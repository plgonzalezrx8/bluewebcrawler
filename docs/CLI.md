# CLI Reference

## Command

```bash
bluewebcrawler crawl <url> [options]
```

## Options

- `--config <path>`: path to JSON config file.
- `--output <dir>`: output root directory. Each crawl writes to `run-<timestamp>` under this root. Default `./output`.
- `--max-pages <n>`: max written pages. Default `1000`.
- `--max-depth <n>`: max crawl depth. Default `6`.
- `--max-duration <seconds>`: crawl time limit. Default `1800`.
- `--concurrency <n>`: fixed min/max concurrency.
- `--request-timeout <ms>`: HTTP timeout. Default `15000`.
- `--render-timeout <ms>`: browser timeout. Default `20000`.
- `--respect-robots <true|false>`: robots mode. Default `true`.
- `--include-subdomains <true|false>`: include subdomains in scope. Default `false`.
- `--query-policy <drop|keep|allowlist>`: URL query normalization mode. Default `drop`.
- `--query-allowlist <k1,k2,...>`: keep only listed query keys when policy is `allowlist`.
- `--user-agent <string>`: custom user agent.
- `--sitemap <auto|off|url>`: sitemap discovery mode. Default `auto`.
- `--format <markdown|markdown+json>`: output mode. Default `markdown+json`.
- `--verbose`: verbose structured logs.

## Precedence Rules

Configuration merges in this order:
1. Built-in defaults.
2. Config file (`--config`) values.
3. CLI flags.

CLI flags always win.

## Examples

### Basic run

```bash
npm run crawl -- https://example.com
```

### Config-driven run

```bash
npm run crawl -- https://example.com --config ./crawler.config.json
```

### Keep only selected query keys

```bash
npm run crawl -- https://example.com \
  --query-policy allowlist \
  --query-allowlist page,lang
```
