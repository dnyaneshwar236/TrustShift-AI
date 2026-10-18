import os
import pytest
from app.services.trust_engine import TrustEngine
from app.services.incident_service import IncidentService
from app.services.report_service import ReportService
from app.services.auth_service import AuthService
from app.models.user import RiderProfile, User
from app.models.session import RiderSession
from app.models.incident import Incident
from app.models.base import utc_now

def test_incident_creation_and_deduplication(db_session):
    rider = db_session.query(RiderProfile).filter(RiderProfile.rider_code == "RDR-TEST-01").first()
    session = RiderSession(
        rider_id=rider.id,
        session_token="test_sess_inc_01",
        status="active",
        authenticated_at=utc_now()
    )
    db_session.add(session)
    db_session.commit()

    evaluation = TrustEngine.evaluate_session(
        db=db_session,
        rider=rider,
        session=session,
        override_signals={
            "identity_outcome": "no_match",
            "is_new_device": True,
            "second_factor_passed": False
        }
    )

    incident = IncidentService.check_and_create_incident(
        db=db_session,
        rider=rider,
        session=session,
        evaluation=evaluation,
        evidence_summary="Test mismatch detected"
    )

    assert incident is not None
    assert incident.severity == "critical"
    assert incident.status == "open"
    assert "INC-" in incident.incident_number

    # Deduplication test: repeated event for same rider should update, not create new duplicate
    incident_count_before = db_session.query(Incident).count()
    incident_again = IncidentService.check_and_create_incident(
        db=db_session,
        rider=rider,
        session=session,
        evaluation=evaluation,
        evidence_summary="Subsequent telemetry check"
    )
    incident_count_after = db_session.query(Incident).count()
    assert incident_count_before == incident_count_after
    assert incident_again.id == incident.id

def _get_or_create_incident(db_session):
    incident = db_session.query(Incident).first()
    if not incident:
        rider = db_session.query(RiderProfile).filter(RiderProfile.rider_code == "RDR-TEST-01").first()
        incident = Incident(
            incident_number="INC-2026-TEST",
            organization_id=rider.user.organization_id,
            branch_id=rider.branch_id,
            rider_id=rider.id,
            severity="critical",
            status="open",
            reason_codes="SELFIE_MISMATCH,NEW_DEVICE",
            risk_score_at_detection=32.0,
            title=f"Suspected Identity Handoff - {rider.legal_name}",
            assigned_manager_id=rider.assigned_manager_id,
            created_at=utc_now()
        )
        db_session.add(incident)
        db_session.commit()
        db_session.refresh(incident)
    return incident

def test_pdf_report_generation_and_integrity(db_session):
    incident = _get_or_create_incident(db_session)

    report = ReportService.generate_report_for_incident(
        db=db_session,
        incident_id=incident.id,
        force_regenerate=True
    )

    assert report is not None
    assert report.status == "generated"
    assert len(report.cryptographic_hash) == 64 # Valid SHA-256 hex string
    assert os.path.exists(report.file_path)

def test_report_download_rbac(client, db_session):
    rider_user = db_session.query(User).filter(User.email == "rider.test@trustshift.ai").first()
    mgr_user = db_session.query(User).filter(User.email == "mgr.test@trustshift.ai").first()

    incident = _get_or_create_incident(db_session)
    report = ReportService.generate_report_for_incident(
        db=db_session,
        incident_id=incident.id,
        force_regenerate=True
    )

    rider_token = AuthService.generate_token_for_user(rider_user)
    mgr_token = AuthService.generate_token_for_user(mgr_user)

    # 1. Rider must be blocked from downloading incident report
    rider_resp = client.get(
        f"/api/v1/reports/{report.id}/download",
        headers={"Authorization": f"Bearer {rider_token}"}
    )
    assert rider_resp.status_code == 403

    # 2. Manager is authorized and receives PDF file
    mgr_resp = client.get(
        f"/api/v1/reports/{report.id}/download",
        headers={"Authorization": f"Bearer {mgr_token}"}
    )
    assert mgr_resp.status_code == 200
    assert mgr_resp.headers["content-type"] == "application/pdf"
    assert len(mgr_resp.content) > 1000
