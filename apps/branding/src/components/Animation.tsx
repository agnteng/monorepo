import { Children, isValidElement, useEffect, useRef, type ReactNode } from 'react';
import type { ImageProps } from './Image';
import { anchorFactors } from './animation-builder/anchor';

// ─────────────────────────────────────────────────────────────────────────
// Animation — the standalone animated pixel-field. Its props (animation,
// shape, colours, cell, gap, density, motion, fade) are ALWAYS available and
// describe the field itself. Drop an <Image> child in to render a photo
// *through* the field (a moving duotone); the field props still apply on top:
//
//   <Animation density={0.6} shape="square" ...>
//     <Image src="/x.jpg" contrast={1.4} edgeGlow={1.3} tone={0.5} />
//   </Animation>
//
// density = how filled the field is (coverage) — it works the same whether the
// field is a pattern or a photo. tone is a treatment on the photo's pixels;
// they are different concepts, so both stay.
// ─────────────────────────────────────────────────────────────────────────

export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

// directional density falloff (shared with the banner export renderer)
export function fadeFactor(fade: string, fx: number, fy: number) {
  if (fade === 'left') return 1 - fx;
  if (fade === 'right') return fx;
  if (fade === 'up') return 1 - fy;
  if (fade === 'down') return fy;
  if (fade === 'radial') return Math.max(0, 1 - Math.hypot(fx - 0.5, fy - 0.5) * 2);
  return 1;
}

export type AnimName = 'wave' | 'aurora' | 'drift' | 'rain' | 'radar' | 'bloom' | 'swarm';
export const ANIMATIONS: AnimName[] = ['wave', 'aurora', 'drift', 'rain', 'radar', 'bloom', 'swarm'];
export type Shape = 'square' | 'dot' | 'halftone';

