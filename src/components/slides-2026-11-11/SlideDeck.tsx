import DeckEngine from '../slides/DeckEngine';
import type { Slide } from '../slides/deck';
import type { AudienceData } from '../../lib/luma';
import * as Title from './SlideTitle';
import { createCommunitySlide } from '../slides/meetup/Community';
import { createAudienceSlide } from './SlideAudience';
import { createSupportSlide } from '../slides/meetup/Support';
import * as Rules from '../slides/meetup/Rules';
import * as LinksSlide from '../slides/meetup/Links';
import { COMMUNITY, COMMUNITY_PHOTOS, LUMA_EVENT_URL } from './content';

// ─────────────────────────────────────────────────────────────────────────
// The Lisbon — 2026-11-11 meetup deck.
//
// Title → community → who's in the room (live Luma audience mix, with
// tonight's speakers) → support the meetup (Luma supporter list) → talk
// rules → where to find us. Forked from ../slides-2026-09-23 so that deck
// stays as it shipped. No sponsors this month, so no sponsor slides.
//
// Pressing "S" drops the deck into an unattended loop over the title slide
// and "where to find us" (10s each) for the drinks, when nobody's on the
// clicker. Pressing "S" again returns to manual navigation.
// ─────────────────────────────────────────────────────────────────────────

export default function SlideDeck({
  supporters,
  audience,
}: {
  supporters: string[];
  audience: AudienceData;
}) {
  const SLIDES: Slide[] = [
    Title,
    createCommunitySlide(COMMUNITY, COMMUNITY_PHOTOS),
    createAudienceSlide(audience),
    createSupportSlide(supporters, LUMA_EVENT_URL),
    Rules,
    LinksSlide,
  ];
  // No sponsors this month: the "S" loop alternates the title slide and
  // "where to find us" during drinks.
  const loopIndices = [0, SLIDES.length - 1];

  return <DeckEngine slides={SLIDES} loopIndices={loopIndices} loopIntervalMs={10000} />;
}
