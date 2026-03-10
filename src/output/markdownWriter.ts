import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { CrawlError, CrawlSummary, PageResult } from "../types.js";
import { getPageOutputPath } from "./pathUtils.js";

/**
 * Writes a markdown file for a crawled page and returns the relative artifact path.
 */
export async function writePageMarkdown(outputDir: string, page: PageResult): Promise<string> {
  const relativePath = getPageOutputPath(page.finalUrl || page.url);
  const absolutePath = join(outputDir, relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });

  const frontmatter = [
    "---",
    `url: ${yamlString(page.url)}`,
    `final_url: ${yamlString(page.finalUrl)}`,
    `status: ${page.status ?? "null"}`,
    `content_type: ${yamlString(page.contentType ?? "")}`,
    `resource_kind: ${yamlString(page.resourceKind)}`,
    `fetch_mode: ${yamlString(page.fetchMode)}`,
    `title: ${yamlString(page.title ?? "")}`,
    `word_count: ${page.wordCount}`,
    `depth: ${page.depth}`,
    `timestamp: ${yamlString(page.timestamp)}`,
    `discovered_from: ${yamlString(page.discoveredFrom ?? "")}`,
    "---",
  ].join("\n");

  const body = [
    frontmatter,
    "",
    "## Extracted Text",
    "",
    page.textExcerpt?.trim() || "_No extracted text._",
    "",
    "## Discovered Links",
    "",
    ...(page.discoveredLinks.length > 0 ? page.discoveredLinks.map((link) => `- ${link}`) : ["_None_"]),
    "",
  ].join("\n");

  await writeFile(absolutePath, body, "utf8");
  return relativePath;
}

/**
 * Writes crawl index markdown summarizing all emitted page artifacts.
 */
export async function writeIndexMarkdown(args: {
  outputDir: string;
  summary: CrawlSummary;
  pages: PageResult[];
}): Promise<void> {
  const { outputDir, summary, pages } = args;
  const lines = [
    "# Crawl Index",
    "",
    `- Start URL: ${summary.startUrl}`,
    `- Started: ${summary.startedAt}`,
    `- Finished: ${summary.finishedAt}`,
    `- Pages discovered: ${summary.pagesDiscovered}`,
    `- Pages written: ${summary.pagesWritten}`,
    `- Errors: ${summary.errors}`,
    "",
    "## Pages",
    "",
  ];

  if (pages.length === 0) {
    lines.push("_No pages written._", "");
  } else {
    for (const page of pages) {
      const target = page.outputFile ?? getPageOutputPath(page.finalUrl || page.url);
      lines.push(`- [${page.title || page.finalUrl || page.url}](${target}) — ${page.resourceKind}, ${page.wordCount} words`);
    }
    lines.push("");
  }

  await writeFile(join(outputDir, "index.md"), lines.join("\n"), "utf8");
}

/**
 * Writes markdown describing any crawl errors.
 */
export async function writeErrorsMarkdown(outputDir: string, errors: CrawlError[]): Promise<void> {
  const lines = ["# Crawl Errors", ""];

  if (errors.length === 0) {
    lines.push("_No crawl errors recorded._", "");
  } else {
    for (const error of errors) {
      lines.push(`## ${error.stage}: ${error.url}`);
      lines.push("");
      lines.push(`- Code: ${error.errorCode}`);
      lines.push(`- Message: ${error.message}`);
      lines.push(`- Retriable: ${error.retriable}`);
      lines.push(`- Attempts: ${error.attempts}`);
      lines.push(`- Timestamp: ${error.timestamp}`);
      lines.push("");
    }
  }

  await writeFile(join(outputDir, "errors.md"), lines.join("\n"), "utf8");
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}
