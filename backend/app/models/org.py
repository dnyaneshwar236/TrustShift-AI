from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(50), nullable=False, unique=True)
    status = Column(String(20), default="active", nullable=False) # active, suspended
    created_at = Column(DateTime, default=utc_now, nullable=False)

    branches = relationship("Branch", back_populates="organization", cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    policies = relationship("OrganizationPolicy", back_populates="organization", cascade="all, delete-orphan")

class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)
    city = Column(String(50), nullable=True)
    state = Column(String(50), nullable=True)
    status = Column(String(20), default="active", nullable=False) # active, inactive
    created_at = Column(DateTime, default=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="branches")
    riders = relationship("RiderProfile", back_populates="branch")
    managers = relationship("ManagerProfile", back_populates="branch")
    incidents = relationship("Incident", back_populates="branch")

class OrganizationPolicy(Base):
    __tablename__ = "organization_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    
    # Score thresholds
    critical_threshold = Column(Float, default=50.0, nullable=False) # score < 50 => Critical
    elevated_threshold = Column(Float, default=60.0, nullable=False) # score 50-59 => Elevated
    caution_threshold = Column(Float, default=80.0, nullable=False)  # score 60-79 => Caution, >=80 => High Trust
    
    # Policy toggles
    require_2fa_on_new_device = Column(Boolean, default=True, nullable=False)
    require_selfie_on_shift_start = Column(Boolean, default=True, nullable=False)
    require_trustmark_on_high_risk = Column(Boolean, default=True, nullable=False)
    auto_create_incident_on_mismatch = Column(Boolean, default=True, nullable=False)
    max_failed_attempts_before_lock = Column(Integer, default=3, nullable=False)
    
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="policies")
