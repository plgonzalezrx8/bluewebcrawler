import type {
  CrawlConfig,
  CrawlError,
  CrawlResult,
  ExtractedContent,
  PageResult,
  ResourceKind,
  UrlRecord,
} from "../types.js";
import { CrawlQueue } from "./queue.js";
import { discoverLinksFromHtml, discoverUrlsFromSitemap } from "./discovery.js";
import { normalizeUrl } from "../utils/url.js";
import { fetchWithHttp } from "../fetch/httpClient.js";
import { classifyResourceKind, isTextLikeResource } from "../extract/resourceClassifier.js";
import { extractFromHtml } from "../extract/htmlExtractor.js";
import { extractFromPdf } from "../extract/pdfExtractor.js";
import { extractFromXml } from "../extract/xmlExtractor.js";
import { extractFromText } from "../extract/textExtractor.js";
import { shouldEscalateToBrowser } from "../fetch/renderDecider.js";
import { BrowserRenderer } from "../fetch/browserRenderer.js";
import { RobotsManager } from "../robots/robotsManager.js";
import { sleep } from "../utils/time.js";
import { ensureOutputStructure } from "../output/pathUtils.js";
import {
  writeErrorsMarkdown,
  writeIndexMarkdown,
  writePageMarkdown,
} from "../output/markdownWriter.js";
import { writeManifest } from "../output/manifestWriter.js";
import { Logger } from "../logging/logger.js";

const MAX_RETRIES = 2;

/**
 * Executes the full crawl pipeline and persists markdown artifacts.
 */
export async function runCrawl(startUrl: string, config: CrawlConfig): Promise<CrawlResult> {
  const logger = new Logger(config.verbose);
  const startedAt = new Date();
  const deadline = startedAt.getTime() + config.maxDurationSeconds * 1000;

  // Resolve a dedicated run folder so every crawl keeps isolated artifacts.
  const outputPaths = await ensureOutputStructure(config.output, startedAt);
  const runtimeConfig: CrawlConfig = {
    ...config,
    output: outputPaths.outputDir,
  };

  const queue = new CrawlQueue();
  const errors: CrawlError[] = [];
  const pages: PageResult[] = [];

  const robots = new RobotsManager();
  const browserRenderer = new BrowserRenderer();

  const normalizedStart = normalizeUrl(startUrl, {
    queryPolicy: runtimeConfig.queryPolicy,
    queryAllowlist: runtimeConfig.queryAllowlist,
  });

  queue.enqueue({
    url: normalizedStart,
    normalizedUrl: normalizedStart,
    depth: 0,
    discoveredFrom: "seed",
  });

  const sitemapUrls = await discoverUrlsFromSitemap({
    startUrl: normalizedStart,
    sitemapSetting: runtimeConfig.sitemap,
    requestTimeoutMs: runtimeConfig.timeouts.requestMs,
    userAgent: runtimeConfig.userAgent,
    config: runtimeConfig,
  });

  for (const sitemapUrl of sitemapUrls) {
    queue.enqueue({
      url: sitemapUrl,
      normalizedUrl: sitemapUrl,
      depth: 0,
      discoveredFrom: "sitemap",
    });
  }

  logger.info("crawl_started", {
    startUrl: normalizedStart,
    sitemapUrls: sitemapUrls.length,
    runId: outputPaths.runId,
    outputDir: outputPaths.outputDir,
  });

  let dynamicConcurrency = runtimeConfig.concurrency.min;

  try {
    while (queue.size > 0 && pages.length < runtimeConfig.maxPages) {
      if (Date.now() > deadline) {
        logger.warn("crawl_stopped_deadline", {
          maxDurationSeconds: runtimeConfig.maxDurationSeconds,
        });
        break;
      }

      const batch: UrlRecord[] = [];
      const availableSlots = Math.max(
        1,
        Math.min(dynamicConcurrency, runtimeConfig.maxPages - pages.length),
      );

      for (let i = 0; i < availableSlots; i += 1) {
        const next = queue.dequeue();
        if (!next) {
          break;
        }

        if (next.depth > runtimeConfig.maxDepth) {
          continue;
        }

        batch.push(next);
      }

      if (batch.length === 0) {
        continue;
      }

      const batchResults = await Promise.all(
        batch.map((record) =>
          processRecord(
            record,
            normalizedStart,
            runtimeConfig,
            robots,
            browserRenderer,
            queue,
            logger,
          ),
        ),
      );

      let batchFailures = 0;

      for (const result of batchResults) {
        errors.push(...result.errors);
        if (result.errors.length > 0) {
          batchFailures += 1;
        }

        if (result.page) {
          pages.push(result.page);
        }
      }

      dynamicConcurrency = tuneConcurrency(dynamicConcurrency, runtimeConfig, batch.length, batchFailures);
      logger.debug("batch_processed", {
        batchSize: batch.length,
        batchFailures,
        dynamicConcurrency,
        queued: queue.size,
        pagesWritten: pages.length,
      });
    }
  } finally {
    await browserRenderer.close();
  }

  const finishedAt = new Date();
  const summary = {
    startUrl: normalizedStart,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    outputRoot: outputPaths.outputRoot,
    outputDir: outputPaths.outputDir,
    runId: outputPaths.runId,
    pagesDiscovered: queue.discoveredCount,
    pagesWritten: pages.length,
    errors: errors.length,
  };

  await writeIndexMarkdown({
    outputDir: outputPaths.outputDir,
    summary,
    pages,
  });
  await writeErrorsMarkdown(outputPaths.outputDir, errors);

  const crawlResult: CrawlResult = {
    summary,
    pages,
    errors,
  };

  if (runtimeConfig.format === "markdown+json") {
    await writeManifest(outputPaths.outputDir, crawlResult);
  }

  logger.info("crawl_finished", summary);
  return crawlResult;
}

