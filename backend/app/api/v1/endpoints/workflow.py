from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import Project, User
from app.api.deps import get_optional_current_user
from app.schemas.workflow import (
    WorkflowStartRequest,
    WorkflowResumeRequest,
    WorkflowEvolveRequest,
    WorkflowStateResponse,
    WorkflowMutationResponse,
    WorkflowEvent
)
from app.services.workflow_engine import WorkflowStateMachine

router = APIRouter()

@router.post("/{project_id}/workflow/start", response_model=WorkflowStateResponse, status_code=status.HTTP_200_OK)
async def start_project_workflow(
    project_id: str,
    req: WorkflowStartRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Initializes the Goal -> Phase -> Task -> Interaction state machine for a project."""
    project = db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    state = await WorkflowStateMachine.start_workflow(project, req, current_user)
    db.add(project)
    db.commit()
    db.refresh(project)
    return state

@router.get("/{project_id}/workflow", response_model=WorkflowStateResponse)
async def get_project_workflow(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Retrieves authoritative workflow state for a project."""
    project = db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return await WorkflowStateMachine.get_workflow_state(project, current_user)

@router.post("/{project_id}/workflow/resume", response_model=WorkflowMutationResponse)
async def resume_project_workflow(
    project_id: str,
    req: WorkflowResumeRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Resolves active interaction, validates typed payload, and advances state machine."""
    project = db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    res = await WorkflowStateMachine.resolve_interaction(project, req, current_user)
    db.add(project)
    db.commit()
    return res

@router.post("/{project_id}/workflow/evolve", response_model=WorkflowMutationResponse)
async def evolve_project_workflow(
    project_id: str,
    req: WorkflowEvolveRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Adapts future workflow direction while keeping completed history permanently immutable."""
    project = db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    res = await WorkflowStateMachine.evolve_workflow(project, req, current_user)
    db.add(project)
    db.commit()
    return res

