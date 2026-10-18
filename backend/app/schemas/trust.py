from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class TrustScoreBreakdownOut(BaseModel):
    id: Optional[str] = None
    session_id: Optional[str] = None
    rider_id: str
    trust_score: float # 0.0 - 100.0
    score_band: str # high_trust, caution, elevated_risk, critical
    evidence_coverage: float
    recommended_action: str # continue, verify, investigate
    
    # 5 Components
    identity_score: float
    auth_score: float
    device_score: float
    behavior_score: float
    corroborating_score: float
    
    reason_codes: List[str]
    rule_version: str
    evaluated_at: datetime
