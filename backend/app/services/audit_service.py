import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.models.base import utc_now

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        organization_id: str,
        action: str,
        actor_user_id: Optional[str] = None,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        correlation_id: Optional[str] = None
    ) -> AuditLog:
        details_str = json.dumps(details) if details else None
        log_entry = AuditLog(
            organization_id=organization_id,
            action=action,
            actor_user_id=actor_user_id,
            target_type=target_type,
            target_id=target_id,
            details_json=details_str,
            ip_address=ip_address,
            correlation_id=correlation_id,
            timestamp=utc_now()
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
