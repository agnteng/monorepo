// The latest Substack posts, read from the public RSS feed at build time. If
// the feed can't be reached the strip renders without posts rather than
// failing the build.
import { links } from './data';

export type Post = { title: string; url: string; date: string };

const field = (item: string, tag: string) =>
  item.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`))?.[1].trim() ?? '';

export async function latestPosts(n = 3): Promise<Post[]> {
  try {
    const res = await fetch(`${links.substack}/feed`, {
      headers: { 'User-Agent': 'agnteng-site' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .map(([, item]) => {
        const date = new Date(field(item, 'pubDate'));
        return { title: field(item, 'title'), url: field(item, 'link'), date: isNaN(+date) ? '' : date.toISOString().slice(0, 10) };
      })
      .filter((p) => p.title && p.url)
      .slice(0, n);
  } catch {
    return [];
  }
}
