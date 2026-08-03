import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_user():
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "student1@example.com", "password": "securepassword123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "student1@example.com"
    assert "id" in data
    assert data["is_active"] is True

def test_register_duplicate_user():
    client.post(
        "/api/v1/auth/register",
        json={"email": "dupe@example.com", "password": "password123"}
    )
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "dupe@example.com", "password": "password123"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_and_token():
    client.post(
        "/api/v1/auth/register",
        json={"email": "loginuser@example.com", "password": "mypassword123"}
    )
    
    # Test JSON login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@example.com", "password": "mypassword123"}
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Test OAuth2 form login
    form_resp = client.post(
        "/api/v1/auth/token",
        data={"username": "loginuser@example.com", "password": "mypassword123"}
    )
    assert form_resp.status_code == 200
    assert "access_token" in form_resp.json()

def test_read_me():
    client.post(
        "/api/v1/auth/register",
        json={"email": "meuser@example.com", "password": "mypassword123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "meuser@example.com", "password": "mypassword123"}
    )
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "meuser@example.com"

def test_multi_tenant_session_scoping():
    # Register User A
    client.post("/api/v1/auth/register", json={"email": "userA@example.com", "password": "passA"})
    tokA = client.post("/api/v1/auth/login", json={"email": "userA@example.com", "password": "passA"}).json()["access_token"]

    # Register User B
    client.post("/api/v1/auth/register", json={"email": "userB@example.com", "password": "passB"})
    tokB = client.post("/api/v1/auth/login", json={"email": "userB@example.com", "password": "passB"}).json()["access_token"]

    # User A creates a session
    sessA = client.post(
        "/api/v1/sessions/",
        json={"title": "User A Private Goal", "provider": "mock", "model": "mock-gpt"},
        headers={"Authorization": f"Bearer {tokA}"}
    ).json()

    # User B lists sessions
    listB = client.get(
        "/api/v1/sessions/",
        headers={"Authorization": f"Bearer {tokB}"}
    ).json()

    # User B should NOT see User A's session
    session_ids_B = [s["id"] for s in listB]
    assert sessA["id"] not in session_ids_B

    # User B attempting to GET User A's session directly returns 404
    get_resp = client.get(
        f"/api/v1/sessions/{sessA['id']}",
        headers={"Authorization": f"Bearer {tokB}"}
    )
    assert get_resp.status_code == 404
