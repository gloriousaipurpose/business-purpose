from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Notification, Entity
from app.schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[dict])
def get_notifications(limit: int = 50, db: Session = Depends(get_db)):
    notifs = (
        db.query(Notification)
        .order_by(Notification.sent_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for n in notifs:
        ent = db.query(Entity).filter(Entity.id == n.entity_id).first()
        result.append({
            "id": n.id,
            "run_id": n.run_id,
            "entity_id": n.entity_id,
            "entity_name": ent.canonical_name if ent else None,
            "message": n.message,
            "score": n.score,
            "sent_at": n.sent_at,
            "channel": n.channel,
            "delivered": n.delivered
        })

    return result
