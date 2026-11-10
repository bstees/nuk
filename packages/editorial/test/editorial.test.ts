import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { canonicalizeUrl } from '../src/canonical.js';
import { parseFeed } from '../src/feed.js';
import { generateDraft } from '../src/generate.js';
import type { DigestIssue, SourceDefinition } from '../src/types.js';
import { validateIssue } from '../src/validate.js';

const fixtureSource: SourceDefinition = {
  enabled: false,
  feedUrl: 'https://fixtures.example.test/platform-notes.atom.xml',
  id: 'fixture-platform-notes',
  name: 'Fixture Platform Notes',
  note: 'Test fixture.',
  primary: true,
  siteUrl: 'https://fixtures.example.test/',
  topics: ['accessibility', 'css'],
};

describe('editorial pipeline', () => {
  it('normalizes tracking parameters without changing the origin', () => {
    expect(canonicalizeUrl('https://example.com/post/?utm_source=x&b=2&a=1#part')).toBe(
      'https://example.com/post?a=1&b=2',
    );
    expect(() => canonicalizeUrl('http://example.com/post')).toThrow(/HTTPS/);
  });

  it('parses the offline Atom fixture and emits a deterministic review draft', async () => {
    const fixturePath = fileURLToPath(
      new URL('../fixtures/platform-notes.atom.xml', import.meta.url),
    );
    const items = parseFeed(await readFile(fixturePath, 'utf8'), fixtureSource);
    const first = generateDraft(items, {
      date: '2026-10-30',
      generatedAt: '2026-10-30T12:00:00.000Z',
      issueNumber: 2,
    });
    const second = generateDraft(items, {
      date: '2026-10-30',
      generatedAt: '2026-10-30T12:00:00.000Z',
      issueNumber: 2,
    });
    expect(first).toEqual(second);
    expect(first.reviewStatus).toBe('draft');
    expect(first.entries).toHaveLength(3);
    expect(validateIssue(first)).toEqual({ errors: [], ok: true });
  });

  it('fails closed when a draft is requested for production', () => {
    const issue = {
      dek: 'Draft',
      entries: [],
      generatedAt: '2026-10-30T12:00:00.000Z',
      issueNumber: 1,
      promptVersion: 'v1',
      publishedAt: '2026-10-30T12:00:00.000Z',
      reviewStatus: 'draft',
      schemaVersion: 1,
      slug: 'issue-001',
      sourceManifestVersion: 'v1',
      title: 'Issue one',
    } satisfies DigestIssue;
    const result = validateIssue(issue, true);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/approved/);
  });

  it('rejects excessive quotation and unresolved flags in an approved issue', () => {
    const issue = generateDraft(
      [
        {
          canonicalUrl: 'https://example.com/item',
          description: 'An original fixture description.',
          publishedAt: '2026-10-01T00:00:00.000Z',
          sourceId: 'fixture',
          sourceName: 'Fixture',
          title: 'A useful item',
          topics: ['research'],
        },
      ],
      { date: '2026-10-30', issueNumber: 1 },
    );
    const firstEntry = issue.entries[0];
    if (firstEntry === undefined) throw new Error('Fixture draft did not contain an entry.');
    const approved = {
      ...issue,
      entries: [
        {
          ...firstEntry,
          quotes: [
            'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one',
          ],
        },
      ],
      reviewStatus: 'approved',
    } satisfies DigestIssue;
    const result = validateIssue(approved, true);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/quote exceeds|review flags/);
  });
});
