import type { CrawlConfig } from "../types.js";

/**
 * Default runtime configuration used when no config file or flags are provided.
 */
export const DEFAULT_CRAWL_CONFIG: CrawlConfig = {
  output: "./output",
  maxPages: 1000,
  maxDepth: 6,
  maxDurationSeconds: 1800,
  respectRobots: true,
  includeSubdomains: false,
  queryPolicy: "drop",
  queryAllowlist: [],
  sitemap: "auto",
  concurrency: {
    min: 2,
    max: 8,
  },
  timeouts: {
    requestMs: 15000,
    renderMs: 20000,
  },
  render: {
    strategy: "hybrid",
    waitUntil: "networkidle",
    fallbackTimeoutMs: 20000,
  },
  format: "markdown+json",
  userAgent: "bluewebcrawler/0.1 (+https://github.com/)",
  verbose: false,
  security: {
    promptInjection: {
      mode: "redact",
      threshold: 3,
    },
    outputEncoding: {
      mode: "ascii-escape",
      normalize: "NFKC",
      stripControlChars: true,
      stripBidiControls: true,
    },
  },
};
