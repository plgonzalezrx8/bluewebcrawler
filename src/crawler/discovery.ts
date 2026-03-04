import { load } from "cheerio";
import type { CrawlConfig } from "../types.js";
import { isUrlInScope } from "./scope.js";
import { isCrawlableHref, normalizeUrl } from "../utils/url.js";

/**
 * Extracts in-scope crawlable links from an HTML document.
 */
export function discoverLinksFromHtml(params: {
  html: string;
  baseUrl: string;
  seedUrl: string;
  config: Pick<CrawlConfig, "includeSubdomains" | "queryPolicy" | "queryAllowlist">;
}): string[] {
  const $ = load(params.html);
  const seed = new URL(params.seedUrl);
  const discovered = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || !isCrawlableHref(href)) {
      return;
    }

    try {
      const resolved = new URL(href, params.baseUrl);
      if (!isUrlInScope(seed, resolved, params.config)) {
        return;
      }

      const normalized = normalizeUrl(resolved.toString(), {
        queryPolicy: params.config.queryPolicy,
        queryAllowlist: params.config.queryAllowlist,
      });

      discovered.add(normalized);
    } catch {
      // Ignore malformed href values during extraction.
    }
  });

  return [...discovered];
}

/**
 * Loads sitemap URLs either from auto mode (<origin>/sitemap.xml) or explicit URL.
 */
export async function discoverUrlsFromSitemap(params: {
  startUrl: string;
  sitemapSetting: "auto" | "off" | string;
  requestTimeoutMs: number;
  userAgent: string;
  config: Pick<CrawlConfig, "includeSubdomains" | "queryPolicy" | "queryAllowlist">;
}): Promise<string[]> {
  if (params.sitemapSetting === "off") {
    return [];
  }

  const sitemapUrl =
    params.sitemapSetting === "auto"
      ? new URL("/sitemap.xml", params.startUrl).toString()
      : params.sitemapSetting;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.requestTimeoutMs);

  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        "user-agent": params.userAgent,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseSitemapUrls(xml, params.startUrl, params.config);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parses <loc> entries from sitemap XML and applies scope + normalization.
 */
function parseSitemapUrls(
  xml: string,
  startUrl: string,
  config: Pick<CrawlConfig, "includeSubdomains" | "queryPolicy" | "queryAllowlist">,
): string[] {
  const matches = xml.matchAll(/<loc>(.*?)<\/loc>/gi);
  const seed = new URL(startUrl);
  const urls = new Set<string>();

  for (const match of matches) {
    const raw = decodeHtmlEntities(match[1] ?? "").trim();
    if (!raw) {
      continue;
    }

    try {
      const candidate = new URL(raw);
      if (!isUrlInScope(seed, candidate, config)) {
        continue;
      }

      urls.add(
        normalizeUrl(candidate.toString(), {
          queryPolicy: config.queryPolicy,
          queryAllowlist: config.queryAllowlist,
        }),
      );
    } catch {
      // Ignore invalid sitemap URL values.
    }
  }

  return [...urls];
}

/**
 * Decodes XML-escaped entities commonly found in sitemap loc entries.
 */
function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
