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
// The Lisbon — 2026-09-23 meetup deck.
//
// Title → community → this month's sponsors (one slide per entry in
// SPONSORS) → who's in the room (live Luma audience mix) → support the
// meetup (Luma supporter list) → talk rules → where to find us. Every slide
// here is this deck's own — none are imported directly from ../slides, so
// nothing about the earlier standing decks changes.
//
// Sponsors run before "who's in the room" rather than after it: the room
// slide leads into the speakers, so anything between it and the talks is an
// interruption.
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
  const intro: Slide[] = [createTitleSlide(TONIGHT), createCommunitySlide(COMMUNITY, COMMUNITY_PHOTOS)];
  const sponsorSlides = SPONSORS.map(createSponsorSlide);
  const rest: Slide[] = [createAudienceSlide(audience, SPEAKERS), createSupportSlide(supporters, LUMA_EVENT_URL), Rules, LinksSlide];

  const SLIDES: Slide[] = [...intro, ...sponsorSlides, ...rest];
  // Sponsors sit directly after `intro`, and LinksSlide is always last — both
  // derived from the arrays rather than written as literals, so reordering the
  // deck above cannot leave the loop pointing at the wrong slides.
  const loopIndices = [0, ...sponsorSlides.map((_, idx) => intro.length + idx), SLIDES.length - 1];

  return <DeckEngine slides={SLIDES} loopIndices={loopIndices} loopIntervalMs={10000} />;
}
