from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_user_id = Column(String(36), ForeignKey("users.id"), nullable=True) # None = System
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    action = Column(String(100), nullable=False) # e.g. REPORT_DOWNLOADED, INCIDENT_REVIEWED, RIDER_ONBOARDED
    target_type = Column(String(50), nullable=True) # Incident, Report, RiderProfile, User, Policy
    target_id = Column(String(100), nullable=True)
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    correlation_id = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False)

    actor = relationship("User", foreign_keys=[actor_user_id])
    organization = relationship("Organization")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recipient_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=True)
    notification_type = Column(String(50), default="incident_alert", nullable=False) # incident_alert, verification_request, security_notice
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="high", nullable=False) # low, medium, high, critical
    delivery_status = Column(String(20), default="delivered", nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    recipient = relationship("User", back_populates="notifications")
    incident = relationship("Incident", back_populates="notifications")
