import type { UrlRecord } from "../types.js";

/**
 * BFS queue with deduplication by normalized URL.
 */
export class CrawlQueue {
  private readonly queue: UrlRecord[] = [];
  private readonly seen = new Set<string>();

  enqueue(record: UrlRecord): boolean {
    if (this.seen.has(record.normalizedUrl)) {
      return false;
    }

    this.seen.add(record.normalizedUrl);
    this.queue.push(record);
    return true;
  }

  dequeue(): UrlRecord | undefined {
    return this.queue.shift();
  }

  get size(): number {
    return this.queue.length;
  }

  get discoveredCount(): number {
    return this.seen.size;
  }
}
