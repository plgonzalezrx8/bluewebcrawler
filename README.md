# bluewebcrawler

BlueWebCrawler is a `Node + TypeScript` command-line crawler that maps a site and exports AI-ready markdown.

![BlueWebCrawler Logo](./assets/logo/bluewebcrawler-logo-maximalist-4k-black-bg.png)

It supports hybrid crawling:
- Fast HTTP-first fetching for normal pages.
- Playwright browser escalation for JS-rendered pages.

## Capability Matrix

| Capability | v1 Status |
| --- | --- |
| Same-host domain crawl | ✅ |
| Link + sitemap discovery | ✅ |
| JS-rendered page support | ✅ |
| Robots.txt respected by default | ✅ |
| Per-page markdown output | ✅ |
| Index + errors report | ✅ |
| Optional JSON manifest | ✅ |
| Authenticated crawling | ❌ (future) |

## Requirements

- Node.js `>= 20`
- npm `>= 10`
- Playwright browser binaries (for JS-rendered pages)

If your environment does not have Node 20 yet, install it first (for example with `nvm`):

```bash
nvm install 20
nvm use 20
node -v
npm -v
```

## Quick Install (npx)

Run directly without installing globally:

```bash
npx bluewebcrawler crawl https://example.com
```

For JS-rendered pages, install Chromium once on your machine:

```bash
npx playwright install chromium
```

## Global Install (npm)

Install globally and run as a normal command:

```bash
npm install -g bluewebcrawler
bluewebcrawler crawl https://example.com
```

## Dependency Note (Important)

`npm` installs this package dependencies automatically (everything listed in `dependencies`), including the `playwright` npm package.

If you still get Playwright runtime errors (for example, missing Chromium executable), install browser binaries manually:

```bash
npx playwright install chromium
```

For Linux CI/containers that also need system libraries:

```bash
npx playwright install --with-deps chromium
```

## Run From Source (Clone + Build)

```bash
git clone https://github.com/plgonzalezrx8/bluewebcrawler.git
cd bluewebcrawler
npm ci
```

Install Playwright Chromium runtime when you need JS-rendered crawling:

```bash
npx playwright install chromium
```

Build and run:

```bash
npm run build
npm run crawl -- https://example.com
```

Output is written to `./output` by default:
- `output/run-<timestamp>/index.md`
- `output/run-<timestamp>/errors.md`
- `output/run-<timestamp>/pages/*.md`
- `output/run-<timestamp>/manifest.json` (when format is `markdown+json`)

## CLI Usage

```bash
bluewebcrawler crawl <url> [options]
```

## Common Recipes

### Full crawl with explicit limits

```bash
bluewebcrawler crawl https://example.com \
  --max-pages 1500 \
  --max-depth 8 \
  --max-duration 3600
```

### Sitemap-only disabled

```bash
bluewebcrawler crawl https://example.com --sitemap off
```

### Strict robots compliance with conservative concurrency

```bash
bluewebcrawler crawl https://example.com --respect-robots true --concurrency 2
```

## Configuration File

Create `crawler.config.json` in your project root and provide it via `--config`.

```json
{
  "output": "./output",
  "maxPages": 1000,
  "maxDepth": 6,
  "maxDurationSeconds": 1800,
  "respectRobots": true,
  "includeSubdomains": false,
  "queryPolicy": "drop",
  "queryAllowlist": [],
  "sitemap": "auto",
  "concurrency": { "min": 2, "max": 8 },
  "timeouts": { "requestMs": 15000, "renderMs": 20000 },
  "render": { "strategy": "hybrid", "waitUntil": "networkidle", "fallbackTimeoutMs": 20000 },
  "format": "markdown+json",
  "userAgent": "bluewebcrawler/0.1 (+https://github.com/)",
  "verbose": false
}
```

CLI flags override config file values.

## Development (Contributors)

```bash
npm run lint
npm run test
npm run build
```

Browser integration tests are opt-in:

```bash
RUN_BROWSER_TESTS=1 npm run test
```

## Publishing Checklist (Maintainers)

First release target from the original `0.1.0` state: `0.1.1`.

1. Run release checks locally.

```bash
npm run release:check
```

2. Confirm pack output only contains runtime artifacts:
- `dist/**`
- `README.md`
- `LICENSE`
- `package.json`

3. Set release version and tag.

```bash
npm version patch
```

4. Push commit and tag.

```bash
git push origin main --follow-tags
```

5. Authenticate and publish.

```bash
npm login
npm publish
```

6. Verify install and runtime.

```bash
npm view bluewebcrawler version
npx bluewebcrawler --version
npx bluewebcrawler crawl https://example.com --max-pages 1
```

## Continuous Integration

GitHub Actions runs on every `push` and `pull_request` using `.github/workflows/ci.yml`:
- `Lint, Test, Build` job runs `npm run lint`, `npm run test`, and `npm run build`.
- `Browser Integration Tests` job installs Playwright Chromium and runs `tests/integration/js-crawl.test.ts` with `RUN_BROWSER_TESTS=1`.

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [CLI Reference](./docs/CLI.md)
- [Output Format](./docs/OUTPUT_FORMAT.md)
- [Roadmap](./docs/ROADMAP.md)
- [Contributing](./docs/CONTRIBUTING.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
