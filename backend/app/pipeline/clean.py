import logging
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models import Entity, RawItem, Run

logger = logging.getLogger(__name__)

FUZZY_MATCH_THRESHOLD = 85.0

def fuzzy_ratio(s1: str, s2: str) -> float:
    try:
        from rapidfuzz import fuzz
        return float(fuzz.token_set_ratio(s1, s2))
    except ImportError:
        import difflib
        # Token set fallback
        tokens1 = set(s1.lower().split())
        tokens2 = set(s2.lower().split())
        if tokens1 and tokens2:
            intersection = tokens1.intersection(tokens2)
            smaller = min(len(tokens1), len(tokens2))
            if smaller > 0 and len(intersection) / smaller >= 0.8:
                return 90.0
        return difflib.SequenceMatcher(None, s1.lower(), s2.lower()).ratio() * 100.0

def deduplicate_raw_items(raw_items: List[RawItem]) -> List[RawItem]:
    """Deduplicate raw items by URL."""
    seen_urls = set()
    unique_items = []
    for item in raw_items:
        if item.url not in seen_urls:
            seen_urls.add(item.url)
            unique_items.append(item)
    return unique_items

def get_or_create_entity(
    db: Session,
    run_id: int,
    canonical_name: str,
    category: Optional[str] = None,
    country: Optional[str] = None,
    description: Optional[str] = None
) -> Entity:
    """
    Find existing entity by exact or fuzzy match (>85%).
    Updates last_seen_run_id and increments appearance_count if found.
    Creates new Entity record if not found.
    """
    clean_name = canonical_name.strip()
    
    # 1. Exact match check
    existing_entity = db.query(Entity).filter(Entity.canonical_name.ilike(clean_name)).first()
    
    # 2. Fuzzy match check if no exact match
    if not existing_entity:
        all_entities = db.query(Entity).all()
        best_match = None
        best_score = 0.0

        for ent in all_entities:
            score = fuzzy_ratio(clean_name, ent.canonical_name)
            if score > best_score:
                best_score = score
                best_match = ent

        if best_match and best_score >= FUZZY_MATCH_THRESHOLD:
            existing_entity = best_match

    if existing_entity:
        # Update allowed fields ONLY (last_seen_run_id and appearance_count)
        existing_entity.last_seen_run_id = run_id
        existing_entity.appearance_count += 1
        if category and not existing_entity.category:
            existing_entity.category = category
        if description and not existing_entity.description:
            existing_entity.description = description
        db.commit()
        db.refresh(existing_entity)
        return existing_entity
    else:
        # Create new entity record
        new_entity = Entity(
            canonical_name=clean_name,
            category=category,
            country=country,
            description=description,
            first_seen_run_id=run_id,
            last_seen_run_id=run_id,
            appearance_count=1
        )
        db.add(new_entity)
        db.commit()
        db.refresh(new_entity)
        return new_entity
