"""Day 27 — The ingestion pipeline: files → text → chunks → embeddings → database

Run: python run.py day27                    (ingests this course's lessons: week-*/ folders)
     python run.py day27 ./my-documents     (ingests every .md, .txt and .pdf in a folder)
"""

import sys
import time
from pathlib import Path

from ailib.loaders import SUPPORTED_TYPES, load_file
from ailib.mongo import mongo
from ailib.vector_store import ensure_index, list_documents, remove_document, upsert_document

folders = [Path(f) for f in sys.argv[1:]]

# 1. Find the files. The "source" name is the path relative to where you run the command.
if folders:
    files = sorted(f for folder in folders for f in folder.rglob("*")
                   if f.suffix.lower() in SUPPORTED_TYPES and ".venv" not in f.parts and "node_modules" not in f.parts)
else:
    files = sorted(Path(".").glob("week-*/**/*.md"))
print(f"Found {len(files)} files.\n")

ensure_index()
counts = {"added": 0, "updated": 0, "unchanged": 0, "failed": 0, "removed": 0}
started = time.perf_counter()

# 2. Load, clean, chunk, embed and save each file. Unchanged files are skipped (see ailib/vector_store.py).
for file in files:
    try:
        result = upsert_document(str(file), load_file(file))
        counts[result] += 1
        if result != "unchanged":
            print(f"  {'➕' if result == 'added' else '🔄'} {file}")
    except ValueError as error:
        # One bad file shouldn't stop the whole run
        counts["failed"] += 1
        print(f"  ❌ {file}: {error}")

# 3. Remove documents whose files were deleted, but only inside the folders we just scanned
scanned = {str(f) for f in files}


def in_scope(source: str) -> bool:
    if folders:
        return any(Path(source).is_relative_to(folder) for folder in folders)
    return source.startswith("week-")


for doc in list_documents():
    if in_scope(doc["source"]) and doc["source"] not in scanned:
        remove_document(doc["source"])
        counts["removed"] += 1
        print(f"  🗑️  {doc['source']}")

print(
    f"\nDone in {time.perf_counter() - started:.1f}s: {counts['added']} added, {counts['updated']} updated, "
    f"{counts['unchanged']} unchanged, {counts['removed']} removed, {counts['failed']} failed."
)
mongo.close()
