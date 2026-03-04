# Output Format

## Directory Structure

```text
output/
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

## Index (`index.md`)

Includes:
- crawl metadata and totals
- markdown table rows with
  - URL
  - resource kind
  - fetch mode
  - status
  - output file path

## Errors (`errors.md`)

Includes:
- counts grouped by stage (`robots`, `fetch`, `render`, `extract`, `write`)
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
- `summary`
- `pages[]`
- `errors[]`

This is intended for machine consumers and automation pipelines.
