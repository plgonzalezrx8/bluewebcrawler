/**
 * Shared type contracts for crawler configuration, runtime records, and outputs.
 */
export type QueryPolicy = "drop" | "keep" | "allowlist";

export type ResourceKind = "html" | "pdf" | "xml" | "text" | "other";

export type FetchMode = "http" | "browser";

export type CrawlErrorStage = "robots" | "fetch" | "render" | "extract" | "write";

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
