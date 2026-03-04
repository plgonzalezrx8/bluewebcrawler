import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCrawl } from "../../src/crawler/crawl.js";
import { DEFAULT_CRAWL_CONFIG } from "../../src/config/defaults.js";
import { createTestServer, type TestServer } from "../helpers/httpTestServer.js";

/**
 * End-to-end crawl test for HTML, XML, and plain text resource extraction.
 */
describe("runCrawl mixed resources", () => {
  let server: TestServer | undefined;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = undefined;
    }
  });

  it("extracts text-like resources beyond HTML", async () => {
    server = await createTestServer((req, res) => {
      if (req.url === "/robots.txt") {
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("User-agent: *\nAllow: /");
        return;
      }

      if (req.url === "/feed.xml") {
        res.writeHead(200, { "content-type": "application/xml" });
        res.end("<?xml version=\"1.0\"?><root><title>Feed</title><entry>XML body value</entry></root>");
        return;
      }

      if (req.url === "/notes.txt") {
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("Plain text document for crawler extraction");
        return;
      }

      res.writeHead(200, { "content-type": "text/html" });
      res.end(
        "<html><head><title>Home</title></head><body><a href=\"/feed.xml\">XML</a><a href=\"/notes.txt\">TXT</a></body></html>",
      );
    });

    const outputDir = await mkdtemp(join(tmpdir(), "bluewebcrawler-mixed-"));
    const result = await runCrawl(server.baseUrl, {
      ...DEFAULT_CRAWL_CONFIG,
      output: outputDir,
      maxPages: 25,
      maxDepth: 2,
      maxDurationSeconds: 120,
      verbose: false,
    });

    expect(result.pages.some((page) => page.resourceKind === "xml")).toBe(true);
    expect(result.pages.some((page) => page.resourceKind === "text")).toBe(true);
  });
});
