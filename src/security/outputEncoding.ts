import type { CrawlConfig } from "../types.js";

const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const BIDI_CONTROL_REGEX = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const COMBINING_MARK_REGEX = /[\u0300-\u036F]/g;

/**
 * Characters that have common ASCII equivalents for transliteration mode.
 */
const ASCII_PUNCTUATION_MAP: Record<string, string> = {
  "–": "-",
  "—": "-",
  "−": "-",
  "“": '"',
  "”": '"',
  "„": '"',
  "’": "'",
  "‘": "'",
  "•": "*",
  "…": "...",
  "«": '"',
  "»": '"',
};

/**
 * Applies normalization and output-encoding hardening for untrusted text fields.
 */
export function sanitizeOutputText(
  value: string,
  config: CrawlConfig["security"]["outputEncoding"],
): string {
  let text = value.normalize(config.normalize);

  if (config.stripControlChars) {
    text = text.replace(CONTROL_CHAR_REGEX, "");
  }

  if (config.stripBidiControls) {
    text = text.replace(BIDI_CONTROL_REGEX, "");
  }

  if (config.mode === "utf8") {
    return text;
  }

  if (config.mode === "ascii-strip") {
    return text.replace(/[^\x00-\x7F]/g, "");
  }

  if (config.mode === "ascii-transliterate") {
    return toAsciiTransliteration(text);
  }

  return toAsciiEscapes(text);
}

/**
 * Produces ASCII text with escaped non-ASCII code units.
 */
function toAsciiEscapes(text: string): string {
  let output = "";

  for (let i = 0; i < text.length; i += 1) {
    const codeUnit = text.charCodeAt(i);

    if (codeUnit <= 0x7f) {
      output += text[i];
      continue;
    }

    // Preserve surrogate pairs as two explicit \uXXXX sequences.
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff && i + 1 < text.length) {
      const low = text.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        output += toUnicodeEscape(codeUnit);
        output += toUnicodeEscape(low);
        i += 1;
        continue;
      }
    }

    output += toUnicodeEscape(codeUnit);
  }

  return output;
}

/**
 * Best-effort human-readable ASCII transliteration.
 */
function toAsciiTransliteration(text: string): string {
  const mapped = [...text]
    .map((char) => ASCII_PUNCTUATION_MAP[char] ?? char)
    .join("")
    .normalize("NFKD")
    .replace(COMBINING_MARK_REGEX, "");

  // Replace residual non-ASCII symbols with a stable placeholder.
  return mapped.replace(/[^\x00-\x7F]/g, "?");
}

/**
 * Converts one UTF-16 code unit into a fixed-width \uXXXX escape.
 */
function toUnicodeEscape(codeUnit: number): string {
  return `\\u${codeUnit.toString(16).toUpperCase().padStart(4, "0")}`;
}
