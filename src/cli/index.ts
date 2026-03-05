#!/usr/bin/env node
import { Command } from "commander";
import { loadConfig } from "../config/loadConfig.js";
import { runCrawl } from "../crawler/crawl.js";
import { parseBoolean, type CliOptions } from "./options.js";

/**
 * Creates and runs the CLI entrypoint.
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name("bluewebcrawler")
    .description("Hybrid HTTP + browser web crawler with AI-ready markdown output")
    .version("0.1.0");

  program
    .command("crawl")
    .description("Crawl a website and export markdown artifacts")
    .argument("<url>", "Seed URL for the crawl")
    .option("--config <path>", "Path to crawler.config.json")
    .option("--output <dir>", "Output directory")
    .option("--max-pages <n>", "Maximum pages to write", parseIntOption)
    .option("--max-depth <n>", "Maximum crawl depth", parseIntOption)
    .option("--max-duration <seconds>", "Maximum crawl duration in seconds", parseIntOption)
    .option("--concurrency <n>", "Fixed concurrency target", parseIntOption)
    .option("--request-timeout <ms>", "HTTP request timeout in milliseconds", parseIntOption)
    .option("--render-timeout <ms>", "Browser render timeout in milliseconds", parseIntOption)
    .option("--respect-robots <boolean>", "Respect robots.txt (true|false)", parseBoolean)
    .option("--include-subdomains <boolean>", "Include subdomains in scope (true|false)", parseBoolean)
    .option("--query-policy <policy>", "Query policy: drop|keep|allowlist")
    .option("--query-allowlist <keys>", "Comma-separated query allowlist")
    .option("--user-agent <string>", "HTTP user agent")
    .option("--sitemap <auto|off|url>", "Sitemap mode or explicit sitemap URL")
    .option("--format <format>", "Output format: markdown|markdown+json")
    .option("--verbose", "Enable verbose structured logs", false)
    .action(async (url: string, options: CliOptions) => {
      const runtimeConfig = await loadConfig(options);
      const result = await runCrawl(url, runtimeConfig);

      process.stdout.write(
        `Crawl complete: pages=${result.summary.pagesWritten} errors=${result.summary.errors} output=${result.summary.outputDir}\n`,
      );
    });

  await program.parseAsync(process.argv);
}

/**
 * Guards numeric options from invalid integer values.
 */
function parseIntOption(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    throw new Error(`Invalid integer value: ${value}`);
  }
  return parsed;
}

main().catch((error) => {
  process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
