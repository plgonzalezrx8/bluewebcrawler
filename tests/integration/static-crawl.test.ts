import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCrawl } from "../../src/crawler/crawl.js";
import { DEFAULT_CRAWL_CONFIG } from "../../src/config/defaults.js";
import { createTestServer, type TestServer } from "../helpers/httpTestServer.js";

/**
 * End-to-end crawl test for static HTML traversal and sitemap seeding.
 */
describe("runCrawl static site", () => {
  let server: TestServer | undefined;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = undefined;
    }
  });

  it("crawls in-scope pages and writes index/errors reports", async () => {
    server = await createTestServer((req, res) => {
      if (req.url === "/robots.txt") {
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("User-agent: *\nDisallow: /blocked");
        return;
      }

      if (req.url === "/sitemap.xml") {
        res.writeHead(200, { "content-type": "application/xml" });
        res.end(
          `<?xml version="1.0" encoding="UTF-8"?><urlset><url><loc>${server?.baseUrl}/sitemap-page</loc></url></urlset>`,
        );
        return;
      }

      if (req.url === "/about") {
        res.writeHead(200, { "content-type": "text/html" });
        res.end("<html><head><title>About</title></head><body><p>About page text</p></body></html>");
        return;
      }

      if (req.url === "/sitemap-page") {
        res.writeHead(200, { "content-type": "text/html" });
        res.end("<html><body><p>Sitemap page text</p></body></html>");
        return;
      }

      if (req.url === "/blocked") {
        res.writeHead(200, { "content-type": "text/html" });
        res.end("<html><body><p>blocked</p></body></html>");
        return;
      }

      res.writeHead(200, { "content-type": "text/html" });
      res.end(
        "<html><head><title>Home</title></head><body><a href=\"/about\">About</a><a href=\"/blocked\">Blocked</a></body></html>",
      );
    });

    const outputDir = await mkdtemp(join(tmpdir(), "bluewebcrawler-static-"));

    const result = await runCrawl(server.baseUrl, {
      ...DEFAULT_CRAWL_CONFIG,
      output: outputDir,
      maxPages: 25,
      maxDepth: 3,
      maxDurationSeconds: 120,
      verbose: false,
    });

    expect(result.summary.pagesWritten).toBeGreaterThanOrEqual(2);
    expect(result.pages.some((page) => page.finalUrl.includes("/about"))).toBe(true);
    expect(result.pages.some((page) => page.finalUrl.includes("/sitemap-page"))).toBe(true);
    expect(result.pages.some((page) => page.finalUrl.includes("/blocked"))).toBe(false);

    await expect(stat(join(outputDir, "index.md"))).resolves.toBeDefined();
    await expect(stat(join(outputDir, "errors.md"))).resolves.toBeDefined();

    const index = await readFile(join(outputDir, "index.md"), "utf8");
    expect(index).toContain("# Crawl Index");
  });
});
