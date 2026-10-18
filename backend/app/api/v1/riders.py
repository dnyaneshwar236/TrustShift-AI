import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_rider, get_current_manager, get_optional_current_user
from app.core.security import get_password_hash
from app.services.auth_service import AuthService
from app.models.user import User, RiderProfile, ConsentRecord
from app.models.org import Branch, Organization
from app.models.session import RiderSession
from app.models.trust import TrustEvaluation
from app.models.base import utc_now
from app.schemas.rider import RiderRegistrationRequest, RiderOnboardingStepUpdate, RiderDetailOut
from app.schemas.common import StandardResponse, PaginatedResponse
from app.services.audit_service import AuditService


router = APIRouter(prefix="/riders", tags=["Riders"])

def _format_rider_detail(db: Session, rider: RiderProfile) -> RiderDetailOut:
    branch_name = rider.branch.name if rider.branch else "Unassigned Branch"
    mgr_name = rider.assigned_manager.email if rider.assigned_manager else "Operations Pool"
    
    # Get current session & trust score
    latest_sess = db.query(RiderSession).filter(
        RiderSession.rider_id == rider.id
    ).order_by(RiderSession.authenticated_at.desc()).first()
    
    current_shift_status = latest_sess.shift_status if latest_sess else "not_started"

    latest_eval = db.query(TrustEvaluation).filter(
        TrustEvaluation.rider_id == rider.id
    ).order_by(TrustEvaluation.evaluated_at.desc()).first()

    trust_score = latest_eval.trust_score if latest_eval else 85.0
    score_band = latest_eval.score_band if latest_eval else "high_trust"

    return RiderDetailOut(
        id=rider.id,
        user_id=rider.user_id,
        rider_code=rider.rider_code,
        legal_name=rider.legal_name,
        email=rider.email or (rider.user.email if rider.user else None),
        phone=rider.phone,
        address=rider.address,
        date_of_birth=rider.date_of_birth,
        experience_years=rider.experience_years,
        employment_type=rider.employment_type,
        work_zone=rider.work_zone,
        shift_preference=rider.shift_preference,
        vehicle_type=rider.vehicle_type,
        branch_id=rider.branch_id,
        branch_name=branch_name,
        assigned_manager_id=rider.assigned_manager_id,
        assigned_manager_name=mgr_name,
        license_number=rider.license_number,
        license_expiry=rider.license_expiry,
        license_class=rider.license_class,
        license_document_url=rider.license_document_url,
        government_id_type=rider.government_id_type,
        government_id_number=rider.government_id_number,
        government_id_document_url=rider.government_id_document_url,
        documents_verified=rider.documents_verified,
        onboarding_status=rider.onboarding_status,
        onboarding_step=rider.onboarding_step,
        selfie_enrolled=rider.selfie_enrolled,
        selfie_image_data=rider.selfie_image_data,
        trustmark_enrolled=rider.trustmark_enrolled,
        trustmark_signature_data=rider.trustmark_signature_data,
        current_shift_status=current_shift_status,
        current_trust_score=trust_score,
        current_score_band=score_band,
        created_at=rider.created_at
    )

