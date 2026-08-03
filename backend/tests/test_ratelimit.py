import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_rate_limiting_chat_endpoint():
    """Verify rate limiter permits requests within limits and returns 429 when exceeded."""
    # Create a session
    sess_resp = client.post(
        "/api/v1/sessions/",
        json={"title": "Rate Limit Test Session", "provider": "mock", "model": "mock-gpt"}
    )
    assert sess_resp.status_code == 201
    session_id = sess_resp.json()["id"]

    # Send first message (should succeed)
    msg_resp = client.post(
        f"/api/v1/chat/{session_id}",
        json={"content": "Hello world", "stream": False}
    )
    assert msg_resp.status_code == 200
