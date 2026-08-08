import openai
from typing import AsyncGenerator, List, Dict
from app.services.llm.base import BaseLLMProvider
from app.core.exceptions import LLMProviderException

class GeminiProvider(BaseLLMProvider):
    """Google Gemini Integration via Google's Generative Language OpenAI-compatible endpoint."""

    def __init__(self, default_api_key: str):
        self.default_api_key = default_api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
        self.provider_name = "gemini"

    def _get_client(self, api_key: str = None) -> openai.AsyncOpenAI:
        key = api_key or self.default_api_key
        if not key:
            raise LLMProviderException(
                provider=self.provider_name,
                details="GEMINI_API_KEY is missing. Please set it in backend/.env or your environment."
            )
        return openai.AsyncOpenAI(
            api_key=key,
            base_url=self.base_url
        )

    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model: str = "gemini-1.5-flash", 
        temperature: float = 0.7,
        api_key: str = None
    ) -> str:
        try:
            client = self._get_client(api_key)
            target_model = model if ("gemini" in model) else "gemini-1.5-flash"
            response = await client.chat.completions.create(
                model=target_model,
                messages=messages,
                temperature=temperature
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            raise LLMProviderException(provider=self.provider_name, details=str(e))

    async def generate_response_stream(
        self, 
        messages: List[Dict[str, str]], 
        model: str = "gemini-1.5-flash", 
        temperature: float = 0.7,
        api_key: str = None
    ) -> AsyncGenerator[str, None]:
        try:
            client = self._get_client(api_key)
            target_model = model if ("gemini" in model) else "gemini-1.5-flash"
            stream = await client.chat.completions.create(
                model=target_model,
                messages=messages,
                temperature=temperature,
                stream=True
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            raise LLMProviderException(provider=self.provider_name, details=str(e))
