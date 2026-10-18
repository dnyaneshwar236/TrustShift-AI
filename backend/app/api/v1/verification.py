from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_rider, get_optional_current_user
from app.models.user import User, RiderProfile
from app.models.verification import VerificationEvent
from app.models.session import RiderSession
from app.schemas.verification import (
    SelfieEnrollRequest,
    SelfieCheckRequest,
    TrustMarkEnrollRequest,
    TrustMarkCheckRequest,
    VerificationResultOut
)
from app.schemas.common import StandardResponse
from app.services.verification_service import VerificationService
from app.services.trust_engine import TrustEngine
from app.services.incident_service import IncidentService

router = APIRouter(prefix="/verification", tags=["Verification"])

def _format_verif_out(event: VerificationEvent, msg: str, action: str, rider: Optional[RiderProfile] = None) -> VerificationResultOut:
    ref_enrolled = None
    ref_id = None
    has_ref_img = None
    has_ref_sig = None

    if rider:
        if "selfie" in event.verification_type:
            ref_enrolled = rider.selfie_enrolled
            ref_id = rider.selfie_reference_id
            has_ref_img = bool(rider.selfie_image_data)
        elif "trustmark" in event.verification_type:
            ref_enrolled = rider.trustmark_enrolled
            ref_id = rider.trustmark_reference_id
            has_ref_sig = bool(rider.trustmark_signature_data)

    return VerificationResultOut(
        id=event.id,
        verification_type=event.verification_type,
        outcome=event.outcome,
        confidence_score=event.confidence_score,
        provider_reference=event.provider_reference,
        reason_code=event.reason_code,
        is_simulation=event.is_simulation,
        message=msg,
        recommended_action=action,
        reference_enrolled=ref_enrolled,
        enrolled_reference_id=ref_id,
        has_reference_image=has_ref_img,
        has_reference_signature=has_ref_sig,
        occurred_at=event.occurred_at
    )

