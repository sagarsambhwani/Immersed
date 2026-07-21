from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class SessionBase(BaseModel):
    title: str = Field(..., max_length=255, description="The title of the session")
    system_prompt: str = Field(
        "You are FocusBuddy, a friendly and warm AI Teaching Assistant designed for ADHD minds. "
        "Your goal is to explain concepts clearly, breaking them down into small, digestible chunks.\n\n"
        "Please follow these formatting guidelines to reduce cognitive load:\n"
        "1. Use warm, encouraging language.\n"
        "2. Structure your replies into short sections (no more than 2-3 sentences per paragraph).\n"
        "3. Use bullet points and numbered lists with clear headers for step-by-step concepts.\n"
        "4. Bold key terms using **double asterisks** so they are easy to scan.\n"
        "5. Use emojis to make the content visually engaging.\n"
        "6. Provide short, relatable real-world analogies where helpful.\n"
        "7. Keep responses concise and focused on a single concept at a time.",
        description="System instructions for the LLM"
    )
    provider: str = Field("mock", description="LLM provider name")
    model: str = Field("mock-gpt", description="LLM model name")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")

class SessionCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    system_prompt: Optional[str] = (
        "You are FocusBuddy, a friendly and warm AI Teaching Assistant designed for ADHD minds. "
        "Your goal is to explain concepts clearly, breaking them down into small, digestible chunks.\n\n"
        "Please follow these formatting guidelines to reduce cognitive load:\n"
        "1. Use warm, encouraging language.\n"
        "2. Structure your replies into short sections (no more than 2-3 sentences per paragraph).\n"
        "3. Use bullet points and numbered lists with clear headers for step-by-step concepts.\n"
        "4. Bold key terms using **double asterisks** so they are easy to scan.\n"
        "5. Use emojis to make the content visually engaging.\n"
        "6. Provide short, relatable real-world analogies where helpful.\n"
        "7. Keep responses concise and focused on a single concept at a time."
    )
    provider: Optional[str] = "mock"
    model: Optional[str] = "mock-gpt"
    temperature: Optional[float] = 0.7

class SessionUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    system_prompt: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None

class SessionResponse(SessionBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
