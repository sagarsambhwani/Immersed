import openai
from typing import AsyncGenerator, List, Dict
from app.services.llm.base import BaseLLMProvider
from app.core.exceptions import LLMProviderException

class OpenAICompatibleProvider(BaseLLMProvider):
    """Generic class to interface with any OpenAI-compatible API endpoint (OpenAI, OpenRouter, Groq, Ollama, etc.)."""

    def __init__(self, default_api_key: str, base_url: str, provider_name: str, default_headers: dict = None):
        self.default_api_key = default_api_key
        self.base_url = base_url
        self.provider_name = provider_name
        self.default_headers = default_headers or {}

    def _get_client(self, api_key: str = None) -> openai.AsyncOpenAI:
        key = api_key or self.default_api_key
        if not key:
            raise LLMProviderException(
                provider=self.provider_name,
                details=f"API Key for {self.provider_name} is missing. Please set it in Settings."
            )
        return openai.AsyncOpenAI(
            api_key=key,
            base_url=self.base_url,
            default_headers=self.default_headers
        )

    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float,
        api_key: str = None
    ) -> str:
        try:
            client = self._get_client(api_key)
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            raise LLMProviderException(provider=self.provider_name, details=str(e))

    async def generate_response_stream(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float,
        api_key: str = None
    ) -> AsyncGenerator[str, None]:
        try:
            client = self._get_client(api_key)
            stream = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                stream=True
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            # Yield error details to frontend
            raise LLMProviderException(provider=self.provider_name, details=str(e))
