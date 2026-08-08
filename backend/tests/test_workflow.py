import pytest
from httpx import AsyncClient
from app.schemas.workflow import (
    WorkflowStartRequest,
    WorkflowResumeRequest,
    WorkflowEvolveRequest,
    TaskStatus,
    InteractionStatus,
    InteractionType
)
from app.services.workflow_engine import AIProposalEngine, WorkflowStateMachine

@pytest.mark.asyncio
async def test_multi_domain_intent_decomposition():
    # 1. Learning
    learning_decomp = AIProposalEngine.propose_intent_decomposition("I want to learn quantum mechanics from scratch")
    assert learning_decomp["domain"] == "Conceptual Learning"
    assert len(learning_decomp["phases"]) >= 3
    assert learning_decomp["active_interaction"] is not None

    # 2. Belief / Inquiry
    belief_decomp = AIProposalEngine.propose_intent_decomposition("I believe social media is always harmful. Help me investigate.")
    assert belief_decomp["domain"] == "Belief & Inquiry Investigation"
    assert len(belief_decomp["phases"]) >= 3

    # 3. Creative / Curatorial
    art_decomp = AIProposalEngine.propose_intent_decomposition("I want to curate an art gallery exhibition")
    assert art_decomp["domain"] == "Creative & Curatorial Project"

    # 4. Content Creation
    content_decomp = AIProposalEngine.propose_intent_decomposition("Write a LinkedIn post about building my startup")
    assert content_decomp["domain"] == "Content & Narrative Creation"

    # 5. Technical / Building
    tech_decomp = AIProposalEngine.propose_intent_decomposition("Build an automated RAG vector search engine")
    assert tech_decomp["domain"] == "Technical & Project Execution"

@pytest.mark.asyncio
async def test_full_workflow_lifecycle_and_stepper_progression(client: AsyncClient):
    # 1. Create a project
    proj_resp = await client.post("/api/v1/projects/", json={
        "title": "Quantum Mechanics Study",
        "description": "Master quantum physics from first principles",
        "domain": "Physics",
        "project_type": "Learning"
    })
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    # 2. Start Workflow
    start_resp = await client.post(f"/api/v1/projects/{project_id}/workflow/start", json={
        "intention": "I want to learn quantum mechanics from scratch",
        "context_notes": "Strong math background"
    })
    assert start_resp.status_code == 200
    state = start_resp.json()
    assert state["workflow_version"] == 1
    assert state["plan_version"] == 1
    assert state["active_interaction"] is not None
    active_int_id = state["active_interaction"]["interaction_id"]

    # 3. Resolve Active Interaction (Choice)
    resume_payload = {
        "checkpoint_id": active_int_id,
        "expected_version": 1,
        "idempotency_key": "key_step_1",
        "resume_data": {
            "selected_option": "Intermediate (Understand core principles, need formal depth)"
        }
    }
    resume_resp = await client.post(f"/api/v1/projects/{project_id}/workflow/resume", json=resume_payload)
    assert resume_resp.status_code == 200
    res_data = resume_resp.json()
    assert res_data["transition"]["workflow_version_before"] == 1
    assert res_data["transition"]["workflow_version_after"] == 2
    updated_wf = res_data["workflow"]
    assert updated_wf["workflow_version"] == 2

    # 4. Canonical Idempotency Check: Re-send identical request -> Safe 200 OK cached replay
    idempotent_resp = await client.post(f"/api/v1/projects/{project_id}/workflow/resume", json=resume_payload)
    assert idempotent_resp.status_code == 200
    assert idempotent_resp.json()["transition"]["workflow_version_after"] == 2

    # 5. Idempotency Key Collision with differing data -> 422 Unprocessable Entity
    conflict_payload = dict(resume_payload)
    conflict_payload["resume_data"] = {"selected_option": "Advanced"}
    collision_resp = await client.post(f"/api/v1/projects/{project_id}/workflow/resume", json=conflict_payload)
    assert collision_resp.status_code == 422

    # 6. Two-Phase Optimistic Lock Conflict (409)
    stale_payload = {
        "checkpoint_id": updated_wf["active_interaction"]["interaction_id"],
        "expected_version": 1,  # Stale version! Current is 2
        "idempotency_key": "key_stale",
        "resume_data": {
            "answers": {"q1": "Yes"}
        }
    }
    stale_resp = await client.post(f"/api/v1/projects/{project_id}/workflow/resume", json=stale_payload)
    assert stale_resp.status_code == 409

    # 7. Evolve Workflow / Change Direction -> Preserves completed history, creates plan_version=2
    evolve_payload = {
        "expected_version": 2,
        "change_direction_statement": "Shift focus to quantum computing qubits instead of wave mechanics",
        "user_rationale": "My goal is specifically building quantum quantum simulation algorithms"
    }
    evolve_resp = await client.post(f"/api/v1/projects/{project_id}/workflow/evolve", json=evolve_payload)
    assert evolve_resp.status_code == 200
    evolved_wf = evolve_resp.json()["workflow"]
    assert evolved_wf["workflow_version"] == 3
    assert evolved_wf["plan_version"] == 2

    # 8. Malformed Typed Resume Payload -> 422 Unprocessable Entity
    active_int_id_2 = evolved_wf["active_interaction"]["interaction_id"]
    invalid_type_payload = {
        "checkpoint_id": active_int_id_2,
        "expected_version": 3,
        "idempotency_key": "key_invalid_data",
        "resume_data": {
            # Active interaction is REVIEW, which expects 'accepted: bool'
            "completely_wrong_key": 123
        }
    }
    invalid_resp = await client.post(f"/api/v1/projects/{project_id}/workflow/resume", json=invalid_type_payload)
    assert invalid_resp.status_code == 422

    # 9. Non-active / Inactive checkpoint rejection -> 409 Conflict
    inactive_payload = {
        "checkpoint_id": "cp_non_existent_or_future",
        "expected_version": 3,
        "idempotency_key": "key_inactive",
        "resume_data": {
            "accepted": True
        }
    }
    inactive_resp = await client.post(f"/api/v1/projects/{project_id}/workflow/resume", json=inactive_payload)
    assert inactive_resp.status_code == 409

