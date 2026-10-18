# TrustShift AI
> **AI-powered identity continuity monitoring and account handoff detection for delivery platforms.**
> *Same account. Same credentials. Is it still the same person?*

TrustShift AI is a production-grade full-stack identity continuity and account-handoff detection platform engineered for delivery companies, gig-economy networks, and organizations managing distributed field personnel.

The platform continuously verifies rider identity at shift check-in, monitors session continuity telemetry, identifies suspicious terminal handoffs/subleasing without blanket fraud accusations, triggers progressive step-up biometric verification, alerts authorized operations managers, provides deep forensic investigation tooling, and automatically compiles cryptographically hashed PDF verification reports via ReportLab.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │    TrustShift AI Next.js 15+ Frontend │
                      │ (TypeScript, Tailwind CSS, Recharts)  │
                      └──────────────────┬────────────────────┘
                                         │  HTTP / REST + Bearer Token
                                         ▼
                      ┌───────────────────────────────────────┐
                      │    FastAPI High-Performance Backend   │
                      │        (Python 3.11+, Pydantic)       │
                      └───────┬────────────────────────┬──────┘
                              │                        │
             ┌────────────────┴──────┐         ┌───────┴────────────────┐
             │ Identity Risk Engine  │         │ ReportLab PDF Compiler │
             │  • 5 Weighted Signals │         │  • SHA-256 Hashing     │
             │  • 4 Score Bands      │         │  • Forensic Dossiers   │
             │  • Explainable Codes  │         │  • RBAC Auth Downloads │
             └────────────────┬──────┘         └────────────────────────┘
                              │
                      ┌───────┴────────────────────────┐
                      │  SQLAlchemy 2 & Alembic Engine │
                      │ (PostgreSQL / SQLite Fallback) │
                      └────────────────────────────────┘
```

---

## Key Features

1. **Enterprise Multi-Role Portal & Strict Backend RBAC**:
   - **Rider Portal**: Mobile-optimized shift terminal, biometric camera selfie verification, TrustMark signature drawing pad, 2FA management, trust score explainability breakdown, and security history.
   - **Operations Manager Center**: Branch-scoped fleet roster, live shift session monitor, incident investigation workspace, manager review submission, and PDF report downloads.
   - **Company Admin Console**: Regional branch provisioning, manager account creation, organization-wide policy threshold sliders, provider status, and global audit logs.

2. **Modular 5-Signal Identity Continuity Risk Engine**:
   - *Biometric Match Evidence* (30%)
   - *Authentication Security* (20%)
   - *Trusted Device & Session Continuity* (20%)
   - *Behavioral Consistency Baseline* (20%)
   - *Corroborating Security Deviation* (10%)
   - Normalizes scores across 4 operational bands:
     - `80–100`: High Trust (Green) — Action: `CONTINUE`
     - `60–79`: Caution (Amber) — Action: `CONTINUE` or `VERIFY`
     - `50–59`: Elevated Risk (Orange) — Action: `VERIFY`
     - `0–49`: Critical Incident (Red) — Action: `INVESTIGATE`
   - Explicit `INSUFFICIENT_HISTORY` handling for new recruits without fabricating confidence scores.

3. **Polished Biometric & Kinematic Verification**:
   - **Facial Liveness & Selfie Capture**: Live HTML5 video stream, oval face guide, passive liveness simulation, and explicit match/mismatch/low-lighting error states.
   - **TrustMark Drawn Signature**: HTML5 pointer/touch canvas with undo, clear, kinematic stroke vector capture, and comparison simulator.

4. **Automated Incident Creation & Deduplication**:
   - Detects critical continuity deviations and automatically creates unique incidents (`INC-2026-XXXX`).
   - Updates open cases to avoid manager alert fatigue.

5. **Official ReportLab PDF Incident Dossiers**:
   - Enterprise vector layout with incident summary, timestamps, evidence tables, manager review signatures, and a tamper-proof byte-level SHA-256 cryptographic digest.

6. **Interactive Demo Scenario Panel**:
   - Slide-out developer drawer accessible from the top navigation bar to trigger live scenarios:
     - **Scenario A**: Normal Legitimate Rider (`CONTINUE`)
     - **Scenario B**: New Phone / Hardware Swap (`CAUTION` + Step-Up)
     - **Scenario C**: Critical Account Handoff / Rental (`CRITICAL` + Incident)
     - **Scenario D**: Poor Lighting / Obscured Face (`RETRY`)
     - **Scenario E**: New Recruit (`INSUFFICIENT_HISTORY`)
     - **Scenario F**: Manager Review & Sign-Off
     - **Scenario G**: Simulated PDF Failure & Retry

---

## Pre-Configured Demo Accounts

All demo accounts are pre-seeded in the local database with development credentials:

| Role | Email | Password | Scope & Description |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@trustshift.ai` | `Admin@12345` | Global organizational administration & policies |
| **Branch Manager** | `manager@trustshift.ai` | `Manager@12345` | Downtown & Westside branch operations reviewer |
| **Verified Rider** | `rider.alex@trustshift.ai` | `Rider@12345` | Established baseline, High Trust (Alex Rivera, `TS-RIDER-101`) |
| **Suspicious Rider** | `rider.devon@trustshift.ai` | `Rider@12345` | Elevated deviation subject (Devon Vance, `TS-RIDER-102`) |
| **New Recruit** | `rider.sam@trustshift.ai` | `Rider@12345` | Insufficient history status (Sam Taylor, `TS-RIDER-103`) |

