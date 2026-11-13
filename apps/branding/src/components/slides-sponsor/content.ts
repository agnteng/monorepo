// ─────────────────────────────────────────────────────────────────────────
// Sponsorship deck. All copy and figures, in one place.
//
// Stage geometry, the palette and the slide primitives are shared with the
// meetup deck (../slides/deck.ts, ../slides/parts.tsx); only the content and
// the running order differ.
//
// No em dashes in anything that reaches the screen. They read as machine
// writing to the people this deck is going to, and a sponsor deck cannot
// afford to look generated. Bullets are squares, not dashes, for the same
// reason. Comments are exempt; nobody reads those over your shoulder.
// ─────────────────────────────────────────────────────────────────────────

// ── Slide 01: title ────────────────────────────────────────────────────────
// No city pill and no venue: this deck goes to a sponsor by email, months
// before whatever event they end up on. The line that carried the date on the
// meetup deck carries the subject instead.
export const TITLE = {
  line: 'Sponsorship & Partnerships',
} as const;

// ── Slide 02: the room ─────────────────────────────────────────────────────
// The subhead is the site's own hero line, extended. Cities are deliberately
// absent: the deck is read by sponsors who may be backing a city that is not
// yet on the list, and naming two of them reads as a limit rather than a
// footprint. The cards underneath say where, for anyone counting.
export const COMMUNITY = {
  headline: 'The room for agentic engineering',
  // The Substack's own description of itself, verbatim, plus one factual line.
  // The website's "turning agents into an unfair advantage" is hero copy
  // written to sell a signup; in a sponsor deck it was the one line that
  // sounded like marketing rather than like the people who run this.
  //
  // Every subhead in this deck is a real sentence with a real verb. The
  // fragment style ("Monthly, in person, since May 2026") is the house voice of
  // decks that were written by a machine, and it costs nothing to avoid.
  subhead:
    'Agentic Engineering is for people building software, infrastructure and companies with agentic workflows. We have met every month since May 2026.',
};

export interface PastEvent {
  city: string;
  date: string;
  photo: string;
}

// Dates are the registration system's. The meetup deck says 29 May and 17 Jun
// for the first two; those are a day or two out and this is the version to
// trust.
export const EVENTS: PastEvent[] = [
  { city: 'Lisbon', date: '27 May 2026', photo: '/assets/photos/events/lisbon-may2026.jpg' },
  { city: 'Berlin', date: '16 Jun 2026', photo: '/assets/photos/events/berlin-jun2026.jpg' },
  { city: 'Lisbon', date: '29 Jul 2026', photo: '/assets/photos/events/lisbon-jul2026.webp' },
];

// ── Slide 03: who is in the room, and what we track ────────────────────────
// Three segments, not four. `Other` as its own band invited the question of
// what was in it, which is not a question worth spending a slide on; folded in
// with investors it is one group a sponsor can price.
//
// Engineers includes researchers and DevRel. All three are the same person to
// a sponsor, and splitting them made the second-largest group look like the
// fourth.
//
// Percentages are the observed mix across the three events (228 founders, 185
// engineers, 106 everyone else, of 519 approved) and are rounded to whole
// numbers that still sum to 100. Change a count and check that they still do.
export const ROLES = [
  { label: 'Founders', pct: 44 },
  { label: 'Engineers', pct: 36 },
  { label: 'Investors & others', pct: 20 },
] as const;

export const ROLE_TOTAL = '550 people have registered across our first three events.';

export const STATS = {
  label: 'Average event',
  items: [
    { label: 'Registrations', n: 180 },
    { label: 'Attendees', n: 70 },
  ],
};

// Two lists, not three title-and-subtitle pairs. The hole under "Company &
// role" was never really about that cell: a row of headings-with-explanations
// only works when every heading needs explaining, and "Company" does not.
// Inventing a subtitle for it ("where they work and what they do there") only
// moved the problem, because now the slide was explaining a word nobody needed
// explained.
//
// As two plain lists the structure is honest about what these are. Intent leads
// because it is the part a sponsor cannot get anywhere else: every other event
// can tell you someone's job title, and none of them can tell you that person
// came looking for a co-founder.
// Ordered by what it costs a sponsor to reach these people anywhere else, not
// by how many of them there are. Someone job seeking or starting a company is
// findable; someone who came looking for a co-founder is not, so it anchors the
// list rather than opening it.
export const INTENT = {
  label: 'Intent they tell us',
  items: ['Job seeking', 'Starting a company', 'Raising funds', 'Hiring', 'Looking for a co-founder'],
};

// "& enrich" belongs in the label. As a sentence underneath it was a fourth
// idea competing with three columns; as two words in the heading it is the same
// claim, read at the same moment as the list it describes.
export const COLLECT = {
  label: 'What we collect & enrich',
  items: [
    { name: 'Company' },
    { name: 'Role' },
    { name: 'City' },
    { name: 'Socials', detail: 'GitHub, LinkedIn, X' },
  ],
};

// ── Slide 04: event format + talk rules ────────────────────────────────────
export const FORMAT = {
  headline: 'Event format',
  // "Lightning talks" is the recaps' own word for these. The line also needed a
  // verb: "Three 10-minute lightning talks, then drinks and networking" is a
  // caption, not a sentence.
  subhead: 'Every event runs three 10-minute lightning talks, then drinks and networking.',
};

