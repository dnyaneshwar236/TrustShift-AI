from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class StartShiftRequest(BaseModel):
    device_fingerprint: Optional[str] = "device_default_fingerprint"
    device_name: Optional[str] = "Samsung Galaxy S24"
    location_area: Optional[str] = "Metro Central Logistics Zone"
    # Biometric gate verification proofs
    selfie_event_id: Optional[str] = None
    trustmark_event_id: Optional[str] = None
    selfie_image_b64: Optional[str] = None
    trustmark_strokes: Optional[str] = None
    simulation_preset: Optional[str] = "match"

class EndShiftRequest(BaseModel):
    notes: Optional[str] = None

class TelemetryPingRequest(BaseModel):
    latitude: float
    longitude: float
    speed: Optional[float] = None
    heading: Optional[float] = None
    accuracy: Optional[float] = None

class SessionEventCreate(BaseModel):
    event_type: str
    metadata: Optional[Dict[str, Any]] = None

class RiderSessionOut(BaseModel):
    id: str
    rider_id: str
    shift_status: str
    shift_started_at: Optional[datetime] = None
    shift_ended_at: Optional[datetime] = None
    device_name: Optional[str] = None
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None
    status: str
    authenticated_at: datetime
