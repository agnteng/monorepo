import { useEffect, useRef } from 'react';
import Animation from '../Animation';
import Image from '../Image';
import { drawOverlay } from '../animation-builder/overlay';
import { C, STAGE_H, STAGE_W, type SlideProps } from '../slides/deck';
import { TONIGHT } from './content';
import WetSummit from './WetSummit';

// ─────────────────────────────────────────────────────────────────────────
// 01 — Title. See ../slides/SlideTitle.tsx for the full composition notes;
// this is the same slide with this meetup's own TONIGHT.
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
      <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {/* Storm week: Web Summit, corrected in marker. Top right, tilted. */}
      <WetSummit
        style={{
          position: 'absolute',
          top: 70,
          right: 90,
          width: 380,
          transform: 'rotate(10deg)',
          filter: 'drop-shadow(0 2px 3px rgba(5,7,30,0.7)) drop-shadow(0 8px 24px rgba(5,7,30,0.6))',
        }}
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
