"""Split long documents into chunks that an embedding model can read in full.

Every chunk keeps metadata (where it came from) so search results can point to the source.
"""

import re


def chunk_by_size(text: str, size: int = 80, overlap: int = 20) -> list[dict]:
    """Strategy 1: fixed size. Cut every `size` words, repeating `overlap` words between
    neighbouring chunks so a sentence cut in half still appears whole in one of them."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        chunks.append({"text": " ".join(words[start : start + size])})
        if start + size >= len(words):
            break
        start += size - overlap
    return chunks


def chunk_by_headings(markdown: str, size: int = 80, overlap: int = 20) -> list[dict]:
    """Strategy 2: follow the document's structure. Split Markdown at headings, so each chunk
    is about one topic, then split any section that's still too long by size.
    Each chunk starts with its heading, which gives the embedding useful context."""
    chunks = []
    for section in re.split(r"\n(?=#{1,3} )", markdown):
        match = re.match(r"#{1,3} (.+)", section)
        heading = match.group(1) if match else ""
        body = re.sub(r"^#{1,3} .+\n?", "", section).strip()
        if not body:
            continue
        for chunk in chunk_by_size(body, size, overlap):
            chunks.append({"heading": heading, "text": f"{heading}: {chunk['text']}" if heading else chunk["text"]})
    return chunks
