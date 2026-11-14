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
  recap?: string; // the night's Substack post
  free?: boolean; // Luma has a free ticket
  approval?: boolean; // the hosts approve each registration
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
  href: string; // their first talk, or the event's Luma page if no talk is published
};

export type Talk = TalkFile & {
  id: string; // <date>-<slug>, unique across events
  event: Event;
  person: { name: string; title?: string; photo?: string };
};

const eventFiles = import.meta.glob<Event>('@content/*/event.json', { eager: true, import: 'default' });
const talkFiles = import.meta.glob<TalkFile>('@content/*/talks/*.json', { eager: true, import: 'default' });

export type Question = { question: string; answers: { speaker: string; text: string }[] };
const questionFiles = import.meta.glob<Question[]>('@content/*/questions.json', { eager: true, import: 'default' });

const dateOf = (path: string) => path.match(/(\d{4}-\d\d-\d\d)\//)![1];

export const events: Event[] = Object.values(eventFiles).sort((a, b) => b.date.localeCompare(a.date));

// Upcoming and past as of the build. The home page also hides a next event
// whose start has passed in the browser, since the site is only rebuilt on deploy.
const today = new Date().toISOString().slice(0, 10);
export const past = events.filter((e) => e.date < today);
export const nextEvent: Event | undefined = events.filter((e) => e.date >= today).at(-1);

export const links = {
  luma: 'https://luma.com/agnteng',
  youtube: 'https://www.youtube.com/@agnteng',
  substack: 'https://agnteng.substack.com',
  telegram: 'https://t.me/agntacc',
  sponsors: 'https://sponsors.agnteng.com',
};
export const register = nextEvent?.luma?.url ?? links.luma;

// The deck may shorten a speaker's name ("Andy Nik" for "Andy Nikulin",
// "Doris Hernandez" for "Doris Hernandez Argueta"): same first name, and the
// shorter name's last word starts one of the longer name's later words.
function sameName(a: string, b: string) {
  const [fa, ...ra] = a.toLowerCase().split(/\s+/);
  const [fb, ...rb] = b.toLowerCase().split(/\s+/);
  if (fa !== fb || !ra.length || !rb.length) return false;
  const [short, long] = ra.length <= rb.length ? [ra, rb] : [rb, ra];
  const last = short.at(-1)!;
  return long.some((w) => w.startsWith(last) || last.startsWith(w));
}

const slugify = (s: string) =>
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

// Everyone who has given a talk: from the published talks, then anyone listed
// in a past event.json whose talk isn't published yet.
export const speakers: Speaker[] = (() => {
  const out: Speaker[] = [];
  const known = (name: string) => out.some((s) => sameName(s.name, name));
  for (const t of talks) {
    if (!known(t.person.name)) out.push({ slug: slugify(t.person.name), ...t.person, href: `/talks/${t.id}` });
  }
  for (const e of past) {
    for (const sp of e.speakers ?? []) {
      if (!known(sp.name)) out.push({ slug: slugify(sp.name), ...sp, href: e.luma?.url ?? links.luma });
    }
  }
  return out;
})();

export const talksAt = (e: Event) => talks.filter((t) => t.event.date === e.date);

// The night's gallery: web copies written by production's event_photos.py.
const photoFiles = import.meta.glob<ImageMetadata>('@content/*/photos/*.jpg', { eager: true, import: 'default' });
const photoLists = import.meta.glob<{ file: string; alt: string }[]>('@content/*/photos.json', { eager: true, import: 'default' });
export type Photo = { file: string; img: ImageMetadata; alt: string };
export const photosAt = (e: Event): Photo[] => {
  const list = Object.entries(photoLists).find(([path]) => dateOf(path) === e.date)?.[1] ?? [];
  return list.flatMap(({ file, alt }) => {
    const img = Object.entries(photoFiles).find(([path]) => path.endsWith(`${e.date}/photos/${file}`))?.[1];
    return img ? [{ file, img, alt }] : [];
  });
};
// One gallery photo by file name. Re-publishing a gallery renumbers its files,
// so a pick that is no longer there fails the build instead of showing another photo.
export const galleryPhoto = (date: string, file: string): Photo => {
  const e = events.find((ev) => ev.date === date);
  const p = e && photosAt(e).find((ph) => ph.file === file);
  if (!p) throw new Error(`content/${date}/photos/${file} is not in that night's gallery`);
  return p;
};

export const questionsAt = (e: Event): Question[] =>
  Object.entries(questionFiles).find(([path]) => dateOf(path) === e.date)?.[1] ?? [];

// /events/lisbon-5: the city and the meetup number, like the Luma slugs.
export const eventSlug = (e: Event) => `${slugify(e.city)}-${e.number}`;
export const eventName = (e: Event) => `${e.city} #${e.number}`;


export const thumbnail = (t: Talk) =>
  t.video ? `https://i.ytimg.com/vi/${t.video.youtubeId}/maxresdefault.jpg` : undefined;

export const watchAt = (t: Talk, seconds: number) =>
  t.video ? `https://www.youtube.com/watch?v=${t.video.youtubeId}&t=${seconds}s` : undefined;

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });

export const longDate = (d: string) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const shortDate = (d: string) => fmt(d, { day: 'numeric', month: 'short', year: 'numeric' });
export const cardDate = (d: string) => fmt(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

// Doors time in the event's city, from Luma's start.
const zones: Record<string, string> = { Lisbon: 'Europe/Lisbon' };
export const startTime = (e: Event) =>
  e.luma
    ? new Date(e.luma.startAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: zones[e.city] ?? 'UTC' })
    : undefined;

// Transcript paragraphs: "**[m:ss]** text".
export const transcriptParas = (t: Talk) =>
  (t.transcript ?? '').split('\n\n').map((p) => {
    const m = p.match(/^\*\*\[([\d:]+)\]\*\*\s*(.*)$/s);
    return m ? { at: m[1], text: m[2] } : { at: '', text: p };
  });
