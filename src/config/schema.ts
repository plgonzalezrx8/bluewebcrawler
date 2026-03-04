import { z } from "zod";

/**
 * Central config schema to validate file-based and CLI-merged configuration.
 */
export const crawlConfigSchema = z.object({
  output: z.string().min(1),
  maxPages: z.number().int().positive(),
  maxDepth: z.number().int().nonnegative(),
  maxDurationSeconds: z.number().int().positive(),
  respectRobots: z.boolean(),
  includeSubdomains: z.boolean(),
  queryPolicy: z.enum(["drop", "keep", "allowlist"]),
  queryAllowlist: z.array(z.string().min(1)),
  sitemap: z.union([z.literal("auto"), z.literal("off"), z.string().url()]),
  concurrency: z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  }),
  timeouts: z.object({
    requestMs: z.number().int().positive(),
    renderMs: z.number().int().positive(),
  }),
  render: z.object({
    strategy: z.literal("hybrid"),
    waitUntil: z.enum(["load", "domcontentloaded", "networkidle"]),
    fallbackTimeoutMs: z.number().int().positive(),
  }),
  format: z.enum(["markdown", "markdown+json"]),
  userAgent: z.string().min(1),
  verbose: z.boolean(),
});

export type CrawlConfigSchema = z.infer<typeof crawlConfigSchema>;
