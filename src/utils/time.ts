/**
 * Promise-based sleep used for retry backoff and crawl pacing.
 */
export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
