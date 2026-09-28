"""Your capstone's eval set. Copy this into your project and write the questions BEFORE the code.

Same format as week-08/eval_set.py, so you can reuse week-08/checks.py and week-08/judge.py.
"""

EVAL_SET = [
    {
        "id": "fee-deadline",  # short and unique
        "type": "answerable",
        "question": "When is the last day to pay the semester fee?",
        "sources": ["fee-notice.pdf"],  # which document(s) answer it
        "must_mention": ["Magh 15"],  # facts a correct answer must contain; ["a", "b"] inside means either
        "reference": "The fee must be paid by Magh 15; after that a fine of Rs 500 per week applies.",
    },
    {
        "id": "parking",
        "type": "unanswerable",  # your documents DON'T answer this: the right reply is "I don't know"
        "question": "Where can I park my scooter?",
    },
    # Write at least 10: 7 answerable (including hard ones), 3 unanswerable.
    # Include: a question in Nepali, a vague question, a question needing two documents, a typo.
]
