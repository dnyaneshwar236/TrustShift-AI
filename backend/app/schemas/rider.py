import re
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, field_validator

class RiderRegistrationRequest(BaseModel):
    legal_name: str
    email: str
    phone: str
    password: Optional[str] = "Rider@12345"
    branch_id: Optional[str] = None
    date_of_birth: Optional[str] = None
    experience_years: Optional[Any] = 0
    employment_type: Optional[str] = "full_time"
    work_zone: Optional[str] = None
    assigned_work_zone: Optional[str] = None
    shift_preference: Optional[str] = "morning"
    vehicle_type: Optional[str] = "motorcycle"
    address: Optional[str] = None
    # License & Government ID fields
    license_number: Optional[str] = None
    license_expiry: Optional[str] = None
    license_class: Optional[str] = None
    license_document_b64: Optional[str] = None
    government_id_type: Optional[str] = "national_id"
    government_id_number: Optional[str] = None
    government_id_document_b64: Optional[str] = None
    # Enrolled Biometric Reference Assets
    selfie_image_data: Optional[str] = None
    trustmark_signature_data: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        if not v or not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$", v.strip()):
            raise ValueError("Invalid email format. Please provide a valid email address (e.g. rider@example.com).")
        return v.strip().lower()

    @field_validator("phone")
    @classmethod
    def validate_phone_format(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        digits = re.sub(r"\D", "", cleaned)
        if not re.match(r"^\+?[0-9\s\-()]{7,25}$", cleaned) or len(digits) < 7 or len(digits) > 15:
            raise ValueError("Invalid phone number format. Please provide a valid phone number with 7 to 15 digits (e.g. +1-555-0144 or +91-9876543210).")
        return cleaned


class RiderOnboardingStepUpdate(BaseModel):
    step: int
    data: Dict[str, Any]

class RiderDetailOut(BaseModel):
    id: str
    user_id: str
    rider_code: str
    legal_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    experience_years: int
    employment_type: str
    work_zone: Optional[str] = None
    shift_preference: str
    vehicle_type: str
    branch_id: Optional[str] = None
    branch_name: Optional[str] = None
    assigned_manager_id: Optional[str] = None
    assigned_manager_name: Optional[str] = None
    # Documents
    license_number: Optional[str] = None
    license_expiry: Optional[str] = None
    license_class: Optional[str] = None
    license_document_url: Optional[str] = None
    government_id_type: Optional[str] = None
    government_id_number: Optional[str] = None
    government_id_document_url: Optional[str] = None
    documents_verified: bool = False
    onboarding_status: str
    onboarding_step: int
    selfie_enrolled: bool
    selfie_image_data: Optional[str] = None
    trustmark_enrolled: bool
    trustmark_signature_data: Optional[str] = None

    current_shift_status: str = "not_started"
    current_trust_score: float = 85.0
    current_score_band: str = "high_trust"
    access_token: Optional[str] = None
    created_at: datetime

