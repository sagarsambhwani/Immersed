import json
from fastapi import APIRouter, Depends, Header, Request

from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repository import ChatRepository
from app.services.chat_service import ChatService
from app.schemas.chat import ChatRequest, MessageResponse
from app.core.limiter import limiter
from app.config import settings
from typing import List, Optional

router = APIRouter()

@router.get("/{session_id}/history", response_model=List[MessageResponse])
def get_history(session_id: str, db: Session = Depends(get_db)):
    """Retrieve all historical messages for a specific conversation session."""
    repo = ChatRepository(db)
    return repo.get_session_messages(session_id)

@router.post("/{session_id}")
@limiter.limit(settings.DEFAULT_RATE_LIMIT)
async def send_message(
    request: Request,
    session_id: str,
    chat_req: ChatRequest,
    db: Session = Depends(get_db),
    x_openai_key: Optional[str] = Header(None, alias="X-OpenAI-Key"),
    x_openrouter_key: Optional[str] = Header(None, alias="X-OpenRouter-Key"),
    x_groq_key: Optional[str] = Header(None, alias="X-Groq-Key"),
    x_anthropic_key: Optional[str] = Header(None, alias="X-Anthropic-Key")
):

    """
    Send a message to the chatbot.
    Supports either synchronous JSON response or Server-Sent Events (SSE) stream.
    """
    repo = ChatRepository(db)
    chat_service = ChatService(repo)
    
    # Bundle key overrides from headers
    api_key_overrides = {
        "openai": x_openai_key,
        "openrouter": x_openrouter_key,
        "groq": x_groq_key,
        "anthropic": x_anthropic_key
    }
    # Clean none or empty string settings
    api_key_overrides = {k: v for k, v in api_key_overrides.items() if v and v.strip()}

    if chat_req.stream:
        generator = await chat_service.send_message_stream(
            session_id=session_id,
            content=chat_req.content,
            api_key_overrides=api_key_overrides
        )
        
        async def event_generator():
            try:
                async for chunk in generator:
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
            except Exception as e:
                # Catch dynamic API/Config exceptions and format them as SSE JSON so client can display details
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")
    else:
        assistant_msg = await chat_service.send_message_sync(
            session_id=session_id,
            content=chat_req.content,
            api_key_overrides=api_key_overrides
        )
        return assistant_msg
