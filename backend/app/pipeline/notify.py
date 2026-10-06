import logging
import httpx
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Notification, OpportunityScore, Entity, Run, Finding
from app.config import settings

logger = logging.getLogger(__name__)

async def send_telegram_alert(message: str) -> bool:
    """Sends a Telegram alert via HTTP API if bot token and chat ID are configured."""
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    if not token or not chat_id:
        logger.info("Telegram notification skipped: missing token or chat ID.")
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown",
        "disable_web_page_preview": False
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                logger.info("Telegram notification delivered successfully.")
                return True
            else:
                logger.warning(f"Telegram alert failed status {resp.status_code}: {resp.text}")
                return False
    except Exception as e:
        logger.error(f"Error sending Telegram notification: {e}")
        return False

async def run_notifications(db: Session, run_id: int) -> List[Notification]:
    """
    Evaluates strict notification rules and sends notifications.
    Rules:
    - total score >= 80
    - confidence = 'high'
    - 3+ independent sources (confidence high already requires 3+ sources)
    - (entity is new OR score rose >= 15 vs its previous score)
    - Max 2 notifications per 24 hours (picks highest scores)
    - Never notify twice for same entity within 7 days unless score rose >= 10
    """
    scores = db.query(OpportunityScore).filter(OpportunityScore.run_id == run_id).all()
    if not scores:
        return []

    # Check 24-hour notification quota
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    sent_in_last_24h = db.query(Notification).filter(Notification.sent_at >= twenty_four_hours_ago).count()

    remaining_quota = max(0, 2 - sent_in_last_24h)
    if remaining_quota <= 0:
        logger.info("Notification quota reached (max 2 per 24h).")
        return []

    eligible_candidates = []

    for sc in scores:
        if sc.total < 80.0:
            continue
        if sc.confidence.lower() != "high":
            continue

        entity = db.query(Entity).filter(Entity.id == sc.entity_id).first()
        if not entity:
            continue

        # Check entity findings to count independent sources
        findings = db.query(Finding).filter(Finding.run_id == run_id, Finding.entity_id == entity.id).all()
        unique_sources = set()
        for f in findings:
            for ev in f.evidence:
                unique_sources.add(ev.get("source", ""))
        
        if len(unique_sources) < 3 and sc.confidence.lower() != "high":
            continue

        # Check if entity is new or score rose >= 15 vs last score
        previous_scores = (
            db.query(OpportunityScore)
            .filter(OpportunityScore.entity_id == entity.id, OpportunityScore.run_id != run_id)
            .order_by(OpportunityScore.created_at.desc())
            .all()
        )

        is_new = (len(previous_scores) == 0) or (entity.appearance_count <= 1)
        score_rose_15 = False
        last_notified_score = None

        if not is_new and previous_scores:
            prev_sc = previous_scores[0]
            if (sc.total - prev_sc.total) >= 15.0:
                score_rose_15 = True

        if not (is_new or score_rose_15):
            continue

        # Check 7-day duplicate notification rule
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_notif = (
            db.query(Notification)
            .filter(Notification.entity_id == entity.id, Notification.sent_at >= seven_days_ago)
            .order_by(Notification.sent_at.desc())
            .first()
        )

        if recent_notif:
            # Only notify if score rose >= 10 since recent notification
            if (sc.total - recent_notif.score) < 10.0:
                logger.info(f"Skipping notification for '{entity.canonical_name}': already notified within 7 days.")
                continue

        eligible_candidates.append((sc, entity, len(unique_sources)))

    # Sort eligible candidates by score descending and take up to remaining quota
    eligible_candidates.sort(key=lambda x: x[0].total, reverse=True)
    candidates_to_notify = eligible_candidates[:remaining_quota]

    created_notifications = []
    for sc, entity, source_count in candidates_to_notify:
        summary_text = entity.description or f"High impact opportunity found: {entity.canonical_name}"
        telegram_msg = (
            f"🔥 *New opportunity detected*\n"
            f"{summary_text}\n\n"
            f"India opportunity score: *{int(sc.total)}/100* | Confidence: *High*\n"
            f"Evidence: *{source_count} sources*\n"
            f"[View Analysis]({settings.FRONTEND_URL}/runs/{run_id}?entity={entity.id})"
        )

        delivered = await send_telegram_alert(telegram_msg)

        notif = Notification(
            run_id=run_id,
            entity_id=entity.id,
            message=telegram_msg,
            score=sc.total,
            sent_at=datetime.utcnow(),
            channel="telegram",
            delivered=delivered
        )
        db.add(notif)
        created_notifications.append(notif)

    db.commit()
    for n in created_notifications:
        db.refresh(n)

    return created_notifications
