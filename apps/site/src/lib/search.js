// Talks search, run in the browser against /search.json (and by
// scripts/search-check.mjs). Each word typed must start a word in the talk
// (so "har" finds "hard" and "Harley", "harness" only "harness…"); case and
// accents don't matter. No stemming: what you type is what's matched.

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Words of a query, folded; punctuation splits words except inside them (x402, design.md). */
export const terms = (q) => fold(q).split(/[^\p{L}\p{N}.+#-]+/u).map((w) => w.replace(/^[.+#-]+|[.+#-]+$/g, '')).filter(Boolean);

const wordStart = (term) => new RegExp(`(?<![\\p{L}\\p{N}])${escRe(term)}`, 'gu');
const count = (text, re) => (fold(text).match(re) ?? []).length;

/** `text` around its first match, with every match marked; HTML-safe. */
export const snippet = (text, res, words = 34) => {
  const f = fold(text);
  let at = Infinity;
  for (const re of res) { re.lastIndex = 0; const m = re.exec(f); if (m && m.index < at) at = m.index; }
  if (at === Infinity) at = 0;
  // Folding keeps lengths for Latin text, so offsets carry over to the original.
  const before = text.slice(0, at).split(/\s+/);
  const start = Math.max(0, before.length - 8);
  const parts = text.split(/\s+/);
  const window = parts.slice(start, start + words).join(' ');
  let html = escHtml(window);
  const marked = new RegExp(res.map((re) => re.source).join('|'), 'giu');
  const folded = fold(html);
  let out = '', last = 0, m;
  while ((m = marked.exec(folded))) {
    const end = m.index + m[0].length;
    const wordEnd = end + (folded.slice(end).match(/^[\p{L}\p{N}'’]*/u)?.[0].length ?? 0);
    out += html.slice(last, m.index) + '<mark>' + html.slice(m.index, wordEnd) + '</mark>';
    last = wordEnd;
    marked.lastIndex = wordEnd;
  }
  out += html.slice(last);
  return (start > 0 ? '…' : '') + out + (start + words < parts.length ? '…' : '');
};

/**
 * Talks matching every word, best first: [{ path, url, snippet }].
 * A talk matches when each word starts a word in its title, speaker, summary or transcript.
 */
export const search = (index, query) => {
  const ws = terms(query);
  if (!ws.length) return [];
  const res = ws.map(wordStart);
  const hits = [];
  for (const t of index) {
    const all = [t.title, t.speaker, t.text, ...t.paras.map((p) => p[1])].join(' ');
    if (!res.every((re) => count(all, re) > 0)) continue;
    const head = res.reduce((n, re) => n + count(t.title, re) * 20 + count(t.speaker, re) * 15 + count(t.text, re) * 3, 0);
    // The transcript paragraph with the most of the words, then the most matches.
    let best = null, bestKey = [0, 0];
    for (const [at, text] of t.paras) {
      const per = res.map((re) => count(text, re));
      const key = [per.filter(Boolean).length, per.reduce((a, b) => a + b, 0)];
      if (key[0] > bestKey[0] || (key[0] === bestKey[0] && key[1] > bestKey[1])) { best = [at, text]; bestKey = key; }
    }
    const body = t.paras.reduce((n, [, text]) => n + res.reduce((m, re) => m + count(text, re), 0), 0);
    hits.push({
      path: t.path,
      score: head + body,
      url: best ? `${t.path}#t-${best[0]}` : t.path,
      snippet: best ? snippet(best[1], res) : count(t.text, res[0]) ? snippet(t.text, res) : '',
    });
  }
  return hits.sort((a, b) => b.score - a.score);
};