/**
 * Processes a single URL: robots check, fetch/render, extraction, discovery, and page write.
 */
async function processRecord(
  record: UrlRecord,
  startUrl: string,
  config: CrawlConfig,
  robots: RobotsManager,
  browserRenderer: BrowserRenderer,
  queue: CrawlQueue,
  logger: Logger,
): Promise<{ page?: PageResult; errors: CrawlError[] }> {
  const errors: CrawlError[] = [];

  if (config.respectRobots) {
    const allowed = await robots.isAllowed(record.url, config.userAgent, config.timeouts.requestMs);
    if (!allowed) {
      errors.push({
        url: record.url,
        stage: "robots",
        errorCode: "ROBOTS_DISALLOWED",
        message: "URL disallowed by robots.txt",
        retriable: false,
        attempts: 1,
        timestamp: new Date().toISOString(),
      });

      return { errors };
    }
  }

  const fetched = await withRetries(
    () => fetchWithHttp({
      url: record.url,
      timeoutMs: config.timeouts.requestMs,
      userAgent: config.userAgent,
    }),
    MAX_RETRIES,
    250,
  ).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    errors.push({
      url: record.url,
      stage: "fetch",
      errorCode: "FETCH_FAILED",
      message,
      retriable: true,
      attempts: MAX_RETRIES + 1,
      timestamp: new Date().toISOString(),
    });
    return undefined;
  });

  if (!fetched) {
    return { errors };
  }

  const resourceKind = classifyResourceKind(fetched.contentType, fetched.finalUrl);
  if (!isTextLikeResource(resourceKind)) {
    logger.debug("resource_skipped", {
      url: fetched.finalUrl,
      contentType: fetched.contentType,
      resourceKind,
    });
    return { errors };
  }

  let fetchMode: "http" | "browser" = "http";
  let finalUrl = fetched.finalUrl;
  let pageTitle: string | undefined;
  let discoveredLinks: string[] = [];
  let extractedText = "";

  try {
    const extraction = await extractByKind(resourceKind, fetched.bodyText, fetched.bodyBuffer);
    extractedText = extraction.text;
    pageTitle = extraction.title;

    if (resourceKind === "html") {
      discoveredLinks = discoverLinksFromHtml({
        html: fetched.bodyText ?? "",
        baseUrl: fetched.finalUrl,
        seedUrl: startUrl,
        config,
      });

      if (
        shouldEscalateToBrowser({
          html: fetched.bodyText ?? "",
          extracted: extraction,
          status: fetched.status,
        })
      ) {
        const rendered = await withRetries(
          () => browserRenderer.render(record.url, config),
          MAX_RETRIES,
          350,
        ).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          errors.push({
            url: record.url,
            stage: "render",
            errorCode: "BROWSER_RENDER_FAILED",
            message,
            retriable: true,
            attempts: MAX_RETRIES + 1,
            timestamp: new Date().toISOString(),
          });
          return undefined;
        });

        if (rendered) {
          const renderedExtraction = extractFromHtml(rendered.html);

          if (renderedExtraction.textLength > extraction.textLength) {
            extractedText = renderedExtraction.text;
            pageTitle = rendered.title ?? renderedExtraction.title ?? extraction.title;
            discoveredLinks = discoverLinksFromHtml({
              html: rendered.html,
              baseUrl: rendered.finalUrl,
              seedUrl: startUrl,
              config,
            });
            finalUrl = rendered.finalUrl;
            fetchMode = "browser";
          }
        }
      }
    }
  } catch (error) {
    errors.push({
      url: record.url,
      stage: "extract",
      errorCode: "EXTRACT_FAILED",
      message: error instanceof Error ? error.message : String(error),
      retriable: false,
      attempts: 1,
      timestamp: new Date().toISOString(),
    });
    return { errors };
  }

  // Queue discovered links for BFS traversal.
  if (record.depth < config.maxDepth) {
    for (const link of discoveredLinks) {
      const normalized = normalizeUrl(link, {
        queryPolicy: config.queryPolicy,
        queryAllowlist: config.queryAllowlist,
      });

      queue.enqueue({
        url: normalized,
        normalizedUrl: normalized,
        depth: record.depth + 1,
        discoveredFrom: record.url,
      });
    }
  }

  const page: PageResult = {
    url: record.url,
    finalUrl,
    status: fetched.status,
    contentType: fetched.contentType,
    resourceKind,
    fetchMode,
    title: pageTitle,
    textExcerpt: truncateText(extractedText, 40_000),
    wordCount: countWords(extractedText),
    discoveredLinks,
    timestamp: new Date().toISOString(),
    depth: record.depth,
    discoveredFrom: record.discoveredFrom,
  };

  try {
    page.outputFile = await writePageMarkdown(config.output, page);
  } catch (error) {
    errors.push({
      url: record.url,
      stage: "write",
      errorCode: "WRITE_FAILED",
      message: error instanceof Error ? error.message : String(error),
      retriable: false,
      attempts: 1,
      timestamp: new Date().toISOString(),
    });
  }

  return { page, errors };
}

