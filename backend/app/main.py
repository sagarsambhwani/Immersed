import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.api.v1.router import api_router
from app.core.exceptions import ChatbotException
from app.core.limiter import limiter
from app.db.base import Base
from app.db.session import engine
import app.db.models  # Ensure models are imported for metadata mapping

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions: automatically initialize SQL database tables synchronously in a thread
    def init_tables():
        Base.metadata.create_all(bind=engine)
    await asyncio.to_thread(init_tables)
    yield
    # Shutdown actions: dispose sync engine connection pool
    engine.dispose()

app = FastAPI(
    title="Scalable Generic Chatbot API",
    description="Asynchronous FastAPI chatbot backend with database histories and pluggable LLMs.",
    version="1.0.0",
    lifespan=lifespan
)

# Attach Rate Limiter state & exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Custom Error Interceptor
@app.exception_handler(ChatbotException)
async def chatbot_exception_handler(request: Request, exc: ChatbotException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

# Register V1 Routers
app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint to ensure server is live."""
    return {"status": "ok"}
