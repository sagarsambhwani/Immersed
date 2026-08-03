from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repository import ChatRepository
from app.schemas.session import SessionCreate, SessionUpdate, SessionResponse
from app.core.exceptions import SessionNotFoundException
from app.api.deps import get_optional_current_user
from app.db.models import User

router = APIRouter()

@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    session_in: SessionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Create a new chatbot conversation session."""
    repo = ChatRepository(db)
    user_id = current_user.id if current_user else None
    return repo.create_session(session_in, user_id=user_id)

@router.get("/", response_model=List[SessionResponse])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """List conversation sessions ordered by updated time."""
    repo = ChatRepository(db)
    user_id = current_user.id if current_user else None
    return repo.get_sessions(user_id=user_id)

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Retrieve details of a specific conversation session."""
    repo = ChatRepository(db)
    user_id = current_user.id if current_user else None
    session = repo.get_session(session_id, user_id=user_id)
    if not session:
        raise SessionNotFoundException(session_id)
    return session

@router.patch("/{session_id}", response_model=SessionResponse)
def update_session(
    session_id: str,
    session_in: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Update settings (title, temperature, prompt) of a conversation session."""
    repo = ChatRepository(db)
    user_id = current_user.id if current_user else None
    session = repo.update_session(session_id, session_in, user_id=user_id)
    if not session:
        raise SessionNotFoundException(session_id)
    return session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Delete a conversation session and all its associated messages."""
    repo = ChatRepository(db)
    user_id = current_user.id if current_user else None
    success = repo.delete_session(session_id, user_id=user_id)
    if not success:
        raise SessionNotFoundException(session_id)

