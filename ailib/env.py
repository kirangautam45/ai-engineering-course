"""Loads the .env file in the folder you run the command from (the repo root). Import it first."""

from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path.cwd() / ".env")
