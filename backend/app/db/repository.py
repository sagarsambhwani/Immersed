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

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Fetch a conversation session by ID."""
        return self.db.scalar(select(ChatSession).where(ChatSession.id == session_id))

    def get_sessions(self) -> List[ChatSession]:
        """Fetch all conversation sessions ordered by created time descending."""
        return list(
            self.db.scalars(
                select(ChatSession).order_by(ChatSession.created_at.desc())
            ).all()
        )

    def create_session(self, obj_in: SessionCreate) -> ChatSession:
        """Create a new conversation session."""
        title = obj_in.title or f"Chat - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}"
        db_session = ChatSession(
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

    def update_session(self, session_id: str, obj_in: SessionUpdate) -> Optional[ChatSession]:
        """Update existing session fields."""
        db_session = self.get_session(session_id)
        if not db_session:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_session, key, value)
            
        self.db.add(db_session)
        self.db.commit()
        self.db.refresh(db_session)
        return db_session

    def delete_session(self, session_id: str) -> bool:
        """Delete a session by ID."""
        db_session = self.get_session(session_id)
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
