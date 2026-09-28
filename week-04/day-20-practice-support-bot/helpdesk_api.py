"""A small client for the Helpdesk API from the MERN course
(https://github.com/kirangautam45/Saptagandaki-MERN-Stack/tree/main/helpdesk-api).

It knows nothing about AI: it just logs in and calls the REST endpoints.
"""

import os

import httpx

BASE_URL = os.getenv("HELPDESK_URL", "http://localhost:5002")
_token: str | None = None


def _call(path: str, method: str = "GET", body: dict | None = None):
    headers = {"Authorization": f"Bearer {_token}"} if _token else {}
    try:
        response = httpx.request(method, f"{BASE_URL}{path}", json=body, headers=headers, timeout=10)
    except httpx.HTTPError as error:
        raise ConnectionError(f"Can't reach the Helpdesk API at {BASE_URL}. Is it running?") from error
    data = response.json() if response.content else {}
    if response.is_error:
        raise ValueError(data.get("message") or f"Helpdesk API returned {response.status_code}")
    return data


def login() -> dict:
    """Log in once with the test account from .env. The token stays here, in our code,
    and is never shown to the model."""
    global _token
    email, password = os.getenv("HELPDESK_EMAIL"), os.getenv("HELPDESK_PASSWORD")
    if not email or not password:
        raise ValueError("Add HELPDESK_EMAIL and HELPDESK_PASSWORD to your .env file.")
    data = _call("/api/auth/login", "POST", {"email": email, "password": password})
    _token = data["token"]
    return data["user"]


def list_tickets() -> list[dict]:
    return _call("/api/tickets")


def get_ticket(ticket_id: str) -> dict:
    return _call(f"/api/tickets/{ticket_id}")


def create_ticket(title: str, description: str) -> dict:
    return _call("/api/tickets", "POST", {"title": title, "description": description})


def update_ticket_status(ticket_id: str, status: str) -> dict:
    return _call(f"/api/tickets/{ticket_id}", "PUT", {"status": status})
