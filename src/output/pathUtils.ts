import { mkdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Ensures output folders exist before writing crawl artifacts.
 */
export async function ensureOutputStructure(outputDir: string): Promise<{
  outputDir: string;
  pagesDir: string;
}> {
  const pagesDir = join(outputDir, "pages");
  await mkdir(pagesDir, { recursive: true });
  return {
    outputDir,
    pagesDir,
  };
}
