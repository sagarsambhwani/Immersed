from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import Project, User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.api.deps import get_optional_current_user

router = APIRouter()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    proj_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Create a new user project with optional blueprint data."""
    user_id = current_user.id if current_user else None
    project = Project(
        user_id=user_id,
        title=proj_in.title,
        description=proj_in.description,
        domain=proj_in.domain,
        project_type=proj_in.project_type,
        blueprint_data=proj_in.blueprint_data,
        status=proj_in.status
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """List all projects for current user."""
    query = select(Project)
    if current_user:
        query = query.where(Project.user_id == current_user.id)
    query = query.order_by(Project.created_at.desc())
    return list(db.scalars(query).all())

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Retrieve details of a specific project by ID."""
    query = select(Project).where(Project.id == project_id)
    if current_user:
        query = query.where(Project.user_id == current_user.id)
    project = db.scalar(query)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    proj_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Update project details or blueprint data."""
    query = select(Project).where(Project.id == project_id)
    if current_user:
        query = query.where(Project.user_id == current_user.id)
    project = db.scalar(query)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = proj_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)

    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Delete a project by ID."""
    query = select(Project).where(Project.id == project_id)
    if current_user:
        query = query.where(Project.user_id == current_user.id)
    project = db.scalar(query)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
