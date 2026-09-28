"""Connects to MongoDB with PyMongo. Used from Week 5 onward."""

import os
import sys
import time

from pymongo import MongoClient

import ailib.env  # noqa: F401 — loads .env

if not os.getenv("MONGODB_URI"):
    sys.exit("Add MONGODB_URI to your .env file first (see .env.example).")

mongo = MongoClient(os.environ["MONGODB_URI"])
db = mongo.get_default_database("ai-course")  # the database named in MONGODB_URI


def wait_for_search_index(collection, name: str) -> None:
    """Search indexes are built in the background. Wait until this one can be queried."""
    for attempt in range(60):
        index = next(iter(collection.list_search_indexes(name)), None)
        if index and index.get("queryable"):
            return
        if attempt == 0:
            print(f'Waiting for the "{name}" index to be ready...')
        time.sleep(2)
    raise TimeoutError(f'The "{name}" index is still not ready after 2 minutes. Check it in the Atlas UI.')
