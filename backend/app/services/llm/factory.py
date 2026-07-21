from app.config import settings
from app.services.llm.base import BaseLLMProvider
from app.services.llm.mock_provider import MockProvider
from app.services.llm.openai_compatible import OpenAICompatibleProvider
from app.services.llm.anthropic_provider import AnthropicProvider
from app.core.exceptions import ConfigurationException

class LLMFactory:
    """Factory to instantiate and retrieve appropriate LLM provider interfaces."""
    
    @staticmethod
    def get_provider(provider_name: str) -> BaseLLMProvider:
        name = provider_name.lower().strip()
        
        if name == "mock":
            return MockProvider()
            
        elif name == "openai":
            return OpenAICompatibleProvider(
                default_api_key=settings.OPENAI_API_KEY,
                base_url="https://api.openai.com/v1",
                provider_name="openai"
            )
            
        elif name == "openrouter":
            return OpenAICompatibleProvider(
                default_api_key=settings.OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1",
                provider_name="openrouter",
                default_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "FastAPI React Chatbot"
                }
            )
            
        elif name == "groq":
            return OpenAICompatibleProvider(
                default_api_key=settings.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1",
                provider_name="groq"
            )
            
        elif name == "anthropic":
            return AnthropicProvider(default_api_key=settings.ANTHROPIC_API_KEY)
            
        else:
            raise ConfigurationException(f"Unsupported LLM Provider: {provider_name}")
