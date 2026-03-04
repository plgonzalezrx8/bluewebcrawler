import { chromium, type Browser } from "playwright";
import type { BrowserRenderResult, CrawlConfig } from "../types.js";

/**
 * Shared Playwright browser manager used by crawler when JS rendering is required.
 */
export class BrowserRenderer {
  private browser?: Browser;

  async render(url: string, config: CrawlConfig): Promise<BrowserRenderResult> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }

    const context = await this.browser.newContext({
      userAgent: config.userAgent,
    });

    const page = await context.newPage();

    try {
      const response = await page.goto(url, {
        waitUntil: config.render.waitUntil,
        timeout: config.timeouts.renderMs,
      });

      // Give hydration-based UIs a short additional window.
      await page.waitForTimeout(350);

      const html = await page.content();
      const title = await page.title();
      return {
        url,
        finalUrl: page.url(),
        html,
        status: response?.status(),
        title: title.trim() || undefined,
      };
    } finally {
      await page.close();
      await context.close();
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}
