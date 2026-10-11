from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# Handle SQLite vs PostgreSQL arguments
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
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
            result = conn.execute(text("PRAGMA table_info(findings)")).fetchall()
            col_names = [row[1] for row in result]
            if col_names and "pain_point" not in col_names:
                conn.execute(text("ALTER TABLE findings ADD COLUMN pain_point TEXT"))
                conn.commit()
            if col_names and "action_plan" not in col_names:
                conn.execute(text("ALTER TABLE findings ADD COLUMN action_plan TEXT"))
                conn.commit()
    except Exception:
        pass

