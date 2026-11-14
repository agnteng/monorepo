// Every page of the site, at the address its canonical link gives.
import { events, talks, talksAt, eventSlug } from '../lib/data';

export const GET = ({ site }: { site: URL }) => {
  const paths = [
    '/',
    '/talks',
    '/speakers',
    ...events.filter((e) => talksAt(e).length).map((e) => `/events/${eventSlug(e)}`),
    ...talks.map((t) => `/talks/${t.id}`),
  ];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
