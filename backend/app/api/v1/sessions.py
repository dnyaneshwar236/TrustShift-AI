import uuid
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_rider
from app.models.user import User, RiderProfile
from app.models.session import RiderSession, SessionEvent
from app.models.trust import TrustEvaluation
from app.models.base import utc_now
from app.schemas.session import StartShiftRequest, EndShiftRequest, SessionEventCreate, RiderSessionOut, TelemetryPingRequest
from app.schemas.trust import TrustScoreBreakdownOut
from app.schemas.common import StandardResponse
from app.services.trust_engine import TrustEngine

router = APIRouter(prefix="/sessions", tags=["Sessions & Shifts"])

def _format_trust_breakdown(eval_record: TrustEvaluation) -> TrustScoreBreakdownOut:
    codes = [c.strip() for c in eval_record.reason_codes.split(",") if c.strip()]
    return TrustScoreBreakdownOut(
        id=eval_record.id,
        session_id=eval_record.session_id,
        rider_id=eval_record.rider_id,
        trust_score=eval_record.trust_score,
        score_band=eval_record.score_band,
        evidence_coverage=eval_record.evidence_coverage,
        recommended_action=eval_record.recommended_action,
        identity_score=eval_record.identity_score,
        auth_score=eval_record.auth_score,
        device_score=eval_record.device_score,
        behavior_score=eval_record.behavior_score,
        corroborating_score=eval_record.corroborating_score,
        reason_codes=codes,
        rule_version=eval_record.rule_version,
        evaluated_at=eval_record.evaluated_at
    )

