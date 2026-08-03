import httpx
import logging
from typing import List, Optional
from fastapi import APIRouter, Header
from app.schemas.chat import ProviderModelsResponse, ModelInfo
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

async def fetch_openrouter_models() -> List[ModelInfo]:
    models = []
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get("https://openrouter.ai/api/v1/models")
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for item in data[:35]:  # Dynamic models list straight from OpenRouter API
                    m_id = item.get("id")
                    m_name = item.get("name", m_id)
                    m_desc = item.get("description") or f"Context window: {item.get('context_length', 'N/A')} tokens."
                    models.append(ModelInfo(
                        id=m_id,
                        name=m_name,
                        provider="openrouter",
                        description=m_desc
                    ))
    except Exception as e:
        logger.warning("Failed to dynamically fetch OpenRouter models", error=str(e))

    if not models:
        models = [
            ModelInfo(id="openrouter/auto", name="OpenRouter Auto", provider="openrouter", description="Dynamic router auto-selecting active model."),
            ModelInfo(id="google/gemini-2.5-flash:free", name="Google Gemini 2.5 Flash (Free)", provider="openrouter", description="Google Gemini Flash free tier."),
            ModelInfo(id="meta-llama/llama-3.1-70b-instruct", name="Llama 3.1 70B Instruct", provider="openrouter", description="Meta Llama 3.1 70B Instruct."),
            ModelInfo(id="anthropic/claude-3.5-sonnet", name="Claude 3.5 Sonnet", provider="openrouter", description="Anthropic flagship Claude 3.5 Sonnet.")
        ]
    return models

async def fetch_openai_models(api_key: Optional[str]) -> List[ModelInfo]:
    models = []
    if api_key:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                headers = {"Authorization": f"Bearer {api_key}"}
                resp = await client.get("https://api.openai.com/v1/models", headers=headers)
                if resp.status_code == 200:
                    data = resp.json().get("data", [])
                    valid_ids = [m["id"] for m in data if any(k in m["id"] for k in ["gpt-4", "gpt-3.5", "o1"])]
                    for m_id in valid_ids[:10]:
                        models.append(ModelInfo(
                            id=m_id,
                            name=f"OpenAI {m_id}",
                            provider="openai",
                            description=f"Official OpenAI API model: {m_id}"
                        ))
        except Exception as e:
            logger.warning("Failed to dynamically fetch OpenAI models", error=str(e))

    if not models:
        models = [
            ModelInfo(id="gpt-4o", name="GPT-4o (Flagship)", provider="openai", description="High-intelligence flagship model."),
            ModelInfo(id="gpt-4o-mini", name="GPT-4o Mini (Fast)", provider="openai", description="Lightweight model."),
            ModelInfo(id="gpt-4-turbo", name="GPT-4 Turbo", provider="openai", description="Previous generation flagship model.")
        ]
    return models

async def fetch_groq_models(api_key: Optional[str]) -> List[ModelInfo]:
    models = []
    if api_key:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                headers = {"Authorization": f"Bearer {api_key}"}
                resp = await client.get("https://api.groq.com/openai/v1/models", headers=headers)
                if resp.status_code == 200:
                    data = resp.json().get("data", [])
                    for item in data:
                        m_id = item.get("id")
                        models.append(ModelInfo(
                            id=m_id,
                            name=f"Groq {m_id}",
                            provider="groq",
                            description=f"Groq LPU hardware accelerated model: {m_id}"
                        ))
        except Exception as e:
            logger.warning("Failed to dynamically fetch Groq models", error=str(e))

    if not models:
        models = [
            ModelInfo(id="llama3-8b-8192", name="Llama 3 8B (Groq LPU)", provider="groq", description="Fast inference on Groq."),
            ModelInfo(id="llama3-70b-8192", name="Llama 3 70B (Groq LPU)", provider="groq", description="Llama 3 70B on Groq.")
        ]
    return models

@router.get("/", response_model=List[ProviderModelsResponse])
async def list_models(
    x_openai_key: Optional[str] = Header(None, alias="X-OpenAI-Key"),
    x_openrouter_key: Optional[str] = Header(None, alias="X-OpenRouter-Key"),
    x_groq_key: Optional[str] = Header(None, alias="X-Groq-Key"),
    x_anthropic_key: Optional[str] = Header(None, alias="X-Anthropic-Key"),
):
    """Retrieve available models dynamically from provider APIs using active server & client keys."""
    s_openai = getattr(settings, "OPENAI_API_KEY", "") or ""
    s_openrouter = getattr(settings, "OPENROUTER_API_KEY", "") or ""
    s_groq = getattr(settings, "GROQ_API_KEY", "") or ""
    s_anthropic = getattr(settings, "ANTHROPIC_API_KEY", "") or ""

    openai_key = (x_openai_key and x_openai_key.strip()) or s_openai.strip()
    openrouter_key = (x_openrouter_key and x_openrouter_key.strip()) or s_openrouter.strip()
    groq_key = (x_groq_key and x_groq_key.strip()) or s_groq.strip()
    anthropic_key = (x_anthropic_key and x_anthropic_key.strip()) or s_anthropic.strip()


    mock_models = [
        ModelInfo(
            id="mock-gpt",
            name="Mock GPT (No key required)",
            provider="mock",
            description="Simulated typewriter response for local development."
        )
    ]
    openai_models = await fetch_openai_models(openai_key)
    openrouter_models = await fetch_openrouter_models()
    groq_models = await fetch_groq_models(groq_key)
    anthropic_models = [
        ModelInfo(id="claude-3-5-sonnet-20240620", name="Claude 3.5 Sonnet", provider="anthropic", description="Anthropic flagship model."),
        ModelInfo(id="claude-3-haiku-20240307", name="Claude 3 Haiku", provider="anthropic", description="Fast Claude 3 model.")
    ]

    return [
        ProviderModelsResponse(provider="mock", is_configured=True, models=mock_models),
        ProviderModelsResponse(provider="openai", is_configured=bool(openai_key), models=openai_models),
        ProviderModelsResponse(provider="openrouter", is_configured=bool(openrouter_key), models=openrouter_models),
        ProviderModelsResponse(provider="groq", is_configured=bool(groq_key), models=groq_models),
        ProviderModelsResponse(provider="anthropic", is_configured=bool(anthropic_key), models=anthropic_models),
    ]
