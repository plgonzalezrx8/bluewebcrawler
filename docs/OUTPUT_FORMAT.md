# Output Format

## Directory Structure

```text
output/
  run-<timestamp>/
    index.md
    errors.md
    manifest.json
    pages/
      <slug-hash>.md
```

## Per-Page Markdown (`pages/*.md`)

Each page file includes YAML frontmatter:
- `url`
- `final_url`
- `status`
- `content_type`
- `resource_kind`
- `fetch_mode`
- `depth`
- `discovered_from`
- `crawled_at`

Then markdown sections:
- `# Title`
- `## Summary`
- `## Extracted Text`
- `## Discovered Links`
- `## Security Signals`

## Index (`index.md`)

Includes:
- crawl metadata and totals
- run metadata (`run_id`, output root, run output directory)
- security totals (`pagesFlagged`, `pagesRedacted`, `pagesDropped`, `totalPromptInjectionMatches`)
- markdown table rows with
  - URL
  - resource kind
  - fetch mode
  - status
  - security action
  - prompt injection score
  - prompt injection matches
  - output file path

## Errors (`errors.md`)

Includes:
- counts grouped by stage (`robots`, `fetch`, `render`, `extract`, `write`, `security`)
- per-error entries with
  - URL
  - stage
  - error code
  - message
  - retriable
  - attempts
  - timestamp

## Manifest (`manifest.json`)

Generated when format is `markdown+json`.
Contains:
- `summary` (includes `runId`, `outputRoot`, and `outputDir`)
- `summary.security` counters for prompt-injection outcomes
- `pages[]` (includes per-page `security` metadata)
- `errors[]`

This is intended for machine consumers and automation pipelines.

## Encoding Safety

With default `ascii-escape` output encoding:
- persisted artifacts contain only ASCII characters
- non-ASCII characters are represented as `\\uXXXX` sequences
- control and bidi/invisible direction characters are removed
