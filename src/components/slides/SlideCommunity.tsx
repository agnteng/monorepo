import { C, type PastEvent, type SlideProps } from './deck';
import { COMMUNITY, EVENTS } from './content';
import { Backdrop, Frame, Headline, Subhead } from './parts';

// ─────────────────────────────────────────────────────────────────────────
// 02 — The community. Two photos, bare — no dither, no duotone. The rooms
// themselves are the argument, so nothing is layered over them. Venue lines
// and the stat strip are deliberately gone: the headline is the whole point,
// and the speaker is talking over the photos.
// ─────────────────────────────────────────────────────────────────────────

const GAP = 44;
const CARD_W = (1920 - 128 * 2 - GAP) / 2;

export function Background({ active }: SlideProps) {
  return <Backdrop fade="radial" motion={22} paused={!active} />;
}

export function Content() {
  return (
    <Frame>
      <Headline>{COMMUNITY.headline}</Headline>
      <Subhead>{COMMUNITY.subhead}</Subhead>

      <div style={{ display: 'flex', gap: GAP, marginTop: 'auto' }}>
        {EVENTS.map((e) => (
          <Card key={e.city} event={e} />
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
          height: 462,
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
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: C.white,
          }}
        >
          {event.city}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: C.periwinkle }}>{event.date}</span>
      </div>
    </div>
  );
}
