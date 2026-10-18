import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_manager
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.manager import AuditLogOut
from app.schemas.common import StandardResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=StandardResponse[List[AuditLogOut]])
def get_audit_logs(
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).filter(
        AuditLog.organization_id == current_user.organization_id
    )

    if action:
        query = query.filter(AuditLog.action == action)
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    results = []
    for log in logs:
        actor_name = log.actor.email if log.actor else "System Process"
        details_dict = None
        if log.details_json:
            try:
                details_dict = json.loads(log.details_json)
            except Exception:
                details_dict = {"raw": log.details_json}

        results.append(
            AuditLogOut(
                id=log.id,
                actor_name=actor_name,
                action=log.action,
                target_type=log.target_type,
                target_id=log.target_id,
                details=details_dict,
                ip_address=log.ip_address,
                timestamp=log.timestamp.isoformat()
            )
        )

    return StandardResponse(success=True, message="Audit logs retrieved.", data=results)