@router.get("/reference", response_model=StandardResponse[dict])
def get_enrolled_reference(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rider = current_user.rider_profile
    if not rider:
        raise HTTPException(status_code=400, detail="Only riders have biometric reference templates.")
    return StandardResponse(
        success=True,
        message="Enrolled reference assets retrieved from database.",
        data={
            "rider_id": rider.id,
            "rider_code": rider.rider_code,
            "legal_name": rider.legal_name,
            "selfie_enrolled": rider.selfie_enrolled,
            "selfie_reference_id": rider.selfie_reference_id,
            "selfie_image_data": rider.selfie_image_data,
            "trustmark_enrolled": rider.trustmark_enrolled,
            "trustmark_reference_id": rider.trustmark_reference_id,
            "trustmark_signature_data": rider.trustmark_signature_data,
        }
    )

@router.post("/selfie/enroll", response_model=StandardResponse[VerificationResultOut])
def enroll_selfie(
    req: SelfieEnrollRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    rider = None
    if current_user and current_user.rider_profile:
        rider = current_user.rider_profile
    elif req.rider_id:
        rider = db.query(RiderProfile).filter(RiderProfile.id == req.rider_id).first()

    if not rider:
        raise HTTPException(status_code=400, detail="Rider profile not identified for selfie enrollment.")

    success, msg, ref = VerificationService.process_selfie_enrollment(
        db=db,
        rider=rider,
        image_b64=req.image_b64,
        simulation_preset=req.simulation_preset or "match"
    )

    if not success:
        raise HTTPException(status_code=400, detail=msg)

    latest_ev = db.query(VerificationEvent).filter(
        VerificationEvent.rider_id == rider.id,
        VerificationEvent.verification_type == "selfie_enrollment"
    ).order_by(VerificationEvent.occurred_at.desc()).first()

    return StandardResponse(
        success=True,
        message=msg,
        data=_format_verif_out(latest_ev, msg, "continue", rider)
    )


@router.post("/selfie/check", response_model=StandardResponse[VerificationResultOut])
def verify_selfie(
    req: SelfieCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rider = current_user.rider_profile
    if not rider:
        raise HTTPException(status_code=400, detail="Only rider accounts can perform selfie verification.")

    # Find active session
    session = None
    if req.session_id:
        session = db.query(RiderSession).filter(RiderSession.id == req.session_id).first()
    if not session:
        session = db.query(RiderSession).filter(
            RiderSession.rider_id == rider.id,
            RiderSession.status == "active"
        ).order_by(RiderSession.authenticated_at.desc()).first()

    event = VerificationService.verify_selfie(
        db=db,
        rider=rider,
        session_id=session.id if session else None,
        image_b64=req.image_b64,
        simulation_preset=req.simulation_preset or "match"
    )

    # Re-evaluate continuity trust score
    if session:
        eval_res = TrustEngine.evaluate_session(
            db=db,
            rider=rider,
            session=session,
            override_signals={"identity_outcome": event.outcome}
        )
        # Check incident threshold
        if event.outcome in ["no_match", "liveness_failure"] or eval_res.trust_score < 50.0:
            IncidentService.check_and_create_incident(
                db=db,
                rider=rider,
                session=session,
                evaluation=eval_res,
                evidence_summary=f"Automated selfie check failed with outcome: {event.outcome.upper()} ({event.reason_code})."
            )

    action = "continue" if event.outcome == "match" else ("retry" if event.outcome in ["quality_failure", "uncertain"] else "review")
    msg = f"Selfie verification completed: {event.outcome.upper()}."

    return StandardResponse(
        success=(event.outcome == "match"),
        message=msg,
        data=_format_verif_out(event, msg, action, rider)
    )

@router.post("/trustmark/enroll", response_model=StandardResponse[VerificationResultOut])
def enroll_trustmark(
    req: TrustMarkEnrollRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    rider = None
    if current_user and current_user.rider_profile:
        rider = current_user.rider_profile
    elif req.rider_id:
        rider = db.query(RiderProfile).filter(RiderProfile.id == req.rider_id).first()

    if not rider:
        raise HTTPException(status_code=400, detail="Rider profile not identified for TrustMark enrollment.")

    success, msg, ref = VerificationService.process_trustmark_enrollment(
        db=db,
        rider=rider,
        stroke_data=req.stroke_data,
        simulation_preset=req.simulation_preset or "match"
    )

    latest_ev = db.query(VerificationEvent).filter(
        VerificationEvent.rider_id == rider.id,
        VerificationEvent.verification_type == "trustmark_enrollment"
    ).order_by(VerificationEvent.occurred_at.desc()).first()

    return StandardResponse(
        success=True,
        message=msg,
        data=_format_verif_out(latest_ev, msg, "continue", rider)
    )


@router.post("/trustmark/check", response_model=StandardResponse[VerificationResultOut])
def verify_trustmark(
    req: TrustMarkCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rider = current_user.rider_profile
    if not rider:
        raise HTTPException(status_code=400, detail="Only rider accounts can check TrustMark.")

    event = VerificationService.verify_trustmark(
        db=db,
        rider=rider,
        session_id=req.session_id,
        stroke_data=req.stroke_data,
        simulation_preset=req.simulation_preset or "match"
    )

    action = "continue" if event.outcome == "match" else "review"
    msg = f"TrustMark pattern verification: {event.outcome.upper()}."

    return StandardResponse(
        success=(event.outcome == "match"),
        message=msg,
        data=_format_verif_out(event, msg, action, rider)
    )

@router.get("/history", response_model=StandardResponse[List[VerificationResultOut]])
def get_verification_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rider = current_user.rider_profile
    if not rider:
        return StandardResponse(success=True, message="No verification events.", data=[])

    events = db.query(VerificationEvent).filter(
        VerificationEvent.rider_id == rider.id
    ).order_by(VerificationEvent.occurred_at.desc()).limit(30).all()

    results = [
        _format_verif_out(ev, f"Result: {ev.outcome}", "continue", rider)
        for ev in events
    ]
    return StandardResponse(success=True, message="Verification history retrieved.", data=results)
