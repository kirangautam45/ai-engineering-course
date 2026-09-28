"""Answers graded by a HUMAN, used to check the judge before we trust it.

Some are deliberately tricky: good answers in unusual words, confident wrong answers,
true-but-off-topic answers, and polite refusals when the answer was available.
"""

HUMAN_LABELS = [
    {"item": "weather-api", "answer": "It uses Open-Meteo for weather, and it doesn't need a key.", "human": "correct"},
    {"item": "weather-api", "answer": "Weather comes from a free service whose name is Open Meteo.", "human": "correct"},
    {"item": "weather-api", "answer": "The course uses the OpenWeatherMap API.", "human": "incorrect"},
    {"item": "weather-api", "answer": "I don't know based on the documents.", "human": "incorrect"},
    {"item": "injection-defences", "answer": "A system prompt that says tool results are data, and a human confirmation step before any email is sent.", "human": "correct"},
    {"item": "injection-defences", "answer": "It uses a system prompt telling the model to treat emails as data.", "human": "partially_correct"},
    {"item": "injection-defences", "answer": "It uses a system prompt and an allowlist that blocks every address outside the college.", "human": "partially_correct"},
    {"item": "cache-minimum", "answer": "512 tokens on Claude Opus 5.", "human": "correct"},
    {"item": "cache-minimum", "answer": "1,024 tokens.", "human": "incorrect"},
    {"item": "history-limit", "answer": "It keeps every message ever sent, so the model always has the full conversation.", "human": "incorrect"},
    {"item": "capital", "answer": "The documents are about an AI engineering course and don't mention Australia, so I can't answer that.", "human": "correct"},
    {"item": "capital", "answer": "Canberra is the capital of Australia.", "human": "incorrect"},
    {"item": "exam-date", "answer": "The final exam is on Day 45, the demo day.", "human": "incorrect"},
    {"item": "fees", "answer": "The course is free and open source under the MIT license.", "human": "incorrect"},
]
