from typing import Optional
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role_hint: Optional[str] = None # rider, manager, admin
    device_fingerprint: Optional[str] = None
    device_name: Optional[str] = None

class SecondFactorVerifyRequest(BaseModel):
    challenge_id: str
    code: str
    device_fingerprint: Optional[str] = None
    device_name: Optional[str] = None
    remember_device: bool = True

class SecondFactorResendRequest(BaseModel):
    challenge_id: str

class UserProfileOut(BaseModel):
    id: str
    email: str
    phone: Optional[str] = None
    role: str
    status: str
    organization_id: str
    organization_name: str
    is_2fa_enabled: bool
    rider_profile_id: Optional[str] = None
    rider_code: Optional[str] = None
    legal_name: Optional[str] = None
    branch_id: Optional[str] = None
    branch_name: Optional[str] = None
    selfie_enrolled: Optional[bool] = False
    trustmark_enrolled: Optional[bool] = False
    selfie_image_data: Optional[str] = None
    trustmark_signature_data: Optional[str] = None

class LoginResponse(BaseModel):
    requires_2fa: bool = False
    challenge_id: Optional[str] = None
    challenge_type: Optional[str] = None
    simulated_code: Optional[str] = None # Provided only in dev/simulation mode for testing
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[UserProfileOut] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str

class DigiLockerLoginRequest(BaseModel):
    rider_identifier: Optional[str] = None # email, phone, or rider_code
    aadhaar_last_four: Optional[str] = "4829"
    otp_code: Optional[str] = "123456"
    consent: bool = True
    device_fingerprint: Optional[str] = None
    device_name: Optional[str] = "DigiLocker Mobile Connector"

class DigiLockerCredentialsRequest(BaseModel):
    preset_identity: Optional[str] = "default" # alex, devon, sam, or default
    phone: Optional[str] = None
    aadhaar_last_four: Optional[str] = None

class DigiLockerCredentialsOut(BaseModel):
    digilocker_id: str
    legal_name: str
    email: str
    phone: str
    date_of_birth: str
    address: str
    # Driving Licence
    license_number: str
    license_expiry: str
    license_class: str
    license_document_url: str
    license_issuer: str
    # Government ID (Aadhaar / National ID)
    government_id_type: str
    government_id_number: str
    government_id_document_url: str
    government_id_issuer: str
    # Verification metadata
    digilocker_verified: bool = True
    verification_timestamp: str
    digilocker_uri: str
    checksum_sha256: str

class DigiLockerOAuthExchangeRequest(BaseModel):
    code: str
    mode: str = "login" # "login" or "pull_credentials"
    preset_identity: Optional[str] = "alex"
    phone: Optional[str] = None
    aadhaar_last_four: Optional[str] = None

