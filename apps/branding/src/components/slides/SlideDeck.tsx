import DeckEngine from './DeckEngine';
import type { Slide } from './deck';
import * as Title from './SlideTitle';
import * as Community from './SlideCommunity';
import * as Links from './SlideLinks';
import * as Ask from './SlideAsk';
import * as Rules from './SlideRules';

// ─────────────────────────────────────────────────────────────────────────
// The meetup deck — the running order, and nothing else. All the presentation
// machinery lives in DeckEngine, shared with the sponsorship deck.
//
// Title → community → the ask → talk rules → and the links last, so the QR
// codes are what stays on screen once the intro ends.
// ─────────────────────────────────────────────────────────────────────────

const SLIDES: Slide[] = [Title, Community, Ask, Rules, Links];

export default function SlideDeck() {
  return <DeckEngine slides={SLIDES} />;
}
