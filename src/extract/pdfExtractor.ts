import pdfParse from "pdf-parse";
import type { ExtractedContent } from "../types.js";

/**
 * Extracts plain text from a PDF buffer.
 */
export async function extractFromPdf(buffer: Buffer): Promise<ExtractedContent> {
  const parsed = await pdfParse(buffer);
  const text = parsed.text.replace(/\s+/g, " ").trim();

  return {
    title: parsed.info?.Title || undefined,
    text,
    discoveredLinks: [],
    textLength: text.length,
  };
}
