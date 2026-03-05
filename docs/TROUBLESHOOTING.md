# Troubleshooting

## Browser Rendering Fails

Symptoms:
- `BROWSER_RENDER_FAILED` entries in `errors.md`.

Checks:
1. Install Playwright browser binaries:
   ```bash
   npx playwright install chromium
   ```
2. Increase render timeout:
   ```bash
   npm run crawl -- https://example.com --render-timeout 45000
   ```

## Crawl Stops Early

Symptoms:
- Lower page count than expected.

Checks:
1. Increase depth/page limits:
   ```bash
   npm run crawl -- https://example.com --max-depth 10 --max-pages 5000
   ```
2. Increase duration:
   ```bash
   npm run crawl -- https://example.com --max-duration 7200
   ```

## Missing Pages Because of Robots

Symptoms:
- `ROBOTS_DISALLOWED` in `errors.md`.

Action:
- Keep default for compliance, or override in controlled environments:
  ```bash
  npm run crawl -- https://example.com --respect-robots false
  ```

## Too Many Near-Duplicate URLs

Symptoms:
- Many pages differing only by query params.

Action:
- Keep default `drop` or use allowlist:
  ```bash
  npm run crawl -- https://example.com --query-policy allowlist --query-allowlist page,lang
  ```

## Timeouts or Rate Limiting

Symptoms:
- Frequent fetch errors or retries.

Action:
1. Reduce concurrency:
   ```bash
   npm run crawl -- https://example.com --concurrency 2
   ```
2. Increase request timeout:
   ```bash
   npm run crawl -- https://example.com --request-timeout 30000
   ```

## Prompt-Injection False Positives

Symptoms:
- `SECURITY_PROMPT_INJECTION_DROPPED` entries in `errors.md`
- pages unexpectedly redacted or dropped

Actions:
1. Switch to detect-only mode while tuning:
   ```bash
   npm run crawl -- https://example.com --prompt-injection-mode detect
   ```
2. Increase drop threshold if strict mode is needed:
   ```bash
   npm run crawl -- https://example.com --prompt-injection-mode drop --prompt-injection-threshold 5
   ```
3. Disable prompt-injection handling temporarily for controlled inputs:
   ```bash
   npm run crawl -- https://example.com --prompt-injection-mode off
   ```

## Non-ASCII Characters Missing or Escaped

Symptoms:
- output shows `\\uXXXX` sequences
- symbols or CJK text removed/changed

Action:
- use UTF-8 output mode when your downstream stack can safely consume raw Unicode:
  ```bash
  npm run crawl -- https://example.com --output-encoding utf8
  ```
