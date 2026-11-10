import type { DigestIssue, ValidationResult } from './types.js';

const MAX_QUOTE_WORDS = 20;

function wordCount(value: string): number {
  return value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
}

export function validateIssue(issue: DigestIssue, requireApproval = false): ValidationResult {
  const errors: string[] = [];
  if (issue.schemaVersion !== 1) errors.push('Unsupported issue schema version.');
  if (requireApproval && issue.reviewStatus !== 'approved') {
    errors.push('Production issues must have reviewStatus "approved".');
  }
  if (issue.entries.length === 0) errors.push('An issue must contain at least one entry.');

  const ids = new Set<string>();
  for (const [index, entry] of issue.entries.entries()) {
    const prefix = `entries[${String(index)}]`;
    if (ids.has(entry.id)) errors.push(`${prefix}: duplicate id ${entry.id}.`);
    ids.add(entry.id);
    if (entry.title.trim() === '') errors.push(`${prefix}: title is required.`);
    if (entry.summary.trim() === '') errors.push(`${prefix}: summary is required.`);
    if (entry.citations.length === 0) errors.push(`${prefix}: at least one citation is required.`);
    if (!entry.citations.some((citation) => citation.url === entry.canonicalUrl)) {
      errors.push(`${prefix}: the canonical source must appear in citations.`);
    }
    for (const citation of entry.citations) {
      try {
        if (new URL(citation.url).protocol !== 'https:') {
          errors.push(`${prefix}: citation URLs must use HTTPS.`);
        }
      } catch {
        errors.push(`${prefix}: invalid citation URL.`);
      }
    }
    for (const quote of entry.quotes) {
      if (wordCount(quote) > MAX_QUOTE_WORDS) {
        errors.push(
          `${prefix}: quote exceeds the ${String(MAX_QUOTE_WORDS)}-word editorial limit.`,
        );
      }
    }
    if (issue.reviewStatus === 'approved' && entry.reviewFlags.length > 0) {
      errors.push(`${prefix}: approved entries cannot retain review flags.`);
    }
  }
  return { errors, ok: errors.length === 0 };
}

export function assertValidIssue(issue: DigestIssue, requireApproval = false): void {
  const result = validateIssue(issue, requireApproval);
  if (!result.ok) throw new Error(result.errors.join('\n'));
}
