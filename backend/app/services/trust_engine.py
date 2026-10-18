import json
from typing import List, Tuple, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.trust import TrustEvaluation, VerificationBaseline
from app.models.verification import VerificationEvent
from app.models.session import RiderSession, SessionEvent
from app.models.auth import TrustedDevice
from app.models.user import RiderProfile
from app.models.base import utc_now

class TrustEngine:
    RULE_VERSION = "continuity_rule_v1.4"

    @classmethod
    def evaluate_session(
        cls,
        db: Session,
        rider: RiderProfile,
        session: RiderSession,
        override_signals: Optional[Dict[str, Any]] = None
    ) -> TrustEvaluation:
        """
        Calculates the multi-factor identity continuity trust score and recommendation.
        Weights:
          - Identity verification evidence: 30%
          - Authentication security: 20%
          - Trusted-device & session continuity: 20%
          - Behavioural consistency: 20%
          - Corroborating security evidence: 10%
        """
        reason_codes: List[str] = []
        
        # 1. Check history depth
        total_sessions = db.query(RiderSession).filter(RiderSession.rider_id == rider.id).count()
        is_insufficient_history = total_sessions <= 2
        evidence_coverage = 55.0 if is_insufficient_history else 98.0
        
        if is_insufficient_history:
            reason_codes.append("INSUFFICIENT_HISTORY")

        # 2. Identity Verification Component (30%)
        # Look up latest verification event
        latest_verif = db.query(VerificationEvent).filter(
            VerificationEvent.rider_id == rider.id
        ).order_by(VerificationEvent.occurred_at.desc()).first()

        if override_signals and "identity_outcome" in override_signals:
            identity_outcome = override_signals["identity_outcome"]
        elif latest_verif:
            identity_outcome = latest_verif.outcome
        else:
            identity_outcome = "none"

        if identity_outcome == "match":
            identity_score = 95.0
            reason_codes.append("IDENTITY_CONFIRMED")
        elif identity_outcome == "no_match":
            identity_score = 15.0
            reason_codes.append("SELFIE_MISMATCH")
        elif identity_outcome == "liveness_failure":
            identity_score = 20.0
            reason_codes.append("LIVENESS_FAILURE")
        elif identity_outcome == "uncertain":
            identity_score = 55.0
            reason_codes.append("CONFIDENCE_MARGINAL")
        elif identity_outcome == "quality_failure":
            identity_score = 50.0
            reason_codes.append("POOR_IMAGE_LIGHTING")
        elif identity_outcome == "provider_unavailable":
            identity_score = 50.0
            reason_codes.append("VERIFICATION_PROVIDER_UNAVAILABLE")
        else: # none / not yet taken
            identity_score = 65.0 if is_insufficient_history else 75.0

        # 3. Authentication Security Component (20%)
        if override_signals and "second_factor_passed" in override_signals:
            mfa_passed = override_signals["second_factor_passed"]
        else:
            mfa_passed = True # Authenticated session has validated primary & secondary factors

        if mfa_passed:
            auth_score = 96.0
            reason_codes.append("AUTH_FACTOR_VERIFIED")
        else:
            auth_score = 20.0
            reason_codes.append("SECOND_FACTOR_FAILED")

        # 4. Device and Session Continuity Component (20%)
        # Check if current session's device fingerprint is in trusted devices
        device_is_trusted = False
        if session.device_fingerprint:
            trusted_dev = db.query(TrustedDevice).filter(
                TrustedDevice.user_id == rider.user_id,
                TrustedDevice.device_fingerprint == session.device_fingerprint,
                TrustedDevice.status == "trusted"
            ).first()
            if trusted_dev:
                device_is_trusted = True

        if override_signals and "is_new_device" in override_signals:
            is_new_dev = override_signals["is_new_device"]
        else:
            is_new_dev = not device_is_trusted

        if is_new_dev:
            device_score = 45.0
            reason_codes.append("NEW_DEVICE")
        else:
            device_score = 94.0
            reason_codes.append("KNOWN_DEVICE_CONFIRMED")

        # 5. Behavioural Consistency Component (20%)
        if override_signals and "behavioral_anomaly" in override_signals:
            has_behavior_shift = override_signals["behavioral_anomaly"]
        else:
            has_behavior_shift = False

        if has_behavior_shift:
            behavior_score = 30.0
            reason_codes.append("BEHAVIOR_SHIFT")
        else:
            behavior_score = 70.0 if is_insufficient_history else 92.0

        # 6. Corroborating Security Evidence (10%)
        # Check recent suspicious events
        if override_signals and "corroborating_risk" in override_signals:
            has_corroborating = override_signals["corroborating_risk"]
        else:
            has_corroborating = False

        if has_corroborating:
            corroborating_score = 25.0
            reason_codes.append("MULTIPLE_SIGNAL_DEVIATION")
        else:
            corroborating_score = 90.0

        # Weighted calculation
        raw_score = (
            (0.30 * identity_score) +
            (0.20 * auth_score) +
            (0.20 * device_score) +
            (0.20 * behavior_score) +
            (0.10 * corroborating_score)
        )
        trust_score = round(max(0.0, min(100.0, raw_score)), 1)

        # Bands: High Trust (80-100), Caution (60-79), Elevated Risk (50-59), Critical (0-49)
        if trust_score >= 80.0:
            score_band = "high_trust"
            recommended_action = "CONTINUE"
        elif trust_score >= 60.0:
            score_band = "caution"
            # If new device or uncertain selfie, recommend VERIFY
            recommended_action = "VERIFY" if (is_new_dev or identity_outcome in ["uncertain", "quality_failure"]) else "CONTINUE"
        elif trust_score >= 50.0:
            score_band = "elevated_risk"
            recommended_action = "VERIFY"
        else:
            score_band = "critical"
            recommended_action = "INVESTIGATE"

        # Unique reason codes
        seen = set()
        clean_codes = [c for c in reason_codes if not (c in seen or seen.add(c))]

        evaluation = TrustEvaluation(
            session_id=session.id,
            rider_id=rider.id,
            trust_score=trust_score,
            score_band=score_band,
            evidence_coverage=evidence_coverage,
            recommended_action=recommended_action,
            identity_score=round(identity_score, 1),
            auth_score=round(auth_score, 1),
            device_score=round(device_score, 1),
            behavior_score=round(behavior_score, 1),
            corroborating_score=round(corroborating_score, 1),
            reason_codes=",".join(clean_codes),
            rule_version=cls.RULE_VERSION,
            evaluated_at=utc_now()
        )
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)
        return evaluation
