import os
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.incident import Incident, IncidentReport
from app.models.user import User
from app.models.base import utc_now
from app.core.config import settings
from app.reports.generator import generate_pdf_report
from app.services.audit_service import AuditService

class ReportService:
    @staticmethod
    def generate_report_for_incident(
        db: Session,
        incident_id: str,
        generated_by_user_id: Optional[str] = None,
        force_regenerate: bool = False
    ) -> IncidentReport:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise ValueError(f"Incident with ID {incident_id} not found.")

        # Check existing report
        existing_report = db.query(IncidentReport).filter(
            IncidentReport.incident_id == incident_id,
            IncidentReport.status == "generated"
        ).order_by(IncidentReport.report_version.desc()).first()

        if existing_report and not force_regenerate:
            if os.path.exists(existing_report.file_path):
                return existing_report

        version = (existing_report.report_version + 1) if existing_report else 1
        report_number = f"REP-{incident.incident_number}-V{version}"
        file_name = f"TrustShift_Incident_{incident.incident_number}_V{version}.pdf"
        file_path = os.path.join(settings.REPORT_STORAGE_DIR, file_name)

        user_name = "Automated Continuity Pipeline"
        if generated_by_user_id:
            user = db.query(User).filter(User.id == generated_by_user_id).first()
            if user:
                user_name = user.email

        # Generate the PDF file
        sha256_hash = generate_pdf_report(
            incident=incident,
            report_number=report_number,
            output_path=file_path,
            generated_by_name=user_name
        )

        report_entry = IncidentReport(
            report_number=report_number,
            incident_id=incident.id,
            report_version=version,
            file_path=file_path,
            cryptographic_hash=sha256_hash,
            status="generated",
            generated_by_user_id=generated_by_user_id,
            generated_at=utc_now()
        )
        db.add(report_entry)
        db.commit()
        db.refresh(report_entry)

        AuditService.log_event(
            db=db,
            organization_id=incident.organization_id,
            action="REPORT_GENERATED",
            actor_user_id=generated_by_user_id,
            target_type="IncidentReport",
            target_id=report_entry.id,
            details={
                "report_number": report_number,
                "incident_number": incident.incident_number,
                "sha256": sha256_hash
            }
        )

        return report_entry

    @staticmethod
    def get_report_file(
        db: Session,
        report_id: str,
        requesting_user: User
    ) -> IncidentReport:
        report = db.query(IncidentReport).filter(IncidentReport.id == report_id).first()
        if not report:
            raise ValueError("Report not found")

        # Authorization check: Rider cannot download incident reports
        if requesting_user.role == "rider":
            raise PermissionError("Riders are not authorized to download confidential investigation reports.")

        # Managers can only download for their organization/branch
        incident = report.incident
        if incident.organization_id != requesting_user.organization_id:
            raise PermissionError("Access denied: Report outside organizational scope.")

        # Log download audit event
        AuditService.log_event(
            db=db,
            organization_id=requesting_user.organization_id,
            action="REPORT_DOWNLOADED",
            actor_user_id=requesting_user.id,
            target_type="IncidentReport",
            target_id=report.id,
            details={
                "report_number": report.report_number,
                "incident_number": incident.incident_number
            }
        )

        return report
