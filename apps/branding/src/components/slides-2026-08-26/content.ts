import event from '@content/2026-08-26/event.json';
import type { Speaker } from '../slides/deck';

// ─────────────────────────────────────────────────────────────────────────
// Per-meetup content for the Lisbon — 2026-08-26 deck. Same split as
// ../slides/content.ts: geometry, palette and slide primitives are shared;
// only TONIGHT, EVENTS, SPONSORS and the Luma event id are this meetup's own.
// ─────────────────────────────────────────────────────────────────────────

// Identity of the event (city, date, venue, Luma, speakers) lives in
// content/2026-08-26/event.json, shared with that event's write-up and videos.
export const TONIGHT = { city: event.city, date: event.tonight } as const;

// This event's Luma api_id — the supporter list on the "support" slide is
// pulled from here at build time (see src/lib/luma.ts and the page's
// frontmatter). Find it via the Luma dashboard or `calendar/list-events`.
export const LUMA_EVENT_API_ID = event.luma.apiId;

// Public registration page — safe to ship to the client, unlike the api key.
// Used on the "support" slide to link the ticket screenshot back to Luma.
export const LUMA_EVENT_URL = event.luma.url;

// Event start, from Luma's own start_at. Gates the "who's in the room" slide:
// before this instant it shows everyone registered, from this instant on it
// switches to checked-in guests only. See getEventAudience in src/lib/luma.ts.
export const LUMA_EVENT_START_AT = event.luma.startAt;

export interface Sponsor {
  name: string;
  // Image paths under /assets. Falls back to a labelled placeholder box when
  // unset — see SlideSponsor.tsx.
  logo: string | null;
  screenshot: string | null;
  // What they need from the room: hiring, raising, intros, "try the product" —
  // whatever the pitch is this month.
  ask: string;
  // Where the room should go — a bare domain/path, not a full URL, to print.
  cta: { text: string; href: string };
}

// This month's sponsors — one slide per entry, in order. Swap or extend for
// whoever sponsors next month.
export const SPONSORS: Sponsor[] = [
  {
    name: 'PostHog',
    // Drop a logo file at public/assets/sponsors/posthog-logo.svg and point
    // this at it — no logo supplied yet, so this stays a placeholder.
    logo: null,
    screenshot: '/assets/sponsors/posthog-screenshot.jpeg',
    ask: 'PostHog Desktop brings coding agents, product context, and team processes into one app. Organize work in spaces, ask agents to produce code or interactive canvases, and turn product signals into action.',
    cta: { text: 'posthog.com/desktop', href: 'https://posthog.com/desktop' },
  },
  {
    name: 'HackMeridian',
    logo: null,
    screenshot: '/assets/sponsors/hackmeridian-screenshot.jpeg',
    ask: "Stellar's annual hackathon is happening October 25–26 in Lisbon. For two days, 500 builders will hack to claim a piece of the $30,000 prize pool.",
    cta: { text: 'hackmeridian.com', href: 'https://hackmeridian.com' },
  },
];

// Same copy as the sponsorship deck's slide 02 — a real sentence with a real
// verb, not the meetup deck's fragment-style subhead.
export const COMMUNITY = {
  headline: 'The room for agentic engineering',
  subhead:
    'Agentic Engineering is for people building software, infrastructure and companies with agentic workflows. We have met every month since May 2026.',
};

// Six image slots, not a dated event list — just the room. Add a path to
// fill one in; leave it null for a placeholder box. See SlideCommunity.tsx.
export const COMMUNITY_PHOTOS: (string | null)[] = [
  '/assets/photos/community/slide2-speaker-mic.jpg',
  '/assets/photos/community/slide2-group-photo.jpg',
  '/assets/photos/events/lisbon-may2026.jpg',
  '/assets/photos/community/slide2-audience.jpg',
  '/assets/photos/community/slide2-laptop-demo-flipped-v2.jpg',
  '/assets/photos/community/slide2-harness-talk.jpg',
];

// Swapped in each month. See SlideAudience.tsx.
export const SPEAKERS: Speaker[] = event.speakers;
