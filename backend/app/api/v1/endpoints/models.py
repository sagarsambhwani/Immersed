from fastapi import APIRouter
from app.schemas.chat import ProviderModelsResponse, ModelInfo
from app.config import settings
from typing import List

router = APIRouter()

# Statically list models that the system natively integrates with
SUPPORTED_MODELS = {
    "mock": [
        ModelInfo(
            id="mock-gpt", 
            name="Mock GPT (No key required)", 
            provider="mock", 
            description="Simulated typewriter response for local development."
        )
    ],
    "openai": [
        ModelInfo(
            id="gpt-4o", 
            name="GPT-4o (Flagship)", 
            provider="openai", 
            description="High-intelligence flagship model for complex tasks."
        ),
        ModelInfo(
            id="gpt-4o-mini", 
            name="GPT-4o Mini (Fast & Lightweight)", 
            provider="openai", 
            description="Affordable, high-speed model for everyday tasks."
        ),
        ModelInfo(
            id="gpt-4-turbo", 
            name="GPT-4 Turbo", 
            provider="openai", 
            description="Previous generation high intelligence model."
        )
    ],
    "openrouter": [
        # --- FREE MODELS ---
        ModelInfo(
            id="openrouter/free", 
            name="Free Models Router (Auto)", 
            provider="openrouter", 
            description="Automatically selects and routes your request to any currently available free model."
        ),
        ModelInfo(
            id="google/gemma-4-31b-it:free", 
            name="Gemma 4 31B (Free)", 
            provider="openrouter", 
            description="Google's newest Gemma 4 31B parameter model hosted for free."
        ),
        ModelInfo(
            id="openai/gpt-oss-20b:free", 
            name="GPT-OSS-20B (Free)", 
            provider="openrouter", 
            description="OpenAI's GPT-OSS 20B parameter model hosted for free."
        ),
        ModelInfo(
            id="tencent/hy3:free", 
            name="Tencent Hy3 (Free)", 
            provider="openrouter", 
            description="Tencent's Hy3 model hosted for free."
        ),
        ModelInfo(
            id="nvidia/nemotron-3-super-120b-a12b:free", 
            name="NVIDIA Nemotron 3 Super (Free)", 
            provider="openrouter", 
            description="NVIDIA's massive 120B Nemotron 3 model hosted for free."
        ),
        ModelInfo(
            id="cohere/north-mini-code:free", 
            name="Cohere North Mini Code (Free)", 
            provider="openrouter", 
            description="Cohere's lightweight coding assistant model hosted for free."
        ),
        ModelInfo(
            id="poolside/laguna-xs-2.1:free", 
            name="Poolside Laguna XS (Free)", 
            provider="openrouter", 
            description="Poolside's fast code autocomplete and generation model hosted for free."
        ),
        # --- PREMIUM MODELS ---
        ModelInfo(
            id="anthropic/claude-3.5-sonnet", 
            name="Claude 3.5 Sonnet", 
            provider="openrouter", 
            description="Anthropic's flagship Claude 3.5 Sonnet model. Unmatched logic and writing."
        ),
        ModelInfo(
            id="anthropic/claude-3-haiku", 
            name="Claude 3 Haiku", 
            provider="openrouter", 
            description="Anthropic's highly efficient, lightning-fast text and logic model."
        ),
        ModelInfo(
            id="openai/gpt-4o", 
            name="GPT-4o (OpenAI Flagship)", 
            provider="openrouter", 
            description="OpenAI's high-intelligence conversational flagship model."
        ),
        ModelInfo(
            id="openai/gpt-4o-mini", 
            name="GPT-4o Mini", 
            provider="openrouter", 
            description="OpenAI's cost-effective, high-speed lightweight model."
        ),
        ModelInfo(
            id="meta-llama/llama-3.1-405b-instruct", 
            name="Llama 3.1 405B Instruct", 
            provider="openrouter", 
            description="Meta's largest, most capable open model with 128k context."
        ),
        ModelInfo(
            id="meta-llama/llama-3.1-70b-instruct", 
            name="Llama 3.1 70B Instruct", 
            provider="openrouter", 
            description="Meta's 70B parameter model with a 128k token context window."
        ),
        ModelInfo(
            id="deepseek/deepseek-coder", 
            name="DeepSeek Coder V2", 
            provider="openrouter", 
            description="State-of-the-art coding and reasoning open-source model."
        )
    ],
    "groq": [
        ModelInfo(
            id="llama3-8b-8192", 
            name="Llama 3 8B (Groq LPU)", 
            provider="groq", 
            description="Extremely fast inference on Meta Llama 3 8B."
        ),
        ModelInfo(
            id="llama3-70b-8192", 
            name="Llama 3 70B (Groq LPU)", 
            provider="groq", 
            description="Meta Llama 3 70B running on Groq hardware."
        ),
        ModelInfo(
            id="mixtral-8x7b-32768", 
            name="Mixtral 8x7B (Groq LPU)", 
            provider="groq", 
            description="High-quality MoE model with large context size."
        ),
        ModelInfo(
            id="gemma-7b-it", 
            name="Gemma 7B (Groq LPU)", 
            provider="groq", 
            description="Google's Gemma 7B optimized on Groq."
        )
    ],
    "anthropic": [
        ModelInfo(
            id="claude-3-5-sonnet-20240620", 
            name="Claude 3.5 Sonnet", 
            provider="anthropic", 
            description="Anthropic's state-of-the-art model."
        ),
        ModelInfo(
            id="claude-3-haiku-20240307", 
            name="Claude 3 Haiku", 
            provider="anthropic", 
            description="Anthropic's fastest, most energy-efficient model."
        ),
        ModelInfo(
            id="claude-3-opus-20240229", 
            name="Claude 3 Opus", 
            provider="anthropic", 
            description="Deep reasoning model for highly complex tasks."
        )
    ]
}

@router.get("/", response_model=List[ProviderModelsResponse])
def list_models():
    """Retrieve available models grouped by provider, indicating server configuration status."""
    config_status = {
        "mock": True,
        "openai": bool(settings.OPENAI_API_KEY.strip()) if settings.OPENAI_API_KEY else False,
        "openrouter": bool(settings.OPENROUTER_API_KEY.strip()) if settings.OPENROUTER_API_KEY else False,
        "groq": bool(settings.GROQ_API_KEY.strip()) if settings.GROQ_API_KEY else False,
        "anthropic": bool(settings.ANTHROPIC_API_KEY.strip()) if settings.ANTHROPIC_API_KEY else False
    }
    
    return [
        ProviderModelsResponse(
            provider=provider,
            is_configured=config_status.get(provider.lower(), False),
            models=models
        )
        for provider, models in SUPPORTED_MODELS.items()
    ]
