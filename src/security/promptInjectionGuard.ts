/**
 * Rule definition used by deterministic prompt-injection detection.
 */
interface PromptInjectionRule {
  id: string;
  weight: number;
  pattern: RegExp;
}

/**
 * Single rule hit with source span for optional redaction.
 */
export interface PromptInjectionMatch {
  ruleId: string;
  start: number;
  end: number;
  matchedText: string;
}

/**
 * Aggregate detection result for one text field.
 */
export interface PromptInjectionDetection {
  score: number;
  matchCount: number;
  matchedRules: string[];
  matches: PromptInjectionMatch[];
}

/**
 * Weighted patterns focused on high-risk instruction-override language.
 */
const PROMPT_INJECTION_RULES: PromptInjectionRule[] = [
  {
    id: "ignore_previous_instructions",
    weight: 2,
    pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  },
  {
    id: "system_or_developer_prompt",
    weight: 2,
    pattern: /\b(system|developer)\s+prompt\b/gi,
  },
  {
    id: "jailbreak_or_bypass",
    weight: 3,
    pattern: /\b(jailbreak|bypass|override)\b.{0,50}\b(safety|guardrails?|policy|restrictions?)\b/gi,
  },
  {
    id: "reveal_sensitive_secrets",
    weight: 3,
    pattern: /\b(reveal|expose|print|dump)\b.{0,50}\b(secret|token|api[\s_-]?key|credential|password)\b/gi,
  },
  {
    id: "tool_override",
    weight: 2,
    pattern: /\b(tool|function)\b.{0,50}\b(ignore|override|disable)\b/gi,
  },
  {
    id: "role_reassignment",
    weight: 2,
    pattern: /\bact\s+as\s+(system|developer|root|admin)\b/gi,
  },
];

/**
 * Detects likely prompt-injection instructions in untrusted text.
 */
export function detectPromptInjection(text: string): PromptInjectionDetection {
  if (!text) {
    return {
      score: 0,
      matchCount: 0,
      matchedRules: [],
      matches: [],
    };
  }

  const matchedRuleIds = new Set<string>();
  const matches: PromptInjectionMatch[] = [];

  for (const rule of PROMPT_INJECTION_RULES) {
    // Reset global regex index before scanning a fresh field.
    rule.pattern.lastIndex = 0;

    for (const hit of text.matchAll(rule.pattern)) {
      const matched = hit[0] ?? "";
      const start = hit.index ?? 0;
      const end = start + matched.length;

      matches.push({
        ruleId: rule.id,
        start,
        end,
        matchedText: matched,
      });
      matchedRuleIds.add(rule.id);
    }
  }

  let score = 0;
  for (const rule of PROMPT_INJECTION_RULES) {
    if (matchedRuleIds.has(rule.id)) {
      score += rule.weight;
    }
  }

  return {
    score,
    matchCount: matches.length,
    matchedRules: [...matchedRuleIds].sort(),
    matches,
  };
}

/**
 * Replaces matched instruction spans with a fixed placeholder.
 */
export function redactPromptInjectionSegments(
  text: string,
  matches: PromptInjectionMatch[],
  replacement = "[REDACTED_PROMPT_INJECTION]",
): string {
  if (!text || matches.length === 0) {
    return text;
  }

  const spans = mergeOverlappingSpans(
    matches.map((match) => ({ start: match.start, end: match.end })),
  );

  let cursor = 0;
  let redacted = "";

  for (const span of spans) {
    redacted += text.slice(cursor, span.start);
    redacted += replacement;
    cursor = span.end;
  }

  redacted += text.slice(cursor);
  return redacted;
}

/**
 * Coalesces overlapping spans to keep redaction stable and deterministic.
 */
function mergeOverlappingSpans(spans: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  const sorted = [...spans].sort((left, right) => left.start - right.start || left.end - right.end);
  if (sorted.length === 0) {
    return [];
  }

  const merged: Array<{ start: number; end: number }> = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      continue;
    }

    merged.push({ ...current });
  }

  return merged;
}
