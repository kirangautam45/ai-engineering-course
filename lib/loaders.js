// Turn files into clean text, split into pages. Markdown and text files are one "page";
// PDFs keep their real page numbers so answers can say "see page 3".
import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";

export const SUPPORTED_TYPES = [".md", ".txt", ".pdf"];

// Remove things that waste tokens or confuse the embedding model
export function cleanText(text) {
  return text
    .replace(/\u0000/g, "") // null characters from broken PDFs
    .replace(/[ \t]+/g, " ") // runs of spaces
    .replace(/\n{3,}/g, "\n\n") // runs of blank lines
    .trim();
}

// name: file name (used to decide the type). data: the file's bytes (a Buffer).
// Returns [{ page, text }] — pages with no text (e.g. scanned images) are dropped.
export async function loadDocument(name, data) {
  const ext = path.extname(name).toLowerCase();
  if (!SUPPORTED_TYPES.includes(ext)) throw new Error(`Unsupported file type "${ext}". Use ${SUPPORTED_TYPES.join(", ")}.`);

  let pages;
  if (ext === ".pdf") {
    let text;
    try {
      const pdf = await getDocumentProxy(new Uint8Array(data));
      ({ text } = await extractText(pdf, { mergePages: false }));
    } catch {
      // The PDF library's own errors are long and technical; give users something they can act on
      throw new Error(`Could not read "${name}". The PDF may be damaged or password-protected.`);
    }
    pages = text.map((pageText, i) => ({ page: i + 1, text: cleanText(pageText) }));
  } else {
    pages = [{ page: 1, text: cleanText(data.toString("utf8")) }];
  }

  pages = pages.filter((p) => p.text.length > 0);
  if (pages.length === 0) throw new Error(`No text found in "${name}". Scanned PDFs need OCR first.`);
  return pages;
}

export async function loadFile(filePath) {
  return loadDocument(filePath, await readFile(filePath));
}
