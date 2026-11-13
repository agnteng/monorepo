import type { PastEvent } from './deck';
import event from '@content/2026-07-29/event.json';

// ─────────────────────────────────────────────────────────────────────────
// Per-meetup content for the Lisbon — 2026-07-29 deck. Geometry, palette and
// slide primitives live in ./deck and ./parts and are shared with every other
// dated deck; only TONIGHT and EVENTS change from one meetup to the next.
// ─────────────────────────────────────────────────────────────────────────

// Identity of the event (city, date, venue, Luma, speakers) lives in
// content/2026-07-29/event.json, shared with that event's write-up and videos.
export const TONIGHT = { city: event.city, date: event.tonight } as const;

// Cities stay out of the subhead — the cards underneath already say Lisbon and
// Berlin. Phrasing echoes the Substack's own positioning ("people building
// software, infrastructure, and companies with agentic workflows").
export const COMMUNITY = {
  headline: 'The room for agentic engineering',
  subhead: '500+ builders and founders shipping with agents',
};

export const EVENTS: PastEvent[] = [
  { city: 'Lisbon', date: '29 May 2026', photo: '/assets/photos/events/lisbon-may2026.jpg' },
  { city: 'Berlin', date: '17 Jun 2026', photo: '/assets/photos/events/berlin-jun2026.jpg' },
];
