import pytest
from app.services.trust_engine import TrustEngine
from app.models.user import RiderProfile
from app.models.session import RiderSession
from app.models.base import utc_now

def test_risk_engine_normal_high_trust(db_session):
    rider = db_session.query(RiderProfile).filter(RiderProfile.rider_code == "RDR-TEST-01").first()
    session = RiderSession(
        rider_id=rider.id,
        session_token="test_sess_normal",
        device_fingerprint="fp_known",
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
            "identity_outcome": "match",
            "is_new_device": False,
            "second_factor_passed": True,
            "behavioral_anomaly": False
        }
    )

    assert evaluation.trust_score >= 80.0
    assert evaluation.score_band == "high_trust"
    assert evaluation.recommended_action == "CONTINUE"
    assert "IDENTITY_CONFIRMED" in evaluation.reason_codes

def test_risk_engine_new_device_caution(db_session):
    rider = db_session.query(RiderProfile).filter(RiderProfile.rider_code == "RDR-TEST-01").first()
    session = RiderSession(
        rider_id=rider.id,
        session_token="test_sess_new_dev",
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
            "identity_outcome": "none",
            "is_new_device": True,
            "second_factor_passed": True,
            "behavioral_anomaly": False
        }
    )

    assert 60.0 <= evaluation.trust_score < 80.0
    assert evaluation.score_band == "caution"
    assert evaluation.recommended_action == "VERIFY"
    assert "NEW_DEVICE" in evaluation.reason_codes

def test_risk_engine_handoff_critical(db_session):
    rider = db_session.query(RiderProfile).filter(RiderProfile.rider_code == "RDR-TEST-01").first()
    session = RiderSession(
        rider_id=rider.id,
        session_token="test_sess_mismatch",
        status="restricted",
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
            "second_factor_passed": False,
            "behavioral_anomaly": True,
            "corroborating_risk": True
        }
    )

    assert evaluation.trust_score < 50.0
    assert evaluation.score_band == "critical"
    assert evaluation.recommended_action == "INVESTIGATE"
    assert "SELFIE_MISMATCH" in evaluation.reason_codes
