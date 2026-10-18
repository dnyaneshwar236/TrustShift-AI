from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False) # 'rider', 'manager', 'admin'
    status = Column(String(20), default="active", nullable=False) # 'active', 'pending', 'suspended'
    is_2fa_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="users")
    rider_profile = relationship("RiderProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="[RiderProfile.user_id]")
    manager_profile = relationship("ManagerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="[ManagerProfile.user_id]")
    challenges = relationship("AuthenticationChallenge", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("TrustedDevice", back_populates="user", cascade="all, delete-orphan")
    consents = relationship("ConsentRecord", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")

class RiderProfile(Base):
    __tablename__ = "rider_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    rider_code = Column(String(20), unique=True, index=True, nullable=False) # e.g. RDR-1082
    legal_name = Column(String(100), nullable=False)
    date_of_birth = Column(String(15), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(120), nullable=True)
    address = Column(String(255), nullable=True)
    experience_years = Column(Integer, default=0, nullable=False)
    employment_type = Column(String(30), default="full_time", nullable=False) # full_time, part_time, gig_contractor
    work_zone = Column(String(50), nullable=True) # e.g. "Downtown / Metro Hub"
    shift_preference = Column(String(30), default="morning", nullable=False)
    vehicle_type = Column(String(30), default="motorcycle", nullable=False) # motorcycle, bicycle, ev_scooter, car
    
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=True)
    assigned_manager_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    # Onboarding status: draft, pending_verification, pending_approval, active, temporarily_restricted, recovery_required, inactive
    onboarding_status = Column(String(30), default="draft", nullable=False)
    onboarding_step = Column(Integer, default=1, nullable=False)
    
    # Government & Licence Document Verification
    license_number = Column(String(50), nullable=True)
    license_expiry = Column(String(20), nullable=True)
    license_class = Column(String(30), nullable=True) # e.g. Motorcycle, Commercial, Standard
    license_document_url = Column(Text, nullable=True) # Document scan / storage URI or base64
    government_id_type = Column(String(50), default="national_id", nullable=True) # national_id, passport, state_id
    government_id_number = Column(String(50), nullable=True)
    government_id_document_url = Column(Text, nullable=True)
    documents_verified = Column(Boolean, default=False, nullable=False)

    # Biometric enrollment flags & enrolled reference assets
    selfie_enrolled = Column(Boolean, default=False, nullable=False)
    selfie_reference_id = Column(String(100), nullable=True) # Provider reference identifier
    selfie_image_data = Column(Text, nullable=True) # Enrolled reference facial image (base64 data URL)
    trustmark_enrolled = Column(Boolean, default=False, nullable=False)
    trustmark_reference_id = Column(String(100), nullable=True)
    trustmark_signature_data = Column(Text, nullable=True) # Enrolled reference signature strokes / vector
    
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="rider_profile", foreign_keys=[user_id])
    branch = relationship("Branch", back_populates="riders")
    assigned_manager = relationship("User", foreign_keys=[assigned_manager_id])
    sessions = relationship("RiderSession", back_populates="rider", cascade="all, delete-orphan")
    verification_events = relationship("VerificationEvent", back_populates="rider", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="rider", cascade="all, delete-orphan")
    baselines = relationship("VerificationBaseline", back_populates="rider", cascade="all, delete-orphan")

class ManagerProfile(Base):
    __tablename__ = "manager_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=True)
    title = Column(String(50), default="Shift Operations Lead", nullable=False)
    department = Column(String(50), default="Fleet Security & Risk Operations", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="manager_profile")
    branch = relationship("Branch", back_populates="managers")

class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    consent_type = Column(String(50), nullable=False) # 'biometric_selfie', 'trustmark_signature', 'device_telemetry'
    purpose = Column(String(255), nullable=False)
    version = Column(String(20), default="v1.0", nullable=False)
    is_granted = Column(Boolean, default=True, nullable=False)
    granted_at = Column(DateTime, default=utc_now, nullable=False)
    withdrawn_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="consents")
