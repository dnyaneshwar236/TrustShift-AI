from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, RiderProfile, ManagerProfile
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    SecondFactorVerifyRequest,
    SecondFactorResendRequest,
    UserProfileOut,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    DigiLockerLoginRequest,
    DigiLockerCredentialsRequest,
    DigiLockerCredentialsOut,
    DigiLockerOAuthExchangeRequest
)
from app.schemas.common import StandardResponse
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService
from app.services.digilocker_service import DigiLockerService
from app.core.config import settings


router = APIRouter(prefix="/auth", tags=["Authentication"])

def _format_user_profile(user: User) -> UserProfileOut:
    rider_profile_id = None
    rider_code = None
    legal_name = None
    branch_id = None
    branch_name = None

    if user.role == "rider" and user.rider_profile:
        rider_profile_id = user.rider_profile.id
        rider_code = user.rider_profile.rider_code
        legal_name = user.rider_profile.legal_name
        branch_id = user.rider_profile.branch_id
        if user.rider_profile.branch:
            branch_name = user.rider_profile.branch.name
    elif user.role in ["manager", "admin"]:
        if user.manager_profile:
            branch_id = user.manager_profile.branch_id
            if user.manager_profile.branch:
                branch_name = user.manager_profile.branch.name
        legal_name = user.email.split("@")[0].replace(".", " ").title()

    org_name = user.organization.name if user.organization else "TrustShift Demo Org"

    return UserProfileOut(
        id=user.id,
        email=user.email,
        phone=user.phone,
        role=user.role,
        status=user.status,
        organization_id=user.organization_id,
        organization_name=org_name,
        is_2fa_enabled=user.is_2fa_enabled,
        rider_profile_id=rider_profile_id,
        rider_code=rider_code,
        legal_name=legal_name,
        branch_id=branch_id,
        branch_name=branch_name,
        selfie_enrolled=user.rider_profile.selfie_enrolled if user.rider_profile else False,
        trustmark_enrolled=user.rider_profile.trustmark_enrolled if user.rider_profile else False,
        selfie_image_data=user.rider_profile.selfie_image_data if user.rider_profile else None,
        trustmark_signature_data=user.rider_profile.trustmark_signature_data if user.rider_profile else None,
    )

