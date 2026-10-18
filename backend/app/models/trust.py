from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class TrustEvaluation(Base):
    __tablename__ = "trust_evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("rider_sessions.id"), nullable=False)
    rider_id = Column(String(36), ForeignKey("rider_profiles.id"), nullable=False)
    
    # 0.0 - 100.0
    trust_score = Column(Float, nullable=False)
    # Bands: 'high_trust' (80-100), 'caution' (60-79), 'elevated_risk' (50-59), 'critical' (0-49)
    score_band = Column(String(30), nullable=False)
    # 0.0 - 100.0 or percentage
    evidence_coverage = Column(Float, default=100.0, nullable=False)
    
    # Decision action: 'continue', 'verify', 'investigate'
    recommended_action = Column(String(30), nullable=False)
    
    # Component breakdown (0-100 each)
    identity_score = Column(Float, nullable=False)       # 30% weight
    auth_score = Column(Float, nullable=False)           # 20% weight
    device_score = Column(Float, nullable=False)         # 20% weight
    behavior_score = Column(Float, nullable=False)       # 20% weight
    corroborating_score = Column(Float, nullable=False)  # 10% weight
    
    # Comma-delimited or JSON string of reason codes
    reason_codes = Column(Text, nullable=False)
    rule_version = Column(String(20), default="rule_v1.2", nullable=False)
    evaluated_at = Column(DateTime, default=utc_now, nullable=False)

    session = relationship("RiderSession", back_populates="trust_evaluations")
    rider = relationship("RiderProfile")

class VerificationBaseline(Base):
    __tablename__ = "verification_baselines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    rider_id = Column(String(36), ForeignKey("rider_profiles.id"), nullable=False)
    baseline_version = Column(String(20), default="v1.0", nullable=False)
    feature_summary_json = Column(Text, nullable=False) # JSON metadata summary
    status = Column(String(20), default="active", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    rider = relationship("RiderProfile", back_populates="baselines")
