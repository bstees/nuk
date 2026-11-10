import { createHash } from 'node:crypto';

const TRACKING_PARAMETERS = new Set(['fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'source']);

export function canonicalizeUrl(input: string): string {
  const url = new URL(input);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error(`Only HTTPS canonical URLs are accepted: ${input}`);
  }

  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_') || TRACKING_PARAMETERS.has(key)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/$/, '');
  }
  return url.toString();
}

export function stableId(...parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('\u0000')).digest('hex').slice(0, 16);
}

export function normalizedTitle(title: string): string {
  return title
    .normalize('NFKD')
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
