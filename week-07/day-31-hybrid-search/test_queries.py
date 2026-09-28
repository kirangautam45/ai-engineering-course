"""Retrieval test set for Week 7. Each query lists the lesson folder(s) that answer it.

"exact" queries use specific names and codes; "meaning" queries use different words than the lessons.
"""

TEST_QUERIES = [
    {"type": "exact", "query": "is_error", "expect": ["day-16", "day-17"]},
    {"type": "exact", "query": "numCandidates", "expect": ["day-24"]},
    {"type": "exact", "query": "citations_delta", "expect": ["day-30"]},
    {"type": "exact", "query": "HISTORY_LIMIT", "expect": ["day-13"]},
    {"type": "exact", "query": "max_iterations", "expect": ["day-18"]},
    {"type": "exact", "query": "Open-Meteo", "expect": ["day-17"]},
    {"type": "exact", "query": "pypdf", "expect": ["day-27"]},
    {"type": "exact", "query": "413 body too large", "expect": ["day-11"]},
    {"type": "meaning", "query": "stop paying for tokens when the user leaves the page", "expect": ["day-12", "day-13"]},
    {"type": "meaning", "query": "an email tried to trick the assistant into leaking the inbox", "expect": ["day-19"]},
    {"type": "meaning", "query": "splitting long documents into smaller pieces", "expect": ["day-23"]},
    {"type": "meaning", "query": "search that works in both English and Nepali", "expect": ["day-21"]},
    {"type": "meaning", "query": "ask the user before creating a support ticket", "expect": ["day-20"]},
    {"type": "meaning", "query": "files that did not change are skipped", "expect": ["day-27"]},
    {"type": "meaning", "query": "quote the exact sentence an answer came from", "expect": ["day-29"]},
    {"type": "meaning", "query": "the assistant should admit when the documents lack the answer", "expect": ["day-28"]},
]
