import { C, PAD, type SlideProps } from '../slides/deck';
import { Backdrop, Frame, Headline, Subhead } from '../slides/parts';
import { COMMUNITY, EVENTS, type PastEvent } from './content';

// ─────────────────────────────────────────────────────────────────────────
// 02 — The room. The meetup deck's two-card slide with the third event added.
//
// Three cards, not two, so the card is narrower and the photo has to lose
// height with it — the meetup deck's 462 at this width would set a portrait
// crop of a room shot, which is the wrong crop for a room. Height tracks the
// original's 0.588 aspect so all three still read as the same object.
//
// The subhead runs to two lines here, so it is set smaller than the deck's
// default and held to a measure rather than the full 1664: a 40px line across
// the whole stage is about 90 characters, which is past the point where the
// eye reliably finds the start of the next one.
//
// Cards carry a city and a date and nothing else. Per-event attendance lived
// here in the first draft and said the same thing as the stat block two slides
// later, less well — three numbers under three photos invite comparison
// between the events, which is not the argument this slide is making.
// ─────────────────────────────────────────────────────────────────────────

const GAP = 40;
const CARD_W = (1920 - PAD * 2 - GAP * (EVENTS.length - 1)) / EVENTS.length;
// Taller than the meetup deck's 0.588. With the attendance line gone the cards
// no longer reached far enough up the stage, and the slide read as a headline
// with a strip of photos parked at the bottom. These are the argument, so they
// get the room.
const CARD_H = Math.round(CARD_W * 0.74);

export function Background({ active }: SlideProps) {
  return <Backdrop fade="radial" motion={22} paused={!active} />;
}

export function Content() {
  return (
    <Frame>
      <Headline>{COMMUNITY.headline}</Headline>
      <Subhead style={{ lineHeight: 1.34, maxWidth: 1380 }}>{COMMUNITY.subhead}</Subhead>

      <div style={{ display: 'flex', gap: GAP, marginTop: 'auto' }}>
        {EVENTS.map((e) => (
          <Card key={`${e.city}-${e.date}`} event={e} />
        ))}
      </div>
    </Frame>
  );
}

function Card({ event }: { event: PastEvent }) {
  return (
    <div style={{ width: CARD_W, flex: 'none' }}>
      <div
        style={{
          position: 'relative',
          height: CARD_H,
          borderRadius: 20,
          overflow: 'hidden',
          background: C.panelNavy,
          border: '1px solid rgba(181,166,255,0.18)',
        }}
      >
        <img
          src={event.photo}
          alt={`Agentic Engineering ${event.city}, ${event.date}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'baseline', gap: 20 }}>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: C.white,
          }}
        >
          {event.city}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: C.periwinkle }}>{event.date}</span>
      </div>
    </div>
  );
}
