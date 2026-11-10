import rss from '@astrojs/rss';

import { getIssues } from '../lib/content';

export function GET(context: { site?: URL }) {
  return rss({
    customData: '<language>en-us</language>',
    description: 'A human-reviewed weekly digest about interfaces, accessibility, and applied AI.',
    items: getIssues().map((issue) => ({
      description: issue.dek,
      link: `/issue/${issue.slug}/`,
      pubDate: new Date(issue.publishedAt),
      title: issue.title,
    })),
    site: context.site ?? new URL('https://digest.example.test'),
    title: 'Signal / Interface',
  });
}
