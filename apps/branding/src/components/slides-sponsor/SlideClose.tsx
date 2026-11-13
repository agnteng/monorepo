import { C, LINKS, PAD, type SlideProps } from '../slides/deck';
import { Backdrop, Frame, Headline, Subhead } from '../slides/parts';
import { CLOSE } from './content';

// ─────────────────────────────────────────────────────────────────────────
// 06 — The close. An address to reply to, then the channels.
//
// The deck used to end on the meetup deck's "Where to find us", which is the
// right last slide for a room of attendees and the wrong one for a sponsor:
// they have just read a price list and the deck offers them a Telegram group.
// The email is the whole point of the slide, so it is the largest thing on it
// and the channels sit underneath at a size that reads as supporting material.
//
// Everything clickable, gated on `active` like the rest of the deck: every
// slide stays mounted at opacity 0, so an ungated anchor is a live link over
// all six.
// ─────────────────────────────────────────────────────────────────────────

const GAP = 32;
const PANEL_W = (1920 - PAD * 2 - GAP * (LINKS.length - 1)) / LINKS.length;
const QR = 168;

export function Background({ active }: SlideProps) {
  return <Backdrop animation="drift" fade="radial" motion={22} density={0.4} opacity={0.5} paused={!active} />;
}

export function Content({ active }: SlideProps) {
  return (
    <Frame>
      <Headline>{CLOSE.headline}</Headline>
      {/* Wide enough for two lines. At 1180 it broke into three and hyphenated
          "high-signal" across the turn, which is the one word on the slide that
          has to read as one. */}
      <Subhead style={{ margin: '24px 0 0', lineHeight: 1.34, maxWidth: 1520 }}>
        {CLOSE.subhead}
      </Subhead>

      <a
        href={`mailto:${CLOSE.email}?subject=Agentic%20Engineering%20sponsorship`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={active ? 0 : -1}
        style={{
          marginTop: 44,
          alignSelf: 'flex-start',
          pointerEvents: active ? 'auto' : 'none',
          cursor: 'pointer',
          textDecoration: 'none',
          fontFamily: 'var(--font-mono)',
          fontSize: 72,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          // Periwinkle, the same tone the Engineers band carries on slide 03.
          // In brand blue the address sat at almost the value of the field
          // behind it and read as a link rather than as the point of the slide.
          color: C.periwinkle,
        }}
      >
        {CLOSE.email}
      </a>

      <div style={{ display: 'flex', gap: GAP, marginTop: 'auto' }}>
        {LINKS.map((l) => (
          <Channel key={l.name} {...l} active={active} />
        ))}
      </div>
    </Frame>
  );
}

function Channel({ name, url, href, qr, active }: (typeof LINKS)[number] & { active: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      tabIndex={active ? 0 : -1}
      style={{
        width: PANEL_W,
        flex: 'none',
        pointerEvents: active ? 'auto' : 'none',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        padding: 28,
        borderRadius: 20,
        background: C.panelNavy,
        border: '1px solid rgba(181,166,255,0.22)',
      }}
    >
      <img
        src={qr}
        alt={`QR code for ${url}`}
        style={{ width: QR, height: QR, flex: 'none', borderRadius: 10, background: '#fff' }}
      />
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-sans)',
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: C.white,
          }}
        >
          {name}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 10,
            fontFamily: 'var(--font-mono)',
            fontSize: 21,
            color: C.brightBlue,
          }}
        >
          {url}
        </span>
      </span>
    </a>
  );
}
