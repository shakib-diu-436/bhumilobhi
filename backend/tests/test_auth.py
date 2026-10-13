import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite://"
os.environ["AUTH_SECRET_KEY"] = "auth-test-secret-with-at-least-32-characters"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.rate_limit import clear_login_failures
from app.db.session import SessionLocal
from app.main import app
from app.models.user import AuthSession, User

client_ip = "testclient"
valid_account = {
    "display_name": "Land Reviewer",
    "email": "Reviewer@Example.org",
    "password": "ValidPassword123",
}


@pytest.fixture(autouse=True)
def reset_auth_state():
    with SessionLocal() as db:
        db.query(AuthSession).delete()
        db.query(User).delete()
        db.commit()
    clear_login_failures(client_ip)


@pytest.fixture
def api_client():
    with TestClient(app) as test_client:
        yield test_client


def register(api_client: TestClient, email: str | None = None):
    payload = {**valid_account}
    if email:
        payload["email"] = email
    return api_client.post("/api/v1/auth/register", json=payload)


def test_register_normalizes_email_and_never_returns_password_hash(api_client):
    response = register(api_client)

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "reviewer@example.org"
    assert body["user"]["display_name"] == "Land Reviewer"
    assert "password_hash" not in body["user"]
    assert "role" not in body["user"]
    assert api_client.cookies.get("bhumi_refresh")
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == "reviewer@example.org"))
        assert user is not None
        assert user.password_hash != valid_account["password"]
        assert user.password_hash.startswith("$argon2")


def test_registration_rejects_duplicate_normalized_email(api_client):
    assert register(api_client).status_code == 201

    response = register(api_client, "  REVIEWER@example.org ")

    assert response.status_code == 409
    assert response.json()["detail"] == "An account with this email already exists"


def test_registration_rejects_client_supplied_role(api_client):
    response = api_client.post(
        "/api/v1/auth/register",
        json={**valid_account, "role": "admin"},
    )

    assert response.status_code == 422
    with SessionLocal() as db:
        assert db.scalar(select(User).where(User.email == "reviewer@example.org")) is None


@pytest.mark.parametrize(
    "password",
    ["short", "lowercasepassword", "UPPERCASE12345", "NoDigitsPassword"],
)
def test_registration_rejects_weak_passwords(api_client, password):
    payload = {**valid_account, "password": password}

    response = api_client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 422


def test_login_returns_generic_error_and_limits_repeated_failures(api_client):
    payload = {"email": "missing@example.org", "password": "WrongPassword123"}
    for _ in range(5):
        response = api_client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"

    limited = api_client.post("/api/v1/auth/login", json=payload)

    assert limited.status_code == 429
    assert limited.headers["retry-after"] == "900"


def test_login_wrong_password_uses_generic_error(api_client):
    assert register(api_client).status_code == 201

    response = api_client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@example.org", "password": "WrongPassword123"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_me_and_protected_route(api_client):
    assert register(api_client).status_code == 201
    api_client.cookies.clear()

    response = api_client.post(
        "/api/v1/auth/login",
        json={"email": "REVIEWER@example.org", "password": valid_account["password"]},
    )

    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert api_client.get("/api/v1/auth/me", headers=headers).json()["email"] == "reviewer@example.org"
    assert api_client.get("/api/v1/plots/not-found", headers=headers).status_code == 404
    assert api_client.get("/api/v1/plots/not-found").status_code == 401


def test_refresh_rotates_cookie_and_logout_invalidates_access(api_client):
    registered = register(api_client)
    access_token = registered.json()["access_token"]
    original_refresh = api_client.cookies.get("bhumi_refresh")

    refreshed = api_client.post("/api/v1/auth/refresh")

    assert refreshed.status_code == 200
    rotated_refresh = api_client.cookies.get("bhumi_refresh")
    assert rotated_refresh and rotated_refresh != original_refresh
    assert api_client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    ).status_code == 204
    assert api_client.get(
        "/api/v1/plots/not-found",
        headers={"Authorization": f"Bearer {access_token}"},
    ).status_code == 401
    assert api_client.post("/api/v1/auth/refresh").status_code == 401