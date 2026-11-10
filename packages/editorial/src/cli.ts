#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { fetchFeed, parseFeed } from './feed.js';
import { generateDraft } from './generate.js';
import type { FeedItem, SourceManifest } from './types.js';
import { assertValidIssue } from './validate.js';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function loadManifest(): Promise<SourceManifest> {
  const file = path.join(repositoryRoot, 'packages/editorial/sources/sources.v1.json');
  return JSON.parse(await readFile(file, 'utf8')) as SourceManifest;
}

async function fixtureItems(manifest: SourceManifest): Promise<readonly FeedItem[]> {
  const source = manifest.sources.find((item) => item.id === 'fixture-platform-notes');
  if (source === undefined) throw new Error('Fixture source is missing from sources.v1.json.');
  const xml = await readFile(
    path.join(repositoryRoot, 'packages/editorial/fixtures/platform-notes.atom.xml'),
    'utf8',
  );
  return parseFeed(xml, source);
}

async function networkItems(manifest: SourceManifest): Promise<readonly FeedItem[]> {
  if (process.env.ALLOW_DIGEST_NETWORK !== '1') {
    throw new Error('Network intake requires the explicit ALLOW_DIGEST_NETWORK=1 guard.');
  }
  const settled = await Promise.allSettled(
    manifest.sources.filter((source) => source.enabled).map(fetchFeed),
  );
  const failures = settled.filter((result) => result.status === 'rejected');
  for (const failure of failures) {
    if (failure.status === 'rejected') console.warn(String(failure.reason));
  }
  const successful = settled.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  );
  if (successful.length === 0)
    throw new Error('Every configured feed failed or returned no items.');
  return successful;
}

async function main(): Promise<void> {
  const fixture = hasFlag('--fixture');
  const network = hasFlag('--network');
  if (fixture === network) throw new Error('Choose exactly one of --fixture or --network.');

  const date = argument('--date') ?? new Date().toISOString().slice(0, 10);
  const issueNumber = Number(argument('--issue') ?? date.replaceAll('-', ''));
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1)
    throw new Error('Invalid issue number.');
  const manifest = await loadManifest();
  const items = fixture ? await fixtureItems(manifest) : await networkItems(manifest);
  const issue = generateDraft(items, { date, issueNumber });
  assertValidIssue(issue);

  const output =
    argument('--output') ??
    path.join(repositoryRoot, 'apps/digest/src/content/issues/generated', `${issue.slug}.json`);
  await writeFile(output, `${JSON.stringify(issue, null, 2)}\n`, { encoding: 'utf8', flag: 'w' });
  console.log(`Created review-gated draft: ${path.relative(repositoryRoot, output)}`);
  console.log('Review status remains "draft"; production validation will reject it.');
}

await main();