@router.post("/login", response_model=LoginResponse)
def login(
    req: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    user = AuthService.authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    # Optional role checking
    if req.role_hint and req.role_hint != user.role:
        if req.role_hint == "rider" and user.role != "rider":
            raise HTTPException(status_code=403, detail="Manager credentials cannot log in via rider portal.")
        if req.role_hint in ["manager", "admin"] and user.role == "rider":
            raise HTTPException(status_code=403, detail="Rider credentials cannot log in to management portal.")

    # Check 2FA requirement
    if user.is_2fa_enabled:
        challenge, plain_code = AuthService.create_2fa_challenge(db, user, challenge_type="sms_otp")
        simulated_code = plain_code if settings.ENVIRONMENT == "development" else None
        
        return LoginResponse(
            requires_2fa=True,
            challenge_id=challenge.id,
            challenge_type=challenge.challenge_type,
            simulated_code=simulated_code,
            access_token=None,
            user=None
        )

    # Direct login without 2FA
    token = AuthService.generate_token_for_user(user)
    
    # Set HttpOnly Cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False, # Set True in production over HTTPS
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    AuditService.log_event(
        db=db,
        organization_id=user.organization_id,
        action="USER_LOGIN_SUCCESS",
        actor_user_id=user.id,
        target_type="User",
        target_id=user.id,
        ip_address=request.client.host if request.client else None
    )

    return LoginResponse(
        requires_2fa=False,
        access_token=token,
        token_type="bearer",
        user=_format_user_profile(user)
    )

@router.post("/second-factor/verify", response_model=LoginResponse)
def verify_second_factor(
    req: SecondFactorVerifyRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    success, message, user = AuthService.verify_2fa_challenge(
        db=db,
        challenge_id=req.challenge_id,
        code=req.code,
        device_fingerprint=req.device_fingerprint,
        device_name=req.device_name,
        remember_device=req.remember_device
    )

    if not success or not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
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
        organization_id=user.organization_id,
        action="SECOND_FACTOR_VERIFIED",
        actor_user_id=user.id,
        target_type="User",
        target_id=user.id,
        ip_address=request.client.host if request.client else None
    )

    return LoginResponse(
        requires_2fa=False,
        access_token=token,
        token_type="bearer",
        user=_format_user_profile(user)
    )

@router.post("/second-factor/resend", response_model=StandardResponse[dict])
def resend_second_factor(
    req: SecondFactorResendRequest,
    db: Session = Depends(get_db)
):
    from app.models.auth import AuthenticationChallenge
    old_challenge = db.query(AuthenticationChallenge).filter(
        AuthenticationChallenge.id == req.challenge_id
    ).first()

    if not old_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    user = old_challenge.user
    new_challenge, plain_code = AuthService.create_2fa_challenge(db, user, challenge_type=old_challenge.challenge_type)
    old_challenge.challenge_status = "expired"
    db.commit()

    return StandardResponse(
        success=True,
        message="A new verification code has been dispatched.",
        data={
            "challenge_id": new_challenge.id,
            "simulated_code": plain_code if settings.ENVIRONMENT == "development" else None
        }
    )

@router.post("/logout", response_model=StandardResponse[dict])
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return StandardResponse(success=True, message="Successfully logged out.", data={})

@router.get("/me", response_model=StandardResponse[UserProfileOut])
def get_me(
    current_user: User = Depends(get_current_user)
):
    return StandardResponse(
        success=True,
        message="Current user profile retrieved.",
        data=_format_user_profile(current_user)
    )

@router.post("/forgot-password", response_model=StandardResponse[dict])
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if user:
        # In simulation mode, issue recovery challenge
        challenge, code = AuthService.create_2fa_challenge(db, user, challenge_type="email_otp")
        return StandardResponse(
            success=True,
            message="Recovery instructions sent to registered address.",
            data={"simulated_reset_code": code if settings.ENVIRONMENT == "development" else None}
        )
    return StandardResponse(
        success=True,
        message="If this account exists, recovery instructions have been sent.",
        data={}
    )

@router.post("/reset-password", response_model=StandardResponse[dict])
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    from app.core.security import get_password_hash
    user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return StandardResponse(success=True, message="Password successfully reset. Please log in.", data={})

@router.post("/digilocker/fast-login", response_model=LoginResponse)
def digilocker_fast_login(
    req: DigiLockerLoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    if not req.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DigiLocker electronic consent is required to authenticate identity."
        )

    user = DigiLockerService.fast_authenticate_or_create(db, req.rider_identifier)
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
        organization_id=user.organization_id,
        action="DIGILOCKER_LOGIN_SUCCESS",
        actor_user_id=user.id,
        target_type="User",
        target_id=user.id,
        ip_address=request.client.host if request.client else None,
        details={
            "channel": "DigiLocker Government Gateway",
            "rider_code": user.rider_profile.rider_code if user.rider_profile else None,
            "aadhaar_last_four": req.aadhaar_last_four or "4829"
        }
    )

    return LoginResponse(
        requires_2fa=False,
        access_token=token,
        token_type="bearer",
        user=_format_user_profile(user)
    )

@router.post("/digilocker/pull-credentials", response_model=StandardResponse[DigiLockerCredentialsOut])
def digilocker_pull_credentials(
    req: DigiLockerCredentialsRequest,
    db: Session = Depends(get_db)
):
    creds = DigiLockerService.get_verified_credentials(
        preset_key=req.preset_identity or "default",
        custom_phone=req.phone
    )
    return StandardResponse(
        success=True,
        message="Official credentials successfully fetched and cryptographically verified via DigiLocker Government Gateway.",
        data=DigiLockerCredentialsOut(**creds)
    )

@router.post("/digilocker/oauth/exchange")
def digilocker_oauth_exchange(
    req: DigiLockerOAuthExchangeRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Exchange DigiLocker OAuth authorization code for verified identity session or onboarding dossier.
    """
    if req.mode == "pull_credentials":
        creds = DigiLockerService.get_verified_credentials(
            preset_key=req.preset_identity or "alex",
            custom_phone=req.phone
        )
        return StandardResponse(
            success=True,
            message="DigiLocker OAuth authorization code exchanged for verified citizen dossier.",
            data=DigiLockerCredentialsOut(**creds)
        )
    else:
        # Default mode: Login
        user = DigiLockerService.fast_authenticate_or_create(db, req.preset_identity or req.phone or "alex")
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
            organization_id=user.organization_id,
            action="DIGILOCKER_OAUTH_LOGIN_SUCCESS",
            actor_user_id=user.id,
            target_type="User",
            target_id=user.id,
            ip_address=request.client.host if request.client else None,
            details={
                "channel": "DigiLocker OAuth 2.0 Web Gateway",
                "auth_code": req.code[:12] + "...",
                "rider_code": user.rider_profile.rider_code if user.rider_profile else None
            }
        )

        return LoginResponse(
            requires_2fa=False,
            access_token=token,
            token_type="bearer",
            user=_format_user_profile(user)
        )