> **2FA OTP Note**: In development mode, the active 6-digit challenge code is automatically populated or displayed on-screen for 1-click verification.

---

## Local Development Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+ (Node 20+ recommended)
- Git

### 1. Backend Setup (FastAPI & SQLite)
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Alembic migrations
alembic upgrade head

# Seed initial organization, branches, demo users, and baseline report
python seed.py

# Start the FastAPI backend server
uvicorn main:app --reload --port 8000
```
- Backend API Docs (Swagger): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

### 2. Frontend Setup (Next.js 15+ App Router)
```bash
cd frontend

# Install npm dependencies
npm install

# Run the development server
npm run dev
```
- Web Application: `http://localhost:3000`

---

## Running with Docker Compose

To start the full stack with PostgreSQL, FastAPI backend, and Next.js frontend:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## Automated Test Suite

TrustShift AI includes automated pytest backend tests and Next.js production type-checking:

### Backend Tests (12/12 Passing)
```bash
cd backend
.\venv\Scripts\python.exe -m pytest -v
```

**Test Coverage Highlights:**
- `test_auth.py`: Valid login, invalid password, 2FA challenge creation, verification, attempt rate-limiting.
- `test_permissions.py`: RBAC enforcement (riders blocked from manager routes, unauthenticated blocked).
- `test_risk_engine.py`: Normal session high trust, new hardware caution band, handoff critical trigger.
- `test_incidents_and_reports.py`: Automatic critical incident creation, deduplication, ReportLab PDF compilation, SHA-256 hash calculation, and RBAC-scoped download authorization.

### Frontend Validation (41/41 Pages Generated)
```bash
cd frontend
npm run build
```
- 0 TypeScript errors
- 0 Linting errors
- 41 static and partial-prerendered routes compiled cleanly.

---

## Privacy, Fairness & Biometric Governance

- **Purpose Limitation**: Biometric signals are utilized exclusively for session continuity during active shifts.
- **No Demographics in Risk Engine**: Race, gender, age, disability, and personal identifiers are strictly excluded from mathematical score calculation.
- **Human-in-the-Loop**: An algorithmic score deviation never automatically triggers a permanent employment termination. A human supervisor must review evidence and record notes.
- **Biometric Protection**: Raw facial photos and kinematic signature drawings are processed ephemerally; only one-way cryptographic feature representations and provider references are retained in the database.
- **GDPR Compliance**: Field workers can withdraw optional biometric consent and utilize an approved alternate supervisor-assisted verification pathway.

---

## License & Operational Notice
Developed for enterprise logistics, courier networks, and gig-economy operations. All demo telemetry and simulation adapters are clearly labelled.

