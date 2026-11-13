// Everything the site shows comes from content/: each event's event.json
// (written from Luma) and its talks/*.json (published by agnteng/production).

export type Link = { label: string; url: string };

export type EventSpeaker = { name: string; title: string; photo?: string };

export type Event = {
  date: string;
  city: string;
  number: number;
  venue: string;
  tonight: string;
  luma?: { apiId: string; url: string; startAt: string };
  speakers?: EventSpeaker[];
};

type TalkFile = {
  slug: string;
  order: number;
  title: string;
  speaker: string;
  summary: string;
  takeaways: string[];
  speakerLinks: Link[];
  mentioned: Link[];
  video: { youtubeId: string; url: string } | null;
  transcript: string | null;
};

export type Speaker = {
  slug: string;
  name: string;
  title?: string;
  photo?: string;
  links: Link[];
  talks: Talk[];
};

export type Talk = TalkFile & {
  id: string; // <date>-<slug>, unique across events
  event: Event;
  person: { name: string; title?: string; photo?: string };
};

const eventFiles = import.meta.glob<Event>('@content/*/event.json', { eager: true, import: 'default' });
const talkFiles = import.meta.glob<TalkFile>('@content/*/talks/*.json', { eager: true, import: 'default' });

const dateOf = (path: string) => path.match(/(\d{4}-\d\d-\d\d)\//)![1];

export const events: Event[] = Object.values(eventFiles).sort((a, b) => b.date.localeCompare(a.date));

const today = new Date().toISOString().slice(0, 10);
export const upcoming = events.filter((e) => e.date >= today).reverse();
export const past = events.filter((e) => e.date < today);
export const nextEvent: Event | undefined = upcoming[0];

// The deck may use a short form of a speaker's name ("Andy Nik" for "Andy Nikulin").
function sameName(a: string, b: string) {
  const [fa, ...ra] = a.toLowerCase().split(/\s+/);
  const [fb, ...rb] = b.toLowerCase().split(/\s+/);
  const la = ra.at(-1) ?? '';
  const lb = rb.at(-1) ?? '';
  return fa === fb && (la.startsWith(lb) || lb.startsWith(la));
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const talks: Talk[] = Object.entries(talkFiles)
  .map(([path, t]) => {
    const event = events.find((e) => e.date === dateOf(path))!;
    const s = event.speakers?.find((sp) => sameName(sp.name, t.speaker));
    return {
      ...t,
      id: `${event.date}-${t.slug}`,
      event,
      person: { name: t.speaker, title: s?.title, photo: s?.photo },
    };
  })
  .sort((a, b) => b.event.date.localeCompare(a.event.date) || a.order - b.order);

export const speakers: Speaker[] = (() => {
  const bySlug = new Map<string, Speaker>();
  for (const t of talks) {
    const slug = slugify(t.person.name);
    const sp = bySlug.get(slug) ?? { slug, name: t.person.name, links: [], talks: [] };
    sp.title ??= t.person.title;
    sp.photo ??= t.person.photo;
    if (!sp.links.length) sp.links = t.speakerLinks;
    sp.talks.push(t);
    bySlug.set(slug, sp);
  }
  return [...bySlug.values()];
})();

export const talksAt = (e: Event) => talks.filter((t) => t.event.date === e.date);

export const thumbnail = (t: Talk) =>
  t.video ? `https://i.ytimg.com/vi/${t.video.youtubeId}/maxresdefault.jpg` : undefined;

// Doors, talks and Q&A as listed on Luma for every Lisbon meetup.
export const agenda = [
  { time: '19:00', what: 'Doors open' },
  { time: '19:45', what: 'Three 10-minute talks' },
  { time: '20:15', what: 'Q&A, then drinks' },
];

export const socials: Link[] = [
  { label: 'Luma', url: 'https://luma.com/agnteng' },
  { label: 'YouTube', url: 'https://www.youtube.com/@agnteng' },
  { label: 'Substack', url: 'https://agnteng.substack.com' },
  { label: 'Telegram', url: 'https://t.me/agntacc' },
];

const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });

export const day = (d: string) => fmt(d, { day: 'numeric' });
export const month = (d: string) => fmt(d, { month: 'short' });
export const longDate = (d: string) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const shortDate = (d: string) => fmt(d, { day: 'numeric', month: 'short', year: 'numeric' });

// Transcript paragraphs: "**[m:ss]** text".
export const transcriptParas = (t: Talk) =>
  (t.transcript ?? '').split('\n\n').map((p) => {
    const m = p.match(/^\*\*\[([\d:]+)\]\*\*\s*(.*)$/s);
    return m ? { at: m[1], text: m[2] } : { at: '', text: p };
  });
