import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CrawlResult } from "../types.js";

/**
 * Writes a JSON manifest alongside markdown artifacts.
 */
export async function writeManifest(outputDir: string, result: CrawlResult): Promise<void> {
  await writeFile(join(outputDir, "manifest.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
}
