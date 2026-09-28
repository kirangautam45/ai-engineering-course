// Split long documents into small chunks that an embedding model can read in full.
// Every chunk keeps metadata (where it came from) so search results can point to the source.

// Strategy 1: fixed size. Cut every `size` words, repeating `overlap` words between
// neighbouring chunks so a sentence cut in half still appears whole in one of them.
export function chunkBySize(text, { size = 80, overlap = 20 } = {}) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let start = 0; start < words.length; start += size - overlap) {
    chunks.push(words.slice(start, start + size).join(" "));
    if (start + size >= words.length) break;
  }
  return chunks.map((text) => ({ text }));
}

// Strategy 2: follow the document's structure. Split Markdown at headings, so each chunk
// is about one topic, then split any section that's still too long by size.
// Each chunk starts with its heading, which gives the embedding useful context.
export function chunkByHeadings(markdown, { size = 80, overlap = 20 } = {}) {
  const sections = markdown.split(/\n(?=#{1,3} )/);
  const chunks = [];
  for (const section of sections) {
    const heading = section.match(/^#{1,3} (.+)/)?.[1] ?? "";
    const body = section.replace(/^#{1,3} .+\n?/, "").trim();
    if (!body) continue;
    for (const { text } of chunkBySize(body, { size, overlap })) {
      chunks.push({ heading, text: heading ? `${heading}: ${text}` : text });
    }
  }
  return chunks;
}
