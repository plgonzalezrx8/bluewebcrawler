import { createHash } from "node:crypto";
import type { CrawlConfig } from "../types.js";

const TRACKING_KEYS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
]);

const NON_PAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".webp",
  ".avif",
  ".ico",
  ".mp4",
  ".webm",
  ".mov",
  ".avi",
  ".mp3",
  ".wav",
  ".zip",
  ".tar",
  ".gz",
  ".rar",
  ".7z",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".css",
  ".js",
  ".mjs",
  ".map",
]);

/**
 * Normalizes a URL according to query policy, host canonicalization, and fragment removal.
 */
export function normalizeUrl(urlLike: string, config: Pick<CrawlConfig, "queryPolicy" | "queryAllowlist">): string {
  const url = new URL(urlLike);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  if (config.queryPolicy === "drop") {
    url.search = "";
  }

  if (config.queryPolicy === "allowlist") {
    const search = new URLSearchParams(url.search);
    const allow = new Set(config.queryAllowlist);
    const filtered = new URLSearchParams();

    for (const [key, value] of search.entries()) {
      if (allow.has(key)) {
        filtered.append(key, value);
      }
    }

    url.search = filtered.toString();
  }

  if (config.queryPolicy === "keep") {
    const current = new URLSearchParams(url.search);
    const sorted = [...current.entries()].sort(([a], [b]) => a.localeCompare(b));
    const stable = new URLSearchParams();

    for (const [key, value] of sorted) {
      if (!TRACKING_KEYS.has(key.toLowerCase())) {
        stable.append(key, value);
      }
    }

    url.search = stable.toString();
  }

  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

/**
 * Returns true for links that are plausible crawl targets for page discovery.
 */
export function isCrawlableHref(href: string): boolean {
  const lower = href.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("data:")
  ) {
    return false;
  }

  const queryIndex = href.indexOf("?");
  const cleanHref = queryIndex > -1 ? href.slice(0, queryIndex) : href;
  const lastSlash = cleanHref.lastIndexOf("/");
  const tail = lastSlash >= 0 ? cleanHref.slice(lastSlash) : cleanHref;

  for (const extension of NON_PAGE_EXTENSIONS) {
    if (tail.toLowerCase().endsWith(extension)) {
      return false;
    }
  }

  return true;
}

/**
 * Generates a deterministic markdown filename for a URL.
 */
export function urlToSlug(url: string): string {
  const parsed = new URL(url);
  const raw = `${parsed.hostname}${parsed.pathname}${parsed.search}`
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  const base = raw.length > 0 ? raw.slice(0, 80) : "page";
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 10);
  return `${base}-${hash}`;
}
