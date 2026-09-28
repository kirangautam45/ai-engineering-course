"""Run a lesson by its day number.

    python run.py day1 "Explain what an API is in one sentence"
    python run.py day10 classifier
    python run.py list                 (show every lesson)
"""

import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).parent

# Shortcuts that aren't "dayN"
ALIASES = {
    "day25:samples": ROOT / "week-05/day-25-practice-semantic-notes/load_samples.py",
}


def find_script(day: int) -> Path | None:
    """week-XX/day-NN-something/ → main.py, or solution/main.py for practice days."""
    for folder in sorted(ROOT.glob(f"week-*/day-{day:02d}-*")):
        for candidate in (folder / "main.py", folder / "solution" / "main.py"):
            if candidate.exists():
                return candidate
    return None


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        return
    name, args = sys.argv[1], sys.argv[2:]

    if name == "list":
        for day in range(1, 46):
            script = find_script(day)
            if script:
                print(f"day{day:<3} {script.relative_to(ROOT)}")
        return

    script = ALIASES.get(name)
    if script is None and name.startswith("day") and name[3:].isdigit():
        script = find_script(int(name[3:]))
    if script is None:
        sys.exit(f"No lesson called '{name}'. Try: python run.py list")

    # Run the lesson as if you'd typed `python <script> <args>`, from the repo root
    sys.argv = [str(script), *args]
    runpy.run_path(str(script), run_name="__main__")


if __name__ == "__main__":
    main()
