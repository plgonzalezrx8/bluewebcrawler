import { describe, expect, it } from "vitest";
import { sanitizeOutputText } from "../../src/security/outputEncoding.js";

const baseConfig = {
  normalize: "NFKC" as const,
  stripControlChars: true,
  stripBidiControls: true,
};

describe("sanitizeOutputText", () => {
  it("escapes non-ASCII characters in ascii-escape mode", () => {
    const value = sanitizeOutputText("café 😀", {
      ...baseConfig,
      mode: "ascii-escape",
    });

    expect(value).toBe("caf\\u00E9 \\uD83D\\uDE00");
  });

  it("strips controls and bidi chars before encoding", () => {
    const input = `safe\u0007text\u202E`;
    const value = sanitizeOutputText(input, {
      ...baseConfig,
      mode: "ascii-escape",
    });

    expect(value).toBe("safetext");
  });

  it("transliterates accents and maps punctuation", () => {
    const value = sanitizeOutputText("Crème brûlée — test", {
      ...baseConfig,
      mode: "ascii-transliterate",
    });

    expect(value).toBe("Creme brulee - test");
  });

  it("removes non-ASCII in ascii-strip mode", () => {
    const value = sanitizeOutputText("hello 漢字 😀", {
      ...baseConfig,
      mode: "ascii-strip",
    });

    expect(value).toBe("hello  ");
  });
});
