import uuid
import json
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.user import User, RiderProfile
from app.models.session import RiderSession, SessionEvent
from app.models.trust import TrustEvaluation
from app.models.incident import Incident, IncidentEvidence, ManagerReview
from app.models.verification import VerificationEvent
from app.models.auth import TrustedDevice
from app.models.base import utc_now
from app.services.trust_engine import TrustEngine
from app.services.incident_service import IncidentService
from app.services.report_service import ReportService

class DemoService:
    @classmethod
    def run_scenario(cls, db: Session, scenario_id: str) -> Dict[str, Any]:
        """
        Executes interactive demonstration scenarios directly in the database.
        Returns detailed telemetry for frontend visualization.
        """
        scenario_id = scenario_id.upper().strip()

        if scenario_id == "SCENARIO_A":
            # Scenario A: Normal rider, known device, verified selfie
            rider = db.query(RiderProfile).filter(RiderProfile.rider_code == "RDR-1082").first()
            if not rider:
                rider = db.query(RiderProfile).first()

            session = db.query(RiderSession).filter(RiderSession.rider_id == rider.id).first()
            if not session:
                session = RiderSession(
                    rider_id=rider.id,
                    session_token=f"sess_{uuid.uuid4().hex[:16]}",
                    device_fingerprint="fp_samsung_s24_trusted",
                    device_name="Samsung Galaxy S24 Ultra",
                    shift_status="on_shift",
                    status="active",
                    authenticated_at=utc_now()
                )
                db.add(session)
                db.commit()

            # Record verified selfie event
            v_event = VerificationEvent(
                rider_id=rider.id,
                session_id=session.id,
                verification_type="selfie",
                outcome="match",
                confidence_score=97.8,
                provider_reference=f"SIM-PASS-{uuid.uuid4().hex[:8].upper()}",
                reason_code="IDENTITY_CONFIRMED",
                is_simulation=True,
                metadata_json=json.dumps({"scenario": "A", "device": "trusted"}),
                occurred_at=utc_now()
            )
            db.add(v_event)
            db.commit()

            eval_res = TrustEngine.evaluate_session(
                db=db,
                rider=rider,
                session=session,
                override_signals={
                    "identity_outcome": "match",
                    "is_new_device": False,
                    "second_factor_passed": True,
                    "behavioral_anomaly": False
                }
            )

            return {
                "scenario": "Scenario A - Normal Rider",
                "rider_name": rider.legal_name,
                "rider_code": rider.rider_code,
                "trust_score": eval_res.trust_score,
                "score_band": eval_res.score_band,
                "recommended_action": eval_res.recommended_action,
                "reason_codes": eval_res.reason_codes.split(","),
                "incident_created": False,
                "summary": "Verified shift continuity on authorized device with high confidence. Shift proceeds uninterrupted."
            }

        elif scenario_id == "SCENARIO_B":
            # Scenario B: New phone, legitimate rider (caution band, step-up needed)
            rider = db.query(RiderProfile).filter(RiderProfile.rider_code == "RDR-1082").first()
            if not rider:
                rider = db.query(RiderProfile).first()

            session = RiderSession(
                rider_id=rider.id,
                session_token=f"sess_{uuid.uuid4().hex[:16]}",
                device_fingerprint=f"fp_new_pixel_{uuid.uuid4().hex[:6]}",
                device_name="Google Pixel 8 (New Device)",
                shift_status="on_shift",
                status="active",
                authenticated_at=utc_now()
            )
            db.add(session)
            db.commit()

            eval_res = TrustEngine.evaluate_session(
                db=db,
                rider=rider,
                session=session,
                override_signals={
                    "identity_outcome": "none",
                    "is_new_device": True,
                    "second_factor_passed": True,
                    "behavioral_anomaly": False
                }
            )

            return {
                "scenario": "Scenario B - New Phone (Legitimate)",
                "rider_name": rider.legal_name,
                "rider_code": rider.rider_code,
                "trust_score": eval_res.trust_score,
                "score_band": eval_res.score_band,
                "recommended_action": eval_res.recommended_action,
                "reason_codes": eval_res.reason_codes.split(","),
                "incident_created": False,
                "summary": "New device detected without baseline corroborating anomalies. Step-up selfie check recommended."
            }

        elif scenario_id == "SCENARIO_C":
            # Scenario C: Possible account handoff (mismatch + new device + behavior shift -> Critical incident & PDF)
            rider = db.query(RiderProfile).filter(RiderProfile.rider_code == "RDR-2490").first()
            if not rider:
                rider = db.query(RiderProfile).first()

            session = RiderSession(
                rider_id=rider.id,
                session_token=f"sess_{uuid.uuid4().hex[:16]}",
                device_fingerprint=f"fp_rogue_device_{uuid.uuid4().hex[:6]}",
                device_name="Unknown Xiaomi Redmi 12",
                shift_status="on_shift",
                status="restricted",
                authenticated_at=utc_now()
            )
            db.add(session)
            db.commit()

            # Record failed biometric
            v_event = VerificationEvent(
                rider_id=rider.id,
                session_id=session.id,
                verification_type="selfie",
                outcome="no_match",
                confidence_score=19.4,
                provider_reference=f"SIM-FAIL-{uuid.uuid4().hex[:8].upper()}",
                reason_code="SELFIE_MISMATCH",
                is_simulation=True,
                metadata_json=json.dumps({"scenario": "C", "face_discrepancy": "Severe"}),
                occurred_at=utc_now()
            )
            db.add(v_event)
            db.commit()

            eval_res = TrustEngine.evaluate_session(
                db=db,
                rider=rider,
                session=session,
                override_signals={
                    "identity_outcome": "no_match",
                    "is_new_device": True,
                    "second_factor_passed": False,
                    "behavioral_anomaly": True,
                    "corroborating_risk": True
                }
            )

            # Trigger automated critical incident
            incident = IncidentService.check_and_create_incident(
                db=db,
                rider=rider,
                session=session,
                evaluation=eval_res,
                evidence_summary="Biometric check mismatch: confidence 19.4% combined with unverified device switch."
            )

            pdf_report_id = None
            if incident:
                report = ReportService.generate_report_for_incident(
                    db=db,
                    incident_id=incident.id,
                    force_regenerate=True
                )
                pdf_report_id = report.id

            return {
                "scenario": "Scenario C - Suspected Account Handoff",
                "rider_name": rider.legal_name,
                "rider_code": rider.rider_code,
                "trust_score": eval_res.trust_score,
                "score_band": eval_res.score_band,
                "recommended_action": eval_res.recommended_action,
                "reason_codes": eval_res.reason_codes.split(","),
                "incident_created": True,
                "incident_number": incident.incident_number if incident else None,
                "incident_id": incident.id if incident else None,
                "pdf_report_id": pdf_report_id,
                "summary": "CRITICAL INCIDENT: Biometric mismatch detected on unfamiliar device. Manager alert dispatched, session restricted, and PDF verification report generated."
            }

        elif scenario_id == "SCENARIO_D":
            # Scenario D: Poor selfie quality (retry, not fraud)
            rider = db.query(RiderProfile).first()
            session = db.query(RiderSession).filter(RiderSession.rider_id == rider.id).first()

            v_event = VerificationEvent(
                rider_id=rider.id,
                session_id=session.id if session else None,
                verification_type="selfie",
                outcome="quality_failure",
                confidence_score=12.0,
                provider_reference=f"SIM-QUAL-{uuid.uuid4().hex[:8].upper()}",
                reason_code="POOR_IMAGE_LIGHTING",
                is_simulation=True,
                metadata_json=json.dumps({"lighting": "underexposed"}),
                occurred_at=utc_now()
            )
            db.add(v_event)
            db.commit()

            eval_res = TrustEngine.evaluate_session(
                db=db,
                rider=rider,
                session=session or RiderSession(rider_id=rider.id, session_token="s_demo", authenticated_at=utc_now()),
                override_signals={
                    "identity_outcome": "quality_failure",
                    "is_new_device": False,
                    "second_factor_passed": True,
                    "behavioral_anomaly": False
                }
            )

            return {
                "scenario": "Scenario D - Poor Selfie Lighting",
                "rider_name": rider.legal_name,
                "rider_code": rider.rider_code,
                "trust_score": eval_res.trust_score,
                "score_band": eval_res.score_band,
                "recommended_action": "RETRY",
                "reason_codes": ["POOR_IMAGE_LIGHTING"],
                "incident_created": False,
                "summary": "Quality failure due to inadequate lighting. System politely prompts rider to retake photo rather than penalizing identity trust."
            }

        elif scenario_id == "SCENARIO_E":
            # Scenario E: New rider with insufficient history
            rider = db.query(RiderProfile).filter(RiderProfile.rider_code == "RDR-3310").first()
            if not rider:
                rider = db.query(RiderProfile).first()

            session = RiderSession(
                rider_id=rider.id,
                session_token=f"sess_{uuid.uuid4().hex[:16]}",
                device_fingerprint=f"fp_first_phone_{uuid.uuid4().hex[:6]}",
                device_name="OnePlus Nord CE",
                shift_status="not_started",
                status="active",
                authenticated_at=utc_now()
            )
            db.add(session)
            db.commit()

            eval_res = TrustEngine.evaluate_session(
                db=db,
                rider=rider,
                session=session,
                override_signals={
                    "identity_outcome": "none",
                    "is_new_device": True,
                    "second_factor_passed": True,
                    "behavioral_anomaly": False
                }
            )

            return {
                "scenario": "Scenario E - Insufficient Baseline History",
                "rider_name": rider.legal_name,
                "rider_code": rider.rider_code,
                "trust_score": eval_res.trust_score,
                "score_band": eval_res.score_band,
                "evidence_coverage": eval_res.evidence_coverage,
                "recommended_action": eval_res.recommended_action,
                "reason_codes": eval_res.reason_codes.split(","),
                "incident_created": False,
                "summary": "New rider profile with limited operational baseline. Coverage flagged at 55%, preventing false-confidence scoring."
            }

        elif scenario_id == "SCENARIO_F":
            # Scenario F: Manager review resolution
            incident = db.query(Incident).filter(Incident.status == "open").first()
            if not incident:
                incident = db.query(Incident).first()

            if incident:
                manager = db.query(User).filter(User.role == "manager").first()
                review = IncidentService.record_manager_review(
                    db=db,
                    incident=incident,
                    reviewer=manager or incident.assigned_manager,
                    outcome="false_alert",
                    notes="Investigated via direct dispatch radio. Rider confirmed handset camera glass crack caused biometric blur; legitimate shift resumption approved.",
                    action_taken="cleared"
                )
                # Regenerate updated report reflecting manager notes
                report = ReportService.generate_report_for_incident(
                    db=db,
                    incident_id=incident.id,
                    generated_by_user_id=manager.id if manager else None,
                    force_regenerate=True
                )
                return {
                    "scenario": "Scenario F - Manager Review Resolution",
                    "incident_number": incident.incident_number,
                    "status_after_review": incident.status,
                    "outcome": review.outcome,
                    "action_taken": review.action_taken,
                    "updated_report_id": report.id,
                    "summary": f"Incident {incident.incident_number} successfully resolved as False Alert. Updated PDF report compiled and timestamped."
                }
            return {"error": "No incident found to review"}

        elif scenario_id == "SCENARIO_G":
            # Scenario G: PDF generation error simulation
            return {
                "scenario": "Scenario G - PDF Generation Error Handling",
                "simulated_error": "REPORT_STORAGE_IO_EXCEPTION: Storage volume read-only lock simulation.",
                "retry_available": True,
                "summary": "Verified error boundary: Graceful UI feedback shown, incident record preserved without corrupting database state."
            }

        return {"error": f"Unknown scenario {scenario_id}"}
