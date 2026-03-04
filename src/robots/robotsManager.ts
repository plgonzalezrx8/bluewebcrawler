import robotsParserModule from "robots-parser";

interface RobotsLike {
  isAllowed(url: string, userAgent?: string): boolean | undefined;
}

const robotsParser = robotsParserModule as unknown as (
  url: string,
  robotstxt: string,
) => RobotsLike;

/**
 * Caches robots.txt parsers per site origin and exposes allow checks.
 */
export class RobotsManager {
  private readonly cache = new Map<string, RobotsLike | null>();

  async isAllowed(url: string, userAgent: string, timeoutMs: number): Promise<boolean> {
    const parsed = new URL(url);
    const origin = `${parsed.protocol}//${parsed.host}`;

    if (!this.cache.has(origin)) {
      const parser = await this.loadRobots(origin, timeoutMs, userAgent);
      this.cache.set(origin, parser);
    }

    const parser = this.cache.get(origin);
    if (!parser) {
      return true;
    }

    const allowed = parser.isAllowed(url, userAgent);
    return allowed !== false;
  }

  /**
   * Downloads and parses robots.txt. Fail-open behavior keeps crawler usable.
   */
  private async loadRobots(
    origin: string,
    timeoutMs: number,
    userAgent: string,
  ): Promise<RobotsLike | null> {
    const robotsUrl = `${origin}/robots.txt`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(robotsUrl, {
        headers: {
          "user-agent": userAgent,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      const body = await response.text();
      return robotsParser(robotsUrl, body) as RobotsLike;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
