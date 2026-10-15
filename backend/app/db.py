from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

import logging

logger = logging.getLogger(__name__)

# Detect available Postgres drivers
try:
    import psycopg  # noqa
    _has_psycopg3 = True
except ImportError:
    _has_psycopg3 = False

try:
    import psycopg2  # noqa
    _has_psycopg2 = True
except ImportError:
    _has_psycopg2 = False

# Handle SQLite vs PostgreSQL arguments & URL compatibility
raw_db_url = settings.DATABASE_URL or "sqlite:///./radar.db"
db_url = raw_db_url

if db_url.startswith("postgres://") or db_url.startswith("postgresql://"):
    # Strip existing prefix
    prefix = "postgres://" if db_url.startswith("postgres://") else "postgresql://"
    rest = db_url[len(prefix):]
    # If a specific driver like postgresql+psycopg is not already specified
    if not prefix.startswith("postgresql+"):
        if _has_psycopg3:
            db_url = f"postgresql+psycopg://{rest}"
        elif _has_psycopg2:
            db_url = f"postgresql+psycopg2://{rest}"
        else:
            db_url = f"postgresql://{rest}"

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
except Exception as e:
    logger.error(f"Failed to initialize database engine for {db_url}: {e}. Falling back to local SQLite.")
    db_url = "sqlite:///./radar.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

from sqlalchemy import text

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_schema_columns():
    """Ensures newly added columns exist in existing SQLite/Postgres tables."""
    try:
        with engine.connect() as conn:
            # ── findings table columns ──
            result = conn.execute(text("PRAGMA table_info(findings)")).fetchall()
            col_names = [row[1] for row in result]
            if col_names and "pain_point" not in col_names:
                conn.execute(text("ALTER TABLE findings ADD COLUMN pain_point TEXT"))
                conn.commit()
            if col_names and "action_plan" not in col_names:
                conn.execute(text("ALTER TABLE findings ADD COLUMN action_plan TEXT"))
                conn.commit()
            if col_names and "likes" not in col_names:
                conn.execute(text("ALTER TABLE findings ADD COLUMN likes INTEGER NOT NULL DEFAULT 0"))
                conn.commit()
    except Exception:
        pass

    # PostgreSQL: use information_schema (PRAGMA not available)
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='findings'"
            )).fetchall()
            col_names = [row[0] for row in result]
            if col_names and "pain_point" not in col_names:
                conn.execute(text("ALTER TABLE findings ADD COLUMN pain_point TEXT"))
                conn.commit()
            if col_names and "action_plan" not in col_names:
                conn.execute(text("ALTER TABLE findings ADD COLUMN action_plan TEXT"))
                conn.commit()
            if col_names and "likes" not in col_names:
                conn.execute(text("ALTER TABLE findings ADD COLUMN likes INTEGER NOT NULL DEFAULT 0"))
                conn.commit()
    except Exception:
        pass

