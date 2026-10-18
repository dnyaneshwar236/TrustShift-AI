import json
import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.incident import Incident, IncidentEvidence, ManagerReview, IncidentReport
from app.models.user import RiderProfile, User
from app.models.session import RiderSession
from app.models.trust import TrustEvaluation
from app.models.org import OrganizationPolicy
from app.models.base import utc_now
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

class IncidentService:
    @staticmethod
    def _generate_incident_number(db: Session) -> str:
        count = db.query(Incident).count() + 1
        return f"INC-2026-{count:04d}"

    @classmethod
    def check_and_create_incident(
        cls,
        db: Session,
        rider: RiderProfile,
        session: RiderSession,
        evaluation: TrustEvaluation,
        evidence_summary: Optional[str] = None
    ) -> Optional[Incident]:
        """
        Evaluates policy thresholds and creates/updates an incident with deduplication.
        """
        # Fetch organization policy
        policy = db.query(OrganizationPolicy).filter(
            OrganizationPolicy.organization_id == rider.user.organization_id
        ).first()
        critical_threshold = policy.critical_threshold if policy else 50.0

        # Trigger condition: Trust score in critical range or severe reason codes
        reason_list = [r.strip() for r in evaluation.reason_codes.split(",") if r.strip()]
        is_critical_mismatch = "SELFIE_MISMATCH" in reason_list or "LIVENESS_FAILURE" in reason_list
        is_score_critical = evaluation.trust_score < critical_threshold

        if not (is_score_critical or is_critical_mismatch):
            return None # No critical incident triggered

        severity = "critical" if evaluation.trust_score < 40.0 or is_critical_mismatch else "high"

        # Deduplication: check for active open incident for this rider
        active_incident = db.query(Incident).filter(
            Incident.rider_id == rider.id,
            Incident.status.in_(["open", "awaiting_verification", "under_review", "escalated"])
        ).order_by(Incident.created_at.desc()).first()

        if active_incident:
            # Update existing incident with new score and append evidence
            active_incident.risk_score_at_detection = min(active_incident.risk_score_at_detection, evaluation.trust_score)
            active_incident.updated_at = utc_now()
            
            # Merge reason codes
            existing_reasons = set(active_incident.reason_codes.split(","))
            for r in reason_list:
                existing_reasons.add(r)
            active_incident.reason_codes = ",".join(existing_reasons)
            
            evidence_item = IncidentEvidence(
                incident_id=active_incident.id,
                evidence_type="continuity_evaluation",
                summary=evidence_summary or f"Continuous telemetry update: Trust score shifted to {evaluation.trust_score:.1f}.",
                severity=severity,
                metadata_json=json.dumps({
                    "trust_score": evaluation.trust_score,
                    "reasons": reason_list,
                    "evaluation_id": evaluation.id
                }),
                occurred_at=utc_now()
            )
            db.add(evidence_item)
            db.commit()
            db.refresh(active_incident)
            return active_incident

        # Create new Incident
        incident_number = cls._generate_incident_number(db)
        title = f"Suspected Identity Handoff - {rider.legal_name} ({rider.rider_code})"
        description = (
            f"Automated continuity alert: Trust score dropped to {evaluation.trust_score:.1f} "
            f"[{evaluation.score_band.upper()}]. Triggered by: {', '.join(reason_list)}."
        )

        incident = Incident(
            incident_number=incident_number,
            organization_id=rider.user.organization_id,
            branch_id=rider.branch_id,
            rider_id=rider.id,
            session_id=session.id,
            severity=severity,
            status="open",
            reason_codes=evaluation.reason_codes,
            risk_score_at_detection=evaluation.trust_score,
            title=title,
            description=description,
            assigned_manager_id=rider.assigned_manager_id,
            created_at=utc_now(),
            updated_at=utc_now()
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        # Attach initial evidence item
        evidence_item = IncidentEvidence(
            incident_id=incident.id,
            evidence_type="biometric_or_session_deviation",
            summary=evidence_summary or f"Initial detection: Trust score {evaluation.trust_score:.1f} with reasons: {evaluation.reason_codes}.",
            severity=severity,
            metadata_json=json.dumps({
                "trust_score": evaluation.trust_score,
                "reasons": reason_list,
                "evaluation_id": evaluation.id
            }),
            occurred_at=utc_now()
        )
        db.add(evidence_item)
        db.commit()

        # Send alert notification to assigned manager or branch managers
        target_manager_id = rider.assigned_manager_id
        if not target_manager_id:
            # find first manager in organization/branch
            mgr = db.query(User).filter(
                User.organization_id == rider.user.organization_id,
                User.role == "manager"
            ).first()
            if mgr:
                target_manager_id = mgr.id
                incident.assigned_manager_id = mgr.id
                db.commit()

        if target_manager_id:
            NotificationService.create_notification(
                db=db,
                recipient_user_id=target_manager_id,
                title=f"CRITICAL: {incident.incident_number} - {rider.legal_name}",
                message=f"Possible account handoff detected for rider {rider.rider_code}. Risk score: {evaluation.trust_score:.1f}.",
                severity=severity,
                incident_id=incident.id,
                notification_type="incident_alert"
            )

        # Audit log creation
        AuditService.log_event(
            db=db,
            organization_id=rider.user.organization_id,
            action="INCIDENT_CREATED",
            target_type="Incident",
            target_id=incident.id,
            details={
                "incident_number": incident.incident_number,
                "rider_code": rider.rider_code,
                "severity": severity,
                "trust_score": evaluation.trust_score
            }
        )

        return incident

    @staticmethod
    def record_manager_review(
        db: Session,
        incident: Incident,
        reviewer: User,
        outcome: str,
        notes: str,
        action_taken: str
    ) -> ManagerReview:
        """
        Records a human manager's review decision and transitions incident status.
        """
        review = ManagerReview(
            incident_id=incident.id,
            reviewer_id=reviewer.id,
            outcome=outcome,
            notes=notes,
            action_taken=action_taken,
            created_at=utc_now()
        )
        db.add(review)

        # Map review outcome to incident status
        if outcome == "false_alert":
            incident.status = "false_alert"
            incident.resolved_at = utc_now()
        elif outcome in ["resolved_verified", "legitimate_rider"]:
            incident.status = "resolved"
            incident.resolved_at = utc_now()
        elif outcome == "confirmed_handoff":
            incident.status = "escalated"
        elif outcome == "pending_investigation":
            incident.status = "under_review"

        incident.updated_at = utc_now()
        db.commit()
        db.refresh(review)
        db.refresh(incident)

        AuditService.log_event(
            db=db,
            organization_id=incident.organization_id,
            action="INCIDENT_REVIEWED",
            actor_user_id=reviewer.id,
            target_type="Incident",
            target_id=incident.id,
            details={
                "outcome": outcome,
                "action_taken": action_taken,
                "incident_number": incident.incident_number
            }
        )
        return review
