import type { CrawlConfig } from "../types.js";

/**
 * Evaluates whether a URL is inside the configured domain scope.
 */
export function isUrlInScope(seedUrl: URL, targetUrl: URL, config: Pick<CrawlConfig, "includeSubdomains">): boolean {
  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    return false;
  }

  if (config.includeSubdomains) {
    return (
      targetUrl.hostname === seedUrl.hostname ||
      targetUrl.hostname.endsWith(`.${seedUrl.hostname}`)
    );
  }

  return targetUrl.hostname === seedUrl.hostname;
}
