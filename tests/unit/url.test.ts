import { describe, expect, it } from "vitest";
import { normalizeUrl } from "../../src/utils/url.js";

/**
 * Validates URL normalization and query handling policies.
 */
describe("normalizeUrl", () => {
  it("drops all query parameters when policy is drop", () => {
    const normalized = normalizeUrl("https://Example.com/docs/?a=1&utm_source=x#intro", {
      queryPolicy: "drop",
      queryAllowlist: [],
    });

    expect(normalized).toBe("https://example.com/docs");
  });

  it("keeps only allowlisted query parameters", () => {
    const normalized = normalizeUrl("https://example.com/path?a=1&b=2", {
      queryPolicy: "allowlist",
      queryAllowlist: ["b"],
    });

    expect(normalized).toBe("https://example.com/path?b=2");
  });

  it("keeps sorted query parameters in keep mode", () => {
    const normalized = normalizeUrl("https://example.com/path?b=2&a=1", {
      queryPolicy: "keep",
      queryAllowlist: [],
    });

    expect(normalized).toBe("https://example.com/path?a=1&b=2");
  });
});
