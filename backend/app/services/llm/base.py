from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any

class BaseLLMProvider(ABC):
    """Abstract Base Class for all LLM service integrations."""

    @abstractmethod
    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float,
        api_key: str = None
    ) -> str:
        """
        Generate a complete response from the LLM.
        
        :param messages: List of message dictionaries, e.g., [{"role": "user", "content": "..."}]
        :param model: Specific model string identifier.
        :param temperature: LLM creativity temperature settings (0.0 to 2.0).
        :param api_key: Provider API Key override (optional).
        :return: Complete string response content.
        """
        pass

    @abstractmethod
    def generate_response_stream(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float,
        api_key: str = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream response chunks from the LLM.
        
        :param messages: List of message dictionaries.
        :param model: Specific model string identifier.
        :param temperature: LLM creativity temperature settings.
        :param api_key: Provider API Key override (optional).
        :return: Async generator yielding string chunks.
        """
        pass
