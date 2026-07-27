import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_session_lifecycle(client: AsyncClient):
    """Test creating, reading, updating, listing, and deleting a session."""
    # 1. Create a session
    payload = {
        "title": "Test Chat Session",
        "system_prompt": "You are a test bot.",
        "provider": "mock",
        "model": "mock-gpt",
        "temperature": 0.5
    }
    response = await client.post("/api/v1/sessions/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["title"] == "Test Chat Session"
    assert data["system_prompt"] == "You are a test bot."
    assert data["provider"] == "mock"
    assert data["model"] == "mock-gpt"
    assert data["temperature"] == 0.5
    session_id = data["id"]

    # 2. Get the created session details
    response = await client.get(f"/api/v1/sessions/{session_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == session_id
    assert data["title"] == "Test Chat Session"

    # 3. List sessions
    response = await client.get("/api/v1/sessions/")
    assert response.status_code == 200
    sessions = response.json()
    assert len(sessions) == 1
    assert sessions[0]["id"] == session_id

    # 4. Update the session title and temperature
    update_payload = {
        "title": "Updated Session Title",
        "temperature": 0.8
    }
    response = await client.patch(f"/api/v1/sessions/{session_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Session Title"
    assert data["temperature"] == 0.8
    assert data["system_prompt"] == "You are a test bot."  # System prompt remains unchanged

    # 5. Delete the session
    response = await client.delete(f"/api/v1/sessions/{session_id}")
    assert response.status_code == 204

    # 6. Verify 404 on deleted session details
    response = await client.get(f"/api/v1/sessions/{session_id}")
    assert response.status_code == 404
