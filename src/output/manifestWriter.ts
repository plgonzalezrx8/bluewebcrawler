import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CrawlResult } from "../types.js";

/**
 * Writes machine-friendly crawl metadata for downstream tooling.
 */
export async function writeManifest(outputDir: string, crawlResult: CrawlResult): Promise<string> {
  const filePath = join(outputDir, "manifest.json");
  await writeFile(filePath, `${JSON.stringify(crawlResult, null, 2)}\n`, "utf8");
  return filePath;
}
