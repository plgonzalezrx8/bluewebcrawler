import type { ExtractedContent } from "../types.js";

/**
 * Heuristics that decide whether HTML likely needs browser rendering.
 */
export function shouldEscalateToBrowser(params: {
  html: string;
  extracted: ExtractedContent;
  status: number;
}): boolean {
  const lowerHtml = params.html.toLowerCase();

  const spaMarkers = [
    "id=\"root\"",
    "id=\"app\"",
    "__next",
    "data-reactroot",
    "hydration",
    "window.__nuxt",
    "type=\"module\"",
    "application/json\" id=\"__next_data__",
  ];

  const hasSpaMarker = spaMarkers.some((marker) => lowerHtml.includes(marker));
  const scriptCount = params.extracted.scriptCount ?? 0;
  const lowText = params.extracted.textLength < 200;
  const scriptHeavy = scriptCount >= 8;
  const statusLooksRecoverable = params.status >= 200 && params.status < 400;

  return statusLooksRecoverable && (hasSpaMarker || (lowText && scriptHeavy));
}
