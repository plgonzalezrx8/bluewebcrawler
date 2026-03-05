/**
 * Shared type contracts for crawler configuration, runtime records, and outputs.
 */
export type QueryPolicy = "drop" | "keep" | "allowlist";

export type ResourceKind = "html" | "pdf" | "xml" | "text" | "other";

export type FetchMode = "http" | "browser";

export type CrawlErrorStage = "robots" | "fetch" | "render" | "extract" | "write" | "security";

export type PromptInjectionMode = "off" | "detect" | "redact" | "drop";

export type OutputEncodingMode = "utf8" | "ascii-escape" | "ascii-transliterate" | "ascii-strip";

export interface CrawlSecurityConfig {
  promptInjection: {
    mode: PromptInjectionMode;
    threshold: number;
  };
  outputEncoding: {
    mode: OutputEncodingMode;
    normalize: "NFKC";
    stripControlChars: boolean;
    stripBidiControls: boolean;
  };
}

export type PageSecurityAction = "none" | "flagged" | "redacted" | "dropped";

export interface PageSecurityMetadata {
  promptInjectionScore: number;
  promptInjectionMatches: number;
  action: PageSecurityAction;
  matchedRules: string[];
}

export interface CrawlConfig {
  output: string;
  maxPages: number;
  maxDepth: number;
  maxDurationSeconds: number;
  respectRobots: boolean;
  includeSubdomains: boolean;
  queryPolicy: QueryPolicy;
  queryAllowlist: string[];
  sitemap: "auto" | "off" | string;
  concurrency: {
    min: number;
    max: number;
  };
  timeouts: {
    requestMs: number;
    renderMs: number;
  };
  render: {
    strategy: "hybrid";
    waitUntil: "load" | "domcontentloaded" | "networkidle";
    fallbackTimeoutMs: number;
  };
  format: "markdown" | "markdown+json";
  userAgent: string;
  verbose: boolean;
  security: CrawlSecurityConfig;
}

export interface UrlRecord {
  url: string;
  normalizedUrl: string;
  depth: number;
  discoveredFrom?: string;
}

export interface PageResult {
  url: string;
  finalUrl: string;
  status?: number;
  contentType?: string;
  resourceKind: ResourceKind;
  fetchMode: FetchMode;
  title?: string;
  textExcerpt: string;
  wordCount: number;
  discoveredLinks: string[];
  timestamp: string;
  depth: number;
  discoveredFrom?: string;
  outputFile?: string;
  security: PageSecurityMetadata;
}

export interface CrawlError {
  url: string;
  stage: CrawlErrorStage;
  errorCode: string;
  message: string;
  retriable: boolean;
  attempts: number;
  timestamp: string;
}

export interface CrawlSummary {
  startUrl: string;
  startedAt: string;
  finishedAt: string;
  outputRoot: string;
  outputDir: string;
  runId: string;
  pagesDiscovered: number;
  pagesWritten: number;
  errors: number;
  security: {
    pagesFlagged: number;
    pagesRedacted: number;
    pagesDropped: number;
    totalPromptInjectionMatches: number;
  };
}

export interface CrawlResult {
  summary: CrawlSummary;
  pages: PageResult[];
  errors: CrawlError[];
}

export interface HttpFetchResult {
  url: string;
  finalUrl: string;
  status: number;
  contentType: string;
  bodyText?: string;
  bodyBuffer?: Buffer;
}

export interface BrowserRenderResult {
  url: string;
  finalUrl: string;
  html: string;
  status?: number;
  title?: string;
}

export interface ExtractedContent {
  title?: string;
  text: string;
  discoveredLinks: string[];
  scriptCount?: number;
  textLength: number;
}
