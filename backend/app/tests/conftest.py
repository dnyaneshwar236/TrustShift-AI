import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.config import settings
from main import app
from app.models import (
    Organization,
    Branch,
    OrganizationPolicy,
    User,
    RiderProfile,
    ManagerProfile
)
from app.core.security import get_password_hash
from app.models.base import utc_now

# In-memory SQLite database for test isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)

@pytest.fixture
def db_session():
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed baseline fixtures
    org = Organization(name="Test Express Logistics", slug="test-express", status="active", created_at=utc_now())
    session.add(org)
    session.flush()

    branch = Branch(organization_id=org.id, name="Test Branch", code="TB1", status="active", created_at=utc_now())
    session.add(branch)
    session.flush()

    policy = OrganizationPolicy(
        organization_id=org.id,
        critical_threshold=50.0,
        elevated_threshold=60.0,
        caution_threshold=80.0,
        require_2fa_on_new_device=True,
        require_selfie_on_shift_start=True,
        auto_create_incident_on_mismatch=True
    )
    session.add(policy)
    session.flush()

    # Manager
    mgr = User(
        organization_id=org.id,
        email="mgr.test@trustshift.ai",
        password_hash=get_password_hash("Test@12345"),
        role="manager",
        status="active",
        is_2fa_enabled=False
    )
    session.add(mgr)
    session.flush()

    m_prof = ManagerProfile(user_id=mgr.id, branch_id=branch.id, title="Lead", department="Risk")
    session.add(m_prof)

    # Rider
    rider_user = User(
        organization_id=org.id,
        email="rider.test@trustshift.ai",
        password_hash=get_password_hash("Test@12345"),
        role="rider",
        status="active",
        is_2fa_enabled=False
    )
    session.add(rider_user)
    session.flush()

    r_prof = RiderProfile(
        user_id=rider_user.id,
        rider_code="RDR-TEST-01",
        legal_name="Test Rider",
        branch_id=branch.id,
        assigned_manager_id=mgr.id,
        onboarding_status="active",
        selfie_enrolled=True,
        trustmark_enrolled=True,
        experience_years=2
    )
    session.add(r_prof)
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
