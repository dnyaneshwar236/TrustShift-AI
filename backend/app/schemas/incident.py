from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class IncidentEvidenceOut(BaseModel):
    id: str
    event_reference: Optional[str] = None
    evidence_type: str
    summary: str
    severity: str
    occurred_at: datetime

class ManagerReviewCreate(BaseModel):
    outcome: str # confirmed_handoff, legitimate_rider, false_alert, pending_investigation, resolved_verified
    notes: str
    action_taken: str # re_verification_requested, shift_continued, session_restricted, profile_flagged, cleared

class ManagerReviewOut(BaseModel):
    id: str
    reviewer_id: str
    reviewer_name: str
    outcome: str
    notes: str
    action_taken: str
    created_at: datetime

class IncidentReportOut(BaseModel):
    id: str
    report_number: str
    report_version: int
    cryptographic_hash: str
    status: str
    generated_by_name: Optional[str] = None
    generated_at: datetime

class IncidentDetailOut(BaseModel):
    id: str
    incident_number: str
    organization_id: str
    branch_id: Optional[str] = None
    branch_name: Optional[str] = None
    rider_id: str
    rider_code: str
    rider_name: str
    session_id: Optional[str] = None
    severity: str
    status: str
    reason_codes: List[str]
    risk_score_at_detection: float
    title: str
    description: Optional[str] = None
    assigned_manager_id: Optional[str] = None
    assigned_manager_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    evidences: List[IncidentEvidenceOut] = []
    reviews: List[ManagerReviewOut] = []
    reports: List[IncidentReportOut] = []

class IncidentSummaryOut(BaseModel):
    id: str
    incident_number: str
    rider_id: str
    rider_code: str
    rider_name: str
    branch_name: Optional[str] = None
    severity: str
    status: str
    reason_codes: List[str]
    risk_score_at_detection: float
    title: str
    assigned_manager_name: Optional[str] = None
    has_pdf_report: bool = False
    created_at: datetime
