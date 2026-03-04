import type { ResourceKind } from "../types.js";

/**
 * Classifies a fetched resource into extraction-friendly categories.
 */
export function classifyResourceKind(contentType: string, url: string): ResourceKind {
  const ct = contentType.toLowerCase();
  const lowerUrl = url.toLowerCase();

  if (ct.includes("text/html") || lowerUrl.endsWith(".html") || lowerUrl.endsWith(".htm")) {
    return "html";
  }

  if (ct.includes("application/pdf") || lowerUrl.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    ct.includes("application/xml") ||
    ct.includes("text/xml") ||
    lowerUrl.endsWith(".xml")
  ) {
    return "xml";
  }

  if (ct.startsWith("text/") || ct.includes("application/json") || lowerUrl.endsWith(".txt")) {
    return "text";
  }

  return "other";
}

/**
 * Checks whether a resource is in the v1 crawlable output set.
 */
export function isTextLikeResource(kind: ResourceKind): boolean {
  return kind === "html" || kind === "pdf" || kind === "xml" || kind === "text";
}
