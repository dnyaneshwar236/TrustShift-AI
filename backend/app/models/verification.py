from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class VerificationEvent(Base):
    __tablename__ = "verification_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    rider_id = Column(String(36), ForeignKey("rider_profiles.id"), nullable=False)
    session_id = Column(String(36), nullable=True) # Optional link to session
    verification_type = Column(String(30), nullable=False) # 'selfie', 'trustmark', 'otp', 'device_challenge'
    
    # Outcomes: 'match', 'no_match', 'uncertain', 'quality_failure', 'liveness_failure', 'provider_unavailable'
    outcome = Column(String(30), nullable=False)
    confidence_score = Column(Float, nullable=True) # 0.0 - 100.0
    provider_reference = Column(String(100), nullable=True)
    reason_code = Column(String(50), nullable=True)
    is_simulation = Column(Boolean, default=True, nullable=False)
    metadata_json = Column(Text, nullable=True)
    occurred_at = Column(DateTime, default=utc_now, nullable=False)

    rider = relationship("RiderProfile", back_populates="verification_events")
