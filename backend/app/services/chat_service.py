import asyncio
from app.db.repository import ChatRepository
from app.services.llm.factory import LLMFactory
from app.core.exceptions import SessionNotFoundException
from typing import AsyncGenerator, Dict, List
from app.db.session import SessionLocal
from app.db.models import ChatMessage

class ChatService:
    """Core service executing chatbot business logic, wrapping sync DB operations in threads."""

    def __init__(self, repo: ChatRepository):
        self.repo = repo

    async def send_message_sync(
        self, 
        session_id: str, 
        content: str, 
        api_key_overrides: Dict[str, str] = None
    ) -> ChatMessage:
        """Sends user message, fetches entire block response, updates DB, and returns Assistant message."""
        session = await asyncio.to_thread(self.repo.get_session, session_id)
        if not session:
            raise SessionNotFoundException(session_id)

        # 1. Save user message to database
        await asyncio.to_thread(self.repo.create_message, session_id, "user", content)

        # 2. Build complete conversation context
        messages = await self._build_llm_messages(session_id, session.system_prompt)

        # 3. Request LLM completion
        provider = LLMFactory.get_provider(session.provider)
        api_key = (api_key_overrides or {}).get(session.provider.lower())

        assistant_content = await provider.generate_response(
            messages=messages,
            model=session.model,
            temperature=session.temperature,
            api_key=api_key
        )

        # 4. Save and return Assistant response
        assistant_msg = await asyncio.to_thread(
            self.repo.create_message, session_id, "assistant", assistant_content
        )
        return assistant_msg

    async def send_message_stream(
        self, 
        session_id: str, 
        content: str, 
        api_key_overrides: Dict[str, str] = None
    ) -> AsyncGenerator[str, None]:
        """Sends user message, returns SSE chunk generator, writes full assistant reply to DB upon completion."""
        session = await asyncio.to_thread(self.repo.get_session, session_id)
        if not session:
            raise SessionNotFoundException(session_id)

        # 1. Save user message
        await asyncio.to_thread(self.repo.create_message, session_id, "user", content)

        # 2. Build dialog context
        messages = await self._build_llm_messages(session_id, session.system_prompt)

        # 3. Setup streaming generator
        provider_name = session.provider.lower()
        api_key = (api_key_overrides or {}).get(provider_name)
        provider = LLMFactory.get_provider(provider_name)

        async def stream_generator() -> AsyncGenerator[str, None]:
            stream = provider.generate_response_stream(
                messages=messages,
                model=session.model,
                temperature=session.temperature,
                api_key=api_key
            )
            accumulated_content = []
            try:
                async for chunk in stream:
                    accumulated_content.append(chunk)
                    yield chunk
            finally:
                # Once generator terminates or client cancels, write full block to database in a thread
                full_text = "".join(accumulated_content)
                if full_text.strip():
                    def save_assistant_message(sid: str, text: str):
                        with SessionLocal() as db_session:
                            async_repo = ChatRepository(db_session)
                            async_repo.create_message(session_id=sid, role="assistant", content=text)
                            db_session.commit()

                    await asyncio.to_thread(save_assistant_message, session_id, full_text)

        return stream_generator()

    async def _build_llm_messages(self, session_id: str, system_prompt: str) -> List[Dict[str, str]]:
        """Constructs chat histories properly for API feeding."""
        history = await asyncio.to_thread(self.repo.get_session_messages, session_id)
        llm_messages = []
        
        # Inject system instructions at the start of conversation
        if system_prompt:
            llm_messages.append({"role": "system", "content": system_prompt})
            
        for msg in history:
            llm_messages.append({"role": msg.role, "content": msg.content})
            
        return llm_messages
