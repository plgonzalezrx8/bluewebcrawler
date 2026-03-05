import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DEFAULT_CRAWL_CONFIG } from "./defaults.js";
import { crawlConfigSchema } from "./schema.js";
import type { CrawlConfig } from "../types.js";
import type { CliOptions } from "../cli/options.js";

/**
 * Loads crawler config from defaults, optional config file, then CLI options.
 */
export async function loadConfig(cli: CliOptions): Promise<CrawlConfig> {
  const fileConfig = cli.config ? await readConfigFile(cli.config) : {};

  const merged: CrawlConfig = {
    ...DEFAULT_CRAWL_CONFIG,
    ...fileConfig,
    output: cli.output ?? fileConfig.output ?? DEFAULT_CRAWL_CONFIG.output,
    maxPages: cli.maxPages ?? fileConfig.maxPages ?? DEFAULT_CRAWL_CONFIG.maxPages,
    maxDepth: cli.maxDepth ?? fileConfig.maxDepth ?? DEFAULT_CRAWL_CONFIG.maxDepth,
    maxDurationSeconds:
      cli.maxDuration ??
      fileConfig.maxDurationSeconds ??
      DEFAULT_CRAWL_CONFIG.maxDurationSeconds,
    respectRobots:
      cli.respectRobots ?? fileConfig.respectRobots ?? DEFAULT_CRAWL_CONFIG.respectRobots,
    includeSubdomains:
      cli.includeSubdomains ??
      fileConfig.includeSubdomains ??
      DEFAULT_CRAWL_CONFIG.includeSubdomains,
    queryPolicy:
      cli.queryPolicy ?? fileConfig.queryPolicy ?? DEFAULT_CRAWL_CONFIG.queryPolicy,
    queryAllowlist:
      cli.queryAllowlist
        ? cli.queryAllowlist
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : fileConfig.queryAllowlist ?? DEFAULT_CRAWL_CONFIG.queryAllowlist,
    sitemap: cli.sitemap ?? fileConfig.sitemap ?? DEFAULT_CRAWL_CONFIG.sitemap,
    concurrency: {
      min:
        cli.concurrency ??
        fileConfig.concurrency?.min ??
        DEFAULT_CRAWL_CONFIG.concurrency.min,
      max:
        cli.concurrency ??
        fileConfig.concurrency?.max ??
        DEFAULT_CRAWL_CONFIG.concurrency.max,
    },
    timeouts: {
      requestMs:
        cli.requestTimeout ??
        fileConfig.timeouts?.requestMs ??
        DEFAULT_CRAWL_CONFIG.timeouts.requestMs,
      renderMs:
        cli.renderTimeout ??
        fileConfig.timeouts?.renderMs ??
        DEFAULT_CRAWL_CONFIG.timeouts.renderMs,
    },
    render: {
      ...DEFAULT_CRAWL_CONFIG.render,
      ...fileConfig.render,
      fallbackTimeoutMs:
        cli.renderTimeout ??
        fileConfig.render?.fallbackTimeoutMs ??
        DEFAULT_CRAWL_CONFIG.render.fallbackTimeoutMs,
    },
    format: cli.format ?? fileConfig.format ?? DEFAULT_CRAWL_CONFIG.format,
    userAgent: cli.userAgent ?? fileConfig.userAgent ?? DEFAULT_CRAWL_CONFIG.userAgent,
    verbose: cli.verbose ?? fileConfig.verbose ?? DEFAULT_CRAWL_CONFIG.verbose,
    security: {
      promptInjection: {
        mode:
          cli.promptInjectionMode ??
          fileConfig.security?.promptInjection?.mode ??
          DEFAULT_CRAWL_CONFIG.security.promptInjection.mode,
        threshold:
          cli.promptInjectionThreshold ??
          fileConfig.security?.promptInjection?.threshold ??
          DEFAULT_CRAWL_CONFIG.security.promptInjection.threshold,
      },
      outputEncoding: {
        mode:
          cli.outputEncoding ??
          fileConfig.security?.outputEncoding?.mode ??
          DEFAULT_CRAWL_CONFIG.security.outputEncoding.mode,
        normalize:
          fileConfig.security?.outputEncoding?.normalize ??
          DEFAULT_CRAWL_CONFIG.security.outputEncoding.normalize,
        stripControlChars:
          fileConfig.security?.outputEncoding?.stripControlChars ??
          DEFAULT_CRAWL_CONFIG.security.outputEncoding.stripControlChars,
        stripBidiControls:
          fileConfig.security?.outputEncoding?.stripBidiControls ??
          DEFAULT_CRAWL_CONFIG.security.outputEncoding.stripBidiControls,
      },
    },
  };

  const parsed = crawlConfigSchema.safeParse(merged);
  if (!parsed.success) {
    throw new Error(`Invalid crawler configuration: ${parsed.error.message}`);
  }

  if (parsed.data.concurrency.min > parsed.data.concurrency.max) {
    throw new Error("concurrency.min cannot be greater than concurrency.max");
  }

  return parsed.data;
}

/**
 * Reads and parses a JSON config file from disk.
 */
async function readConfigFile(pathLike: string): Promise<Partial<CrawlConfig>> {
  const filePath = resolve(pathLike);
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<CrawlConfig>;
  return parsed;
}
