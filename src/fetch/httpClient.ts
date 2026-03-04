import type { HttpFetchResult } from "../types.js";
import { classifyResourceKind } from "../extract/resourceClassifier.js";

/**
 * Performs HTTP fetch with timeout and returns body as text or binary buffer.
 */
export async function fetchWithHttp(params: {
  url: string;
  timeoutMs: number;
  userAgent: string;
}): Promise<HttpFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const response = await fetch(params.url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": params.userAgent,
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const finalUrl = response.url || params.url;
    const resourceKind = classifyResourceKind(contentType, finalUrl);

    if (resourceKind === "pdf") {
      const arrayBuffer = await response.arrayBuffer();
      return {
        url: params.url,
        finalUrl,
        status: response.status,
        contentType,
        bodyBuffer: Buffer.from(arrayBuffer),
      };
    }

    const bodyText = await response.text();
    return {
      url: params.url,
      finalUrl,
      status: response.status,
      contentType,
      bodyText,
    };
  } finally {
    clearTimeout(timeout);
  }
}
