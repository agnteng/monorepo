import type { ReactNode } from 'react';
import type { OverlayAssets } from '../animation-builder/overlay';

// ─────────────────────────────────────────────────────────────────────────
// Deck constants + content. Content sizes are authored in fixed px against a
// 1920×1080 stage; SlideDeck applies a single CSS transform to fit it to the
// viewport. See parts.tsx for the background/content layer split.
// ─────────────────────────────────────────────────────────────────────────

export const STAGE_W = 1920;
export const STAGE_H = 1080;

/** Slide gutter. All content lives inside this margin. */
export const PAD = 128;

/** The top gutter is tighter than the other three. Optically centring a
 *  headline inside an even margin sits it lower than it looks like it should,
 *  because the cap height starts well below the top of its line box; every
 *  slide read as though its title had slipped down the stage. Pulling the top
 *  in also hands the space back to the content underneath, which is where the
 *  deck was short. */
export const PAD_TOP = 72;

/** What SlideDeck hands every slide layer. */
export interface Speaker {
  name: string;
  // Their role, e.g. "Founder, Acme" — not the talk title.
  title: string;
  // Image path under /assets, or null for a placeholder headshot.
  photo: string | null;
}

export interface SlideProps {
  active: boolean; // drives `paused` on any <Animation> the slide owns
  assets: OverlayAssets; // preloaded logo SVGs, hoisted to the deck
  fontsReady: boolean;
  started: boolean; // false until the first key/click — gates the start hint
  step: number; // build step within this slide; 0 unless the slide declares `steps`
}

/** A slide is a full-viewport backdrop plus a 16:9 content composition. */
export interface Slide {
  Background: (p: SlideProps) => ReactNode;
  Content: (p: SlideProps) => ReactNode;
  /** Extra "next" presses this slide consumes before the deck advances — each
   *  one bumps `step` (0 → steps). Back walks the steps down again. Omit for a
   *  slide with no builds. */
  steps?: number;
}

// Brand palette, duplicated here as plain hex because slides paint onto canvas
// and inline styles as often as they use Tailwind classes.
export const C = {
  navy: '#05071E',
  panelNavy: '#0B0E2A',
  white: '#F4F5FF',
  blue: '#1E2BE6',
  brightBlue: '#3A4DFF',
  periwinkle: '#B5A6FF',
  magenta: '#ED4BA0',
  yellow: '#F9C835',
} as const;

export interface PastEvent {
  city: string;
  date: string;
  photo: string;
}

// TONIGHT, COMMUNITY and EVENTS are per-meetup, not per-deck-engine — each
// dated deck folder (e.g. slides-2026-08-26/) carries its own content.ts with
// these three, same split as slides-sponsor/content.ts.

// ── Slide 03: where to find us ─────────────────────────────────────────────
// `url` is what gets printed; `href` is what a click follows. They differ only
// by the scheme, which is noise on a slide and required in an anchor.
export const LINKS = [
  { name: 'Telegram', url: 't.me/agntacc', href: 'https://t.me/agntacc', qr: '/assets/qr/telegram.svg' },
  {
    name: 'Substack',
    url: 'agnteng.substack.com',
    href: 'https://agnteng.substack.com',
    qr: '/assets/qr/substack.svg',
  },
  {
    name: 'YouTube',
    url: 'youtube.com/@agnteng',
    href: 'https://www.youtube.com/@agnteng',
    qr: '/assets/qr/youtube.svg',
  },
];

// ── Slide 04: how to contribute ────────────────────────────────────────────
export const ASKS = [
  { n: '01', title: 'Organize', body: 'Meetups and events' },
  { n: '02', title: 'Build', body: 'Website and tools' },
  { n: '03', title: 'Communicate', body: 'Social and community' },
  { n: '04', title: 'Teach', body: 'Content, resources, newsletter' },
  { n: '05', title: 'Support', body: 'Partners, sponsors, venues' },
];

// ── Talk rules ─────────────────────────────────────────────────────────────
// All three bodies are deliberately the same length (37 chars) so they set as
// one even line each and the block reads as a set, not a paragraph.
export const RULES = [
  { n: '01', title: 'Under 10 min', body: "Run long and we'll kindly cut you off" },
  { n: '02', title: 'Make it useful', body: 'People leave having learned something' },
  { n: '03', title: 'No pitches', body: 'Save the fundraise for the networking' },
];
