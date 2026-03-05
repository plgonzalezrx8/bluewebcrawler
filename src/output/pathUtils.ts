import { mkdir } from "node:fs/promises";
import { join } from "node:path";

export interface OutputPaths {
  outputRoot: string;
  outputDir: string;
  pagesDir: string;
  runId: string;
}

/**
 * Creates a run-scoped output directory under the configured output root.
 */
export async function ensureOutputStructure(outputRoot: string, startedAt: Date): Promise<OutputPaths> {
  const runId = buildRunId(startedAt);
  const outputDir = join(outputRoot, runId);
  const pagesDir = join(outputDir, "pages");
  await mkdir(pagesDir, { recursive: true });

  return {
    outputRoot,
    outputDir,
    pagesDir,
    runId,
  };
}

/**
 * Generates a sortable run identifier from the crawl start timestamp.
 */
function buildRunId(startedAt: Date): string {
  const iso = startedAt.toISOString();
  // Example: 2026-03-05T14:30:12.345Z -> run-20260305-143012-345Z
  const compact = iso.replace(/[-:]/g, "").replace("T", "-").replace(".", "-");
  return `run-${compact}`;
}
