import event from '@content/2026-11-11/event.json';
import type { Speaker } from '../slides/deck';

// ─────────────────────────────────────────────────────────────────────────
// Per-meetup content for the Lisbon — 2026-11-11 deck. Same split as
// ../slides/content.ts: geometry, palette and slide primitives are shared;
// only TONIGHT, SPEAKERS and the Luma event id are this meetup's own.
// ─────────────────────────────────────────────────────────────────────────

// Identity of the event (city, date, venue, Luma, speakers) lives in
// content/2026-11-11/event.json, shared with that event's write-up and videos.
export const TONIGHT = { city: event.city, date: event.tonight } as const;

// This event's Luma api_id — the supporter list on the "support" slide and
// the "who's in the room" numbers are both pulled from here (see
// src/lib/luma.ts, the page frontmatter, and src/pages/api/audience.json.ts).
// Find it via the Luma dashboard or `calendar/list-events`.
export const LUMA_EVENT_API_ID = event.luma.apiId;

// Public registration page — safe to ship to the client, unlike the api key.
// Used on the "support" slide to link the ticket screenshot back to Luma.
export const LUMA_EVENT_URL = event.luma.url;

// Event start, from Luma's own start_at. Gates the "who's in the room" slide:
// before this instant it shows everyone registered, from this instant on it
// switches to checked-in guests only. See getEventAudience in src/lib/luma.ts.
export const LUMA_EVENT_START_AT = event.luma.startAt;

// No sponsors this month, so this deck has no sponsor slides. To add one
// back, copy Sponsor/SPONSORS and SlideSponsor.tsx from ../slides-2026-09-23.

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
