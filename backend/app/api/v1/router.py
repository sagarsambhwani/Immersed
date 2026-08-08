from fastapi import APIRouter
from app.api.v1.endpoints import auth, sessions, chat, models, projects, knowledge, tasks, workflow

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(workflow.router, prefix="/projects", tags=["workflow"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])

api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])


