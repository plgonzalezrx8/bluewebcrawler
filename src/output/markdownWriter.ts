import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CrawlError, CrawlSummary, PageResult } from "../types.js";
import { urlToSlug } from "../utils/url.js";

/**
 * Writes a markdown file per page with YAML frontmatter and extracted sections.
 */
export async function writePageMarkdown(outputDir: string, page: PageResult): Promise<string> {
  const slug = urlToSlug(page.finalUrl || page.url);
  const relativePath = `pages/${slug}.md`;
  const absolutePath = join(outputDir, relativePath);

  const summary = summarizeText(page.textExcerpt, 50);
  const content = [
    "---",
    `url: ${yamlString(page.url)}`,
    `final_url: ${yamlString(page.finalUrl)}`,
    `status: ${page.status ?? "null"}`,
    `content_type: ${yamlString(page.contentType ?? "")}`,
    `resource_kind: ${page.resourceKind}`,
    `fetch_mode: ${page.fetchMode}`,
    `depth: ${page.depth}`,
    `discovered_from: ${yamlString(page.discoveredFrom ?? "")}`,
    `crawled_at: ${yamlString(page.timestamp)}`,
    "---",
    "",
    `# ${page.title ?? "Untitled"}`,
    "",
    "## Summary",
    "",
    summary || "No summary available.",
    "",
    "## Extracted Text",
    "",
    page.textExcerpt || "No extracted text.",
    "",
    "## Discovered Links",
    "",
    ...(page.discoveredLinks.length > 0
      ? page.discoveredLinks.map((link) => `- ${link}`)
      : ["- None"]),
    "",
  ].join("\n");

  await writeFile(absolutePath, content, "utf8");
  return relativePath;
}

/**
 * Writes a top-level index report with crawl totals and page table.
 */
export async function writeIndexMarkdown(params: {
  outputDir: string;
  summary: CrawlSummary;
  pages: PageResult[];
}): Promise<string> {
  const filePath = join(params.outputDir, "index.md");

  const lines = [
    "# Crawl Index",
    "",
    "## Crawl Metadata",
    "",
    `- Start URL: ${params.summary.startUrl}`,
    `- Started At: ${params.summary.startedAt}`,
    `- Finished At: ${params.summary.finishedAt}`,
    `- Run ID: ${params.summary.runId}`,
    `- Output Root: ${params.summary.outputRoot}`,
    `- Output Directory: ${params.summary.outputDir}`,
    `- Pages Discovered: ${params.summary.pagesDiscovered}`,
    `- Pages Written: ${params.summary.pagesWritten}`,
    `- Errors: ${params.summary.errors}`,
    "",
    "## Pages",
    "",
    "| URL | Kind | Mode | Status | Output |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const page of params.pages) {
    lines.push(
      `| ${escapePipe(page.url)} | ${page.resourceKind} | ${page.fetchMode} | ${page.status ?? "-"} | ${page.outputFile ?? "-"} |`,
    );
  }

  lines.push("");
  await writeFile(filePath, lines.join("\n"), "utf8");
  return filePath;
}

/**
 * Writes an error report grouped by pipeline stage.
 */
export async function writeErrorsMarkdown(outputDir: string, errors: CrawlError[]): Promise<string> {
  const filePath = join(outputDir, "errors.md");
  const byStage = new Map<string, number>();

  for (const error of errors) {
    byStage.set(error.stage, (byStage.get(error.stage) ?? 0) + 1);
  }

  const lines = ["# Crawl Errors", "", "## Summary by Stage", ""];

  if (errors.length === 0) {
    lines.push("No errors recorded.", "");
    await writeFile(filePath, lines.join("\n"), "utf8");
    return filePath;
  }

  for (const [stage, count] of byStage.entries()) {
    lines.push(`- ${stage}: ${count}`);
  }

  lines.push("", "## Error Entries", "");

  for (const error of errors) {
    lines.push(`### ${error.url}`);
    lines.push(`- Stage: ${error.stage}`);
    lines.push(`- Code: ${error.errorCode}`);
    lines.push(`- Message: ${error.message}`);
    lines.push(`- Retriable: ${String(error.retriable)}`);
    lines.push(`- Attempts: ${error.attempts}`);
    lines.push(`- Timestamp: ${error.timestamp}`);
    lines.push("");
  }

  await writeFile(filePath, lines.join("\n"), "utf8");
  return filePath;
}

/**
 * Produces a compact summary from long extracted text.
 */
function summarizeText(text: string, maxWords: number): string {
  const words = text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length <= maxWords) {
    return words.join(" ");
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
}

/**
 * Escapes a scalar value for YAML frontmatter.
 */
function yamlString(value: string): string {
  const escaped = value.replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Escapes markdown table pipe characters in dynamic fields.
 */
function escapePipe(value: string): string {
  return value.replace(/\|/g, "\\|");
}
