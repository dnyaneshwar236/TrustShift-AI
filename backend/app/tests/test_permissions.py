import pytest
from app.services.auth_service import AuthService
from app.models.user import User

def test_rbac_rider_blocked_from_manager_dashboard(client, db_session):
    rider_user = db_session.query(User).filter(User.email == "rider.test@trustshift.ai").first()
    token = AuthService.generate_token_for_user(rider_user)

    response = client.get(
        "/api/v1/manager/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert "Access restricted" in response.json()["detail"]

def test_rbac_manager_allowed_on_manager_dashboard(client, db_session):
    mgr_user = db_session.query(User).filter(User.email == "mgr.test@trustshift.ai").first()
    token = AuthService.generate_token_for_user(mgr_user)

    response = client.get(
        "/api/v1/manager/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

def test_unauthenticated_request_blocked(client):
    response = client.get("/api/v1/manager/dashboard")
    assert response.status_code == 401
