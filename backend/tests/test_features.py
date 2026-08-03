import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_projects_crud():
    # Register and login User
    client.post("/api/v1/auth/register", json={"email": "projuser@example.com", "password": "password123"})
    token = client.post("/api/v1/auth/login", json={"email": "projuser@example.com", "password": "password123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Project
    create_resp = client.post(
        "/api/v1/projects/",
        json={
            "title": "Machine Learning Agent",
            "description": "Custom agentic RAG workflow",
            "domain": "Artificial Intelligence",
            "project_type": "Mixed",
            "blueprint_data": '{"phases": ["Phase 1: Concepts", "Phase 2: Build"]}'
        },
        headers=headers
    )
    assert create_resp.status_code == 201
    proj_id = create_resp.json()["id"]

    # 2. List Projects
    list_resp = client.get("/api/v1/projects/", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["id"] == proj_id

    # 3. Get Project Detail
    get_resp = client.get(f"/api/v1/projects/{proj_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["domain"] == "Artificial Intelligence"

    # 4. Patch Project
    patch_resp = client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"status": "completed"},
        headers=headers
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "completed"

    # 5. Delete Project
    del_resp = client.delete(f"/api/v1/projects/{proj_id}", headers=headers)
    assert del_resp.status_code == 204

def test_knowledge_crud():
    headers = {"Authorization": "Bearer fake_token"}

    # 1. Create Knowledge Card
    create_resp = client.post(
        "/api/v1/knowledge/",
        json={
            "title": "Gradient Descent",
            "content": "An optimization algorithm used to minimize loss functions.",
            "tags": "ML, Optimization",
            "mastery_score": 0.85
        }
    )
    assert create_resp.status_code == 201
    item_id = create_resp.json()["id"]

    # 2. List Knowledge Cards
    list_resp = client.get("/api/v1/knowledge/")
    assert list_resp.status_code == 200
    assert any(k["id"] == item_id for k in list_resp.json())

    # 3. Delete Knowledge Card
    del_resp = client.delete(f"/api/v1/knowledge/{item_id}")
    assert del_resp.status_code == 204

def test_tasks_crud():
    # 1. Create Task
    create_resp = client.post(
        "/api/v1/tasks/",
        json={"title": "Review Partial Derivatives", "priority": "high"}
    )
    assert create_resp.status_code == 201
    task_id = create_resp.json()["id"]

    # 2. Update Task to Completed
    patch_resp = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"completed": True}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["completed"] is True

    # 3. Delete Task
    del_resp = client.delete(f"/api/v1/tasks/{task_id}")
    assert del_resp.status_code == 204
