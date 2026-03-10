import { mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { posix as pathPosix } from "node:path";

/**
 * Ensures the crawler output tree exists before any artifacts are written.
 */
export async function ensureOutputStructure(outputDir: string): Promise<void> {
  await mkdir(pathPosix.join(outputDir, "pages"), { recursive: true });
}

/**
 * Builds a deterministic relative path for a crawled page artifact.
 */
export function getPageOutputPath(url: string): string {
  const parsed = new URL(url);
  const host = sanitizeSegment(parsed.hostname);
  const pathname = parsed.pathname === "/" ? "index" : sanitizePath(parsed.pathname);
  const querySuffix = parsed.search ? `-${shortHash(parsed.search)}` : "";
  return pathPosix.join("pages", `${host}${pathname}${querySuffix}.md`);
}

function sanitizePath(pathname: string): string {
  const cleaned = pathname
    .split("/")
    .filter(Boolean)
    .map(sanitizeSegment)
    .join("/");

  return cleaned.length > 0 ? `/${cleaned}` : "/index";
}

function sanitizeSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "index";
}

function shortHash(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}
