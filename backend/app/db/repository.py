from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.models import ChatSession, ChatMessage
from app.schemas.session import SessionCreate, SessionUpdate
from typing import List, Optional
from datetime import datetime, timezone

class ChatRepository:
    """Synchronous Repository wrapping Database actions on Sessions and Messages."""

    def __init__(self, db: Session):
        self.db = db

    def get_session(self, session_id: str, user_id: Optional[str] = None) -> Optional[ChatSession]:
        """Fetch a conversation session by ID with optional user scoping."""
        query = select(ChatSession).where(ChatSession.id == session_id)
        if user_id:
            query = query.where(ChatSession.user_id == user_id)
        return self.db.scalar(query)

    def get_sessions(self, user_id: Optional[str] = None) -> List[ChatSession]:
        """Fetch all conversation sessions with optional user scoping."""
        query = select(ChatSession)
        if user_id:
            query = query.where(ChatSession.user_id == user_id)
        query = query.order_by(ChatSession.created_at.desc())
        return list(self.db.scalars(query).all())

    def create_session(self, obj_in: SessionCreate, user_id: Optional[str] = None) -> ChatSession:
        """Create a new conversation session assigned to optional user."""
        title = obj_in.title or f"Chat - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}"
        db_session = ChatSession(
            user_id=user_id,
            title=title,
            system_prompt=obj_in.system_prompt,
            provider=obj_in.provider,
            model=obj_in.model,
            temperature=obj_in.temperature
        )
        self.db.add(db_session)
        self.db.commit()
        self.db.refresh(db_session)
        return db_session

    def update_session(self, session_id: str, obj_in: SessionUpdate, user_id: Optional[str] = None) -> Optional[ChatSession]:
        """Update existing session fields with user scoping."""
        db_session = self.get_session(session_id, user_id=user_id)
        if not db_session:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_session, key, value)
            
        self.db.add(db_session)
        self.db.commit()
        self.db.refresh(db_session)
        return db_session

    def delete_session(self, session_id: str, user_id: Optional[str] = None) -> bool:
        """Delete a session by ID with user scoping."""
        db_session = self.get_session(session_id, user_id=user_id)
        if not db_session:
            return False
        self.db.delete(db_session)
        self.db.commit()
        return True


    def get_session_messages(self, session_id: str) -> List[ChatMessage]:
        """Fetch all message logs in a session, in chronological order."""
        return list(
            self.db.scalars(
                select(ChatMessage)
                .where(ChatMessage.session_id == session_id)
                .order_by(ChatMessage.created_at.asc())
            ).all()
        )

    def create_message(self, session_id: str, role: str, content: str) -> ChatMessage:
        """Log a new conversational message."""
        db_msg = ChatMessage(
            session_id=session_id,
            role=role,
            content=content
        )
        self.db.add(db_msg)
        self.db.commit()
        self.db.refresh(db_msg)
        return db_msg
