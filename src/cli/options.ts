/**
 * Parsed CLI options before they are merged into typed runtime config.
 */
export interface CliOptions {
  config?: string;
  output?: string;
  maxPages?: number;
  maxDepth?: number;
  maxDuration?: number;
  concurrency?: number;
  requestTimeout?: number;
  renderTimeout?: number;
  respectRobots?: boolean;
  includeSubdomains?: boolean;
  queryPolicy?: "drop" | "keep" | "allowlist";
  queryAllowlist?: string;
  userAgent?: string;
  sitemap?: string;
  format?: "markdown" | "markdown+json";
  verbose?: boolean;
  promptInjectionMode?: "off" | "detect" | "redact" | "drop";
  promptInjectionThreshold?: number;
  outputEncoding?: "utf8" | "ascii-escape" | "ascii-transliterate" | "ascii-strip";
}

/**
 * Converts commander boolean text arguments into booleans.
 */
export function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }
  throw new Error(`Invalid boolean value: ${value}`);
}
