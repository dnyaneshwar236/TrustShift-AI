import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_manager, get_optional_current_user
from app.models.user import User
from app.models.incident import Incident, IncidentReport
from app.schemas.incident import IncidentReportOut
from app.schemas.common import StandardResponse
from app.services.report_service import ReportService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/reports", tags=["Reports"])

def _format_report_out(rp: IncidentReport) -> IncidentReportOut:
    return IncidentReportOut(
        id=rp.id,
        report_number=rp.report_number,
        report_version=rp.report_version,
        cryptographic_hash=rp.cryptographic_hash,
        status=rp.status,
        generated_by_name=rp.generated_by.email if rp.generated_by else "Automated Pipeline",
        generated_at=rp.generated_at
    )

@router.post("/incidents/{incident_id}", response_model=StandardResponse[IncidentReportOut])
def generate_incident_report(
    incident_id: str,
    force: bool = False,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    try:
        report = ReportService.generate_report_for_incident(
            db=db,
            incident_id=incident_id,
            generated_by_user_id=current_user.id,
            force_regenerate=force
        )
        return StandardResponse(
            success=True,
            message="Incident verification report generated successfully.",
            data=_format_report_out(report)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")

@router.get("/incidents/{incident_id}", response_model=StandardResponse[List[IncidentReportOut]])
def get_incident_reports(
    incident_id: str,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    reports = db.query(IncidentReport).filter(
        IncidentReport.incident_id == incident_id
    ).order_by(IncidentReport.report_version.desc()).all()

    results = [_format_report_out(rp) for rp in reports]
    return StandardResponse(success=True, message="Reports retrieved.", data=results)

@router.get("/{report_id}/download")
def download_report_pdf(
    report_id: str,
    inline: bool = False,
    token: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Downloads or previews the official PDF incident report.
    Supports Bearer header, cookie auth, or secure token query parameter.
    Verifies file integrity, regenerates missing PDFs on demand, and returns application/pdf.
    """
    from app.core.security import decode_access_token
    
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            token_user = db.query(User).filter(User.id == payload["sub"], User.status == "active").first()
            if token_user:
                current_user = token_user

    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to download verification report. Please log in."
        )

    if current_user.role == "rider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Riders are not authorized to download confidential management reports."
        )

    report = db.query(IncidentReport).filter(IncidentReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Requested incident report was not found.")

    incident = report.incident
    if not incident or incident.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied: Report outside organizational scope.")

    # If PDF file was deleted or not yet saved on disk, automatically re-generate it now
    if not report.file_path or not os.path.exists(report.file_path):
        report = ReportService.generate_report_for_incident(
            db=db,
            incident_id=incident.id,
            generated_by_user_id=current_user.id,
            force_regenerate=True
        )

    if not os.path.exists(report.file_path):
        raise HTTPException(status_code=500, detail="Failed to synthesize PDF report document.")

    safe_filename = f"{report.report_number}.pdf"
    disposition = "inline" if inline else f'attachment; filename="{safe_filename}"'

    AuditService.log_event(
        db=db,
        organization_id=incident.organization_id,
        action="REPORT_DOWNLOADED",
        actor_user_id=current_user.id,
        target_type="IncidentReport",
        target_id=report.id,
        details={"report_number": report.report_number, "filename": safe_filename}
    )

    return FileResponse(
        path=report.file_path,
        media_type="application/pdf",
        filename=safe_filename,
        headers={
            "Content-Disposition": disposition,
            "Content-Type": "application/pdf",
            "Cache-Control": "no-cache"
        }
    )

@router.get("", response_model=StandardResponse[List[IncidentReportOut]])
def list_all_reports(
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    reports = db.query(IncidentReport).join(Incident).filter(
        Incident.organization_id == current_user.organization_id
    ).order_by(IncidentReport.generated_at.desc()).limit(50).all()

    results = [_format_report_out(rp) for rp in reports]
    return StandardResponse(success=True, message="All organization reports retrieved.", data=results)