// Laid out side by side, so each has to hold one line in a 517px column.
// "Educational & informative" did not, and a rule that wraps stops looking like
// a rule; the second word was carrying nothing the first did not already say.
//
// The originals were written for speakers and read as house style ("run long
// and we'll kindly cut you off"), which is charming on a meetup slide and
// flippant in front of a sponsor. These say the same three things as
// standards.
export const RULES = [
  { n: '01', title: 'Under 10 minutes' },
  { n: '02', title: 'Educational' },
  { n: '03', title: 'Technical, no pitches' },
];

// Talks from past events, sitting beside the rules as the proof of them.
//
// The stills are our own photographs of each talk, not YouTube's auto-generated
// thumbnails, which are a frame the encoder picked and looked it. They are also
// local files rather than anything fetched at render time: a deck gets opened
// in venues with hostile wifi, and a rule about talk quality illustrated by
// three broken images is worse than no illustration.
//
// They are 4:3 and the cards are 16:9, so each is centre-cropped by objectFit.
// Check the crop when swapping one in; a speaker near the top or bottom edge
// loses their head to it.
export interface Talk {
  id: string;
  title: string;
  speaker: string;
}

export const TALKS: Talk[] = [
  { id: 'KSmPCenbWJk', title: 'What The Hell Is An Agent?', speaker: 'Misha Kolesnik' },
  { id: 'KRzbyKm1thI', title: 'Me, My Slop, and I', speaker: 'Alex Lajarre' },
  { id: 'uZo2NWtdfsc', title: 'Harness the Harness', speaker: 'Juan Cruz Fortunatti' },
];

// Imported, not referenced by path out of public/. An asset in public/ ships at
// a stable URL, so replacing one leaves Cloudflare serving the previous bytes
// for its full max-age (four hours here) and the deploy looks like it silently
// did nothing. That is exactly what happened the first time these were swapped.
// Through the bundler each file gets a content-hashed name, so changing the
// image changes the URL and no cache anywhere can hold the old one.
//
// Astro hands back ImageMetadata for images under src/; a plain Vite build
// hands back a string. Take whichever arrived.
import misha from '../../assets/talks/KSmPCenbWJk.jpg';
import alex from '../../assets/talks/KRzbyKm1thI.jpg';
import juan from '../../assets/talks/uZo2NWtdfsc.jpg';

type Imported = string | { src: string };
const url = (m: Imported) => (typeof m === 'string' ? m : m.src);

const THUMBS: Record<string, Imported> = {
  KSmPCenbWJk: misha,
  KRzbyKm1thI: alex,
  uZo2NWtdfsc: juan,
};

export const talkThumb = (id: string) => url(THUMBS[id]);
export const talkUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

// ── Slide 05: packages ─────────────────────────────────────────────────────
export interface Benefit {
  text: string;
  // Only the ask slide carries one. It is the benefit nobody can picture from
  // its own name, and the line that turns a logo placement into a reason to
  // buy the tier.
  note?: string;
}

export interface Tier {
  name: string;
  benefits: Benefit[];
  prices: { period: string; price: string; note?: string }[];
  featured: boolean;
}

export const TIERS: Tier[] = [
  {
    name: 'Partner',
    benefits: [
      { text: 'Logo on the event page, recaps and intro slides' },
      { text: 'Mention during the event opening' },
      { text: 'Merch and swag distribution at the event' },
      {
        text: 'One ask slide, presented by the organizer',
        // Held to one line at 22px in a 702px column. Two lines here is what
        // pushed the panel into the word 'Packages'.
        note: 'Roles you are hiring for, a raise, a partner you are seeking',
      },
      { text: 'Access to the enriched attendee list' },
    ],
    prices: [
      { period: 'Single event', price: '$1,000' },
      { period: '3 months', price: '$2,400', note: '20% off' },
    ],
    featured: true,
  },
  {
    name: 'Community',
    benefits: [
      { text: 'Logo on the event page, recaps and intro slides' },
      { text: 'Mention during the event opening' },
      { text: 'Merch and swag distribution at the event' },
    ],
    prices: [
      { period: 'Single event', price: '$400' },
      { period: '3 months', price: '$950', note: '20% off' },
    ],
    featured: false,
  },
];

// Footnotes under the panels rather than a subhead: still the lines that
// protect everything above them, but as a headline they made the slide read as
// a disclaimer before it read as a price list.
//
// The first is the site's own partner copy. It explains why the tiers are
// limited, which is what the deleted "exclusive, 1 per period" labels were
// doing badly: scarcity stated as a policy reads as principle, stated as a
// badge next to a price it reads as a sales tactic.
// One paragraph, not two stacked lines. As separate blocks the second sentence
// read as a caveat appended to the first; run together they are one statement
// of terms, and the whole thing sets in two lines instead of three, which the
// panels underneath get to keep.
export const TERMS =
  'We keep sponsorships small and well-matched, with partners who see value in being part of this community. Sponsorship never buys stage time. Talks are selected on merit.';

// ── Slide 06: the close ────────────────────────────────────────────────────
// The deck used to end on the meetup deck's "Where to find us": three QR codes
// for Telegram, Substack and YouTube. That is the right close for a room full
// of attendees and the wrong one for a sponsor, who has just read a price list
// and has no way to reply to it. A deck that never asks for anything does not
// get answered.
//
// Headline and subhead are the site's own partner section, so the deck lands on
// the same words a sponsor finds if they go looking. The em dash in the
// original is a comma here.
export const CLOSE = {
  headline: 'Partner with us',
  subhead:
    "Become an early backer of Agentic Engineering and help us grow a high-signal community in Lisbon, one of Europe's fastest-growing AI and tech hubs.",
  email: 'partners@agnteng.com',
};