@router.post("/start", response_model=StandardResponse[RiderSessionOut])
def start_shift(
    req: StartShiftRequest,
    request: Request,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    rider = current_user.rider_profile
    if not rider:
        raise HTTPException(status_code=400, detail="Rider profile missing.")

    # Biometric Gate Enforcement
    from app.models.verification import VerificationEvent
    from app.services.verification_service import VerificationService

    # 1. Check selfie verification proof
    if rider.selfie_enrolled or rider.selfie_image_data:
        if not req.selfie_event_id and not req.selfie_image_b64:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Biometric check-in required: Live face capture must be verified before starting shift."
            )

    if req.selfie_event_id:
        selfie_ev = db.query(VerificationEvent).filter(
            VerificationEvent.id == req.selfie_event_id,
            VerificationEvent.rider_id == rider.id
        ).first()
        if not selfie_ev or selfie_ev.outcome != "match":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Shift Start Blocked: Live face capture does not match the registered rider profile (" + rider.rider_code + "). Impersonation / handoff rejected."
            )
    elif req.selfie_image_b64:
        selfie_ev = VerificationService.verify_selfie(
            db=db,
            rider=rider,
            image_b64=req.selfie_image_b64,
            simulation_preset=req.simulation_preset or "match"
        )
        if selfie_ev.outcome != "match":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Shift Start Blocked: Live face capture does not match the registered rider profile (" + rider.rider_code + "). Check-in rejected."
            )

    # 2. Check TrustMark signature proof
    if rider.trustmark_enrolled or rider.trustmark_signature_data:
        if not req.trustmark_event_id and not req.trustmark_strokes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Biometric check-in required: TrustMark signature must be verified before starting shift."
            )

    if req.trustmark_event_id:
        tm_ev = db.query(VerificationEvent).filter(
            VerificationEvent.id == req.trustmark_event_id,
            VerificationEvent.rider_id == rider.id
        ).first()
        if not tm_ev or tm_ev.outcome != "match":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Shift Start Blocked: TrustMark signature kinematics deviated from the enrolled reference pattern. Check-in rejected."
            )
    elif req.trustmark_strokes:
        tm_ev = VerificationService.verify_trustmark(
            db=db,
            rider=rider,
            stroke_data=req.trustmark_strokes,
            simulation_preset=req.simulation_preset or "match"
        )
        if tm_ev.outcome != "match":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Shift Start Blocked: Drawn signature does not match the registered rider pattern. Check-in rejected."
            )

    # Close previous active sessions if any
    prev_sessions = db.query(RiderSession).filter(
        RiderSession.rider_id == rider.id,
        RiderSession.status == "active"
    ).all()
    for s in prev_sessions:
        s.status = "expired"
        s.ended_at = utc_now()
        s.shift_status = "ended"

    session_token = f"sess_{uuid.uuid4().hex}"
    client_ip = request.client.host if request.client else "127.0.0.1"

    new_session = RiderSession(
        rider_id=rider.id,
        session_token=session_token,
        device_fingerprint=req.device_fingerprint,
        device_name=req.device_name,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", "Mobile App / Field Client"),
        shift_status="on_shift",
        shift_started_at=utc_now(),
        authenticated_at=utc_now(),
        status="active"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Initial session event
    evt = SessionEvent(
        session_id=new_session.id,
        event_type="shift_start",
        metadata_json=json.dumps({"location": req.location_area, "device": req.device_name}),
        occurred_at=utc_now()
    )
    db.add(evt)
    db.commit()

    # Initial trust evaluation
    TrustEngine.evaluate_session(db=db, rider=rider, session=new_session)

    return StandardResponse(
        success=True,
        message="Shift started successfully. Identity continuity monitoring engaged.",
        data=RiderSessionOut(
            id=new_session.id,
            rider_id=new_session.rider_id,
            shift_status=new_session.shift_status,
            shift_started_at=new_session.shift_started_at,
            shift_ended_at=new_session.shift_ended_at,
            device_name=new_session.device_name,
            device_fingerprint=new_session.device_fingerprint,
            ip_address=new_session.ip_address,
            status=new_session.status,
            authenticated_at=new_session.authenticated_at
        )
    )

@router.post("/end", response_model=StandardResponse[RiderSessionOut])
def end_shift(
    req: EndShiftRequest,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    rider = current_user.rider_profile
    active_session = db.query(RiderSession).filter(
        RiderSession.rider_id == rider.id,
        RiderSession.status == "active"
    ).order_by(RiderSession.authenticated_at.desc()).first()

    if not active_session:
        raise HTTPException(status_code=400, detail="No active shift found to end.")

    active_session.shift_status = "ended"
    active_session.shift_ended_at = utc_now()
    active_session.ended_at = utc_now()
    active_session.status = "expired"

    evt = SessionEvent(
        session_id=active_session.id,
        event_type="shift_end",
        metadata_json=json.dumps({"notes": req.notes}),
        occurred_at=utc_now()
    )
    db.add(evt)
    db.commit()
    db.refresh(active_session)

    return StandardResponse(
        success=True,
        message="Shift concluded safely.",
        data=RiderSessionOut(
            id=active_session.id,
            rider_id=active_session.rider_id,
            shift_status=active_session.shift_status,
            shift_started_at=active_session.shift_started_at,
            shift_ended_at=active_session.shift_ended_at,
            device_name=active_session.device_name,
            device_fingerprint=active_session.device_fingerprint,
            ip_address=active_session.ip_address,
            status=active_session.status,
            authenticated_at=active_session.authenticated_at
        )
    )

@router.get("/current", response_model=StandardResponse[dict])
def get_current_session(
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    rider = current_user.rider_profile
    active_session = db.query(RiderSession).filter(
        RiderSession.rider_id == rider.id,
        RiderSession.status == "active"
    ).order_by(RiderSession.authenticated_at.desc()).first()

    eval_data = None
    sess_data = None

    if active_session:
        sess_data = {
            "id": active_session.id,
            "shift_status": active_session.shift_status,
            "shift_started_at": active_session.shift_started_at.isoformat() if active_session.shift_started_at else None,
            "device_name": active_session.device_name,
            "status": active_session.status
        }
        latest_eval = db.query(TrustEvaluation).filter(
            TrustEvaluation.session_id == active_session.id
        ).order_by(TrustEvaluation.evaluated_at.desc()).first()
        if latest_eval:
            eval_data = _format_trust_breakdown(latest_eval).model_dump(mode="json")
    else:
        # Fallback to latest historical evaluation
        latest_eval = db.query(TrustEvaluation).filter(
            TrustEvaluation.rider_id == rider.id
        ).order_by(TrustEvaluation.evaluated_at.desc()).first()
        if latest_eval:
            eval_data = _format_trust_breakdown(latest_eval).model_dump(mode="json")

    return StandardResponse(
        success=True,
        message="Session and trust telemetry retrieved.",
        data={
            "session": sess_data,
            "trust": eval_data
        }
    )

@router.get("/{session_id}/trust", response_model=StandardResponse[TrustScoreBreakdownOut])
def get_session_trust_evaluation(
    session_id: str,
    db: Session = Depends(get_db)
):
    latest_eval = db.query(TrustEvaluation).filter(
        TrustEvaluation.session_id == session_id
    ).order_by(TrustEvaluation.evaluated_at.desc()).first()

    if not latest_eval:
        raise HTTPException(status_code=404, detail="No evaluation found for this session.")

    return StandardResponse(
        success=True,
        message="Trust score breakdown retrieved.",
        data=_format_trust_breakdown(latest_eval)
    )

@router.post("/telemetry", response_model=StandardResponse[dict])
def record_telemetry(
    req: TelemetryPingRequest,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    rider = current_user.rider_profile
    active_session = db.query(RiderSession).filter(
        RiderSession.rider_id == rider.id,
        RiderSession.status == "active"
    ).order_by(RiderSession.authenticated_at.desc()).first()

    if active_session:
        evt = SessionEvent(
            session_id=active_session.id,
            event_type="location_ping",
            metadata_json=json.dumps({
                "latitude": req.latitude,
                "longitude": req.longitude,
                "speed": req.speed,
                "heading": req.heading,
                "accuracy": req.accuracy
            }),
            occurred_at=utc_now()
        )
        db.add(evt)
        db.commit()

    return StandardResponse(
        success=True,
        message="Telemetry recorded successfully.",
        data={
            "latitude": req.latitude,
            "longitude": req.longitude,
            "speed": req.speed,
            "recorded_at": utc_now().isoformat(),
            "session_active": bool(active_session)
        }
    )
