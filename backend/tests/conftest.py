import os
# Configure DATABASE_URL for testing BEFORE importing any app modules
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.orm import Session
from app.db.base import Base
from app.db.session import get_db, engine, SessionLocal
from app.main import app
from httpx import ASGITransport, AsyncClient

@pytest.fixture(scope="function", autouse=True)
def init_db():
    """Setup and teardown database schemas before/after each test function."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    # Clean up the test database file after runs
    try:
        if os.path.exists("./test.db"):
            os.remove("./test.db")
    except Exception:
        pass

@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Provides a transactional database session for each test."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest_asyncio.fixture(scope="function")
async def client(db_session: Session) -> AsyncGenerator[AsyncClient, None]:
    """Provides an AsyncClient for hitting API routes, overrides DB sessions."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
