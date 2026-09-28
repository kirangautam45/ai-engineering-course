"""Day 5 — 🛠️ Practice day: a reliable "ask" command-line tool

Run: python run.py day5 --role "a travel guide for Nepal" "Plan one day in Pokhara"
"""

import argparse
import sys

import anthropic

from ailib.ask import ask

# ---- 1. Read options from the command line ---------------------------------
# argparse builds --help and error messages for you
parser = argparse.ArgumentParser(prog="python run.py day5", description="Ask Claude a question.")
parser.add_argument("question", nargs="+", help="your question")
parser.add_argument("--role", default="a helpful assistant", help="who the assistant is")
args = parser.parse_args()
question = " ".join(args.question)

# ---- 2. Call ask() (see ailib/ask.py), and handle every kind of failure ------
try:
    answer = ask(question, system=f"You are {args.role}. Be concise and practical.")
    print(answer)
# Check the most specific error types first
except anthropic.AuthenticationError:
    sys.exit("❌ Your API key is wrong. Check the .env file.")
except anthropic.RateLimitError:
    sys.exit("⏳ Too many requests. Wait a minute and try again.")
except anthropic.BadRequestError as error:
    sys.exit(f"❌ The request was invalid: {error.message}")
except anthropic.APIStatusError as error:
    sys.exit(f"❌ API error {error.status_code}: {error.message}")
except anthropic.APIConnectionError:
    sys.exit("❌ Could not reach the API. Are you online?")
except TypeError as error:
    # The SDK raises this when no API key was found at all
    if "authentication" in str(error):
        sys.exit("❌ No API key found. Copy .env.example to .env and add your key.")
    raise
