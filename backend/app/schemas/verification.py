from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class SelfieEnrollRequest(BaseModel):
    rider_id: Optional[str] = None
    image_b64: Optional[str] = None
    consent_acknowledged: bool = True
    simulation_preset: Optional[str] = "match" # match, quality_failure

class SelfieCheckRequest(BaseModel):
    session_id: Optional[str] = None
    image_b64: Optional[str] = None
    simulation_preset: Optional[str] = "match" # match, no_match, uncertain, quality_failure, liveness_failure, provider_unavailable

class TrustMarkEnrollRequest(BaseModel):
    rider_id: Optional[str] = None
    stroke_data: Optional[str] = None # SVG or JSON representation
    consent_acknowledged: bool = True
    simulation_preset: Optional[str] = "match"


class TrustMarkCheckRequest(BaseModel):
    session_id: Optional[str] = None
    stroke_data: Optional[str] = None
    simulation_preset: Optional[str] = "match" # match, no_match, uncertain

class VerificationResultOut(BaseModel):
    id: str
    verification_type: str # selfie, trustmark, otp
    outcome: str # match, no_match, uncertain, quality_failure, liveness_failure, provider_unavailable
    confidence_score: Optional[float] = None
    provider_reference: Optional[str] = None
    reason_code: Optional[str] = None
    is_simulation: bool = True
    message: str
    recommended_action: str # continue, retry, verify, review
    reference_enrolled: Optional[bool] = None
    enrolled_reference_id: Optional[str] = None
    has_reference_image: Optional[bool] = None
    has_reference_signature: Optional[bool] = None
    occurred_at: datetime
