import { afterEach, describe, expect, it } from "vitest";
import { RobotsManager } from "../../src/robots/robotsManager.js";
import { createTestServer, type TestServer } from "../helpers/httpTestServer.js";

/**
 * Validates robots.txt allow/deny behavior for crawler checks.
 */
describe("RobotsManager", () => {
  let server: TestServer | undefined;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = undefined;
    }
  });

  it("disallows paths blocked in robots.txt", async () => {
    server = await createTestServer((req, res) => {
      if (req.url === "/robots.txt") {
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("User-agent: *\nDisallow: /private");
        return;
      }

      res.writeHead(200, { "content-type": "text/plain" });
      res.end("ok");
    });

    const manager = new RobotsManager();
    const blocked = await manager.isAllowed(
      `${server.baseUrl}/private/docs`,
      "bluewebcrawler-test",
      2_000,
    );
    const allowed = await manager.isAllowed(
      `${server.baseUrl}/public/docs`,
      "bluewebcrawler-test",
      2_000,
    );

    expect(blocked).toBe(false);
    expect(allowed).toBe(true);
  });
});
