from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.audit import Notification
from app.models.base import utc_now

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        recipient_user_id: str,
        title: str,
        message: str,
        severity: str = "high", # low, medium, high, critical
        incident_id: Optional[str] = None,
        notification_type: str = "incident_alert"
    ) -> Notification:
        # Avoid exact duplicate unread notifications for the same incident
        if incident_id:
            existing = db.query(Notification).filter(
                Notification.recipient_user_id == recipient_user_id,
                Notification.incident_id == incident_id,
                Notification.is_read == False
            ).first()
            if existing:
                existing.message = message
                existing.severity = severity
                existing.created_at = utc_now()
                db.commit()
                db.refresh(existing)
                return existing

        notification = Notification(
            recipient_user_id=recipient_user_id,
            incident_id=incident_id,
            notification_type=notification_type,
            title=title,
            message=message,
            severity=severity,
            delivery_status="delivered",
            is_read=False,
            created_at=utc_now()
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: str,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Notification]:
        query = db.query(Notification).filter(Notification.recipient_user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        return query.order_by(Notification.created_at.desc()).limit(limit).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: str, user_id: str) -> Optional[Notification]:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.recipient_user_id == user_id
        ).first()
        if notification:
            notification.is_read = True
            notification.read_at = utc_now()
            db.commit()
            db.refresh(notification)
        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: str) -> int:
        count = db.query(Notification).filter(
            Notification.recipient_user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True, "read_at": utc_now()})
        db.commit()
        return count
