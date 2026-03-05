import type {
  CrawlConfig,
  CrawlError,
  CrawlSummary,
  PageResult,
  PageSecurityAction,
  PageSecurityMetadata,
} from "../types.js";
import {
  detectPromptInjection,
  redactPromptInjectionSegments,
  type PromptInjectionDetection,
} from "./promptInjectionGuard.js";
import { sanitizeOutputText } from "./outputEncoding.js";

/**
 * Internal page shape before output security metadata is attached.
 */
export type RawPageForOutput = Omit<PageResult, "security">;

/**
 * Final decision after applying prompt-injection and output encoding safeguards.
 */
export interface SanitizedPageDecision {
  page?: PageResult;
  dropped: boolean;
  security: PageSecurityMetadata;
}

/**
 * Applies prompt-injection policy and output encoding rules to a page artifact.
 */
export function sanitizePageForOutput(
  page: RawPageForOutput,
  securityConfig: CrawlConfig["security"],
): SanitizedPageDecision {
  const promptMode = securityConfig.promptInjection.mode;

  const analyzedTitle = analyzeField(page.title ?? "", promptMode);
  const analyzedExcerpt = analyzeField(page.textExcerpt, promptMode);
  const analyzedUrl = analyzeField(page.url, promptMode);
  const analyzedFinalUrl = analyzeField(page.finalUrl, promptMode);
  const analyzedContentType = analyzeField(page.contentType ?? "", promptMode);
  const analyzedDiscoveredFrom = analyzeField(page.discoveredFrom ?? "", promptMode);
  const analyzedLinks = page.discoveredLinks.map((link) => analyzeField(link, promptMode));

  const detections: PromptInjectionDetection[] = [
    analyzedTitle.detection,
    analyzedExcerpt.detection,
    analyzedUrl.detection,
    analyzedFinalUrl.detection,
    analyzedContentType.detection,
    analyzedDiscoveredFrom.detection,
    ...analyzedLinks.map((link) => link.detection),
  ];

  const score = detections.reduce((total, detection) => total + detection.score, 0);
  const matches = detections.reduce((total, detection) => total + detection.matchCount, 0);
  const matchedRules = [...new Set(detections.flatMap((detection) => detection.matchedRules))].sort();

  const security = buildPageSecurityMetadata(
    promptMode,
    securityConfig.promptInjection.threshold,
    score,
    matches,
    matchedRules,
  );

  if (security.action === "dropped") {
    return {
      dropped: true,
      security,
    };
  }

  const encodingConfig = securityConfig.outputEncoding;

  const sanitizedTextExcerpt = sanitizeOutputText(analyzedExcerpt.value, encodingConfig);
  const sanitizedPage: PageResult = {
    ...page,
    url: sanitizeOutputText(analyzedUrl.value, encodingConfig),
    finalUrl: sanitizeOutputText(analyzedFinalUrl.value, encodingConfig),
    contentType: sanitizeOutputText(analyzedContentType.value, encodingConfig) || undefined,
    title: sanitizeOutputText(analyzedTitle.value, encodingConfig) || undefined,
    textExcerpt: sanitizedTextExcerpt,
    wordCount: countWords(sanitizedTextExcerpt),
    discoveredFrom: sanitizeOutputText(analyzedDiscoveredFrom.value, encodingConfig) || undefined,
    discoveredLinks: analyzedLinks.map((link) => sanitizeOutputText(link.value, encodingConfig)),
    outputFile: page.outputFile ? sanitizeOutputText(page.outputFile, encodingConfig) : undefined,
    security,
  };

  return {
    page: sanitizedPage,
    dropped: false,
    security,
  };
}

/**
 * Applies output-encoding policy to error fields.
 */
export function sanitizeErrorForOutput(
  error: CrawlError,
  securityConfig: CrawlConfig["security"],
): CrawlError {
  const encodingConfig = securityConfig.outputEncoding;

  return {
    ...error,
    url: sanitizeOutputText(error.url, encodingConfig),
    errorCode: sanitizeOutputText(error.errorCode, encodingConfig),
    message: sanitizeOutputText(error.message, encodingConfig),
  };
}

/**
 * Applies output-encoding policy to summary text fields.
 */
export function sanitizeSummaryForOutput(
  summary: CrawlSummary,
  securityConfig: CrawlConfig["security"],
): CrawlSummary {
  const encodingConfig = securityConfig.outputEncoding;

  return {
    ...summary,
    startUrl: sanitizeOutputText(summary.startUrl, encodingConfig),
    outputRoot: sanitizeOutputText(summary.outputRoot, encodingConfig),
    outputDir: sanitizeOutputText(summary.outputDir, encodingConfig),
    runId: sanitizeOutputText(summary.runId, encodingConfig),
  };
}

/**
 * Runs detection and optional redaction for one field.
 */
function analyzeField(value: string, mode: CrawlConfig["security"]["promptInjection"]["mode"]): {
  value: string;
  detection: PromptInjectionDetection;
} {
  const detection = detectPromptInjection(value);

  if (mode === "redact" && detection.matchCount > 0) {
    return {
      value: redactPromptInjectionSegments(value, detection.matches),
      detection,
    };
  }

  return {
    value,
    detection,
  };
}

/**
 * Resolves the action used by downstream summary and reporting.
 */
function buildPageSecurityMetadata(
  mode: CrawlConfig["security"]["promptInjection"]["mode"],
  threshold: number,
  score: number,
  matches: number,
  matchedRules: string[],
): PageSecurityMetadata {
  let action: PageSecurityAction = "none";

  if (mode === "drop" && matches > 0 && score >= threshold) {
    action = "dropped";
  } else if (mode === "redact" && matches > 0) {
    action = "redacted";
  } else if (mode === "detect" && matches > 0) {
    action = "flagged";
  }

  return {
    promptInjectionScore: score,
    promptInjectionMatches: matches,
    action,
    matchedRules,
  };
}

/**
 * Word counter aligned with final persisted text.
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