/**
 * Executes extraction according to resource kind.
 */
async function extractByKind(
  resourceKind: ResourceKind,
  bodyText?: string,
  bodyBuffer?: Buffer,
): Promise<ExtractedContent> {
  if (resourceKind === "html") {
    return extractFromHtml(bodyText ?? "");
  }

  if (resourceKind === "pdf") {
    if (!bodyBuffer) {
      throw new Error("Missing PDF buffer");
    }
    return extractFromPdf(bodyBuffer);
  }

  if (resourceKind === "xml") {
    return extractFromXml(bodyText ?? "");
  }

  return extractFromText(bodyText ?? "");
}

/**
 * Retry helper with linear backoff used for network and render retries.
 */
async function withRetries<T>(fn: () => Promise<T>, maxRetries: number, initialDelayMs: number): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }

      const backoffMs = initialDelayMs * (attempt + 1);
      await sleep(backoffMs);
      attempt += 1;
    }
  }
}

/**
 * Adjusts current concurrency according to recent batch failure ratio.
 */
function tuneConcurrency(
  current: number,
  config: CrawlConfig,
  batchSize: number,
  batchFailures: number,
): number {
  if (batchSize === 0) {
    return current;
  }

  const ratio = batchFailures / batchSize;
  if (ratio > 0.5) {
    return Math.max(config.concurrency.min, current - 1);
  }

  if (ratio < 0.2) {
    return Math.min(config.concurrency.max, current + 1);
  }

  return current;
}

/**
 * Caps extracted text to a safe output size per page artifact.
 */
function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}...`;
}

/**
 * Computes word count for markdown summaries and manifest stats.
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
