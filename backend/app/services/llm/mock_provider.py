import asyncio
from typing import AsyncGenerator, List, Dict
from app.services.llm.base import BaseLLMProvider

class MockProvider(BaseLLMProvider):
    """Simulated provider to test the streaming backend and typewriter frontend without keys."""
    
    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float,
        api_key: str = None
    ) -> str:
        last_message = messages[-1]["content"] if messages else ""
        return (
            f"[Mock Response - Model {model}]\n\n"
            f"You said: \"{last_message}\"\n\n"
            f"This mock message confirms that your FastAPI backend is fully operational and database histories are working! "
            f"To hook this chatbot to external language models, open the **Settings** panel on the UI and configure: "
            f"OpenRouter, Groq, OpenAI, or Anthropic."
        )

    async def generate_response_stream(
        self, 
        messages: List[Dict[str, str]], 
        model: str, 
        temperature: float,
        api_key: str = None
    ) -> AsyncGenerator[str, None]:
        last_message = messages[-1]["content"] if messages else ""
        
        paragraphs = [
            f"[Mock Stream - Model {model}]",
            f"Received user prompt: \"{last_message}\"",
            "This is a simulated token stream yielding words one by one over Server-Sent Events (SSE). It helps verify that the React client's async buffer handles incoming data chunks concurrently.",
            "You can click on the Settings gear in the bottom-left corner of the page to supply API credentials dynamically, which will unlock actual remote inference."
        ]
        
        full_text = "\n\n".join(paragraphs)
        # Split text into small word tokens
        tokens = full_text.split(" ")
        for i, token in enumerate(tokens):
            yield token if i == 0 else " " + token
            await asyncio.sleep(0.03)  # Small delay (30ms) to simulate token-by-token processing
