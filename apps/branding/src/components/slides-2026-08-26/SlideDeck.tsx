import DeckEngine from '../slides/DeckEngine';
import type { Slide } from '../slides/deck';
import type { AudienceData } from '../../lib/luma';
import { createTitleSlide } from '../slides/meetup/Title';
import { createCommunitySlide } from '../slides/meetup/Community';
import { createAudienceSlide } from '../slides/meetup/Audience';
import { createSponsorSlide } from './SlideSponsor';
import { createSupportSlide } from '../slides/meetup/Support';
import * as Rules from '../slides/meetup/Rules';
import * as LinksSlide from '../slides/meetup/Links';
import { COMMUNITY, COMMUNITY_PHOTOS, LUMA_EVENT_URL, TONIGHT, SPEAKERS, SPONSORS } from './content';

// ─────────────────────────────────────────────────────────────────────────
// The Lisbon — 2026-08-26 meetup deck.
//
// Title → community → who's in the room (live Luma audience mix) → this
// month's sponsors (one slide per entry in SPONSORS) → support the meetup
// (Luma supporter list) → talk rules → where to find us. Every slide here is
// this deck's own — none are imported directly from ../slides, so nothing
// about the standing Jul 29 deck changes.
//
// Pressing "S" drops the deck into an unattended loop over the title slide,
// the sponsor slides, and "where to find us" (10s each, in that order) —
// sponsors asked to have their slide up during the meet-and-greet and
// drinks, when nobody's on the clicker, and the links slide gives the room
// something to scan while it's up. Pressing "S" again returns to normal
// manual navigation.
// ─────────────────────────────────────────────────────────────────────────

export default function SlideDeck({
  supporters,
  audience,
}: {
  supporters: string[];
  audience: AudienceData;
}) {
  const preSponsor: Slide[] = [createTitleSlide(TONIGHT), createCommunitySlide(COMMUNITY, COMMUNITY_PHOTOS), createAudienceSlide(audience, SPEAKERS)];
  const sponsorSlides = SPONSORS.map(createSponsorSlide);
  const postSponsor: Slide[] = [createSupportSlide(supporters, LUMA_EVENT_URL), Rules, LinksSlide];

  const SLIDES: Slide[] = [...preSponsor, ...sponsorSlides, ...postSponsor];
  // LinksSlide is always last in SLIDES — see the deck order above.
  const loopIndices = [0, ...sponsorSlides.map((_, idx) => preSponsor.length + idx), SLIDES.length - 1];

  return <DeckEngine slides={SLIDES} loopIndices={loopIndices} loopIntervalMs={10000} />;
}
