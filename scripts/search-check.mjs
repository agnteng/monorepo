// Talks search checked against a plain reading of the content: for each query,
// the talks found must be exactly those where every word starts a word in the
// talk's title, speaker, summary, takeaways or transcript. Run by fitness.py.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { search, terms } from '../apps/site/src/lib/search.js';

const root = new URL('../content/', import.meta.url).pathname;
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const index = [], whole = {};
for (const date of readdirSync(root)) {
  let files = [];
  try { files = readdirSync(join(root, date, 'talks')).filter((f) => f.endsWith('.json')); } catch { continue; }
  for (const f of files) {
    const t = JSON.parse(readFileSync(join(root, date, 'talks', f), 'utf8'));
    const path = `/talks/${date}-${t.slug}`;
    const paras = (t.transcript ?? '').split('\n\n').map((p) => p.match(/^\*\*\[([\d:]+)\]\*\*\s*(.*)$/s)).filter(Boolean)
      .map(([, at, text]) => [at.split(':').reduce((s, n) => s * 60 + Number(n), 0), text]);
    index.push({ path, title: t.title, speaker: t.speaker, text: [t.summary, ...(t.takeaways ?? [])].join(' '), paras });
    whole[path] = fold([t.title, t.speaker, t.summary, ...(t.takeaways ?? []), ...paras.map((p) => p[1])].join(' '));
  }
}
const queries = ['har', 'harn', 'harness', 'harness agent', 'Harley', 'david', 'Loïc', 'loic', 'x402', 'design.md', 'design system', 'PostHog', 'cheap tokens', 'zzzqqq', 'h'];
let bad = 0;
for (const q of queries) {
  const want = Object.keys(whole).filter((p) => terms(q).every((w) => new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u').test(whole[p]))).sort();
  const hits = search(index, q);
  const got = hits.map((h) => h.path).sort();
  const why = [];
  if (JSON.stringify(got) !== JSON.stringify(want)) why.push(`found ${got.length}, expected ${want.length}`);
  for (const h of hits) {
    if (h.snippet && !/<mark>/.test(h.snippet) && h.url.includes('#t-')) why.push(`${h.path}: snippet marks nothing`);
    if (/<(?!\/?mark>)/.test(h.snippet)) why.push(`${h.path}: snippet carries markup`);
  }
  if (why.length) { bad++; console.log(`search ${JSON.stringify(q)}: ${why.join('; ')}`); }
}
process.exit(bad ? 1 : 0);
