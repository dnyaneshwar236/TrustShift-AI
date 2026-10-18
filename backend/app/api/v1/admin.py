from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.core.security import get_password_hash
from app.models.user import User, ManagerProfile, RiderProfile
from app.models.org import Branch, OrganizationPolicy, Organization
from app.models.incident import Incident
from app.schemas.admin import (
    CreateManagerRequest,
    BranchCreateRequest,
    BranchOut,
    PolicyUpdateRequest,
    PolicyOut
)
from app.schemas.auth import UserProfileOut
from app.schemas.common import StandardResponse
from app.services.audit_service import AuditService
from app.models.base import utc_now

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/branches", response_model=StandardResponse[List[BranchOut]])
def list_branches(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    branches = db.query(Branch).filter(
        Branch.organization_id == current_user.organization_id
    ).all()

    data = [
        BranchOut(
            id=b.id,
            name=b.name,
            code=b.code,
            city=b.city,
            state=b.state,
            status=b.status,
            riders_count=len(b.riders),
            created_at=b.created_at.isoformat()
        ) for b in branches
    ]
    return StandardResponse(success=True, message="Branches retrieved.", data=data)

@router.post("/branches", response_model=StandardResponse[BranchOut])
def create_branch(
    req: BranchCreateRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    branch = Branch(
        organization_id=current_user.organization_id,
        name=req.name.strip(),
        code=req.code.upper().strip(),
        city=req.city,
        state=req.state,
        status="active",
        created_at=utc_now()
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)

    AuditService.log_event(
        db=db,
        organization_id=current_user.organization_id,
        action="BRANCH_CREATED",
        actor_user_id=current_user.id,
        target_type="Branch",
        target_id=branch.id,
        details={"name": branch.name, "code": branch.code}
    )

    return StandardResponse(
        success=True,
        message="Branch created.",
        data=BranchOut(
            id=branch.id,
            name=branch.name,
            code=branch.code,
            city=branch.city,
            state=branch.state,
            status=branch.status,
            riders_count=0,
            created_at=branch.created_at.isoformat()
        )
    )

@router.get("/managers", response_model=StandardResponse[List[dict]])
def list_managers(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    managers = db.query(User).filter(
        User.organization_id == current_user.organization_id,
        User.role == "manager"
    ).all()

    results = []
    for m in managers:
        prof = m.manager_profile
        results.append({
            "id": m.id,
            "email": m.email,
            "status": m.status,
            "title": prof.title if prof else "Shift Lead",
            "department": prof.department if prof else "Operations",
            "branch_name": prof.branch.name if (prof and prof.branch) else "All Branches",
            "created_at": m.created_at.isoformat()
        })
    return StandardResponse(success=True, message="Managers retrieved.", data=results)

@router.post("/managers", response_model=StandardResponse[dict])
def create_manager(
    req: CreateManagerRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account with this email already exists.")

    new_user = User(
        organization_id=current_user.organization_id,
        email=req.email.lower().strip(),
        password_hash=get_password_hash(req.password),
        role="manager",
        status="active",
        is_2fa_enabled=True,
        created_at=utc_now()
    )
    db.add(new_user)
    db.flush()

    prof = ManagerProfile(
        user_id=new_user.id,
        branch_id=req.branch_id,
        title=req.title,
        department=req.department,
        created_at=utc_now()
    )
    db.add(prof)
    db.commit()

    AuditService.log_event(
        db=db,
        organization_id=current_user.organization_id,
        action="MANAGER_CREATED",
        actor_user_id=current_user.id,
        target_type="User",
        target_id=new_user.id,
        details={"email": new_user.email, "title": req.title}
    )

    return StandardResponse(success=True, message="Manager created successfully.", data={"id": new_user.id, "email": new_user.email})

@router.get("/policy", response_model=StandardResponse[PolicyOut])
def get_policy(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    pol = db.query(OrganizationPolicy).filter(
        OrganizationPolicy.organization_id == current_user.organization_id
    ).first()

    if not pol:
        pol = OrganizationPolicy(organization_id=current_user.organization_id)
        db.add(pol)
        db.commit()
        db.refresh(pol)

    return StandardResponse(
        success=True,
        message="Policy retrieved.",
        data=PolicyOut(
            id=pol.id,
            organization_id=pol.organization_id,
            critical_threshold=pol.critical_threshold,
            elevated_threshold=pol.elevated_threshold,
            caution_threshold=pol.caution_threshold,
            require_2fa_on_new_device=pol.require_2fa_on_new_device,
            require_selfie_on_shift_start=pol.require_selfie_on_shift_start,
            require_trustmark_on_high_risk=pol.require_trustmark_on_high_risk,
            auto_create_incident_on_mismatch=pol.auto_create_incident_on_mismatch,
            max_failed_attempts_before_lock=pol.max_failed_attempts_before_lock
        )
    )

@router.put("/policy", response_model=StandardResponse[PolicyOut])
def update_policy(
    req: PolicyUpdateRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    pol = db.query(OrganizationPolicy).filter(
        OrganizationPolicy.organization_id == current_user.organization_id
    ).first()

    if not pol:
        pol = OrganizationPolicy(organization_id=current_user.organization_id)
        db.add(pol)

    pol.critical_threshold = req.critical_threshold
    pol.elevated_threshold = req.elevated_threshold
    pol.caution_threshold = req.caution_threshold
    pol.require_2fa_on_new_device = req.require_2fa_on_new_device
    pol.require_selfie_on_shift_start = req.require_selfie_on_shift_start
    pol.require_trustmark_on_high_risk = req.require_trustmark_on_high_risk
    pol.auto_create_incident_on_mismatch = req.auto_create_incident_on_mismatch
    pol.max_failed_attempts_before_lock = req.max_failed_attempts_before_lock
    pol.updated_at = utc_now()
    db.commit()
    db.refresh(pol)

    AuditService.log_event(
        db=db,
        organization_id=current_user.organization_id,
        action="POLICY_UPDATED",
        actor_user_id=current_user.id,
        target_type="OrganizationPolicy",
        target_id=pol.id,
        details={"critical_threshold": pol.critical_threshold}
    )

    return StandardResponse(
        success=True,
        message="Policy updated successfully.",
        data=PolicyOut(
            id=pol.id,
            organization_id=pol.organization_id,
            critical_threshold=pol.critical_threshold,
            elevated_threshold=pol.elevated_threshold,
            caution_threshold=pol.caution_threshold,
            require_2fa_on_new_device=pol.require_2fa_on_new_device,
            require_selfie_on_shift_start=pol.require_selfie_on_shift_start,
            require_trustmark_on_high_risk=pol.require_trustmark_on_high_risk,
            auto_create_incident_on_mismatch=pol.auto_create_incident_on_mismatch,
            max_failed_attempts_before_lock=pol.max_failed_attempts_before_lock
        )
    )
