import DeckEngine from '../slides/DeckEngine';
import type { Slide } from '../slides/deck';
import * as Title from './SlideTitle';
import * as Community from './SlideCommunity';
import * as Audience from './SlideAudience';
import * as Format from './SlideFormat';
import * as Packages from './SlidePackages';
import * as Close from './SlideClose';

// ─────────────────────────────────────────────────────────────────────────
// The sponsorship deck. Same engine and same primitives as the meetup deck;
// only the running order and the content differ.
//
// The order is the argument: here is the room, here is who is in it and what
// we know about them, here is how the evening works, and only then what it
// costs. Packages before the audience would make it a rate card.
//
// The close is this deck's own, not the meetup deck's "Where to find us". The
// channels are still on it, but a sponsor who has just read a price list needs
// an address to reply to, and three QR codes for a Telegram group is not one.
// The meetup deck keeps the shared slide unchanged; its audience is in the
// room already.
// ─────────────────────────────────────────────────────────────────────────

const SLIDES: Slide[] = [Title, Community, Audience, Format, Packages, Close];

export default function SponsorDeck() {
  return <DeckEngine slides={SLIDES} />;
}
