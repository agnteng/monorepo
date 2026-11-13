import { useEffect, useRef } from 'react';
import Animation from '@agnteng/brand/components/Animation.tsx';
import Image from '@agnteng/brand/components/Image.tsx';
import { drawOverlay } from '../animation-builder/overlay';
import { C, STAGE_H, STAGE_W, type SlideProps } from './deck';
import { TONIGHT } from './content';

// ─────────────────────────────────────────────────────────────────────────
// 01 — Title. The Luma event cover extended to 16:9.
//
// The field runs full-viewport (background layer) so it bleeds to every edge
// of the screen; the lockup + LISBON pill + date are drawn on a canvas locked
// to the 16:9 stage, so the composition keeps its proportions on any display.
//
// That split is also why the vignette is CSS here rather than the overlay's
// `vignette: true` — a canvas vignette would stop at the 16:9 edge and leave a
// visible seam in the letterbox area. The stops below are a direct translation
// of drawVignette() in overlay.ts (r = min(W,H), 0.18r → 0.72r), expressed
// against `closest-side` (= min(W,H)/2), hence 36% → 144%.
//
// cell={4}, not 2: the Animation Builder normalizes its artboard to a 960px
// long edge, so a cell of 2 there means 480 columns. At real screen widths, 4
// lands in the same register at a quarter of the per-frame rect count.
// ─────────────────────────────────────────────────────────────────────────

// 0.62 × 1.75 — the lockup lands at ~61% of the frame width.
const LOGO_SCALE = 1.085;
// sizes the LISBON pill and the date line up with it
const TEXT_SCALE = 1.3;
const VIGNETTE = 'radial-gradient(circle closest-side, rgba(5,7,30,0.12) 36%, rgba(5,7,30,0.62) 144%)';

export function Background({ active }: SlideProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.navy, overflow: 'hidden' }}>
      <Animation
        animation="aurora"
        color="#1E2BE6"
        edge="#ED4BA0"
        bg="#05071E"
        cell={4}
        gap={0}
        density={0.65}
        motion={82}
        fade="none"
        shape="square"
        paused={!active}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <Image src="/assets/photos/event-lisbon.jpg" contrast={1.25} edgeGlow={1} tone={0.8} position="center" />
      </Animation>
      <div style={{ position: 'absolute', inset: 0, background: VIGNETTE }} />
    </div>
  );
}

export function Content({ assets, fontsReady, started }: SlideProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    cv.width = STAGE_W;
    cv.height = STAGE_H;
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    drawOverlay(
      ctx,
      STAGE_W,
      STAGE_H,
      {
        coverGroup: {
          scale: LOGO_SCALE,
          variant: 'white',
          city: TONIGHT.city,
          date: TONIGHT.date,
          textScale: TEXT_SCALE,
        },
      },
      assets,
      fontsReady,
    );
  }, [assets, fontsReady]);

  return (
    <>
      <canvas
        ref={ref}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      {/* fades out the moment the presenter touches a key — see SlideDeck */}
      <span
        style={{
          position: 'absolute',
          right: 64,
          bottom: 48,
          fontFamily: 'var(--font-mono)',
          fontSize: 20,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'rgba(244,245,255,0.45)',
          opacity: started ? 0 : 1,
          transition: 'opacity 400ms ease',
        }}
      >
        Press any key
      </span>
    </>
  );
}
