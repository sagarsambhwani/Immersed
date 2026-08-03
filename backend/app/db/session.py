from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

# Convert async drivers to sync drivers for SQLAlchemy sessionmaker if present
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite+aiosqlite"):
    db_url = db_url.replace("sqlite+aiosqlite", "sqlite")
elif db_url.startswith("postgresql+asyncpg"):
    db_url = db_url.replace("postgresql+asyncpg", "postgresql+psycopg2")

engine_kwargs = {"echo": False}
if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif db_url.startswith("postgresql"):
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(db_url, **engine_kwargs)


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

def get_db():
    """FastAPI Dependency for database sessions. Runs in thread pool."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
