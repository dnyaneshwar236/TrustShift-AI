from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.manager import NotificationOut
from app.schemas.common import StandardResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def _format_notif(n) -> NotificationOut:
    return NotificationOut(
        id=n.id,
        recipient_user_id=n.recipient_user_id,
        incident_id=n.incident_id,
        notification_type=n.notification_type,
        title=n.title,
        message=n.message,
        severity=n.severity,
        delivery_status=n.delivery_status,
        is_read=n.is_read,
        read_at=n.read_at.isoformat() if n.read_at else None,
        created_at=n.created_at.isoformat()
    )

@router.get("", response_model=StandardResponse[List[NotificationOut]])
def get_my_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = NotificationService.get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=unread_only
    )
    return StandardResponse(
        success=True,
        message="Notifications retrieved.",
        data=[_format_notif(n) for n in notifs]
    )

@router.post("/{notification_id}/read", response_model=StandardResponse[NotificationOut])
def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = NotificationService.mark_as_read(db, notification_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return StandardResponse(success=True, message="Marked as read.", data=_format_notif(notif))

@router.post("/read-all", response_model=StandardResponse[dict])
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = NotificationService.mark_all_as_read(db, current_user.id)
    return StandardResponse(success=True, message=f"{count} notifications marked as read.", data={"count": count})
