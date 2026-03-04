import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCrawl } from "../../src/crawler/crawl.js";
import { DEFAULT_CRAWL_CONFIG } from "../../src/config/defaults.js";
import { createTestServer, type TestServer } from "../helpers/httpTestServer.js";

const browserTest = process.env.RUN_BROWSER_TESTS === "1" ? it : it.skip;

/**
 * Optional browser integration test for JS-rendered content extraction.
 */
describe("runCrawl JS rendering", () => {
  let server: TestServer | undefined;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = undefined;
    }
  });

  browserTest("escalates to browser and captures hydrated text", async () => {
    server = await createTestServer((req, res) => {
      if (req.url === "/robots.txt") {
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("User-agent: *\nAllow: /");
        return;
      }

      res.writeHead(200, { "content-type": "text/html" });
      res.end(`
        <html>
          <head><title>JS Site</title></head>
          <body>
            <div id="root"></div>
            <script type="module">
              document.getElementById('root').innerText = 'Hydrated content from JavaScript render';
            </script>
          </body>
        </html>
      `);
    });

    const outputDir = await mkdtemp(join(tmpdir(), "bluewebcrawler-js-"));
    const result = await runCrawl(server.baseUrl, {
      ...DEFAULT_CRAWL_CONFIG,
      output: outputDir,
      maxPages: 10,
      maxDepth: 1,
      maxDurationSeconds: 120,
      verbose: false,
    });

    const homepage = result.pages.find((page) => page.finalUrl === `${server?.baseUrl}/` || page.finalUrl === server?.baseUrl);
    expect(homepage).toBeDefined();
    expect(homepage?.fetchMode).toBe("browser");
    expect(homepage?.textExcerpt).toContain("Hydrated content from JavaScript render");
  });
});
