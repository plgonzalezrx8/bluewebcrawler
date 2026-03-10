# Troubleshooting

## Browser Rendering Fails

Symptoms:
- `BROWSER_RENDER_FAILED` entries in `errors.md`.

Checks:
1. Install Playwright browser binaries:
   ```bash
   pnpm exec playwright install chromium
   ```
2. Increase render timeout:
   ```bash
   pnpm crawl -- https://example.com --render-timeout 45000
   ```

## Crawl Stops Early

Symptoms:
- Lower page count than expected.

Checks:
1. Increase depth/page limits:
   ```bash
   pnpm crawl -- https://example.com --max-depth 10 --max-pages 5000
   ```
2. Increase duration:
   ```bash
   pnpm crawl -- https://example.com --max-duration 7200
   ```

## Missing Pages Because of Robots

Symptoms:
- `ROBOTS_DISALLOWED` in `errors.md`.

Action:
- Keep default for compliance, or override in controlled environments:
  ```bash
  pnpm crawl -- https://example.com --respect-robots false
  ```

## Too Many Near-Duplicate URLs

Symptoms:
- Many pages differing only by query params.

Action:
- Keep default `drop` or use allowlist:
  ```bash
  pnpm crawl -- https://example.com --query-policy allowlist --query-allowlist page,lang
  ```

## Timeouts or Rate Limiting

Symptoms:
- Frequent fetch errors or retries.

Action:
1. Reduce concurrency:
   ```bash
   pnpm crawl -- https://example.com --concurrency 2
   ```
2. Increase request timeout:
   ```bash
   pnpm crawl -- https://example.com --request-timeout 30000
   ```
