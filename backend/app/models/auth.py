from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class AuthenticationChallenge(Base):
    __tablename__ = "authentication_challenges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    challenge_type = Column(String(30), nullable=False) # sms_otp, email_otp, step_up
    hashed_code = Column(String(255), nullable=False) # SHA-256 or bcrypt hash, never plaintext
    challenge_status = Column(String(30), default="pending", nullable=False) # pending, verified, expired, max_attempts_exceeded
    expires_at = Column(DateTime, nullable=False)
    attempt_count = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=5, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="challenges")

class TrustedDevice(Base):
    __tablename__ = "trusted_devices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    device_fingerprint = Column(String(100), index=True, nullable=False)
    device_name = Column(String(100), nullable=False) # e.g. "Samsung Galaxy S24" or "Pixel 8 Pro"
    device_type = Column(String(50), default="mobile", nullable=False) # mobile, tablet, desktop
    os_info = Column(String(50), nullable=True) # Android 14, iOS 17
    browser_info = Column(String(100), nullable=True) # Chrome Mobile 125.0
    ip_address = Column(String(45), nullable=True)
    status = Column(String(30), default="trusted", nullable=False) # trusted, suspicious, revoked
    enrolled_at = Column(DateTime, default=utc_now, nullable=False)
    last_seen_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="devices")
