import { XMLParser } from 'fast-xml-parser';

import { canonicalizeUrl } from './canonical.js';
import type { FeedItem, SourceDefinition } from './types.js';

const MAX_FEED_BYTES = 2_000_000;
const parser = new XMLParser({
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
  isArray: (name) => ['item', 'entry', 'category', 'link'].includes(name),
  processEntities: false,
  trimValues: true,
});

type XmlValue = Record<string, unknown>;

function record(value: unknown): XmlValue {
  return typeof value === 'object' && value !== null ? (value as XmlValue) : {};
}

function text(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(text).find((candidate) => candidate !== '') ?? '';
  if (value === null || value === undefined) return '';
  const valueRecord = record(value);
  const nested = valueRecord['#text'] ?? valueRecord.__cdata;
  return nested === undefined ? '' : text(nested);
}

function cleanMarkup(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function atomLink(value: unknown): string {
  const links = Array.isArray(value) ? value : [value];
  const alternate = links.map(record).find((link) => link['@_rel'] === 'alternate');
  const selected = alternate ?? record(links[0]);
  return text(selected['@_href']) || text(value);
}

function toIsoDate(value: unknown): string {
  const date = new Date(text(value));
  if (Number.isNaN(date.valueOf())) throw new Error(`Invalid publication date: ${text(value)}`);
  return date.toISOString();
}

function toFeedItem(raw: XmlValue, source: SourceDefinition, atom: boolean): FeedItem {
  const rawUrl = atom ? atomLink(raw.link) : text(raw.link) || text(raw.guid);
  return {
    canonicalUrl: canonicalizeUrl(rawUrl),
    description: cleanMarkup(
      text(raw.description) ||
        text(raw.summary) ||
        text(raw.content) ||
        text(raw['content:encoded']),
    ),
    publishedAt: toIsoDate(raw.pubDate ?? raw.published ?? raw.updated),
    sourceId: source.id,
    sourceName: source.name,
    title: cleanMarkup(text(raw.title)),
    topics: source.topics,
  };
}

export function parseFeed(xml: string, source: SourceDefinition): readonly FeedItem[] {
  if (Buffer.byteLength(xml, 'utf8') > MAX_FEED_BYTES) {
    throw new Error(`${source.id}: feed exceeds ${String(MAX_FEED_BYTES)} bytes`);
  }

  const document = record(parser.parse(xml));
  const rssItems = record(record(document.rss).channel).item;
  const atomEntries = record(document.feed).entry;
  const atom = atomEntries !== undefined;
  const rawItems = atom ? atomEntries : rssItems;
  if (!Array.isArray(rawItems)) throw new Error(`${source.id}: no RSS items or Atom entries found`);
  return rawItems.map((item) => toFeedItem(record(item), source, atom));
}

export async function fetchFeed(source: SourceDefinition): Promise<readonly FeedItem[]> {
  const response = await fetch(source.feedUrl, {
    headers: {
      Accept: 'application/atom+xml, application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
      'User-Agent': 'nuk-digest/0.1 (+local review workflow)',
    },
    redirect: 'error',
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`${source.id}: feed returned HTTP ${String(response.status)}`);
  const declaredSize = Number(response.headers.get('content-length') ?? '0');
  if (declaredSize > MAX_FEED_BYTES)
    throw new Error(`${source.id}: declared feed size is too large`);
  return parseFeed(await response.text(), source);
}
