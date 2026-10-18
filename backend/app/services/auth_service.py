from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User, RiderProfile, ManagerProfile
from app.models.auth import AuthenticationChallenge, TrustedDevice
from app.models.base import utc_now
from app.core.security import verify_password, get_password_hash, create_access_token, generate_otp_code, hash_data
from app.core.config import settings
from app.services.audit_service import AuditService

class AuthService:
    @staticmethod
    def authenticate_user(
        db: Session,
        email: str,
        password: str
    ) -> Optional[User]:
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        if user.status != "active":
            return None
        return user

    @staticmethod
    def create_2fa_challenge(
        db: Session,
        user: User,
        challenge_type: str = "sms_otp"
    ) -> Tuple[AuthenticationChallenge, str]:
        """
        Creates a time-bound verification challenge.
        Stores only the SHA-256 hash of the OTP in DB.
        Returns the challenge record and plain OTP code.
        """
        plain_code = generate_otp_code(6)
        hashed_code = hash_data(plain_code)
        expires_at = utc_now() + timedelta(minutes=settings.CHALLENGE_EXPIRE_MINUTES)

        challenge = AuthenticationChallenge(
            user_id=user.id,
            challenge_type=challenge_type,
            hashed_code=hashed_code,
            challenge_status="pending",
            expires_at=expires_at,
            attempt_count=0,
            max_attempts=5,
            created_at=utc_now()
        )
        db.add(challenge)
        db.commit()
        db.refresh(challenge)
        return challenge, plain_code

    @staticmethod
    def verify_2fa_challenge(
        db: Session,
        challenge_id: str,
        code: str,
        device_fingerprint: Optional[str] = None,
        device_name: Optional[str] = None,
        remember_device: bool = True
    ) -> Tuple[bool, str, Optional[User]]:
        challenge = db.query(AuthenticationChallenge).filter(
            AuthenticationChallenge.id == challenge_id
        ).first()

        if not challenge:
            return False, "Challenge expired or invalid.", None

        if challenge.challenge_status != "pending":
            return False, f"Challenge is already {challenge.challenge_status}.", None

        # Check expiry
        now = utc_now()
        # In SQLite, dates can be naive; make sure both are compared safely
        exp = challenge.expires_at
        if exp.tzinfo is None:
            now_cmp = datetime.utcnow()
        else:
            now_cmp = now

        if exp < now_cmp:
            challenge.challenge_status = "expired"
            db.commit()
            return False, "Verification challenge has expired. Please request a new code.", None

        # Check attempt limits
        if challenge.attempt_count >= challenge.max_attempts:
            challenge.challenge_status = "max_attempts_exceeded"
            db.commit()
            return False, "Maximum attempt limit exceeded. Please request a new code.", None

        challenge.attempt_count += 1
        provided_hash = hash_data(code.strip())

        if provided_hash != challenge.hashed_code:
            db.commit()
            remaining = challenge.max_attempts - challenge.attempt_count
            return False, f"Incorrect verification code. {remaining} attempt(s) remaining.", None

        # Success
        challenge.challenge_status = "verified"
        user = challenge.user

        # Enroll or update trusted device if fingerprint provided
        if device_fingerprint and remember_device:
            trusted_dev = db.query(TrustedDevice).filter(
                TrustedDevice.user_id == user.id,
                TrustedDevice.device_fingerprint == device_fingerprint
            ).first()

            if trusted_dev:
                trusted_dev.last_seen_at = utc_now()
                trusted_dev.status = "trusted"
            else:
                new_device = TrustedDevice(
                    user_id=user.id,
                    device_fingerprint=device_fingerprint,
                    device_name=device_name or "Mobile Field Device",
                    device_type="mobile",
                    status="trusted",
                    enrolled_at=utc_now(),
                    last_seen_at=utc_now()
                )
                db.add(new_device)

        db.commit()
        return True, "Verification successful.", user

    @staticmethod
    def generate_token_for_user(user: User) -> str:
        payload = {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "organization_id": user.organization_id
        }
        return create_access_token(payload)
