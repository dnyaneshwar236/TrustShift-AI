from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class RiderSession(Base):
    __tablename__ = "rider_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    rider_id = Column(String(36), ForeignKey("rider_profiles.id"), nullable=False)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    device_fingerprint = Column(String(100), nullable=True)
    device_name = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    
    # Shift details
    shift_status = Column(String(30), default="not_started", nullable=False) # not_started, on_shift, break, ended
    shift_started_at = Column(DateTime, nullable=True)
    shift_ended_at = Column(DateTime, nullable=True)
    
    authenticated_at = Column(DateTime, default=utc_now, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    status = Column(String(30), default="active", nullable=False) # active, expired, revoked, restricted

    rider = relationship("RiderProfile", back_populates="sessions")
    events = relationship("SessionEvent", back_populates="session", cascade="all, delete-orphan")
    trust_evaluations = relationship("TrustEvaluation", back_populates="session", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="session")

class SessionEvent(Base):
    __tablename__ = "session_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("rider_sessions.id"), nullable=False)
    event_type = Column(String(50), nullable=False) # shift_start, shift_end, verification_prompt, verification_success, verification_fail, device_switch, location_change, periodic_check
    metadata_json = Column(Text, nullable=True) # JSON string of non-sensitive parameters
    occurred_at = Column(DateTime, default=utc_now, nullable=False)

    session = relationship("RiderSession", back_populates="events")
