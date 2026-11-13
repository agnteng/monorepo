import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFontsReady, useLogoAssets } from '../animation-builder/useLogoAssets';
import { STAGE_H, STAGE_W, type Slide, type SlideProps } from './deck';

// ─────────────────────────────────────────────────────────────────────────
// DeckEngine — presentation machinery, shared by every deck. Two stacked
// layers, because the viewport is usually not 16:9:
//
//   1. Backgrounds: full viewport, untransformed. Colour and field reach every
//      edge, so fullscreen shows no letterbox bars on any slide.
//   2. Content: a fixed 1920×1080 artboard scaled by a single CSS transform.
//      Same trick as CanvasStage — absolute px in, exact proportions out.
//
// <Animation> measures its LAYOUT box, which is immune to ancestor transforms
// (see Animation.tsx), so a background renders at true screen resolution.
//
// Every slide stays mounted and cross-fades via opacity — NOT display:none,
// which would collapse the layout box to 0 and force <Animation> to re-init and
// re-run its image sample + Sobel pass on every slide change. Only the visible
// slide's field runs; the rest are `paused`.
//
// The slide list arrives as a prop rather than being imported here, so a second
// deck is a list plus its slides — not a second copy of the keyboard handling,
// the fullscreen dance and the stage fit. It cannot come from Astro frontmatter
// though: these are components, not serialisable props. Each deck is therefore a
// thin .tsx wrapper that imports its own slides and renders this.
// ─────────────────────────────────────────────────────────────────────────

const NEXT_KEYS = new Set([' ', 'Enter', 'ArrowRight', 'ArrowDown', 'PageDown', 'Spacebar']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace']);

export default function DeckEngine({
  slides,
  loopIndices,
  loopIntervalMs = 10000,
}: {
  slides: Slide[];
  // Slide indices to auto-cycle through when the presenter hits "S" — e.g. the
  // title plus each sponsor slide, so the deck can run unattended during a
  // meet-and-greet without a human on the clicker. Omit (or pass []) to
  // disable the feature for a deck that has no use for it.
  loopIndices?: number[];
  loopIntervalMs?: number;
}) {
  // Slide index plus the build step within it. Every jump that isn't a
  // next/prev press (Home, End, the S loop) lands on step 0.
  const [pos, setPos] = useState({ i: 0, step: 0 });
  const i = pos.i;
  const setI = useCallback((idx: number) => setPos({ i: idx, step: 0 }), []);
  const [scale, setScale] = useState(1);
  const [started, setStarted] = useState(false);
  const [loopMode, setLoopMode] = useState(false);
  const loopPosRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const canLoop = !!loopIndices && loopIndices.length > 0;

  // Auto-advance through loopIndices every loopIntervalMs while loopMode is on.
  useEffect(() => {
    if (!loopMode || !loopIndices || loopIndices.length === 0) return;
    loopPosRef.current = 0;
    setI(loopIndices[0]);
    const id = setInterval(() => {
      loopPosRef.current = (loopPosRef.current + 1) % loopIndices.length;
      setI(loopIndices[loopPosRef.current]);
    }, loopIntervalMs);
    return () => clearInterval(id);
  }, [loopMode, loopIndices, loopIntervalMs, setI]);

  // Loaded once for the whole deck rather than per-slide, so the overlay logo
  // SVGs and Kode Mono metrics are ready before the title slide paints.
  const assets = useLogoAssets();
  const fontsReady = useFontsReady();

  // ── fit the 16:9 content stage into whatever viewport we have ───────────
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fit);
    return () => {
      window.removeEventListener('resize', fit);
      document.removeEventListener('fullscreenchange', fit);
    };
  }, []);

  // A slide with `steps` swallows that many next presses (step 1..steps)
  // before the deck moves on; prev unwinds them first.
  const go = useCallback(
    (d: number) =>
      setPos(({ i, step }) => {
        const steps = slides[i].steps ?? 0;
        if (d > 0 && step < steps) return { i, step: step + 1 };
        if (d < 0 && step > 0) return { i, step: step - 1 };
        const next = Math.min(slides.length - 1, Math.max(0, i + d));
        return next === i ? { i, step } : { i: next, step: 0 };
      }),
    [slides],
  );

  // Browsers only grant fullscreen from a user gesture in this document, so a
  // page can't auto-fullscreen on load. The deck already fills the viewport;
  // the first key or click promotes it to true fullscreen — which, since the
  // first thing a presenter does is press →, is invisible in practice.
  const enterFullscreen = useCallback(() => {
    setStarted(true);
    if (document.fullscreenElement) return;
    rootRef.current?.requestFullscreen?.().catch(() => {
      /* denied or unsupported — the fitted view is already correct */
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.key === 's' || e.key === 'S') && canLoop) {
        e.preventDefault();
        setLoopMode((v) => !v);
        enterFullscreen();
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
        setStarted(true);
        return;
      }
      if (loopMode) return; // unattended presenter mode — S is the only key that does anything
      if (e.key === 'Home') {
        e.preventDefault();
        setI(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setI(slides.length - 1);
      } else if (NEXT_KEYS.has(e.key)) {
        e.preventDefault();
        go(1);
      } else if (PREV_KEYS.has(e.key)) {
        e.preventDefault();
        go(-1);
      } else {
        return;
      }
      enterFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, setI, enterFullscreen, toggleFullscreen, slides.length, canLoop, loopMode]);

  // click anywhere advances; right-click goes back without a context menu.
  // Both are no-ops in loop mode, so an accidental tap at the event doesn't
  // knock the deck out of its cycle.
  const onClick = () => {
    enterFullscreen();
    if (!loopMode) go(1);
  };
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    enterFullscreen();
    if (!loopMode) go(-1);
  };

  const props = (idx: number): SlideProps => ({
    active: idx === i,
    assets,
    fontsReady,
    started,
    step: idx === i ? pos.step : 0,
  });
  const layer = (idx: number) => ({
    position: 'absolute' as const,
    inset: 0,
    opacity: idx === i ? 1 : 0,
    pointerEvents: 'none' as const,
    transition: 'opacity 260ms ease',
  });

  return (
    <div
      ref={rootRef}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#05071E',
        overflow: 'hidden',
        cursor: started ? 'none' : 'pointer',
      }}
    >
      {/* 1 — full-viewport backdrops: no bars, ever */}
      {slides.map((s, idx) => (
        <div key={`bg${idx}`} aria-hidden="true" style={layer(idx)}>
          <s.Background {...props(idx)} />
        </div>
      ))}

      {/* 2 — 16:9 content stage */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: STAGE_W,
          height: STAGE_H,
          marginLeft: -STAGE_W / 2,
          marginTop: -STAGE_H / 2,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {slides.map((s, idx) => (
          <div key={`ct${idx}`} aria-hidden={idx !== i} style={layer(idx)}>
            <s.Content {...props(idx)} />
          </div>
        ))}
      </div>

      {!loopMode && <Progress i={i} n={slides.length} />}
    </div>
  );
}

/** Thin position bar along the bottom edge — readable at the back of a room. */
function Progress({ i, n }: { i: number; n: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 4,
        background: 'rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${((i + 1) / n) * 100}%`,
          background: '#3A4DFF',
          transition: 'width 260ms ease',
        }}
      />
    </div>
  );
}
