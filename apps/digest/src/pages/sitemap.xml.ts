import { getIssues, getTopics } from '../lib/content';

export function GET(context: { site?: URL }): Response {
  const site = context.site ?? new URL('https://digest.example.test');
  const paths = [
    '/',
    '/about/',
    '/archive/',
    '/sources/',
    '/topics/',
    ...getIssues().map((issue) => `/issue/${issue.slug}/`),
    ...getTopics().map((topic) => `/topic/${topic}/`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((path) => `  <url><loc>${new URL(path, site).toString()}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
