import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { writePageMarkdown } from "../../src/output/markdownWriter.js";
import { ensureOutputStructure } from "../../src/output/pathUtils.js";

/**
 * Confirms page markdown writer creates frontmatter and deterministic file output.
 */
describe("writePageMarkdown", () => {
  it("writes a markdown file with expected frontmatter keys", async () => {
    const out = await mkdtemp(join(tmpdir(), "bluewebcrawler-md-"));
    await ensureOutputStructure(out);

    const relativePath = await writePageMarkdown(out, {
      url: "https://example.com/docs",
      finalUrl: "https://example.com/docs",
      status: 200,
      contentType: "text/html",
      resourceKind: "html",
      fetchMode: "http",
      title: "Docs",
      textExcerpt: "hello world from docs",
      wordCount: 4,
      discoveredLinks: ["https://example.com/about"],
      timestamp: new Date("2026-03-04T00:00:00.000Z").toISOString(),
      depth: 1,
      discoveredFrom: "https://example.com",
    });

    const absolutePath = join(out, relativePath);
    const content = await readFile(absolutePath, "utf8");

    expect(relativePath.startsWith("pages/")).toBe(true);
    expect(content).toContain("url:");
    expect(content).toContain("final_url:");
    expect(content).toContain("## Extracted Text");
    expect(content).toContain("## Discovered Links");
  });
});
