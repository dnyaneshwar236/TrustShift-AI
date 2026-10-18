from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.riders import router as riders_router
from app.api.v1.verification import router as verification_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.manager import router as manager_router
from app.api.v1.reports import router as reports_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.audit import router as audit_router
from app.api.v1.admin import router as admin_router
from app.api.v1.demo import router as demo_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(riders_router)
api_router.include_router(verification_router)
api_router.include_router(sessions_router)
api_router.include_router(manager_router)
api_router.include_router(reports_router)
api_router.include_router(notifications_router)
api_router.include_router(audit_router)
api_router.include_router(admin_router)
api_router.include_router(demo_router)