@router.post("", response_model=StandardResponse[RiderDetailOut])
def register_rider(
    req: RiderRegistrationRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    req_email = req.email.lower().strip()
    req_phone = req.phone.strip() if req.phone else None

    # Check existing user by email or by phone
    user_by_email = db.query(User).filter(User.email == req_email).first()
    user_by_phone = db.query(User).filter(User.phone == req_phone).first() if req_phone else None

    # If both exist and point to different accounts, report clear conflict
    if user_by_email and user_by_phone and user_by_email.id != user_by_phone.id:
        raise HTTPException(
            status_code=400,
            detail="The provided email address and phone number are already registered to different accounts. Please use your own unique email and phone number."
        )

    existing_user = user_by_email or user_by_phone
    if existing_user:
        # Check role: block non-rider collision
        if existing_user.role != "rider":
            raise HTTPException(
                status_code=400,
                detail="An account with this email or phone is already registered as a manager or administrator. Please sign in to the Operations Portal."
            )

        # Smoothly update existing rider's profile and credentials
        existing_user.email = req_email
        if req_phone:
            existing_user.phone = req_phone

        rider = existing_user.rider_profile
        if not rider:
            count = db.query(RiderProfile).count() + 1
            rider = RiderProfile(
                user_id=existing_user.id,
                rider_code=f"RDR-{1000 + count}",
                legal_name=req.legal_name.strip() if req.legal_name else "Fleet Courier",
                created_at=utc_now()
            )
            db.add(rider)
            db.flush()

        if req.legal_name:
            rider.legal_name = req.legal_name.strip()
        rider.email = req_email
        if req_phone:
            rider.phone = req_phone
        if req.date_of_birth:
            rider.date_of_birth = req.date_of_birth
        if req.address:
            rider.address = req.address
        if req.license_number:
            rider.license_number = req.license_number
        if req.license_expiry:
            rider.license_expiry = req.license_expiry
        if req.license_class:
            rider.license_class = req.license_class
        if req.license_document_b64:
            rider.license_document_url = req.license_document_b64
        if req.government_id_type:
            rider.government_id_type = req.government_id_type
        if req.government_id_number:
            rider.government_id_number = req.government_id_number
        if req.government_id_document_b64:
            rider.government_id_document_url = req.government_id_document_b64
        if rider.license_number and rider.government_id_number:
            rider.documents_verified = True
        
        w_zone = req.work_zone or req.assigned_work_zone
        if w_zone:
            rider.work_zone = w_zone
        if req.vehicle_type:
            rider.vehicle_type = req.vehicle_type
        if req.shift_preference:
            rider.shift_preference = req.shift_preference

        if req.selfie_image_data:
            rider.selfie_image_data = req.selfie_image_data
            rider.selfie_enrolled = True
            if not rider.selfie_reference_id:
                rider.selfie_reference_id = f"SIM-FACE-REF-{uuid.uuid4().hex[:12].upper()}"

        if req.trustmark_signature_data:
            rider.trustmark_signature_data = req.trustmark_signature_data
            rider.trustmark_enrolled = True
            if not rider.trustmark_reference_id:
                rider.trustmark_reference_id = f"SIM-SIGN-REF-{uuid.uuid4().hex[:12].upper()}"

        rider.updated_at = utc_now()
        existing_user.updated_at = utc_now()
        db.commit()
        db.refresh(rider)

        token = AuthService.generate_token_for_user(existing_user)
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            samesite="lax",
            secure=False,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        out_detail = _format_rider_detail(db, rider)
        out_detail.access_token = token
        return StandardResponse(
            success=True,
            message="Rider profile updated with uploaded credentials.",
            data=out_detail
        )

    # Get default organization
    org = db.query(Organization).first()
    if not org:
        raise HTTPException(status_code=500, detail="Default organization not configured.")

    # Generate sequential or unique Rider Code
    base_num = db.query(RiderProfile).count() + 1000
    while db.query(RiderProfile).filter(RiderProfile.rider_code == f"RDR-{base_num}").first():
        base_num += 1
    rider_code = f"RDR-{base_num}"

    # Create user with conflict handling
    user = User(
        organization_id=org.id,
        email=req_email,
        phone=req_phone,
        password_hash=get_password_hash(req.password or "Rider@12345"),
        role="rider",
        status="active",
        is_2fa_enabled=False, # Allow instant onboarding transition
        created_at=utc_now()
    )
    db.add(user)
    try:
        db.flush()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="An account with this email address or phone number already exists. Please use unique contact details or log in."
        )

    # Assign branch
    branch_id = req.branch_id
    if not branch_id:
        default_branch = db.query(Branch).filter(Branch.organization_id == org.id).first()
        branch_id = default_branch.id if default_branch else None

    # Find manager for assignment
    mgr = db.query(User).filter(User.organization_id == org.id, User.role == "manager").first()

    rider = RiderProfile(
        user_id=user.id,
        rider_code=rider_code,
        legal_name=req.legal_name.strip(),
        date_of_birth=req.date_of_birth,
        phone=req_phone,
        email=req_email,
        address=req.address,
        experience_years=int(req.experience_years) if req.experience_years and str(req.experience_years).isdigit() else 0,
        employment_type=req.employment_type or "full_time",
        work_zone=req.work_zone or req.assigned_work_zone or "Central Metro District",
        shift_preference=req.shift_preference,
        vehicle_type=req.vehicle_type,
        branch_id=branch_id,
        assigned_manager_id=mgr.id if mgr else None,
        license_number=req.license_number,
        license_expiry=req.license_expiry,
        license_class=req.license_class,
        license_document_url=req.license_document_b64,
        government_id_type=req.government_id_type or "national_id",
        government_id_number=req.government_id_number,
        government_id_document_url=req.government_id_document_b64,
        documents_verified=bool(req.license_number and req.government_id_number),
        onboarding_status="draft",
        onboarding_step=2,
        selfie_enrolled=bool(req.selfie_image_data),
        selfie_reference_id=f"SIM-FACE-REF-{uuid.uuid4().hex[:12].upper()}" if req.selfie_image_data else None,
        selfie_image_data=req.selfie_image_data,
        trustmark_enrolled=bool(req.trustmark_signature_data),
        trustmark_reference_id=f"SIM-SIGN-REF-{uuid.uuid4().hex[:12].upper()}" if req.trustmark_signature_data else None,
        trustmark_signature_data=req.trustmark_signature_data,
        created_at=utc_now()
    )
    db.add(rider)
    try:
        db.commit()
        db.refresh(rider)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Registration conflict saving rider profile. Please check credentials and try again."
        )

    token = AuthService.generate_token_for_user(user)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    AuditService.log_event(
        db=db,
        organization_id=org.id,
        action="RIDER_REGISTERED",
        actor_user_id=user.id,
        target_type="RiderProfile",
        target_id=rider.id,
        details={"rider_code": rider.rider_code}
    )

    out_detail = _format_rider_detail(db, rider)
    out_detail.access_token = token

    return StandardResponse(
        success=True,
        message="Rider account registered successfully.",
        data=out_detail
    )


