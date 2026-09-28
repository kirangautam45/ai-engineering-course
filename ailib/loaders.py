"""Turn files into clean text, split into pages.

Markdown and text files are one "page"; PDFs keep their real page numbers so answers can say "see page 3".
"""

import io
import logging
import re
from pathlib import Path

from pypdf import PdfReader
from pypdf.errors import PdfReadError

SUPPORTED_TYPES = [".md", ".txt", ".pdf"]

# pypdf prints its own low-level warnings for damaged files; we show a clearer message instead
logging.getLogger("pypdf").setLevel(logging.ERROR)


def clean_text(text: str) -> str:
    """Remove things that waste tokens or confuse the embedding model."""
    text = text.replace("\x00", "")  # null characters from broken PDFs
    text = re.sub(r"[ \t]+", " ", text)  # runs of spaces
    text = re.sub(r"\n{3,}", "\n\n", text)  # runs of blank lines
    return text.strip()


def load_document(name: str, data: bytes) -> list[dict]:
    """name: file name (used to decide the type). data: the file's bytes.

    Returns [{"page": 1, "text": ...}] — pages with no text (e.g. scanned images) are dropped.
    """
    ext = Path(name).suffix.lower()
    if ext not in SUPPORTED_TYPES:
        raise ValueError(f'Unsupported file type "{ext}". Use {", ".join(SUPPORTED_TYPES)}.')

    if ext == ".pdf":
        try:
            reader = PdfReader(io.BytesIO(data))
            pages = [{"page": i + 1, "text": clean_text(page.extract_text() or "")} for i, page in enumerate(reader.pages)]
        except (PdfReadError, ValueError, KeyError, OSError) as error:
            # The PDF library's own errors are technical; give users something they can act on
            raise ValueError(f'Could not read "{name}". The PDF may be damaged or password-protected.') from error
    else:
        pages = [{"page": 1, "text": clean_text(data.decode("utf-8", errors="replace"))}]

    pages = [p for p in pages if p["text"]]
    if not pages:
        raise ValueError(f'No text found in "{name}". Scanned PDFs need OCR first.')
    return pages


def load_file(path: str | Path) -> list[dict]:
    path = Path(path)
    return load_document(path.name, path.read_bytes())
