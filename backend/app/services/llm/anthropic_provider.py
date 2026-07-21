import json
import httpx
from typing import AsyncGenerator, List, Dict
from app.services.llm.base import BaseLLMProvider
from app.core.exceptions import LLMProviderException

class AnthropicProvider(BaseLLMProvider):
    """Direct integration with Anthropic Messages API using httpx streaming."""

    def __init__(self, default_api_key: str):
        self.default_api_key = default_api_key
        self.base_url = "https://api.anthropic.com/v1/messages"

    def _get_headers(self, api_key: str = None) -> dict:
        key = api_key or self.default_api_key
        if not key:
            raise LLMProviderException(
                provider="anthropic",
                details="Anthropic API Key is missing. Please set it in Settings."
            )
        return {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

    def _format_request_body(self, messages: List[Dict[str, str]], model: str, temperature: float) -> dict:
        # Anthropic splits system messages out of the core conversational messages list
        system_content = None
        formatted_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_content = msg["content"]
            else:
                formatted_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        body = {
            "model": model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": 4096
        }
        if system_content:
            body["system"] = system_content
        return body

    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float,
        api_key: str = None
    ) -> str:
        headers = self._get_headers(api_key)
        body = self._format_request_body(messages, model, temperature)
        body["stream"] = False

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(self.base_url, headers=headers, json=body)
                if response.status_code != 200:
                    raise LLMProviderException(
                        provider="anthropic",
                        details=f"Status {response.status_code}: {response.text}"
                    )
                data = response.json()
                return data["content"][0]["text"]
            except Exception as e:
                if isinstance(e, LLMProviderException):
                    raise
                raise LLMProviderException(provider="anthropic", details=str(e))

    async def generate_response_stream(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float,
        api_key: str = None
    ) -> AsyncGenerator[str, None]:
        headers = self._get_headers(api_key)
        body = self._format_request_body(messages, model, temperature)
        body["stream"] = True

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                async with client.stream("POST", self.base_url, headers=headers, json=body) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        raise LLMProviderException(
                            provider="anthropic",
                            details=f"Status {response.status_code}: {error_text.decode('utf-8')}"
                        )
                    
                    async for line in response.iter_lines():
                        if not line:
                            continue
                        if line.startswith("data:"):
                            data_str = line[5:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                data_json = json.loads(data_str)
                                event_type = data_json.get("type")
                                if event_type == "content_block_delta":
                                    delta = data_json.get("delta", {})
                                    if delta.get("type") == "text_delta":
                                        yield delta.get("text", "")
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                if isinstance(e, LLMProviderException):
                    raise
                raise LLMProviderException(provider="anthropic", details=str(e))
