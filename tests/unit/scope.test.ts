import { describe, expect, it } from "vitest";
import { isUrlInScope } from "../../src/crawler/scope.js";

/**
 * Ensures scope boundaries are enforced for host and subdomain policies.
 */
describe("isUrlInScope", () => {
  const seed = new URL("https://www.example.com");

  it("accepts same host URLs", () => {
    expect(
      isUrlInScope(seed, new URL("https://www.example.com/docs"), {
        includeSubdomains: false,
      }),
    ).toBe(true);
  });

  it("rejects subdomains when includeSubdomains is false", () => {
    expect(
      isUrlInScope(seed, new URL("https://api.example.com/docs"), {
        includeSubdomains: false,
      }),
    ).toBe(false);
  });

  it("accepts subdomains when includeSubdomains is true", () => {
    expect(
      isUrlInScope(new URL("https://example.com"), new URL("https://docs.example.com"), {
        includeSubdomains: true,
      }),
    ).toBe(true);
  });
});
