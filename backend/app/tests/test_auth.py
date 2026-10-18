import pytest
from app.services.auth_service import AuthService
from app.models.user import User

def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "mgr.test@trustshift.ai", "password": "Test@12345"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] is not None
    assert data["user"]["email"] == "mgr.test@trustshift.ai"
    assert data["user"]["role"] == "manager"

def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "mgr.test@trustshift.ai", "password": "WrongPassword999"}
    )
    assert response.status_code == 401

def test_2fa_challenge_and_verification(db_session):
    user = db_session.query(User).filter(User.email == "rider.test@trustshift.ai").first()
    challenge, code = AuthService.create_2fa_challenge(db_session, user, challenge_type="sms_otp")
    assert challenge.challenge_status == "pending"
    assert len(code) == 6

    # Verify with correct code
    success, msg, verified_user = AuthService.verify_2fa_challenge(
        db=db_session,
        challenge_id=challenge.id,
        code=code,
        device_fingerprint="fp_test_device",
        device_name="Test Phone",
        remember_device=True
    )
    assert success is True
    assert verified_user.id == user.id

    # Verify cannot re-use challenge
    success2, msg2, _ = AuthService.verify_2fa_challenge(
        db=db_session,
        challenge_id=challenge.id,
        code=code
    )
    assert success2 is False
