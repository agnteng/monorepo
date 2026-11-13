import { C, LINKS, PAD, type SlideProps } from '../deck';
import { Backdrop, Body, Frame, Header, Headline } from '../parts';

// ─────────────────────────────────────────────────────────────────────────
// 06 — Where to find us. Same headline and channels as the standing meetup
// deck (../slides/SlideLinks.tsx); the compact horizontal channel cards are
// the sponsorship deck's (../slides-sponsor/SlideClose.tsx) rather than the
// QR-on-top cards, minus its email CTA — that part is sponsor-specific.
// ─────────────────────────────────────────────────────────────────────────

// QR/padding/gap match the sponsorship deck's proven Channel sizing
// (../slides-sponsor/SlideClose.tsx) — the larger values this slide had
// before left too little room for the longest url ("agnteng.substack.com")
// to fit, and since it's one unbroken token it can't wrap, so it overflowed
// the card instead.
const GAP = 32;
const PANEL_W = (1920 - PAD * 2 - GAP * (LINKS.length - 1)) / LINKS.length;
const QR = 168;

export function Background({ active }: SlideProps) {
  return <Backdrop animation="drift" fade="radial" motion={22} density={0.4} opacity={0.5} paused={!active} />;
}

export function Content({ active }: SlideProps) {
  return (
    <Frame>
      <Header>
        <Headline>Where to find us</Headline>
      </Header>

      <Body>
        <div style={{ display: 'flex', gap: GAP }}>
          {LINKS.map((l) => (
            <Channel key={l.name} {...l} active={active} />
          ))}
        </div>
      </Body>
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
        borderRadius: 24,
        background: C.panelNavy,
        border: '1px solid rgba(181,166,255,0.22)',
      }}
    >
      <img
        src={qr}
        alt={`QR code for ${url}`}
        style={{ width: QR, height: QR, flex: 'none', borderRadius: 12, background: '#fff' }}
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
            overflowWrap: 'anywhere',
          }}
        >
          {url}
        </span>
      </span>
    </a>
  );
}
