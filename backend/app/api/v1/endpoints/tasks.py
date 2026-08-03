from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import TaskItem, User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.api.deps import get_optional_current_user

router = APIRouter()

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Create a new study task item."""
    user_id = current_user.id if current_user else None
    task = TaskItem(
        user_id=user_id,
        title=task_in.title,
        completed=task_in.completed,
        priority=task_in.priority
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """List all study tasks for current user."""
    query = select(TaskItem)
    if current_user:
        query = query.where(TaskItem.user_id == current_user.id)
    query = query.order_by(TaskItem.created_at.desc())
    return list(db.scalars(query).all())

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Update task completion status or title."""
    query = select(TaskItem).where(TaskItem.id == task_id)
    if current_user:
        query = query.where(TaskItem.user_id == current_user.id)
    task = db.scalar(query)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Delete a task item by ID."""
    query = select(TaskItem).where(TaskItem.id == task_id)
    if current_user:
        query = query.where(TaskItem.user_id == current_user.id)
    task = db.scalar(query)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
