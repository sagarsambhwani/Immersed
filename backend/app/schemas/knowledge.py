from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class KnowledgeBase(BaseModel):
    title: str
    content: str
    tags: Optional[str] = None
    mastery_score: float = 0.0

class KnowledgeCreate(KnowledgeBase):
    pass

class KnowledgeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None
    mastery_score: Optional[float] = None

class KnowledgeResponse(KnowledgeBase):
    id: str
    user_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
