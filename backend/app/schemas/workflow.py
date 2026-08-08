import hashlib
import json
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict

class TaskStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    WAITING_FOR_INPUT = "waiting_for_input"
    COMPLETED = "completed"
    SUPERSEDED = "superseded"
    FAILED = "failed"

class InteractionStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    SUPERSEDED = "superseded"

class InteractionType(str, Enum):
    QUESTION = "question"
    CHOICE = "choice"
    REVIEW = "review"
    APPROVAL = "approval"
    ACTION = "action"
    REFLECTION = "reflection"
    VALIDATION = "validation"
    FREEFORM = "freeform"

class WorkflowEventType(str, Enum):
    WORKFLOW_STARTED = "workflow_started"
    WORKFLOW_GENERATED = "workflow_generated"
    INTERACTION_PRESENTED = "interaction_presented"
    INTERACTION_RESOLVED = "interaction_resolved"
    TASK_COMPLETED = "task_completed"
    WORKFLOW_EVOLVED = "workflow_evolved"
    TASK_SUPERSEDED = "task_superseded"
    WORKFLOW_FINISHED = "workflow_finished"

# Typed Resume Payloads
class QuestionResumeData(BaseModel):
    answers: Dict[str, str] = Field(..., description="Mapping of question ID to user answer")

class ChoiceResumeData(BaseModel):
    selected_option: str
    custom_note: Optional[str] = None

class ReviewResumeData(BaseModel):
    accepted: bool
    feedback: Optional[str] = None

class ApprovalResumeData(BaseModel):
    approved: bool
    revision_request: Optional[str] = None

class ActionResumeData(BaseModel):
    completed: bool = True
    action_notes: Optional[str] = None

class ReflectionResumeData(BaseModel):
    reflection_text: str
    insights_gained: Optional[List[str]] = Field(default_factory=list)

class ValidationResumeData(BaseModel):
    is_valid: bool
    evidence_notes: Optional[str] = None

class FreeformResumeData(BaseModel):
    text: str

# Hierarchy: Goal -> Phase -> Task -> List[Interaction]
class WorkflowInteraction(BaseModel):
    interaction_id: str
    sequence: int = 1
    type: InteractionType
    title: str
    prompt_message: str
    why_relevant: str = Field(..., description="Why we are asking this step now")
    what_unlocks: str = Field(..., description="What completing this step unlocks")
    options: Optional[List[str]] = None
    data: Optional[Dict[str, Any]] = None
    status: InteractionStatus = InteractionStatus.PENDING
    user_response_summary: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

class WorkflowTask(BaseModel):
    task_id: str
    plan_version: int = 1
    sequence: int
    title: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    interactions: List[WorkflowInteraction] = Field(default_factory=list)
    active_interaction_id: Optional[str] = None
    completed_at: Optional[str] = None
    user_response_summary: Optional[str] = None

class WorkflowPhase(BaseModel):
    phase_id: str
    sequence: int
    title: str
    description: str
    tasks: List[WorkflowTask] = Field(default_factory=list)

class WorkflowEvent(BaseModel):
    event_id: str
    project_id: str
    workflow_version: int
    plan_version: int
    task_id: Optional[str] = None
    interaction_id: Optional[str] = None
    actor_id: Optional[str] = None
    event_type: WorkflowEventType
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str

class WorkflowTransition(BaseModel):
    transition_id: str
    operation_type: str
    workflow_version_before: int
    workflow_version_after: int
    timestamp: str

class WorkflowStateResponse(BaseModel):
    project_id: str
    intention: str
    domain: str
    workflow_version: int
    plan_version: int
    status: str  # in_progress, completed, archived
    active_phase_id: Optional[str] = None
    active_task_id: Optional[str] = None
    active_interaction: Optional[WorkflowInteraction] = None
    phases: List[WorkflowPhase] = Field(default_factory=list)
    total_tasks_completed: int = 0
    total_tasks_remaining: int = 0

class WorkflowMutationResponse(BaseModel):
    transition: WorkflowTransition
    workflow: WorkflowStateResponse

# API Requests
class WorkflowStartRequest(BaseModel):
    intention: str = Field(..., description="User's intention, question, creative goal, or project")
    context_notes: Optional[str] = Field(None, description="Background experience or context")
    domain_hint: Optional[str] = Field(None, description="Optional domain categorization")

class WorkflowResumeRequest(BaseModel):
    checkpoint_id: str = Field(..., description="Target active task or interaction ID")
    expected_version: int = Field(..., description="Optimistic locking workflow version")
    idempotency_key: Optional[str] = Field(None, description="Client idempotency token")
    resume_data: Dict[str, Any] = Field(..., description="Typed response payload matching interaction type")

class WorkflowEvolveRequest(BaseModel):
    expected_version: int = Field(..., description="Optimistic locking workflow version")
    idempotency_key: Optional[str] = Field(None, description="Client idempotency token")
    change_direction_statement: str = Field(..., description="New intent, pivot, or changed assumption")
    user_rationale: str = Field(..., description="Reasoning behind changing direction")

def compute_mutation_hash(
    project_id: str,
    checkpoint_id: str,
    expected_version: int,
    operation_type: str,
    resume_data: Dict[str, Any]
) -> str:
    """Computes a canonical SHA-256 hash of the complete mutation identity."""
    canonical_payload = {
        "project_id": project_id,
        "checkpoint_id": checkpoint_id,
        "expected_version": expected_version,
        "operation_type": operation_type,
        "resume_data": resume_data,
    }
    encoded = json.dumps(canonical_payload, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()
