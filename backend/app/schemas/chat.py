from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class ChatRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Message text sent by the user")
    stream: bool = Field(True, description="Whether to stream the response chunks using SSE")

class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    description: Optional[str] = None

class ProviderModelsResponse(BaseModel):
    provider: str
    is_configured: bool
    models: List[ModelInfo]
