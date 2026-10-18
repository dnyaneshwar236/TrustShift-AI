import os
import hashlib
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from app.models.incident import Incident
from app.core.config import settings

def generate_pdf_report(
    incident: Incident,
    report_number: str,
    output_path: str,
    generated_by_name: str = "Automated Security Engine"
) -> str:
    """
    Generates a professional enterprise-grade PDF verification report using ReportLab.
    Returns the SHA-256 cryptographic hash of the generated document.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom palette
    PRIMARY_COLOR = colors.HexColor("#4F46E5") # Indigo
    DARK_TEXT = colors.HexColor("#0F172A")    # Slate 900
    MUTED_TEXT = colors.HexColor("#64748B")   # Slate 500
    LIGHT_BG = colors.HexColor("#F8FAFC")     # Slate 50
    BORDER_COLOR = colors.HexColor("#E2E8F0") # Slate 200
    CRITICAL_COLOR = colors.HexColor("#EF4444")
    WARNING_COLOR = colors.HexColor("#F59E0B")
    SUCCESS_COLOR = colors.HexColor("#10B981")

    # Typography styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=PRIMARY_COLOR
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=MUTED_TEXT
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=DARK_TEXT,
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=DARK_TEXT
    )
    bold_body_style = ParagraphStyle(
        "BoldBodyText",
        parent=body_style,
        fontName="Helvetica-Bold"
    )
    code_style = ParagraphStyle(
        "CodeText",
        parent=body_style,
        fontName="Courier",
        fontSize=8,
        textColor=DARK_TEXT
    )

    story = []

    # 1. Header with TrustShift AI Branding
    header_data = [
        [
            Paragraph("<b>TRUSTSHIFT AI</b><br/><font size=8 color='#64748B'>Identity Continuity & Account Handoff Detection Platform</font>", body_style),
            Paragraph(f"<b>INCIDENT VERIFICATION REPORT</b><br/><font size=8 color='#64748B'>Report ID: {report_number}<br/>Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</font>", ParagraphStyle("RightHeader", parent=body_style, alignment=2))
        ]
    ]
    header_table = Table(header_data, colWidths=[270, 270])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_COLOR, spaceBefore=4, spaceAfter=12))

    # 2. Executive Incident Summary
    sev_color = CRITICAL_COLOR if incident.severity == "critical" else WARNING_COLOR
    summary_data = [
        [
            Paragraph("<b>Incident Number:</b>", body_style), Paragraph(incident.incident_number, bold_body_style),
            Paragraph("<b>Detection Severity:</b>", body_style), Paragraph(f"<font color='{sev_color.hexval()}'><b>{incident.severity.upper()}</b></font>", body_style)
        ],
        [
            Paragraph("<b>Current Status:</b>", body_style), Paragraph(incident.status.replace("_", " ").upper(), bold_body_style),
            Paragraph("<b>Risk Score:</b>", body_style), Paragraph(f"<b>{incident.risk_score_at_detection:.1f} / 100</b>", bold_body_style)
        ],
        [
            Paragraph("<b>Detected At:</b>", body_style), Paragraph(incident.created_at.strftime('%Y-%m-%d %H:%M UTC'), body_style),
            Paragraph("<b>Assigned Reviewer:</b>", body_style), Paragraph(incident.assigned_manager.email if incident.assigned_manager else "Operations Review Queue", body_style)
        ]
    ]
    summary_table = Table(summary_data, colWidths=[110, 160, 110, 160])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # 3. Rider & Organization Details
    story.append(Paragraph("1. Subject & Deployment Context", section_heading))
    rider = incident.rider
    branch_name = incident.branch.name if incident.branch else "Unassigned / Roaming"
    org_name = rider.user.organization.name if (rider and rider.user and rider.user.organization) else "SwiftPulse Express Logistics"

    rider_data = [
        [
            Paragraph("<b>Rider Code:</b>", body_style), Paragraph(rider.rider_code, code_style),
            Paragraph("<b>Organization:</b>", body_style), Paragraph(org_name, body_style)
        ],
        [
            Paragraph("<b>Legal Name:</b>", body_style), Paragraph(rider.legal_name, body_style),
            Paragraph("<b>Branch:</b>", body_style), Paragraph(branch_name, body_style)
        ],
        [
            Paragraph("<b>Employment Type:</b>", body_style), Paragraph(rider.employment_type.replace("_", " ").title(), body_style),
            Paragraph("<b>Account Status:</b>", body_style), Paragraph(rider.onboarding_status.replace("_", " ").title(), body_style)
        ]
    ]
    rider_table = Table(rider_data, colWidths=[110, 160, 110, 160])
    rider_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(rider_table)
    story.append(Spacer(1, 10))

    # 4. Identity Continuity Signals & Evidence
    story.append(Paragraph("2. Telemetry & Identity Signals at Detection", section_heading))
    reason_codes_list = [r.strip() for r in incident.reason_codes.split(",") if r.strip()]
    reasons_formatted = ", ".join(reason_codes_list)

    evidence_rows = [
        [
            Paragraph("<b>Evidence Type</b>", bold_body_style),
            Paragraph("<b>Summary / Observation</b>", bold_body_style),
            Paragraph("<b>Severity</b>", bold_body_style),
            Paragraph("<b>Timestamp (UTC)</b>", bold_body_style)
        ]
    ]

    if incident.evidences:
        for ev in incident.evidences[:5]:
            evidence_rows.append([
                Paragraph(ev.evidence_type.replace("_", " ").title(), body_style),
                Paragraph(ev.summary, body_style),
                Paragraph(ev.severity.upper(), body_style),
                Paragraph(ev.occurred_at.strftime("%H:%M:%S"), body_style)
            ])
    else:
        evidence_rows.append([
            Paragraph("Continuity Telemetry", body_style),
            Paragraph(f"Triggered reason codes: {reasons_formatted}", body_style),
            Paragraph(incident.severity.upper(), body_style),
            Paragraph(incident.created_at.strftime("%H:%M:%S"), body_style)
        ])

    evidence_table = Table(evidence_rows, colWidths=[120, 240, 80, 100])
    evidence_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EEF2FF")),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(evidence_table)
    story.append(Spacer(1, 10))

    # 5. Manager Review & Audit Trail
    story.append(Paragraph("3. Investigation Review & Action History", section_heading))
    if incident.reviews:
        rev = incident.reviews[-1]
        rev_text = f"<b>Reviewer:</b> {rev.reviewer.email}<br/><b>Outcome:</b> {rev.outcome.replace('_', ' ').title()}<br/><b>Action Taken:</b> {rev.action_taken.replace('_', ' ').title()}<br/><b>Notes:</b> {rev.notes}"
    else:
        rev_text = "<i>No formal manager investigation decision recorded yet. Case remains open in queue.</i>"

    review_table = Table([[Paragraph(rev_text, body_style)]], colWidths=[540])
    review_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(review_table)
    story.append(Spacer(1, 14))

    # 6. Integrity & Cryptographic Audit Verification
    story.append(HRFlowable(width="100%", thickness=0.75, color=BORDER_COLOR, spaceBefore=4, spaceAfter=8))
    
    # We will build the doc first, compute hash, and include in footer
    doc.build(story)

    # Compute SHA-256 of the generated file
    hasher = hashlib.sha256()
    with open(output_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hasher.update(chunk)
    file_hash = hasher.hexdigest()

    return file_hash
