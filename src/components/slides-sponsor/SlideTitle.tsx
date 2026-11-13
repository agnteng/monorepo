import { useEffect, useRef } from 'react';
import Animation from '../Animation';
import { drawOverlay } from '../animation-builder/overlay';
import { C, STAGE_H, STAGE_W, type SlideProps } from '../slides/deck';
import { TITLE } from './content';

// ─────────────────────────────────────────────────────────────────────────
// 01 — Title. The meetup deck's cover with the event stripped out of it: no
// venue photo sampled into the field, no city pill, and the date line carrying
// the subject instead.
//
// The photo is what goes first. On the meetup cover the field samples the room
// so the audience recognises where they are sitting; a sponsor opening a PDF is
// nowhere, and a photo of one specific night would date the deck the moment the
// next one happens. Without an image the aurora runs on its own — which is the
// wordmark's own animation, and the one thing on this slide that is not an
// assertion about an event.
//
// Density drops from the cover's 0.65 to 0.5 and motion from 82 to 64: with no
// image driving contrast the field is uniform, and at cover settings a flat
// field of that weight reads as noise behind the lockup rather than texture.
// ─────────────────────────────────────────────────────────────────────────

const LOGO_SCALE = 1.085;
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
        density={0.5}
        motion={64}
        fade="none"
        shape="square"
        paused={!active}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
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
        // An empty city draws no pill and recentres the lockup — see
        // drawCoverGroup. The line that held the date holds the subject here.
        coverGroup: {
          scale: LOGO_SCALE,
          variant: 'white',
          city: '',
          date: TITLE.line,
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
      {/* fades out the moment the presenter touches a key — see DeckEngine */}
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
