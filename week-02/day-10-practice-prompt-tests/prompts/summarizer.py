"""Summarizes a notice into one short sentence for an SMS alert."""

NAME = "summarizer"
VERSION = 1
EFFORT = "low"

SYSTEM = """You write one-sentence SMS alerts for college students.
The sentence must be at most 20 words, because SMS space is limited.
Always keep dates, times and places exactly as written, because students act on them.
Reply with the sentence only."""


def build(text: str) -> str:
    return f"<notice>\n{text}\n</notice>"


TESTS = [
    {
        "input": """Dear students, due to the public holiday the mid-term exam of Computer Networks
scheduled for Sunday has been postponed. The new date is Tuesday, 10 AM, in Hall B.
All other exams remain unchanged. — Exam Section""",
        "must_include": ["Tuesday", "10", "Hall B"],
    },
    {
        "input": """The library will stay open until 9 PM every day from next week to help students
prepare for the board exams. Please carry your ID card after 6 PM.""",
        "must_include": ["9 PM", "ID"],
    },
    {
        "input": """Registration for the inter-college hackathon closes on Friday at midnight.
Teams of 2 to 4 can register at the IT department office, room 204.""",
        "must_include": ["Friday", "204"],
    },
]


def check(output: str, test: dict) -> bool | str:
    words = len(output.split())
    missing = [text for text in test["must_include"] if text not in output]
    if words > 20:
        return f"too long ({words} words)"
    if missing:
        return f"missing: {', '.join(missing)}"
    return True
