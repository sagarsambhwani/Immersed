import json
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_chat_sync(client: AsyncClient):
    """Test sending a message synchronously (stream=False)."""
    # 1. Create a session
    sess_resp = await client.post(
        "/api/v1/sessions/", 
        json={"provider": "mock", "model": "mock-gpt"}
    )
    session_id = sess_resp.json()["id"]

    # 2. Send a message
    chat_payload = {
        "content": "Hello chatbot!",
        "stream": False
    }
    response = await client.post(f"/api/v1/chat/{session_id}", json=chat_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "assistant"
    assert "mock" in data["content"].lower()
    assert "hello chatbot!" in data["content"].lower()

    # 3. Verify history has 2 messages (user, assistant)
    history_resp = await client.get(f"/api/v1/chat/{session_id}/history")
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history) == 2
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "Hello chatbot!"
    assert history[1]["role"] == "assistant"

@pytest.mark.asyncio
async def test_chat_streaming(client: AsyncClient):
    """Test sending a message with streaming enabled (stream=True)."""
    # 1. Create a session
    sess_resp = await client.post(
        "/api/v1/sessions/", 
        json={"provider": "mock", "model": "mock-gpt"}
    )
    session_id = sess_resp.json()["id"]

    # 2. Send a message with streaming
    chat_payload = {
        "content": "Hello streaming bot!",
        "stream": True
    }
    
    # Use client.stream for SSE processing
    async with client.stream("POST", f"/api/v1/chat/{session_id}", json=chat_payload) as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        
        chunks = []
        async for line in response.aiter_lines():
            if line.startswith("data:"):
                data_json = json.loads(line[5:].strip())
                if "content" in data_json:
                    chunks.append(data_json["content"])
                elif "error" in data_json:
                    pytest.fail(f"Received error in SSE stream: {data_json['error']}")
        
        assert len(chunks) > 0
        full_text = "".join(chunks)
        assert "mock" in full_text.lower()
        assert "hello streaming bot!" in full_text.lower()

    # 3. Verify history is updated.
    # Note: Stream generator has a finally block that writes to the database.
    # By exiting the 'async with client.stream' scope, the generator will have run to completion.
    history_resp = await client.get(f"/api/v1/chat/{session_id}/history")
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history) == 2
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "Hello streaming bot!"
    assert history[1]["role"] == "assistant"
    assert history[1]["content"] == full_text
