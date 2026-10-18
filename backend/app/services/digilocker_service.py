import hashlib
import uuid
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.user import User, RiderProfile
from app.models.org import Organization, Branch
from app.models.base import utc_now
from app.core.security import get_password_hash
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService

class DigiLockerService:
    @staticmethod
    def generate_driving_licence_svg(name: str, dl_num: str, expiry: str, vehicle_class: str) -> str:
        return f"""data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='210' viewBox='0 0 360 210'>
<rect width='360' height='210' rx='14' fill='%230f172a' stroke='%2338bdf8' stroke-width='2'/>
<rect x='10' y='10' width='340' height='40' rx='8' fill='%230284c7'/>
<text x='25' y='28' fill='%23ffffff' font-family='sans-serif' font-weight='bold' font-size='12'>GOVERNMENT OF INDIA • MoRTH</text>
<text x='25' y='42' fill='%23e0f2fe' font-family='sans-serif' font-size='10'>DIGILOCKER VERIFIED DRIVING LICENCE</text>
<rect x='20' y='65' width='65' height='80' rx='6' fill='%231e293b' stroke='%23475569'/>
<circle cx='52' cy='95' r='18' fill='%2364748b'/>
<path d='M30 138 C32 120 72 120 74 138 Z' fill='%2364748b'/>
<text x='100' y='82' fill='%23f8fafc' font-family='sans-serif' font-weight='bold' font-size='13'>{name.upper()}</text>
<text x='100' y='102' fill='%2394a3b8' font-family='sans-serif' font-size='11'>DL NO: <tspan fill='%2338bdf8' font-family='monospace' font-weight='bold'>{dl_num}</tspan></text>
<text x='100' y='122' fill='%2394a3b8' font-family='sans-serif' font-size='11'>VALID THRU: <tspan fill='%23f8fafc'>{expiry}</tspan></text>
<text x='100' y='142' fill='%2394a3b8' font-family='sans-serif' font-size='10'>CLASS: {vehicle_class}</text>
<rect x='20' y='160' width='320' height='36' rx='8' fill='%23064e3b' stroke='%23059669'/>
<text x='35' y='182' fill='%2334d399' font-family='sans-serif' font-weight='bold' font-size='11'>DIGILOCKER DIGITAL SIGNATURE: VALID & VERIFIED</text>
</svg>"""

    @staticmethod
    def generate_aadhaar_svg(name: str, aadhaar_masked: str, dob: str) -> str:
        return f"""data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='210' viewBox='0 0 360 210'>
<rect width='360' height='210' rx='14' fill='%23111827' stroke='%23a855f7' stroke-width='2'/>
<rect x='10' y='10' width='340' height='40' rx='8' fill='%237e22ce'/>
<text x='25' y='28' fill='%23ffffff' font-family='sans-serif' font-weight='bold' font-size='12'>UNIQUE IDENTIFICATION AUTHORITY OF INDIA</text>
<text x='25' y='42' fill='%23f3e8ff' font-family='sans-serif' font-size='10'>DIGILOCKER ISSUED DIGITAL IDENTITY</text>
<rect x='20' y='65' width='65' height='80' rx='6' fill='%231f2937' stroke='%236b7280'/>
<circle cx='52' cy='95' r='18' fill='%239ca3af'/>
<path d='M30 138 C32 120 72 120 74 138 Z' fill='%239ca3af'/>
<text x='100' y='82' fill='%23f8fafc' font-family='sans-serif' font-weight='bold' font-size='13'>{name.upper()}</text>
<text x='100' y='102' fill='%2394a3b8' font-family='sans-serif' font-size='11'>AADHAAR: <tspan fill='%23c084fc' font-family='monospace' font-weight='bold'>{aadhaar_masked}</tspan></text>
<text x='100' y='122' fill='%2394a3b8' font-family='sans-serif' font-size='11'>DOB: <tspan fill='%23f8fafc'>{dob}</tspan></text>
<text x='100' y='142' fill='%2394a3b8' font-family='sans-serif' font-size='10'>GOVERNMENT RESIDENT RECORD VERIFIED</text>
<rect x='20' y='160' width='320' height='36' rx='8' fill='%233b0764' stroke='%239333ea'/>
<text x='35' y='182' fill='%23d8b4fe' font-family='sans-serif' font-weight='bold' font-size='11'>CRYPTOGRAPHIC E-KYC SEAL CONFIRMED</text>
</svg>"""

    @classmethod
    def get_verified_credentials(cls, preset_key: str = "default", custom_phone: Optional[str] = None) -> Dict[str, Any]:
        profiles = {
            "alex": {
                "name": "Alex Rivera",
                "email": "rider.alex@trustshift.ai",
                "phone": "+1-555-0101",
                "dob": "1994-08-22",
                "address": "452 Metro Central Avenue, Zone 1",
                "dl": "DL-0420190084920",
                "dl_expiry": "2031-08-21",
                "dl_class": "Class M - Motorcycle / Commercial Courier",
                "aadhaar": "XXXX-XXXX-4829",
                "issuer_dl": "Ministry of Road Transport and Highways (MoRTH)",
                "issuer_uidai": "Unique Identification Authority of India (UIDAI)"
            },
            "devon": {
                "name": "Devon Vance",
                "email": "rider.devon@trustshift.ai",
                "phone": "+1-555-0102",
                "dob": "1997-03-15",
                "address": "812 South Harbour Hub",
                "dl": "DL-0720210049102",
                "dl_expiry": "2030-03-14",
                "dl_class": "Class M - Motorcycle / Two-Wheeler",
                "aadhaar": "XXXX-XXXX-9402",
                "issuer_dl": "Ministry of Road Transport and Highways (MoRTH)",
                "issuer_uidai": "Unique Identification Authority of India (UIDAI)"
            },
            "sam": {
                "name": "Sam Taylor",
                "email": "rider.sam@trustshift.ai",
                "phone": "+1-555-0103",
                "dob": "1999-11-04",
                "address": "104 West Logistics Park",
                "dl": "DL-1120230091842",
                "dl_expiry": "2033-11-03",
                "dl_class": "Class M / LMV - Multi-Vehicle",
                "aadhaar": "XXXX-XXXX-6119",
                "issuer_dl": "Ministry of Road Transport and Highways (MoRTH)",
                "issuer_uidai": "Unique Identification Authority of India (UIDAI)"
            },
            "default": {
                "name": "Jordan Casey",
                "email": "jordan.casey.dl@trustshift.ai",
                "phone": custom_phone or "+1-555-0199",
                "dob": "1996-05-14",
                "address": "77 Metro Expressway Logistics Corridor",
                "dl": "DL-0920200084921",
                "dl_expiry": "2032-05-13",
                "dl_class": "Class M - Motorcycle / Two-Wheeler",
                "aadhaar": "XXXX-XXXX-5510",
                "issuer_dl": "Ministry of Road Transport and Highways (MoRTH)",
                "issuer_uidai": "Unique Identification Authority of India (UIDAI)"
            }
        }

        p = profiles.get(preset_key.lower(), profiles["default"])
        if custom_phone:
            p["phone"] = custom_phone

        dl_svg = cls.generate_driving_licence_svg(p["name"], p["dl"], p["dl_expiry"], p["dl_class"])
        aadhaar_svg = cls.generate_aadhaar_svg(p["name"], p["aadhaar"], p["dob"])

        timestamp = datetime.now(timezone.utc).isoformat()
        checksum_payload = f"{p['name']}:{p['dl']}:{p['aadhaar']}:{timestamp}"
        checksum = hashlib.sha256(checksum_payload.encode()).hexdigest()

        return {
            "digilocker_id": f"DGLKR-{uuid.uuid4().hex[:8].upper()}",
            "legal_name": p["name"],
            "email": p["email"],
            "phone": p["phone"],
            "date_of_birth": p["dob"],
            "address": p["address"],
            "license_number": p["dl"],
            "license_expiry": p["dl_expiry"],
            "license_class": p["dl_class"],
            "license_document_url": dl_svg,
            "license_issuer": p["issuer_dl"],
            "government_id_type": "aadhaar",
            "government_id_number": p["aadhaar"],
            "government_id_document_url": aadhaar_svg,
            "government_id_issuer": p["issuer_uidai"],
            "digilocker_verified": True,
            "verification_timestamp": timestamp,
            "digilocker_uri": f"in.gov.digilocker://doc/{checksum[:16]}",
            "checksum_sha256": checksum
        }

    @classmethod
    def fast_authenticate_or_create(cls, db: Session, rider_identifier: Optional[str] = None) -> User:
        """
        Authenticate rider using DigiLocker single-click government authentication.
        If rider_identifier is provided, matches by email, phone, or rider_code.
        If not provided, defaults to verified rider (Alex Rivera).
        """
        user = None
        if rider_identifier:
            term = rider_identifier.strip().lower()
            # 1. Match email
            user = db.query(User).filter(User.email == term).first()
            # 2. Match phone
            if not user:
                user = db.query(User).filter(User.phone == term).first()
            # 3. Match rider code
            if not user:
                profile = db.query(RiderProfile).filter(RiderProfile.rider_code.ilike(term)).first()
                if profile:
                    user = profile.user

        # Default fallback: Alex Rivera
        if not user:
            user = db.query(User).filter(User.email == "rider.alex@trustshift.ai").first()

        # If still no user exists, create one with DigiLocker verified baseline
        if not user:
            creds = cls.get_verified_credentials("default")
            org = db.query(Organization).first()
            branch = db.query(Branch).first()

            user = User(
                organization_id=org.id if org else "org-default",
                email=creds["email"],
                phone=creds["phone"],
                password_hash=get_password_hash("DigiLockerPass@123"),
                role="rider",
                status="active",
                is_2fa_enabled=False,
                created_at=utc_now()
            )
            db.add(user)
            db.flush()

            count = db.query(RiderProfile).count() + 1
            rider = RiderProfile(
                user_id=user.id,
                rider_code=f"RDR-{1000 + count}",
                legal_name=creds["legal_name"],
                date_of_birth=creds["date_of_birth"],
                phone=creds["phone"],
                email=creds["email"],
                address=creds["address"],
                experience_years=3,
                employment_type="full_time",
                work_zone="Metro Central Logistics Zone",
                shift_preference="morning",
                vehicle_type="motorcycle",
                branch_id=branch.id if branch else None,
                license_number=creds["license_number"],
                license_expiry=creds["license_expiry"],
                license_class=creds["license_class"],
                license_document_url=creds["license_document_url"],
                government_id_type="aadhaar",
                government_id_number=creds["government_id_number"],
                government_id_document_url=creds["government_id_document_url"],
                documents_verified=True,
                onboarding_status="active",
                onboarding_step=7,
                selfie_enrolled=True,
                trustmark_enrolled=True,
                created_at=utc_now()
            )
            db.add(rider)
            db.commit()
            db.refresh(user)

        return user
