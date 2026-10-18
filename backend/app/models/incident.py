from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Integer, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_number = Column(String(30), unique=True, index=True, nullable=False) # INC-2026-0001
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=True)
    rider_id = Column(String(36), ForeignKey("rider_profiles.id"), nullable=False)
    session_id = Column(String(36), ForeignKey("rider_sessions.id"), nullable=True)
    
    # Severity: 'low', 'medium', 'high', 'critical'
    severity = Column(String(20), default="high", nullable=False)
    
    # Status: 'open', 'awaiting_verification', 'under_review', 'escalated', 'resolved', 'false_alert', 'closed'
    status = Column(String(30), default="open", nullable=False)
    
    reason_codes = Column(Text, nullable=False)
    risk_score_at_detection = Column(Float, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    assigned_manager_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    branch = relationship("Branch", back_populates="incidents")
    rider = relationship("RiderProfile", back_populates="incidents")
    session = relationship("RiderSession", back_populates="incidents")
    assigned_manager = relationship("User", foreign_keys=[assigned_manager_id])
    evidences = relationship("IncidentEvidence", back_populates="incident", cascade="all, delete-orphan")
    reviews = relationship("ManagerReview", back_populates="incident", cascade="all, delete-orphan")
    reports = relationship("IncidentReport", back_populates="incident", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="incident", cascade="all, delete-orphan")

class IncidentEvidence(Base):
    __tablename__ = "incident_evidences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    event_reference = Column(String(100), nullable=True)
    evidence_type = Column(String(50), nullable=False) # biometric_mismatch, unrecognized_device, behavioral_anomaly, auth_failure
    summary = Column(String(255), nullable=False)
    severity = Column(String(20), default="high", nullable=False)
    metadata_json = Column(Text, nullable=True)
    occurred_at = Column(DateTime, default=utc_now, nullable=False)

    incident = relationship("Incident", back_populates="evidences")

class ManagerReview(Base):
    __tablename__ = "manager_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    reviewer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Outcome: 'confirmed_handoff', 'legitimate_rider', 'false_alert', 'pending_investigation', 'resolved_verified'
    outcome = Column(String(50), nullable=False)
    notes = Column(Text, nullable=False)
    # Action taken: 're_verification_requested', 'shift_continued', 'session_restricted', 'profile_flagged', 'cleared'
    action_taken = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    incident = relationship("Incident", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])

class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_number = Column(String(50), unique=True, index=True, nullable=False) # REP-INC-2026-0001-V1
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    report_version = Column(Integer, default=1, nullable=False)
    file_path = Column(String(255), nullable=False)
    cryptographic_hash = Column(String(64), nullable=False) # SHA-256
    status = Column(String(20), default="generated", nullable=False) # generated, failed
    generated_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    generated_at = Column(DateTime, default=utc_now, nullable=False)

    incident = relationship("Incident", back_populates="reports")
    generated_by = relationship("User", foreign_keys=[generated_by_user_id])
