// Export helpers. Each output frame is composited from the live <Animation>
// field (scaled to the exact output size — chunky dither preserved) plus an
// optional overlay (template logo/text/pill, drawn crisp at native res):
//   • JPG  — one composited frame
//   • MP4  — N seconds, driven offscreen canvas via MediaRecorder (WebM fallback)
//   • GIF  — N seconds sampled then encoded with gifenc
// The mockup chrome is DOM-only and never reaches here, so exports are clean.

export interface ExportTarget {
  source: HTMLCanvasElement; // the live Animation field canvas
  out: { w: number; h: number }; // exact export pixel size
  bg: string; // field background (the canvas has transparent gaps)
  overlay?: (ctx: CanvasRenderingContext2D, W: number, H: number) => void;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// one composited frame at W×H: bg fill → scaled field → overlay
function renderFrame(t: ExportTarget, ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(t.source, 0, 0, W, H);
  t.overlay?.(ctx, W, H);
}

export function exportJpg(t: ExportTarget, name: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      const c = document.createElement('canvas');
      c.width = t.out.w;
      c.height = t.out.h;
      renderFrame(t, c.getContext('2d')!, t.out.w, t.out.h);
      c.toBlob(
        (blob) => {
          if (blob) downloadBlob(blob, `${name}.jpg`);
          resolve();
        },
        'image/jpeg',
        0.92,
      );
    } catch (e) {
      reject(e);
    }
  });
}

type CaptureCanvas = HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream };

export async function exportVideo(t: ExportTarget, seconds: number, name: string, fps = 30) {
  const off = document.createElement('canvas');
  off.width = t.out.w;
  off.height = t.out.h;
  const octx = off.getContext('2d')!;
  const cap = (off as CaptureCanvas).captureStream;
  if (!cap) throw new Error('captureStream unsupported');
  const stream = cap.call(off, fps);
  const types = [
    'video/mp4;codecs=avc1.640028',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  const mime = types.find((m) => MediaRecorder.isTypeSupported(m)) || '';
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };

  // drive the offscreen canvas so each recorded frame is the composited output
  let raf = 0;
  let stopped = false;
  const loop = () => {
    if (stopped) return;
    renderFrame(t, octx, t.out.w, t.out.h);
    raf = requestAnimationFrame(loop);
  };

  await new Promise<void>((resolve) => {
    rec.onstop = () => resolve();
    rec.start();
    raf = requestAnimationFrame(loop);
    setTimeout(() => {
      stopped = true;
      cancelAnimationFrame(raf);
      try { rec.stop(); } catch { /* */ }
    }, Math.max(200, seconds * 1000));
  });

  const outMime = rec.mimeType || mime || 'video/webm';
  const ext = outMime.includes('mp4') ? 'mp4' : 'webm';
  downloadBlob(new Blob(chunks, { type: outMime }), `${name}.${ext}`);
}

export async function exportGif(t: ExportTarget, seconds: number, name: string, fps = 12, onProgress?: (p: number) => void) {
  const mod = await import('gifenc');
  const lib = ((mod as Record<string, unknown>).GIFEncoder ? mod : (mod as { default: unknown }).default) as typeof import('gifenc');
  const { GIFEncoder, quantize, applyPalette } = lib;

  // cap the long edge at 1000 (square covers export full-size; huge banners stay sane)
  const maxEdge = 1000;
  const scale = Math.min(1, maxEdge / Math.max(t.out.w, t.out.h));
  const w = Math.max(1, Math.round(t.out.w * scale));
  const h = Math.max(1, Math.round(t.out.h * scale));
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d', { willReadFrequently: true })!;
  const delay = Math.round(1000 / fps);
  const total = Math.max(1, Math.round(seconds * fps));

  // capture + encode incrementally (one frame in memory at a time) so big
  // frames don't blow up memory; sleep lets the live field advance between frames
  const gif = GIFEncoder();
  for (let i = 0; i < total; i++) {
    renderFrame(t, octx, w, h);
    const data = octx.getImageData(0, 0, w, h).data;
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, w, h, { palette, delay });
    onProgress?.((i + 1) / total);
    await sleep(delay);
  }
  gif.finish();
  downloadBlob(new Blob([gif.bytes()], { type: 'image/gif' }), `${name}.gif`);
}
