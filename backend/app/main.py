import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import redis
from sqlalchemy import text
from app.config import settings
from app.api.v1.router import api_router
from app.core.exceptions import ChatbotException
from app.core.limiter import limiter
from app.core.logging import setup_logging, logger
from app.db.base import Base
from app.db.session import engine
import app.db.models  # Ensure models are imported for metadata mapping

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("Initializing Immersed FastAPI Backend Server...")
    def init_tables():
        Base.metadata.create_all(bind=engine)
    await asyncio.to_thread(init_tables)
    yield
    engine.dispose()
    logger.info("Server shutdown complete.")

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

@app.get("/health/live", tags=["health"])
async def liveness_probe():
    """Liveness probe: verifies application process is running."""
    return {"status": "alive"}

@app.get("/health/ready", tags=["health"])
async def readiness_probe():
    """Readiness probe: validates database engine and Redis connectivity."""
    db_ok = False
    redis_ok = False
    
    # 1. Test DB Connection
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception as e:
        logger.error("Readiness check DB failure", error=str(e))
        
    # 2. Test Redis Connection
    if settings.REDIS_URL.startswith("redis://") or settings.REDIS_URL.startswith("rediss://"):
        try:
            r = redis.from_url(settings.REDIS_URL, socket_connect_timeout=1)
            r.ping()
            redis_ok = True
        except Exception:
            redis_ok = False
    else:
        redis_ok = True

    if db_ok:
        return {
            "status": "ready",
            "database": "ok",
            "redis": "ok" if redis_ok else "fallback_memory"
        }
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unready", "database": "error", "redis": "ok" if redis_ok else "unreachable"}
        )

@app.get("/health", tags=["health"])
async def health_check():
    """General health check endpoint."""
    return {"status": "ok"}

