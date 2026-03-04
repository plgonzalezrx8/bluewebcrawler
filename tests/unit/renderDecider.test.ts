import { describe, expect, it } from "vitest";
import { shouldEscalateToBrowser } from "../../src/fetch/renderDecider.js";

/**
 * Verifies hybrid render escalation heuristics.
 */
describe("shouldEscalateToBrowser", () => {
  it("escalates when SPA markers are present", () => {
    const decision = shouldEscalateToBrowser({
      html: '<html><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>',
      extracted: {
        title: undefined,
        text: "",
        discoveredLinks: [],
        textLength: 0,
        scriptCount: 1,
      },
      status: 200,
    });

    expect(decision).toBe(true);
  });

  it("does not escalate when content already has useful text", () => {
    const decision = shouldEscalateToBrowser({
      html: "<html><body><article>" + "word ".repeat(400) + "</article></body></html>",
      extracted: {
        title: "Article",
        text: "word ".repeat(400),
        discoveredLinks: [],
        textLength: 2000,
        scriptCount: 1,
      },
      status: 200,
    });

    expect(decision).toBe(false);
  });
});
