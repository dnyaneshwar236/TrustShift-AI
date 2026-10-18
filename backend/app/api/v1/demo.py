from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.schemas.common import StandardResponse
from app.services.demo_service import DemoService

router = APIRouter(prefix="/demo", tags=["Demo Simulation"])

SCENARIOS_CATALOG = [
    {
        "id": "SCENARIO_A",
        "title": "Scenario A — Normal Rider Check-in",
        "tagline": "Known Device + Facial Match",
        "description": "Rider checks in on authorized hardware with biometric match. Continuity score remains High Trust (90+), action CONTINUE.",
        "badge": "High Trust",
        "badge_color": "green"
    },
    {
        "id": "SCENARIO_B",
        "title": "Scenario B — New Phone, Legitimate Rider",
        "tagline": "Device Switch + 2FA",
        "description": "Rider logs in from a newly purchased smartphone. Score adjusts to Caution band (60-79), requesting step-up selfie without accusatory flags.",
        "badge": "Caution",
        "badge_color": "amber"
    },
    {
        "id": "SCENARIO_C",
        "title": "Scenario C — Suspected Account Handoff",
        "tagline": "Biometric Mismatch + Rogue Device",
        "description": "Facial verification fails with 19% match on an unverified device. Triggers Critical Incident, restricts shift, creates manager alert & compiles PDF report.",
        "badge": "Critical Incident",
        "badge_color": "red"
    },
    {
        "id": "SCENARIO_D",
        "title": "Scenario D — Poor Selfie Quality",
        "tagline": "Underexposed / Dim Lighting",
        "description": "Camera capture underexposed. System issues a helpful lighting retry guidance rather than generating false fraud accusations.",
        "badge": "Retry Prompt",
        "badge_color": "blue"
    },
    {
        "id": "SCENARIO_E",
        "title": "Scenario E — New Rider (Insufficient History)",
        "tagline": "Sparse Historical Baseline",
        "description": "New onboarding recruit has fewer than 2 shifts. Coverage set to 55%, preventing false-confidence assumptions.",
        "badge": "Insufficient History",
        "badge_color": "slate"
    },
    {
        "id": "SCENARIO_F",
        "title": "Scenario F — Manager Incident Review",
        "tagline": "Investigation & Resolution",
        "description": "Manager reviews incident INC-2026-0001, adds review notes, clears false alert after phone camera check, and updates the official PDF report.",
        "badge": "Review Resolved",
        "badge_color": "purple"
    },
    {
        "id": "SCENARIO_G",
        "title": "Scenario G — PDF Error Handling Boundary",
        "tagline": "Fault-Tolerant Reporting",
        "description": "Simulates storage lock failure. Ensures UI captures error gracefully with retry option, safeguarding DB integrity.",
        "badge": "Resilience Test",
        "badge_color": "slate"
    }
]

@router.get("/scenarios", response_model=StandardResponse[List[dict]])
def get_scenarios():
    if not settings.ENABLE_DEMO_PANEL:
        raise HTTPException(status_code=403, detail="Demo scenario panel disabled in this environment.")
    return StandardResponse(
        success=True,
        message="Demo scenarios catalog retrieved.",
        data=SCENARIOS_CATALOG
    )

@router.post("/run/{scenario_id}", response_model=StandardResponse[dict])
def run_demo_scenario(
    scenario_id: str,
    db: Session = Depends(get_db)
):
    if not settings.ENABLE_DEMO_PANEL:
        raise HTTPException(status_code=403, detail="Demo scenario panel disabled in this environment.")
    
    result = DemoService.run_scenario(db, scenario_id)
    return StandardResponse(
        success=True,
        message=f"Scenario {scenario_id} executed successfully.",
        data=result
    )
