import type { ExtractedContent } from "../types.js";

/**
 * Extracts human-readable text from XML by removing tags and compacting whitespace.
 */
export function extractFromXml(xml: string): ExtractedContent {
  const titleMatch = xml.match(/<title>(.*?)<\/title>/i);
  const text = xml
    .replace(/<\?xml.*?\?>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: titleMatch?.[1]?.trim(),
    text,
    discoveredLinks: [],
    textLength: text.length,
  };
}
