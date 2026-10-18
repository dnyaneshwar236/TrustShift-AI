from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ManagerDashboardSummaryOut(BaseModel):
    total_registered_riders: int
    active_riders: int
    pending_onboarding: int
    active_sessions: int
    open_incidents: int
    critical_incidents: int
    verification_requests_awaiting: int
    resolved_incidents: int

class AssignIncidentRequest(BaseModel):
    manager_id: str

class RequestReVerificationRequest(BaseModel):
    verification_type: str = "selfie" # selfie, trustmark, step_up_otp
    reason: str
    urgency: str = "immediate"

class NotificationOut(BaseModel):
    id: str
    recipient_user_id: str
    incident_id: Optional[str] = None
    notification_type: str
    title: str
    message: str
    severity: str
    delivery_status: str
    is_read: bool
    read_at: Optional[str] = None
    created_at: str

class AuditLogOut(BaseModel):
    id: str
    actor_name: str
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    timestamp: str
