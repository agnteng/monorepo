import type { CSSProperties, ReactNode } from 'react';
import qrcode from 'qrcode-generator';
import Animation from '../Animation';
import type { AnimName } from '../Animation';
import { C, PAD, PAD_TOP } from './deck';

// ─────────────────────────────────────────────────────────────────────────
// Shared slide primitives.
//
// A slide is split in two layers, because the deck letterboxes a 16:9 stage
// into a viewport that is usually NOT 16:9 (a 16:10 laptop leaves ~70px bars):
//
//   Background — full viewport, no transform. Owns the surface colour and the
//                animated field, so colour reaches every edge of the screen.
//   Content    — inside the scaled 1920×1080 stage. Owns all type and imagery,
//                so the composition keeps its exact proportions everywhere.
//
// Content sizes are absolute px against that 1920×1080 stage; nothing here is
// responsive by design.
// ─────────────────────────────────────────────────────────────────────────

/** Full-viewport backdrop: navy + the house field. Lives in the background layer. */
export function Backdrop({
  animation = 'aurora',
  fade = 'none',
  motion = 26,
  density = 0.34,
  opacity = 0.45,
  paused = false,
  children,
}: {
  animation?: AnimName;
  fade?: 'none' | 'left' | 'right' | 'up' | 'down' | 'radial';
  motion?: number;
  density?: number;
  opacity?: number;
  paused?: boolean;
  children?: ReactNode;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.navy, overflow: 'hidden' }}>
      <Animation
        animation={animation}
        color="#1E2BE6"
        edge="#ED4BA0"
        bg="#05071E"
        cell={6}
        gap={1}
        density={density}
        motion={motion}
        fade={fade}
        shape="square"
        paused={paused}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity }}
      />
      {children}
    </div>
  );
}

/** The padded content column every slide lays out inside. */
export function Frame({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: `${PAD_TOP}px ${PAD}px ${PAD}px`,
        color: C.white,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Gap between a slide's header and its content, put on Header itself (not
 *  Frame) so it only shows up on slides that actually use Header/Body. */
const HEADER_GUTTER = 56;

/** A slide's title (+ optional description), sized to its own content — never
 *  stretched or pushed around by what's below it. */
export function Header({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ flex: 'none', marginBottom: HEADER_GUTTER, ...style }}>{children}</div>;
}

/** Everything below the header. Takes whatever height is left in the Frame
 *  and centers its content vertically inside that space by default. */
export function Body({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Headline({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h1
      style={{
        margin: 0,
        fontFamily: 'var(--font-sans)',
        fontSize: 88,
        fontWeight: 800,
        lineHeight: 1.02,
        letterSpacing: '-0.03em',
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function Subhead({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p
      style={{
        margin: '28px 0 0',
        fontFamily: 'var(--font-sans)',
        // One size and one colour for every description in both decks. They had
        // drifted to five sizes between 30 and 44 and two colours, so the line
        // under the title changed weight from slide to slide and read as five
        // different kinds of thing rather than one.
        fontSize: 34,
        fontWeight: 500,
        color: C.white,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

/** Dashed placeholder box for a slide asset (logo, screenshot) not filled in yet. */
export function Placeholder({ height, label }: { height: number; label: string }) {
  return (
    <div
      style={{
        height,
        borderRadius: 20,
        border: '2px dashed rgba(244,245,255,0.22)',
        background: 'rgba(244,245,255,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 22,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(244,245,255,0.35)',
      }}
    >
      {label}
    </div>
  );
}

/** Scannable QR code linking to `value`. White quiet zone is drawn in, so it
 *  stays scannable when dropped straight onto the navy backdrop. */
export function QRCode({ value, size = 120, style }: { value: string; size?: number; style?: CSSProperties }) {
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const quietZone = 2; // modules of white margin — under this, phone cameras miss the finder patterns
  const totalModules = moduleCount + quietZone * 2;
  const cell = size / totalModules;

  const modules: ReactNode[] = [];
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        modules.push(
          <rect
            key={`${row}-${col}`}
            x={(col + quietZone) * cell}
            y={(row + quietZone) * cell}
            width={cell}
            height={cell}
            fill={C.navy}
          />,
        );
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', ...style }}>
      <rect width={size} height={size} fill={C.white} rx={10} />
      {modules}
    </svg>
  );
}

/** `01  ORGANIZE   Help run the next one.` — the list row used on slides 04/05. */
export function NumberedRow({
  n,
  title,
  body,
  titleWidth = 460,
  size = 46,
  divider = true,
}: {
  n: string;
  title: string;
  body: string;
  titleWidth?: number;
  size?: number;
  divider?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 40,
        padding: '30px 0',
        borderTop: divider ? '1px solid rgba(244,245,255,0.14)' : 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: size * 0.62,
          fontWeight: 600,
          color: C.periwinkle,
          width: 72,
          flex: 'none',
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: size,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          width: titleWidth,
          flex: 'none',
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: size * 0.72,
          fontWeight: 500,
          color: 'rgba(244,245,255,0.62)',
          flex: 1,
        }}
      >
        {body}
      </span>
    </div>
  );
}
