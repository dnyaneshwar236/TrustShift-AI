import sys
import os
import json
from datetime import datetime, timedelta, timezone

# Add parent path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import (
    Organization,
    Branch,
    OrganizationPolicy,
    User,
    RiderProfile,
    ManagerProfile,
    TrustedDevice,
    ConsentRecord,
    RiderSession,
    SessionEvent,
    TrustEvaluation,
    VerificationEvent,
    VerificationBaseline,
    Incident,
    IncidentEvidence,
    ManagerReview,
    Notification,
    AuditLog
)
from app.services.report_service import ReportService
from app.services.audit_service import AuditService
from app.models.base import utc_now

def run_seed():
    db = SessionLocal()
    print("[*] Starting TrustShift AI database seeding...")

    try:
        # Check if already seeded
        existing_org = db.query(Organization).first()
        if existing_org:
            print("Database already contains data. Refreshing seed...")
            # We can delete and re-seed or update
            pass

        # 1. Organization
        org = db.query(Organization).filter(Organization.slug == "swiftpulse").first()
        if not org:
            org = Organization(
                name="SwiftPulse Express Logistics",
                slug="swiftpulse",
                status="active",
                created_at=utc_now()
            )
            db.add(org)
            db.flush()
            print(f"[+] Organization created: {org.name}")

        # 2. Branches
        b_central = db.query(Branch).filter(Branch.code == "MCB", Branch.organization_id == org.id).first()
        if not b_central:
            b_central = Branch(
                organization_id=org.id,
                name="Metro Central Branch",
                code="MCB",
                city="San Francisco",
                state="CA",
                status="active",
                created_at=utc_now()
            )
            db.add(b_central)
            db.flush()

        b_north = db.query(Branch).filter(Branch.code == "NHZ", Branch.organization_id == org.id).first()
        if not b_north:
            b_north = Branch(
                organization_id=org.id,
                name="North Harbour Zone",
                code="NHZ",
                city="Oakland",
                state="CA",
                status="active",
                created_at=utc_now()
            )
            db.add(b_north)
            db.flush()

        # 3. Policy
        policy = db.query(OrganizationPolicy).filter(OrganizationPolicy.organization_id == org.id).first()
        if not policy:
            policy = OrganizationPolicy(
                organization_id=org.id,
                critical_threshold=50.0,
                elevated_threshold=60.0,
                caution_threshold=80.0,
                require_2fa_on_new_device=True,
                require_selfie_on_shift_start=True,
                require_trustmark_on_high_risk=True,
                auto_create_incident_on_mismatch=True,
                max_failed_attempts_before_lock=3,
                updated_at=utc_now()
            )
            db.add(policy)
            db.flush()

        # 4. Users
        # A. Admin
        u_admin = db.query(User).filter(User.email == "admin@trustshift.ai").first()
        if not u_admin:
            u_admin = User(
                organization_id=org.id,
                email="admin@trustshift.ai",
                phone="+1-555-0100",
                password_hash=get_password_hash("Admin@12345"),
                role="admin",
                status="active",
                is_2fa_enabled=True,
                created_at=utc_now()
            )
            db.add(u_admin)
            db.flush()
            print("[+] Admin user created: admin@trustshift.ai")

        # B. Manager
        u_mgr = db.query(User).filter(User.email == "manager@trustshift.ai").first()
        if not u_mgr:
            u_mgr = User(
                organization_id=org.id,
                email="manager@trustshift.ai",
                phone="+1-555-0101",
                password_hash=get_password_hash("Manager@12345"),
                role="manager",
                status="active",
                is_2fa_enabled=True,
                created_at=utc_now()
            )
            db.add(u_mgr)
            db.flush()

            m_prof = ManagerProfile(
                user_id=u_mgr.id,
                branch_id=b_central.id,
                title="Shift Security Operations Lead",
                department="Fleet Risk & Verification Operations",
                created_at=utc_now()
            )
            db.add(m_prof)
            db.flush()
            print("[+] Manager user created: manager@trustshift.ai")

        # C. Rider Alex (Normal, Verified, High Trust)
        u_alex = db.query(User).filter(User.email == "rider.alex@trustshift.ai").first()
        if not u_alex:
            u_alex = User(
                organization_id=org.id,
                email="rider.alex@trustshift.ai",
                phone="+1-555-0191",
                password_hash=get_password_hash("Rider@12345"),
                role="rider",
                status="active",
                is_2fa_enabled=True,
                created_at=utc_now() - timedelta(days=45)
            )
            db.add(u_alex)
            db.flush()

            r_alex = RiderProfile(
                user_id=u_alex.id,
                rider_code="RDR-1082",
                legal_name="Alex Vance",
                date_of_birth="1995-04-12",
                phone="+1-555-0191",
                email="rider.alex@trustshift.ai",
                address="742 Market St, San Francisco, CA",
                experience_years=3,
                employment_type="full_time",
                work_zone="Downtown Financial Hub",
                shift_preference="morning",
                vehicle_type="motorcycle",
                branch_id=b_central.id,
                assigned_manager_id=u_mgr.id,
                onboarding_status="active",
                onboarding_step=6,
                selfie_enrolled=True,
                selfie_reference_id="SIM-REF-ALEX-VANCE-01",
                trustmark_enrolled=True,
                trustmark_reference_id="SIM-TM-ALEX-VANCE-01",
                created_at=utc_now() - timedelta(days=45)
            )
            db.add(r_alex)
            db.flush()

            # Device
            dev_alex = TrustedDevice(
                user_id=u_alex.id,
                device_fingerprint="fp_samsung_s24_trusted",
                device_name="Samsung Galaxy S24 Ultra",
                device_type="mobile",
                os_info="Android 14",
                browser_info="Chrome Mobile 125.0",
                ip_address="198.51.100.22",
                status="trusted",
                enrolled_at=utc_now() - timedelta(days=40),
                last_seen_at=utc_now() - timedelta(minutes=15)
            )
            db.add(dev_alex)

            # Consents
            c1 = ConsentRecord(
                user_id=u_alex.id,
                consent_type="biometric_selfie",
                purpose="Facial continuity verification at shift check-in",
                version="v1.0",
                is_granted=True,
                granted_at=utc_now() - timedelta(days=45)
            )
            c2 = ConsentRecord(
                user_id=u_alex.id,
                consent_type="trustmark_signature",
                purpose="Personal dynamic pattern check for step-up verification",
                version="v1.0",
                is_granted=True,
                granted_at=utc_now() - timedelta(days=45)
            )
            db.add_all([c1, c2])

            # Active Session for Alex
            sess_alex = RiderSession(
                rider_id=r_alex.id,
                session_token="sess_alex_live_token_2026",
                device_fingerprint="fp_samsung_s24_trusted",
                device_name="Samsung Galaxy S24 Ultra",
                ip_address="198.51.100.22",
                user_agent="TrustShift Field App / Android",
                shift_status="on_shift",
                shift_started_at=utc_now() - timedelta(hours=3),
                authenticated_at=utc_now() - timedelta(hours=3),
                status="active"
            )
            db.add(sess_alex)
            db.flush()

            # Verification Event
            v_alex = VerificationEvent(
                rider_id=r_alex.id,
                session_id=sess_alex.id,
                verification_type="selfie",
                outcome="match",
                confidence_score=98.2,
                provider_reference="SIM-VERIF-ALEX-PASS",
                reason_code="IDENTITY_CONFIRMED",
                is_simulation=True,
                metadata_json=json.dumps({"camera": "front_12mp", "liveness": "passed"}),
                occurred_at=utc_now() - timedelta(hours=3)
            )
            db.add(v_alex)

            # Trust Evaluation for Alex (Score: 92.5)
            eval_alex = TrustEvaluation(
                session_id=sess_alex.id,
                rider_id=r_alex.id,
                trust_score=92.5,
                score_band="high_trust",
                evidence_coverage=98.0,
                recommended_action="CONTINUE",
                identity_score=95.0,
                auth_score=96.0,
                device_score=94.0,
                behavior_score=92.0,
                corroborating_score=90.0,
                reason_codes="IDENTITY_CONFIRMED,AUTH_FACTOR_VERIFIED,KNOWN_DEVICE_CONFIRMED",
                rule_version="continuity_rule_v1.4",
                evaluated_at=utc_now() - timedelta(hours=3)
            )
            db.add(eval_alex)
            print("[+] Rider Alex created (Normal / High Trust / Shift Active)")

        # D. Rider Devon (Suspicious / Possible Handoff / Critical Incident)
        u_devon = db.query(User).filter(User.email == "rider.devon@trustshift.ai").first()
        if not u_devon:
            u_devon = User(
                organization_id=org.id,
                email="rider.devon@trustshift.ai",
                phone="+1-555-0192",
                password_hash=get_password_hash("Rider@12345"),
                role="rider",
                status="active",
                is_2fa_enabled=True,
                created_at=utc_now() - timedelta(days=20)
            )
            db.add(u_devon)
            db.flush()

            r_devon = RiderProfile(
                user_id=u_devon.id,
                rider_code="RDR-2490",
                legal_name="Devon Miller",
                date_of_birth="1998-11-05",
                phone="+1-555-0192",
                email="rider.devon@trustshift.ai",
                address="104 Mission St, San Francisco, CA",
                experience_years=1,
                employment_type="part_time",
                work_zone="Metro Central Logistics Zone",
                shift_preference="evening",
                vehicle_type="ev_scooter",
                branch_id=b_central.id,
                assigned_manager_id=u_mgr.id,
                onboarding_status="active",
                onboarding_step=6,
                selfie_enrolled=True,
                selfie_reference_id="SIM-REF-DEVON-02",
                trustmark_enrolled=True,
                trustmark_reference_id="SIM-TM-DEVON-02",
                created_at=utc_now() - timedelta(days=20)
            )
            db.add(r_devon)
            db.flush()

            # Known primary phone
            dev_devon = TrustedDevice(
                user_id=u_devon.id,
                device_fingerprint="fp_devon_iphone14",
                device_name="Apple iPhone 14",
                device_type="mobile",
                os_info="iOS 17.4",
                browser_info="Safari Mobile 17.0",
                ip_address="198.51.100.88",
                status="trusted",
                enrolled_at=utc_now() - timedelta(days=20),
                last_seen_at=utc_now() - timedelta(days=2)
            )
            db.add(dev_devon)

            # Suspicious Session on new phone with mismatch
            sess_devon = RiderSession(
                rider_id=r_devon.id,
                session_token="sess_devon_suspicious_token_2026",
                device_fingerprint="fp_rogue_redmi_unregistered",
                device_name="Xiaomi Redmi 12 (Unknown Device)",
                ip_address="203.0.113.45",
                user_agent="Mozilla/5.0 (Linux; Android 13; Redmi 12)",
                shift_status="on_shift",
                shift_started_at=utc_now() - timedelta(hours=1),
                authenticated_at=utc_now() - timedelta(hours=1),
                status="restricted"
            )
            db.add(sess_devon)
            db.flush()

            # Failed Verification Event
            v_devon = VerificationEvent(
                rider_id=r_devon.id,
                session_id=sess_devon.id,
                verification_type="selfie",
                outcome="no_match",
                confidence_score=19.4,
                provider_reference="SIM-VERIF-DEVON-FAIL",
                reason_code="SELFIE_MISMATCH",
                is_simulation=True,
                metadata_json=json.dumps({"discrepancy": "Severe facial geometry mismatch"}),
                occurred_at=utc_now() - timedelta(minutes=45)
            )
            db.add(v_devon)

            # Critical Trust Evaluation for Devon (Score: 38.5)
            eval_devon = TrustEvaluation(
                session_id=sess_devon.id,
                rider_id=r_devon.id,
                trust_score=38.5,
                score_band="critical",
                evidence_coverage=95.0,
                recommended_action="INVESTIGATE",
                identity_score=15.0,
                auth_score=40.0,
                device_score=45.0,
                behavior_score=30.0,
                corroborating_score=25.0,
                reason_codes="SELFIE_MISMATCH,NEW_DEVICE,BEHAVIOR_SHIFT,MULTIPLE_SIGNAL_DEVIATION",
                rule_version="continuity_rule_v1.4",
                evaluated_at=utc_now() - timedelta(minutes=45)
            )
            db.add(eval_devon)
            db.flush()

            # Seed Critical Incident INC-2026-0001
            inc_devon = Incident(
                incident_number="INC-2026-0001",
                organization_id=org.id,
                branch_id=b_central.id,
                rider_id=r_devon.id,
                session_id=sess_devon.id,
                severity="critical",
                status="open",
                reason_codes="SELFIE_MISMATCH,NEW_DEVICE,BEHAVIOR_SHIFT,MULTIPLE_SIGNAL_DEVIATION",
                risk_score_at_detection=38.5,
                title="Suspected Identity Handoff - Devon Miller (RDR-2490)",
                description="Automated continuity alert: Trust score dropped to 38.5 [CRITICAL]. Triggered by: SELFIE_MISMATCH, NEW_DEVICE, BEHAVIOR_SHIFT.",
                assigned_manager_id=u_mgr.id,
                created_at=utc_now() - timedelta(minutes=45),
                updated_at=utc_now() - timedelta(minutes=45)
            )
            db.add(inc_devon)
            db.flush()

            # Attach Evidence
            ev1 = IncidentEvidence(
                incident_id=inc_devon.id,
                evidence_type="biometric_mismatch",
                summary="Mid-shift selfie facial comparison match confidence was 19.4%, failing the 75% policy threshold.",
                severity="critical",
                metadata_json=json.dumps({"confidence": 19.4, "threshold": 75.0}),
                occurred_at=utc_now() - timedelta(minutes=45)
            )
            ev2 = IncidentEvidence(
                incident_id=inc_devon.id,
                evidence_type="unrecognized_device",
                summary="Session initiated from an unrecognized hardware device (Xiaomi Redmi 12) without prior trusted registration.",
                severity="high",
                metadata_json=json.dumps({"device": "Xiaomi Redmi 12", "fingerprint": "fp_rogue_redmi_unregistered"}),
                occurred_at=utc_now() - timedelta(hours=1)
            )
            db.add_all([ev1, ev2])

            # In-App Notification to Manager
            notif = Notification(
                recipient_user_id=u_mgr.id,
                incident_id=inc_devon.id,
                notification_type="incident_alert",
                title="CRITICAL: INC-2026-0001 - Devon Miller",
                message="Possible account handoff detected for rider RDR-2490. Risk score: 38.5. Immediate review required.",
                severity="critical",
                delivery_status="delivered",
                is_read=False,
                created_at=utc_now() - timedelta(minutes=40)
            )
            db.add(notif)
            db.commit()

            # Compile initial PDF report for INC-2026-0001
            try:
                ReportService.generate_report_for_incident(
                    db=db,
                    incident_id=inc_devon.id,
                    generated_by_user_id=u_mgr.id,
                    force_regenerate=True
                )
                print("[+] Generated ReportLab PDF Verification Report for INC-2026-0001")
            except Exception as e:
                print(f"Report generation note: {e}")

            print("[+] Rider Devon created (Suspicious / Critical Incident INC-2026-0001 created)")

        # E. Rider Sam (New recruit, Insufficient History)
        u_sam = db.query(User).filter(User.email == "rider.sam@trustshift.ai").first()
        if not u_sam:
            u_sam = User(
                organization_id=org.id,
                email="rider.sam@trustshift.ai",
                phone="+1-555-0193",
                password_hash=get_password_hash("Rider@12345"),
                role="rider",
                status="active",
                is_2fa_enabled=True,
                created_at=utc_now() - timedelta(days=1)
            )
            db.add(u_sam)
            db.flush()

            r_sam = RiderProfile(
                user_id=u_sam.id,
                rider_code="RDR-3310",
                legal_name="Sam Jordan",
                date_of_birth="2001-08-19",
                phone="+1-555-0193",
                email="rider.sam@trustshift.ai",
                address="220 Pine St, Oakland, CA",
                experience_years=0,
                employment_type="gig_contractor",
                work_zone="North Harbour Zone",
                shift_preference="afternoon",
                vehicle_type="bicycle",
                branch_id=b_north.id,
                assigned_manager_id=u_mgr.id,
                onboarding_status="draft",
                onboarding_step=3,
                selfie_enrolled=False,
                trustmark_enrolled=False,
                created_at=utc_now() - timedelta(days=1)
            )
            db.add(r_sam)
            db.commit()
            print("[+] Rider Sam created (New Recruit / Insufficient History)")

        # Initial Audit Logs
        AuditService.log_event(
            db=db,
            organization_id=org.id,
            action="SYSTEM_INITIALIZED",
            actor_user_id=u_admin.id,
            target_type="Organization",
            target_id=org.id,
            details={"version": "1.0.0", "seeded_profiles": 3}
        )

        print("\n================================================================")
        print("DEMONSTRATION ACCOUNTS (Development Only):")
        print("  - System Admin:    admin@trustshift.ai     / Admin@12345")
        print("  - Operations Mgr:  manager@trustshift.ai   / Manager@12345")
        print("  - Normal Rider:    rider.alex@trustshift.ai  / Rider@12345  (High Trust)")
        print("  - Handoff Rider:   rider.devon@trustshift.ai / Rider@12345  (Critical Incident INC-2026-0001)")
        print("  - New Recruit:     rider.sam@trustshift.ai   / Rider@12345  (Insufficient History)")
        print("================================================================\n")

    except Exception as e:
        db.rollback()
        print(f"[!] Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