function rand(i: number, j: number) {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ── colour ramp built from the three brand colours (shadow → mid → light) ────
function hexToRgb(h: string): [number, number, number] {
  const x = h.replace('#', '');
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number) {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
// shadow → mid → light → near-white. The fixed near-white highlight is what
// gives the duotone its tonal range (and keeps photos legible); the three brand
// colours drive the shadow/mid/light stops.
function buildRamp(bg: string, color: string, edge: string) {
  return [bg, mix(bg, color, 0.4), color, mix(color, edge, 0.5), edge, '#EFEEFF'];
}

// find an <Image> config among the children (config-only; renders nothing)
function readImage(children: ReactNode): ImageProps | null {
  let cfg: ImageProps | null = null;
  Children.forEach(children, (ch) => {
    if (isValidElement(ch) && (ch.type as { isAnimationImage?: boolean })?.isAnimationImage) {
      cfg = ch.props as ImageProps;
    }
  });
  return cfg;
}

// per-cell intensity in roughly [-1, ~1.7]; the engine adds this to the base
// field. Sparse animations (rain/radar/swarm) sit on a negative floor so they
// read as bright events on a dark field — pair them with a low density.
export function animDelta(name: AnimName, fx: number, fy: number, i: number, j: number, t: number, speed: number) {
  switch (name) {
    case 'aurora': {
      // flowing plasma — three domain-warped sines interfering
      const a = Math.sin(fx * 5 + t * speed * 0.9);
      const b = Math.sin(fy * 4.2 - t * speed * 0.7 + a * 1.5);
      const c = Math.sin((fx + fy) * 3.4 + t * speed * 1.2);
      return (a + b + c) / 2.4;
    }
    case 'drift': {
      // marbled flow — domain warp for organic veins
      const w = Math.sin(fx * 7 + t * speed * 0.5);
      const v = Math.sin(fy * 6 + w * 2.4 - t * speed * 0.4);
      return Math.sin((fx + fy) * 3 + v * 2 + t * speed * 0.3) * 1.1;
    }
    case 'rain': {
      // per-column falling comet with a fading tail above the head
      const sp2 = 0.6 + rand(i, 3) * 0.9;
      const head = (t * speed * 0.14 * sp2 + rand(i, 9)) % 1.32;
      const d = head - fy; // >0 means this cell is above the head (the tail)
      const tail = 0.42;
      if (d > -0.04 && d < tail) return 1.6 * (1 - Math.max(0, d) / tail) - 0.1;
      return -0.7;
    }
    case 'radar': {
      // rotating sweep beam with a trailing glow
      const ang = Math.atan2(fy - 0.5, fx - 0.5);
      const beam = ((t * speed * 0.5) % (Math.PI * 2)) - Math.PI;
      let diff = ang - beam;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const trail = 1.4;
      if (diff <= 0.06 && diff > -trail) return 1.7 * (1 + diff / trail) - 0.1;
      return -0.6;
    }
    case 'bloom': {
      // two ripple sources interfering → moiré pulse
      const d1 = Math.hypot(fx - 0.32, fy - 0.34);
      const d2 = Math.hypot(fx - 0.7, fy - 0.66);
      return (Math.sin(d1 * 24 - t * speed * 1.5) + Math.sin(d2 * 22 - t * speed * 1.15)) * 0.65;
    }
    case 'swarm': {
      // a few soft orbs drifting on Lissajous paths
      let v = -0.7;
      for (let k = 0; k < 3; k++) {
        const cx = 0.5 + 0.4 * Math.sin(t * speed * 0.3 + k * 2.2);
        const cy = 0.5 + 0.4 * Math.cos(t * speed * 0.26 + k * 1.7);
        const dd = (fx - cx) * (fx - cx) + (fy - cy) * (fy - cy);
        const g = 1.9 * Math.exp(-dd / 0.025);
        if (g > v) v = g;
      }
      return v;
    }
    case 'wave':
    default:
      return Math.sin(t * speed * 0.7 + (i * 0.26 - j * 0.21));
  }
}

interface Props {
  animation?: AnimName;
  color?: string;
  edge?: string;
  bg?: string;
  density?: number;
  fade?: 'none' | 'left' | 'right' | 'up' | 'down' | 'radial';
  gap?: number;
  cell?: number;
  motion?: number;
  shape?: Shape;
  paused?: boolean; // freeze the animation on the current frame
  // an <Image> child turns the field into a duotone of that photo
  children?: ReactNode;
  onStatus?: (s: 'ok' | 'cors' | 'error') => void;
  className?: string;
  style?: React.CSSProperties;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>; // expose the canvas for export
}

export default function Animation({
  animation = 'wave',
  color = '#1E2BE6',
  edge = '#3A4DFF',
  bg = '#05071E',
  density = 0.55,
  fade = 'none',
  gap = 1,
  cell = 10,
  motion = 70,
  shape = 'square',
  paused = false,
  children,
  onStatus,
  className,
  style,
  canvasRef,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;
  // read inside the animation loop without re-running the draw effect
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // per-instance random time phase: every Animation starts at a different point
  // in its cycle, so no two instances run the same frames and each page load
  // differs. Generated once; stable across effect re-runs (so dep changes don't
  // jump the phase).
  const phaseRef = useRef<number | null>(null);
  if (phaseRef.current === null) phaseRef.current = Math.random() * 1000;

  // expose the canvas to the parent (for export) without forwardRef churn
  useEffect(() => {
    if (canvasRef) canvasRef.current = ref.current;
  }, [canvasRef]);

  const imgCfg = readImage(children);
  const imgSrc = imgCfg?.src || '';
  const imgContrast = imgCfg?.contrast ?? 1.4;
  const imgEdgeGlow = imgCfg?.edgeGlow ?? 1.3;
  const imgTone = imgCfg?.tone ?? 0.5;
  const imgPos = imgCfg?.position ?? 'center';

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const isImage = !!imgSrc;
    const RAMP = buildRamp(bg, color, edge);
    const NR = RAMP.length;

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const m = Math.max(0, Math.min(100, motion)) / 100;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let lum: Float32Array | null = null;
    let edges: Float32Array | null = null;

    // ── image sampling (only when there's an <Image> child) ─────────────────
    const off = document.createElement('canvas');
    const offctx = isImage ? off.getContext('2d', { willReadFrequently: true })! : null;
    // global Image constructor (this module never imports the Image component)
    const img = isImage ? new Image() : null;
    let ready = false;
    if (img) img.crossOrigin = 'anonymous';

    const sample = () => {
      if (!isImage || !img || !offctx || !ready || cols < 1 || rows < 1) return;
      off.width = cols;
      off.height = rows;
      const ar = img.width / img.height || 1;
      const gridAr = cols / rows;
      let dw: number;
      let dh: number;
      if (gridAr > ar) { dw = cols; dh = cols / ar; } else { dh = rows; dw = rows * ar; }
      // cover-crop alignment: shift the overflowing axis per the 9-point anchor
      const { fx, fy } = anchorFactors(imgPos);
      offctx.clearRect(0, 0, cols, rows);
      offctx.drawImage(img, (cols - dw) * fx, (rows - dh) * fy, dw, dh);
      let data: Uint8ClampedArray;
      try {
        data = offctx.getImageData(0, 0, cols, rows).data;
      } catch {
        lum = null;
        edges = null;
        statusRef.current?.('cors');
        return;
      }
      const n = cols * rows;
      const raw = new Float32Array(n);
      for (let k = 0; k < n; k++) raw[k] = (0.299 * data[k * 4] + 0.587 * data[k * 4 + 1] + 0.114 * data[k * 4 + 2]) / 255;
      const sorted = Float32Array.from(raw).sort();
      const lo = sorted[Math.floor(n * 0.04)];
      const hi = sorted[Math.floor(n * 0.96)] || 1;
      const range = Math.max(0.05, hi - lo);
      lum = new Float32Array(n);
      for (let k = 0; k < n; k++) {
        const L = (raw[k] - lo) / range;
        lum[k] = Math.max(0, Math.min(1, (L - 0.5) * imgContrast + 0.5));
      }
      edges = new Float32Array(n);
      const at = (x: number, y: number) => lum![Math.max(0, Math.min(rows - 1, y)) * cols + Math.max(0, Math.min(cols - 1, x))];
      let emax = 1e-6;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const gx = at(i + 1, j - 1) + 2 * at(i + 1, j) + at(i + 1, j + 1) - (at(i - 1, j - 1) + 2 * at(i - 1, j) + at(i - 1, j + 1));
          const gy = at(i - 1, j + 1) + 2 * at(i, j + 1) + at(i + 1, j + 1) - (at(i - 1, j - 1) + 2 * at(i, j - 1) + at(i + 1, j - 1));
          const mg = Math.hypot(gx, gy);
          edges[j * cols + i] = mg;
          if (mg > emax) emax = mg;
        }
      }
      for (let k = 0; k < n; k++) edges[k] /= emax;
      statusRef.current?.('ok');
    };

    if (img) {
      img.onload = () => { ready = true; sample(); };
      img.onerror = () => statusRef.current?.('error');
      img.src = imgSrc;
    }

    // Measure the LAYOUT box (clientWidth/Height), not getBoundingClientRect:
    // the layout box is immune to ancestor CSS transforms, so a zoomed/scaled
    // wrapper (e.g. the builder's pan/zoom stage) magnifies the rendered pixels
    // instead of re-sampling the field to a different resolution. For untrans-
    // formed consumers these are numerically identical.
    const size = (entry?: ResizeObserverEntry) => {
      const box = entry?.borderBoxSize?.[0];
      w = box ? Math.round(box.inlineSize) : canvas.clientWidth;
      h = box ? Math.round(box.blockSize) : canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const c = Math.max(2, cell);
      cols = Math.floor(w / c);
      rows = Math.floor(h / c);
      sample();
    };
    size();
    const ro = new ResizeObserver((entries) => size(entries[0]));
    ro.observe(canvas);

    // motion tuning differs by mode (image animation is subtle)
    const speed = isImage ? 0.4 + m * 1.2 : 0.4 + m * 1.8;
    const ampD = 0.1 + m * 0.32; // coverage wave amplitude
    const ampI = animation === 'wave' ? 0.06 + m * 0.1 : 0.12 + m * 0.22; // image tonal shimmer
    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

    let raf = 0;
    let start = 0;
    let pauseStart = 0;
    let pausedAccum = 0;
    let painted = false; // has a frame actually been committed to the canvas yet?
    const phase = phaseRef.current ?? 0; // random per-instance desync offset (s)
    const frame = (now: number) => {
      if (!start) start = now;
      // freeze on the current frame while paused; resume without a time jump.
      // Gated on `painted` so an instance that mounts already-paused (or whose
      // image is still loading) still commits its first frame — otherwise it
      // would stay blank forever with nothing to freeze on.
      if (!reduce && pausedRef.current && painted) {
        if (!pauseStart) pauseStart = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      if (pauseStart) {
        pausedAccum += now - pauseStart;
        pauseStart = 0;
      }
      const t = reduce ? 0 : (now - start - pausedAccum) / 1000 + phase;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const c = Math.max(2, cell);
      const sq = Math.max(1, c - gap);
      const offx = Math.floor((w - cols * c) / 2);
      const offy = Math.floor((h - rows * c) / 2);
      const dFac = density >= 1 ? 1 : Math.max(0, density); // density → image coverage

      const canDraw = isImage ? lum && edges : true;
      if (canDraw) {
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const fx = cols > 1 ? i / (cols - 1) : 0.5;
            const fy = rows > 1 ? j / (rows - 1) : 0.5;
            const thr = BAYER[(j & 3) * 4 + (i & 3)];
            const delta = reduce ? 0 : animDelta(animation, fx, fy, i, j, t, speed);
            const x = offx + i * c;
            const y = offy + j * c;

            if (isImage) {
              // image treatment — the full white-highlight duotone, but density
              // thins the field so the photo reveals through an animated dither
              // (density 1 = solid; lower = sparser reveal). The animation also
              // modulates brightness for a subtle tonal shimmer.
              const k = j * cols + i;
              const b = clamp(lum![k] * imgTone + edges![k] * imgEdgeGlow + delta * ampI, 0, 1);
              if (shape === 'halftone') {
                // halftone expresses coverage through dot size; density scales it
                const r = (c / 2) * Math.sqrt(b) * dFac;
                if (r > 0.35) {
                  ctx.fillStyle = RAMP[clamp(Math.round(b * (NR - 1)), 1, NR - 1)];
                  ctx.beginPath();
                  ctx.arc(x + c / 2, y + c / 2, r, 0, Math.PI * 2);
                  ctx.fill();
                }
              } else {
                const cov = density * fadeFactor(fade, fx, fy) + delta * ampD;
                if (density < 1 && cov <= thr) continue; // density thins the field
                if (shape === 'dot') {
                  ctx.fillStyle = RAMP[clamp(Math.round(b * (NR - 1)), 1, NR - 1)];
                  ctx.beginPath();
                  ctx.arc(x + c / 2, y + c / 2, sq / 2, 0, Math.PI * 2);
                  ctx.fill();
                } else {
                  const f = b * (NR - 1);
                  let idx = Math.floor(f);
                  if (f - idx > thr && idx < NR - 1) idx++;
                  ctx.fillStyle = RAMP[clamp(idx, 0, NR - 1)];
                  ctx.fillRect(x, y, sq, sq);
                }
              }
            } else {
              // pattern field — density drives coverage
              const cov = density * fadeFactor(fade, fx, fy) + delta * ampD;
              if (shape === 'halftone') {
                const r = (c / 2) * Math.sqrt(clamp(cov, 0, 1));
                if (r > 0.35) {
                  ctx.fillStyle = cov > 0.72 ? edge : color;
                  ctx.beginPath();
                  ctx.arc(x + c / 2, y + c / 2, r, 0, Math.PI * 2);
                  ctx.fill();
                }
              } else if (cov > thr) {
                ctx.fillStyle = thr > 0.62 ? edge : color;
                if (shape === 'dot') {
                  ctx.beginPath();
                  ctx.arc(x + c / 2, y + c / 2, sq / 2, 0, Math.PI * 2);
                  ctx.fill();
                } else {
                  ctx.fillRect(x, y, sq, sq);
                }
              }
            }
          }
        }
        painted = true;
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [animation, density, fade, color, edge, bg, gap, cell, motion, shape, imgSrc, imgContrast, imgEdgeGlow, imgTone, imgPos]);

  return <canvas ref={ref} className={className} style={style} aria-hidden="true" />;
}
