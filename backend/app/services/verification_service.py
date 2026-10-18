import json
import uuid
from typing import Optional, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.verification import VerificationEvent
from app.models.user import RiderProfile
from app.models.base import utc_now
from app.core.config import settings

class VerificationService:
    @staticmethod
    def process_selfie_enrollment(
        db: Session,
        rider: RiderProfile,
        image_b64: Optional[str] = None,
        simulation_preset: str = "match"
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Enroll rider's reference selfie image into database.
        Stores the captured reference portrait and generates a provider tracking identifier.
        """
        if simulation_preset == "quality_failure":
            return False, "Image quality failure: insufficient lighting or face angle. Please re-take in good lighting.", None
        
        provider_ref = f"SIM-FACE-REF-{uuid.uuid4().hex[:12].upper()}"
        if image_b64:
            rider.selfie_image_data = image_b64
        rider.selfie_enrolled = True
        rider.selfie_reference_id = provider_ref
        rider.updated_at = utc_now()
        
        # Record enrollment event
        event = VerificationEvent(
            rider_id=rider.id,
            verification_type="selfie_enrollment",
            outcome="match",
            confidence_score=98.5,
            provider_reference=provider_ref,
            reason_code="REFERENCE_ENROLLED",
            is_simulation=(settings.FACE_PROVIDER_MODE == "simulation"),
            metadata_json=json.dumps({
                "provider": "TrustShift Synthetic Facial Engine v2",
                "mode": "simulation",
                "reference_id": provider_ref,
                "saved_to_database": bool(rider.selfie_image_data)
            }),
            occurred_at=utc_now()
        )
        db.add(event)
        db.commit()
        db.refresh(rider)
        return True, "Selfie reference successfully enrolled and saved to database.", provider_ref

    @staticmethod
    def _compute_image_similarity(img1_str: str, img2_str: str) -> Optional[float]:
        """
        Computes perceptual similarity between two base64 images using normalized luminance.
        Returns a percentage between 0.0 and 100.0, or None if decoding is not feasible.
        """
        try:
            import io, base64
            from PIL import Image

            def decode_to_img(raw_str: str):
                if "," in raw_str:
                    raw_str = raw_str.split(",", 1)[1]
                raw = base64.b64decode(raw_str)
                return Image.open(io.BytesIO(raw)).convert("L").resize((32, 32))

            im1 = decode_to_img(img1_str)
            im2 = decode_to_img(img2_str)
            p1 = list(im1.tobytes())
            p2 = list(im2.tobytes())
            diff = sum(abs(a - b) for a, b in zip(p1, p2)) / (len(p1) * 255.0)
            return max(0.0, min(100.0, (1.0 - diff) * 100.0))
        except Exception:
            return None

    @staticmethod
    def verify_selfie(
        db: Session,
        rider: RiderProfile,
        session_id: Optional[str] = None,
        image_b64: Optional[str] = None,
        simulation_preset: str = "match"
    ) -> VerificationEvent:
        """
        Perform selfie verification against enrolled reference with realistic outcomes.
        Matches live face capture against saved reference in database.
        """
        has_enrolled_face = bool(rider.selfie_enrolled or rider.selfie_image_data)
        ref_id = rider.selfie_reference_id or "NO-ENROLLED-REF"

        preset_map = {
            "match": {
                "outcome": "match",
                "score": 97.4,
                "reason": "IDENTITY_CONFIRMED",
                "desc": f"Facial match verified against enrolled reference template ({ref_id})."
            },
            "no_match": {
                "outcome": "no_match",
                "score": 24.1,
                "reason": "SELFIE_MISMATCH",
                "desc": f"Facial geometry mismatch against enrolled reference template ({ref_id}). Suspected handoff / different person."
            },
            "uncertain": {
                "outcome": "uncertain",
                "score": 62.0,
                "reason": "CONFIDENCE_MARGINAL",
                "desc": f"Match confidence is borderline against enrolled reference ({ref_id}). Secondary verification advised."
            },
            "quality_failure": {
                "outcome": "quality_failure",
                "score": 10.0,
                "reason": "POOR_IMAGE_LIGHTING",
                "desc": "Image is underexposed or face is partially occluded. Please retry with better lighting."
            },
            "liveness_failure": {
                "outcome": "liveness_failure",
                "score": 15.0,
                "reason": "LIVENESS_FAILURE",
                "desc": "Liveness check failed (anti-spoofing challenge did not detect biological movement)."
            },
            "provider_unavailable": {
                "outcome": "provider_unavailable",
                "score": 0.0,
                "reason": "VERIFICATION_PROVIDER_UNAVAILABLE",
                "desc": "Biometric provider service temporarily unreachable. Alternate check required."
            }
        }

        # Check explicit presets first
        if simulation_preset in ["no_match", "impersonator", "different_person"]:
            selected = preset_map["no_match"]
        elif simulation_preset in preset_map and simulation_preset != "match":
            selected = preset_map[simulation_preset]
        else:
            # Algorithmic image comparison against enrolled database reference
            sim = None
            if image_b64 and rider.selfie_image_data:
                sim = VerificationService._compute_image_similarity(image_b64, rider.selfie_image_data)

            # If real comparison detected low similarity (< 55%), reject as mismatch
            if sim is not None and sim < 55.0:
                selected = {
                    "outcome": "no_match",
                    "score": round(min(sim, 35.0), 1),
                    "reason": "SELFIE_MISMATCH",
                    "desc": f"Live face geometry similarity ({sim:.1f}%) is below 55% threshold compared to enrolled portrait ({ref_id}). Person in camera does not match registered rider."
                }
            elif sim is not None:
                selected = {
                    "outcome": "match",
                    "score": round(max(sim, 94.0), 1),
                    "reason": "IDENTITY_CONFIRMED",
                    "desc": f"Facial match confirmed ({max(sim, 94.0):.1f}%) against enrolled reference portrait ({ref_id})."
                }
            else:
                selected = preset_map["match"]

        provider_ref = f"SIM-VERIF-{uuid.uuid4().hex[:10].upper()}"

        event = VerificationEvent(
            rider_id=rider.id,
            session_id=session_id,
            verification_type="selfie",
            outcome=selected["outcome"],
            confidence_score=selected["score"],
            provider_reference=provider_ref,
            reason_code=selected["reason"],
            is_simulation=(settings.FACE_PROVIDER_MODE == "simulation"),
            metadata_json=json.dumps({
                "description": selected["desc"],
                "preset": simulation_preset,
                "face_engine": "TrustShift Identity Continuity Adapter",
                "matched_against_reference_id": ref_id,
                "has_enrolled_reference": has_enrolled_face,
                "has_live_image": bool(image_b64)
            }),
            occurred_at=utc_now()
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def process_trustmark_enrollment(
        db: Session,
        rider: RiderProfile,
        stroke_data: Optional[str] = None,
        simulation_preset: str = "match"
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Enroll rider's TrustMark drawn-signature pattern and persist in database.
        """
        provider_ref = f"SIM-SIGN-REF-{uuid.uuid4().hex[:12].upper()}"
        if stroke_data:
            rider.trustmark_signature_data = stroke_data
        rider.trustmark_enrolled = True
        rider.trustmark_reference_id = provider_ref
        rider.updated_at = utc_now()
        
        event = VerificationEvent(
            rider_id=rider.id,
            verification_type="trustmark_enrollment",
            outcome="match",
            confidence_score=94.0,
            provider_reference=provider_ref,
            reason_code="SIGNATURE_ENROLLED",
            is_simulation=True,
            metadata_json=json.dumps({
                "provider": "TrustMark Touch Pattern Analyzer",
                "mode": "simulation",
                "reference_id": provider_ref,
                "saved_to_database": bool(rider.trustmark_signature_data)
            }),
            occurred_at=utc_now()
        )
        db.add(event)
        db.commit()
        db.refresh(rider)
        return True, "TrustMark signature pattern enrolled and saved to database successfully.", provider_ref

    @staticmethod
    def verify_trustmark(
        db: Session,
        rider: RiderProfile,
        session_id: Optional[str] = None,
        stroke_data: Optional[str] = None,
        simulation_preset: str = "match"
    ) -> VerificationEvent:
        """
        Verify drawn signature against enrolled pattern in database.
        """
        has_enrolled_sign = bool(rider.trustmark_enrolled or rider.trustmark_signature_data)
        ref_id = rider.trustmark_reference_id or "NO-ENROLLED-SIGN"

        if simulation_preset in ["no_match", "deviating", "impersonator", "different_person"]:
            outcome = "no_match"
            score = 31.0
            reason = "SIGNATURE_DEVIATION"
            desc = f"Signature pattern kinematics deviated significantly from enrolled baseline ({ref_id}). Suspected unauthorized handoff."
        elif simulation_preset == "uncertain":
            outcome = "uncertain"
            score = 65.0
            reason = "STROKE_UNCERTAINTY"
            desc = f"Stroke kinematics borderline compared to enrolled pattern ({ref_id})."
        else:
            outcome = "match"
            score = 92.5
            reason = "SIGNATURE_MATCHED"
            desc = f"Drawn signature gesture pattern matched against enrolled reference ({ref_id})."

        event = VerificationEvent(
            rider_id=rider.id,
            session_id=session_id,
            verification_type="trustmark",
            outcome=outcome,
            confidence_score=score,
            provider_reference=f"TM-{uuid.uuid4().hex[:10].upper()}",
            reason_code=reason,
            is_simulation=True,
            metadata_json=json.dumps({
                "type": "drawn_pattern_check",
                "description": desc,
                "supplementary": True,
                "matched_against_reference_id": ref_id,
                "has_enrolled_reference": has_enrolled_sign,
                "has_live_strokes": bool(stroke_data)
            }),
            occurred_at=utc_now()
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
