import type { ExtractedContent } from "../types.js";

/**
 * Normalizes plain text resources into crawler extraction format.
 */
export function extractFromText(textInput: string): ExtractedContent {
  const text = textInput.replace(/\s+/g, " ").trim();

  return {
    title: undefined,
    text,
    discoveredLinks: [],
    textLength: text.length,
  };
}
