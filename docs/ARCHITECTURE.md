# Architecture

## Overview

BlueWebCrawler follows a staged pipeline:
1. Seed and discover URLs (start URL + optional sitemap).
2. Apply scope, dedupe, and robots policies.
3. Fetch via HTTP.
4. Escalate to browser rendering when heuristics indicate JS hydration.
5. Extract text and metadata.
6. Discover additional links from HTML pages.
7. Write markdown and summary artifacts.

## Module Layout

- `src/cli/`: command parsing and invocation.
- `src/config/`: defaults, schema validation, and config loading.
- `src/crawler/`: queue, scope, discovery, and crawl orchestration.
- `src/fetch/`: HTTP client, browser renderer, and render decision logic.
- `src/extract/`: resource-specific text extraction.
- `src/robots/`: robots fetch/cache/allow checks.
- `src/output/`: markdown and JSON artifact writers.
- `src/logging/`: structured logger.
- `src/utils/`: URL normalization and timing helpers.

## Data Flow

1. `runCrawl()` initializes queue and output directories.
2. URLs from sitemap are enqueued when configured.
3. BFS queue emits batches at adaptive concurrency.
4. Each URL processing unit performs:
   - robots allow check (optional)
   - HTTP fetch with retries
   - resource classification
   - extraction
   - optional Playwright escalation
   - discovered link enqueue
   - page markdown write
5. After queue drain or limits reached, index/errors/manifest are written.

## Hybrid Rendering Strategy

Default strategy is `HTTP first`, then browser escalation if:
- SPA markers are present (`#root`, hydration markers, module-heavy shell), or
- extracted text is very small and scripts are heavy.

This balances throughput and compatibility:
- Static/SSR pages stay fast.
- CSR pages still produce useful text.

## Reliability Controls

- Retry policy: 2 retries for network/render operations.
- Adaptive concurrency: bounded by `concurrency.min..concurrency.max`.
- Duration guard: crawl stops when `maxDurationSeconds` elapses.
- Continue-on-error: failures are recorded, crawl continues.

## Public Output Contracts

- `index.md`: crawl metadata and per-page table.
- `errors.md`: grouped failures by stage and detailed entries.
- `pages/*.md`: per-page markdown with YAML frontmatter and extracted text.
- `manifest.json`: optional machine-friendly JSON.
