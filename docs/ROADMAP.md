# Roadmap

## Milestone 1: Skeleton + CLI + Config

Status: complete in this implementation.
- TypeScript project bootstrapped.
- CLI command and option contract implemented.
- Config defaults + schema validation + merge precedence implemented.

## Milestone 2: HTTP Crawl + Discovery + Markdown

Status: complete in this implementation.
- BFS crawl queue with dedupe.
- In-page link discovery and optional sitemap seeding.
- Per-page markdown + index/errors output.

## Milestone 3: JS Rendering (Hybrid)

Status: complete in this implementation.
- Render decider heuristics for JS-heavy pages.
- Playwright escalation and post-render extraction.

## Milestone 4: Politeness + Resilience + Observability

Status: complete in this implementation.
- Robots support (default enabled).
- Retry with backoff.
- Adaptive concurrency tuning.
- Structured runtime logging.

## Milestone 5: Hardening + Docs

Status: in progress.
- Unit and integration tests added.
- Browser integration test is opt-in (`RUN_BROWSER_TESTS=1`).
- Future hardening includes larger fixture coverage and perf profiling.

## Deferred (Future)

- Authenticated crawling flows.
- NPM package publishing.
- Distributed crawl orchestration.
- Advanced content extraction for richer PDF structures.
