import { useEffect, useRef, useState, type ReactNode } from 'react';
import { normalizeWH } from './templates';

// A Figma-style infinite canvas: a fixed-pixel artboard floating in a gray
// viewport you can pan (drag / wheel) and zoom (ctrl/⌘+wheel toward the cursor,
// or the HUD buttons). The artboard is a fixed CSS-pixel box (so <Animation>
// keeps a stable resolution); a single transform on the wrapper magnifies it.

const MIN = 0.1;
const MAX = 8;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

interface View {
  zoom: number;
  x: number;
  y: number;
}

export default function CanvasStage({
  aspect,
  frame,
  bg,
  children,
  paused,
  onTogglePlay,
}: {
  aspect: string;
  frame?: { w: number; h: number };
  bg: string;
  children: ReactNode;
  paused?: boolean;
  onTogglePlay?: () => void;
}) {
  // An active template's frame drives the artboard size; otherwise derive from
  // the manual aspect. Either way the artboard stays ~960px on its long edge.
  let BASE_W: number;
  let BASE_H: number;
  if (frame) {
    const n = normalizeWH(frame.w, frame.h);
    BASE_W = n.w;
    BASE_H = n.h;
  } else {
    const [aw, ah] = aspect.split('/').map((n) => Number(n.trim()) || 1);
    BASE_W = 960;
    BASE_H = Math.round((960 * ah) / aw);
  }

  const stageRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>({ zoom: 1, x: 0, y: 0 });
  const [view, setV] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const apply = (v: View) => {
    viewRef.current = v;
    setV(v);
  };

  const fit = () => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 80;
    const z = clamp(Math.min((r.width - pad) / BASE_W, (r.height - pad) / BASE_H), MIN, MAX);
    apply({ zoom: z, x: (r.width - BASE_W * z) / 2, y: (r.height - BASE_H * z) / 2 });
  };
  const reset100 = () => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    apply({ zoom: 1, x: (r.width - BASE_W) / 2, y: (r.height - BASE_H) / 2 });
  };
  const zoomAtCenter = (factor: number) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cur = viewRef.current;
    const next = clamp(cur.zoom * factor, MIN, MAX);
    const k = next / cur.zoom;
    const px = r.width / 2;
    const py = r.height / 2;
    apply({ zoom: next, x: px - (px - cur.x) * k, y: py - (py - cur.y) * k });
  };

  // re-fit on mount and whenever the frame/aspect changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fit, [aspect, frame?.w, frame?.h]);

  // non-passive wheel listener (React onWheel is passive → can't preventDefault)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const cur = viewRef.current;
      if (e.ctrlKey || e.metaKey) {
        const next = clamp(cur.zoom * Math.exp(-e.deltaY * 0.0015), MIN, MAX);
        const k = next / cur.zoom;
        apply({ zoom: next, x: px - (px - cur.x) * k, y: py - (py - cur.y) * k });
      } else {
        apply({ zoom: cur.zoom, x: cur.x - e.deltaX, y: cur.y - e.deltaY });
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // drag-to-pan
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const cur = viewRef.current;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: cur.x, oy: cur.y };
    setGrabbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    apply({ zoom: viewRef.current.zoom, x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
  };
  const endDrag = () => {
    drag.current = null;
    setGrabbing(false);
  };

  const hudBtn =
    'flex h-7 w-7 items-center justify-center rounded-md text-deep-navy/70 transition-colors hover:bg-deep-navy/[0.06] hover:text-deep-navy';

  return (
    <div
      ref={stageRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      className={`relative h-full w-full overflow-hidden bg-canvas ${grabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        backgroundImage:
          'radial-gradient(circle, rgba(5,7,30,0.07) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      {/* world */}
      <div
        className="absolute left-0 top-0"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, transformOrigin: '0 0' }}
      >
        <div
          className="relative shadow-[0_8px_40px_rgba(5,7,30,0.22)] ring-1 ring-black/10"
          style={{ width: BASE_W, height: BASE_H, background: bg }}
        >
          {children}
        </div>
      </div>

      {/* zoom HUD */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-lg border border-line bg-panel/95 p-1 shadow-sm backdrop-blur"
      >
        {onTogglePlay && (
          <>
            <button type="button" aria-label={paused ? 'Play' : 'Pause'} className={hudBtn} onClick={onTogglePlay}>
              {paused ? (
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><path d="M5 3.5l7 4.5-7 4.5z" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><path d="M5.5 3.5h2v9h-2zM8.5 3.5h2v9h-2z" fill="currentColor" /></svg>
              )}
            </button>
            <span className="mx-0.5 h-4 w-px bg-line" />
          </>
        )}
        <button type="button" aria-label="Zoom out" className={hudBtn} onClick={() => zoomAtCenter(1 / 1.2)}>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
        <button
          type="button"
          onClick={reset100}
          className="min-w-[3.5rem] rounded-md px-1 py-1 text-center font-mono text-[11px] text-deep-navy/70 transition-colors hover:bg-deep-navy/[0.06] hover:text-deep-navy"
        >
          {Math.round(view.zoom * 100)}%
        </button>
        <button type="button" aria-label="Zoom in" className={hudBtn} onClick={() => zoomAtCenter(1.2)}>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
        <span className="mx-0.5 h-4 w-px bg-line" />
        <button
          type="button"
          onClick={fit}
          className="rounded-md px-2 py-1 font-mono text-[11px] text-deep-navy/70 transition-colors hover:bg-deep-navy/[0.06] hover:text-deep-navy"
        >
          Fit
        </button>
      </div>
    </div>
  );
}
