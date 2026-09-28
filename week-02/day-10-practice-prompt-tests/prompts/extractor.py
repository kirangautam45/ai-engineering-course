"""Pulls contact details out of a message as structured data."""

from pydantic import BaseModel

NAME = "extractor"
VERSION = 1
EFFORT = "low"

SYSTEM = """Extract the sender's contact details from the message.
Use null for anything that isn't written in the message. Never guess a phone number or email.
Write Nepali mobile numbers as 10 digits with no spaces or dashes."""


class Contact(BaseModel):
    name: str | None
    phone: str | None
    email: str | None


SCHEMA = Contact  # the runner uses structured output (Day 9) when a prompt has a SCHEMA


def build(text: str) -> str:
    return f"<message>\n{text}\n</message>"


TESTS = [
    {
        "input": "Hi, this is Ramesh Thapa, call me on 9841-234-567 about the admission form.",
        "expect": {"name": "Ramesh Thapa", "phone": "9841234567", "email": None},
    },
    {
        "input": "Please reply to anita.k@example.com — Anita",
        "expect": {"name": "Anita", "phone": None, "email": "anita.k@example.com"},
    },
    {
        "input": "Is the hostel still available for this semester?",
        "expect": {"name": None, "phone": None, "email": None},
    },
]


def check(output: Contact, test: dict) -> bool | str:
    """Compare every field of the parsed object."""
    got = output.model_dump()
    wrong = [f"{key}={got[key]!r}" for key, value in test["expect"].items() if got[key] != value]
    return f"wrong: {', '.join(wrong)}" if wrong else True
