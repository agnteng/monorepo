import { C, LINKS, PAD, type SlideProps } from './deck';
import { Backdrop, Frame, Headline } from './parts';

// ─────────────────────────────────────────────────────────────────────────
// Where to find us. The closing slide, so it stays up while the room talks:
// platform name and URL, nothing else. The QR does the explaining.
//
// QR codes need a light field and their quiet zone intact, so the tiles stay
// white rather than being tinted to brand.
//
// Three panels, not two, so the code sits above its label rather than beside
// it: at a third of the stage each, a side-by-side QR left about 120px for
// "agnteng.substack.com", which is a third of what that string needs.
//
// The panels are anchors. Someone reading this on a laptop should be able to
// click through rather than photograph their own screen, and the QR still
// serves the room. Two things make that work against the deck's own click
// handling: the anchor stops propagation so following a link does not also
// advance the slide, and it only accepts pointer events while its slide is
// active, because every slide stays mounted and merely fades to opacity 0.
// Without the gate these three sit invisibly over the whole deck.
// ─────────────────────────────────────────────────────────────────────────

const GAP = 44;
const PANEL_W = (1920 - PAD * 2 - GAP * (LINKS.length - 1)) / LINKS.length;
const QR = 232;

export function Background({ active }: SlideProps) {
  return <Backdrop animation="drift" fade="radial" motion={22} density={0.4} opacity={0.5} paused={!active} />;
}

export function Content({ active }: SlideProps) {
  return (
    <Frame>
      <Headline>Where to find us</Headline>

      <div style={{ display: 'flex', gap: GAP, marginTop: 'auto' }}>
        {LINKS.map((l) => (
          <Panel key={l.name} {...l} active={active} />
        ))}
      </div>
    </Frame>
  );
}

function Panel({
  name,
  url,
  href,
  qr,
  active,
}: (typeof LINKS)[number] & { active: boolean }) {
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
        display: 'block',
        padding: 40,
        borderRadius: 24,
        background: C.panelNavy,
        border: '1px solid rgba(181,166,255,0.22)',
      }}
    >
      <img
        src={qr}
        alt={`QR code for ${url}`}
        style={{ display: 'block', width: QR, height: QR, margin: '0 auto', borderRadius: 12, background: '#fff' }}
      />
      <div
        style={{
          marginTop: 34,
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: 46,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: C.white,
        }}
      >
        {name}
      </div>
      <div
        style={{
          marginTop: 14,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 26,
          color: C.brightBlue,
          whiteSpace: 'nowrap',
        }}
      >
        {url}
      </div>
    </a>
  );
}
