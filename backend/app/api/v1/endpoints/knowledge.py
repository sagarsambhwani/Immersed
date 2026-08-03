from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import KnowledgeItem, User
from app.schemas.knowledge import KnowledgeCreate, KnowledgeUpdate, KnowledgeResponse
from app.api.deps import get_optional_current_user

router = APIRouter()

@router.post("/", response_model=KnowledgeResponse, status_code=status.HTTP_201_CREATED)
def create_knowledge_item(
    item_in: KnowledgeCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Create a new knowledge base card."""
    user_id = current_user.id if current_user else None
    item = KnowledgeItem(
        user_id=user_id,
        title=item_in.title,
        content=item_in.content,
        tags=item_in.tags,
        mastery_score=item_in.mastery_score
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/", response_model=List[KnowledgeResponse])
def list_knowledge_items(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """List all knowledge cards for current user."""
    query = select(KnowledgeItem)
    if current_user:
        query = query.where(KnowledgeItem.user_id == current_user.id)
    query = query.order_by(KnowledgeItem.created_at.desc())
    return list(db.scalars(query).all())

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_knowledge_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Delete a knowledge card by ID."""
    query = select(KnowledgeItem).where(KnowledgeItem.id == item_id)
    if current_user:
        query = query.where(KnowledgeItem.user_id == current_user.id)
    item = db.scalar(query)
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    
    db.delete(item)
    db.commit()
