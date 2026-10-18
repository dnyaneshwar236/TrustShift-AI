from typing import Optional, List
from pydantic import BaseModel, EmailStr

class CreateManagerRequest(BaseModel):
    email: EmailStr
    password: str
    branch_id: Optional[str] = None
    title: str = "Shift Operations Lead"
    department: str = "Fleet Security"

class BranchCreateRequest(BaseModel):
    name: str
    code: str
    city: Optional[str] = None
    state: Optional[str] = None

class BranchOut(BaseModel):
    id: str
    name: str
    code: str
    city: Optional[str] = None
    state: Optional[str] = None
    status: str
    riders_count: int = 0
    created_at: str

class PolicyUpdateRequest(BaseModel):
    critical_threshold: float
    elevated_threshold: float
    caution_threshold: float
    require_2fa_on_new_device: bool
    require_selfie_on_shift_start: bool
    require_trustmark_on_high_risk: bool
    auto_create_incident_on_mismatch: bool
    max_failed_attempts_before_lock: int

class PolicyOut(BaseModel):
    id: str
    organization_id: str
    critical_threshold: float
    elevated_threshold: float
    caution_threshold: float
    require_2fa_on_new_device: bool
    require_selfie_on_shift_start: bool
    require_trustmark_on_high_risk: bool
    auto_create_incident_on_mismatch: bool
    max_failed_attempts_before_lock: int
