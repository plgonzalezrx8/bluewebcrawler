import { load } from "cheerio";
import type { ExtractedContent } from "../types.js";

/**
 * Extracts title and cleaned body text from an HTML document.
 */
export function extractFromHtml(html: string): ExtractedContent {
  const $ = load(html);

  // Remove non-content nodes before collecting text.
  $("script,style,noscript,template,svg,canvas").remove();

  const title = $("title").first().text().trim() || undefined;
  const text = $("body").text().replace(/\s+/g, " ").trim();

  return {
    title,
    text,
    discoveredLinks: [],
    scriptCount: load(html)("script").length,
    textLength: text.length,
  };
}
