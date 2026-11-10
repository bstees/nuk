import { normalizedTitle, stableId } from './canonical.js';
import type { DigestEntry, DigestIssue, FeedItem } from './types.js';

const STOP_WORDS = new Set([
  'about',
  'after',
  'also',
  'been',
  'from',
  'have',
  'into',
  'more',
  'that',
  'their',
  'these',
  'this',
  'with',
  'your',
]);

export function deduplicate(items: readonly FeedItem[]): readonly FeedItem[] {
  const urls = new Set<string>();
  const titles = new Set<string>();
  return [...items]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .filter((item) => {
      const title = normalizedTitle(item.title);
      if (urls.has(item.canonicalUrl) || titles.has(title)) return false;
      urls.add(item.canonicalUrl);
      titles.add(title);
      return true;
    });
}

function keywords(item: FeedItem): readonly string[] {
  const counts = new Map<string, number>();
  const input = `${item.title} ${item.description}`.toLocaleLowerCase('en-US');
  for (const match of input.matchAll(/[a-z][a-z-]{3,}/g)) {
    const word = match[0];
    if (STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts]
    .sort(([a, aCount], [b, bCount]) => bCount - aCount || a.localeCompare(b))
    .slice(0, 4)
    .map(([word]) => word);
}

function fallbackSummary(item: FeedItem): string {
  const themes = keywords(item);
  const subject = themes.length > 0 ? themes.join(', ') : 'the published update';
  return `${item.sourceName} presents an update centered on ${subject}. This deterministic draft uses only source metadata and must be edited and evidence-checked before approval.`;
}

function toEntry(item: FeedItem): DigestEntry {
  return {
    canonicalUrl: item.canonicalUrl,
    citations: [{ label: `${item.sourceName}: ${item.title}`, url: item.canonicalUrl }],
    id: stableId(item.sourceId, item.canonicalUrl),
    publishedAt: item.publishedAt,
    quotes: [],
    reviewFlags: ['deterministic-fallback', 'human-summary-required'],
    source: item.sourceName,
    summary: fallbackSummary(item),
    title: item.title,
    topics: item.topics,
  };
}

export interface GenerateOptions {
  readonly date: string;
  readonly issueNumber: number;
  readonly generatedAt?: string;
  readonly maxEntries?: number;
}

export function generateDraft(input: readonly FeedItem[], options: GenerateOptions): DigestIssue {
  const publishedAt = new Date(`${options.date}T12:00:00.000Z`).toISOString();
  const entries = deduplicate(input)
    .slice(0, options.maxEntries ?? 12)
    .map(toEntry);
  return {
    dek: 'A review draft of useful interface, accessibility, web-platform, and applied-AI work.',
    entries,
    generatedAt: options.generatedAt ?? publishedAt,
    issueNumber: options.issueNumber,
    promptVersion: 'editorial-summary.v1',
    publishedAt,
    reviewStatus: 'draft',
    schemaVersion: 1,
    slug: `issue-${String(options.issueNumber).padStart(3, '0')}`,
    sourceManifestVersion: 'sources.v1',
    title: `Signal / Interface — Issue ${String(options.issueNumber).padStart(3, '0')}`,
  };
}