@router.get("", response_model=StandardResponse[List[RiderDetailOut]])
def list_riders(
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    query = db.query(RiderProfile).join(User, RiderProfile.user_id == User.id).filter(
        User.organization_id == current_user.organization_id
    )

    if branch_id:
        query = query.filter(RiderProfile.branch_id == branch_id)
    if status:
        query = query.filter(RiderProfile.onboarding_status == status)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (RiderProfile.legal_name.ilike(search_fmt)) |
            (RiderProfile.rider_code.ilike(search_fmt)) |
            (RiderProfile.phone.ilike(search_fmt))
        )

    riders = query.order_by(RiderProfile.created_at.desc()).all()
    results = [_format_rider_detail(db, r) for r in riders]
    return StandardResponse(success=True, message="Riders retrieved.", data=results)

@router.get("/me/profile", response_model=StandardResponse[RiderDetailOut])
def get_my_rider_profile(
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    rider = current_user.rider_profile
    if not rider:
        raise HTTPException(status_code=404, detail="Rider profile not associated with this account.")
    return StandardResponse(success=True, message="Profile retrieved.", data=_format_rider_detail(db, rider))

@router.get("/{rider_id}", response_model=StandardResponse[RiderDetailOut])
def get_rider_by_id(
    rider_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rider = db.query(RiderProfile).filter(RiderProfile.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found.")

    # Authorization: Rider can only view their own
    if current_user.role == "rider" and rider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot view another rider's profile.")

    # Manager can only view within their organization
    if current_user.role in ["manager", "admin"] and rider.user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied: Rider belongs to another organization.")

    return StandardResponse(success=True, message="Rider profile retrieved.", data=_format_rider_detail(db, rider))

@router.post("/{rider_id}/step", response_model=StandardResponse[RiderDetailOut])
def update_onboarding_step(
    rider_id: str,
    update: RiderOnboardingStepUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    rider = db.query(RiderProfile).filter(RiderProfile.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found.")

    if current_user and current_user.role == "rider" and rider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    # Update data fields based on step
    rider.onboarding_step = max(rider.onboarding_step, update.step + 1)
    
    # Save step-specific attributes
    d = update.data
    for field in [
        "legal_name", "vehicle_type", "shift_preference", "work_zone", "employment_type",
        "license_number", "license_expiry", "license_class", "license_document_url",
        "government_id_type", "government_id_number", "government_id_document_url",
        "selfie_image_data", "trustmark_signature_data"
    ]:
        if field in d and d[field] is not None:
            setattr(rider, field, d[field])
    
    if "selfie_image_data" in d and d["selfie_image_data"]:
        rider.selfie_enrolled = True
        if not rider.selfie_reference_id:
            rider.selfie_reference_id = f"SIM-FACE-REF-{uuid.uuid4().hex[:12].upper()}"

    if "trustmark_signature_data" in d and d["trustmark_signature_data"]:
        rider.trustmark_enrolled = True
        if not rider.trustmark_reference_id:
            rider.trustmark_reference_id = f"SIM-SIGN-REF-{uuid.uuid4().hex[:12].upper()}"

    if rider.license_number and rider.government_id_number:
        rider.documents_verified = True

    rider.updated_at = utc_now()
    db.commit()
    db.refresh(rider)
    return StandardResponse(success=True, message=f"Onboarding step {update.step} saved.", data=_format_rider_detail(db, rider))

@router.post("/{rider_id}/submit-onboarding", response_model=StandardResponse[RiderDetailOut])
def submit_onboarding(
    rider_id: str,
    response: Response,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    rider = db.query(RiderProfile).filter(RiderProfile.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found.")

    if current_user and current_user.role == "rider" and rider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    # Automatically set to active so the user can immediately access rider features
    rider.onboarding_status = "active"
    if rider.user:
        rider.user.status = "active"
    rider.updated_at = utc_now()
    db.commit()
    db.refresh(rider)

    user_for_token = current_user or rider.user
    token = AuthService.generate_token_for_user(user_for_token)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    actor_id = current_user.id if current_user else rider.user_id
    AuditService.log_event(
        db=db,
        organization_id=rider.user.organization_id,
        action="ONBOARDING_SUBMITTED",
        actor_user_id=actor_id,
        target_type="RiderProfile",
        target_id=rider.id,
        details={"status": rider.onboarding_status}
    )

    out_detail = _format_rider_detail(db, rider)
    out_detail.access_token = token
    return StandardResponse(success=True, message="Onboarding submitted successfully.", data=out_detail)


@router.post("/{rider_id}/activate", response_model=StandardResponse[RiderDetailOut])
def activate_rider(
    rider_id: str,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    rider = db.query(RiderProfile).filter(RiderProfile.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found.")

    rider.onboarding_status = "active"
    rider.user.status = "active"
    db.commit()
    db.refresh(rider)
    return StandardResponse(success=True, message=f"Rider {rider.rider_code} activated.", data=_format_rider_detail(db, rider))

@router.post("/{rider_id}/deactivate", response_model=StandardResponse[RiderDetailOut])
def deactivate_rider(
    rider_id: str,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    rider = db.query(RiderProfile).filter(RiderProfile.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found.")

    rider.onboarding_status = "inactive"
    db.commit()
    db.refresh(rider)
    return StandardResponse(success=True, message=f"Rider {rider.rider_code} deactivated.", data=_format_rider_detail(db, rider))
