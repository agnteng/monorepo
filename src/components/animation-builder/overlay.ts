// Overlay compositor for brand-asset templates. Every element is sized by
// fractions of (W,H), so the SAME code draws the on-screen preview (≈960px) and
// the export (native platform px) identically — only crispness differs.
// Pure functions ported from BannerBuilder.drawLogo / gradient and
// LumaCoverBuilder.drawPill / vignette, made variant- and size-aware.

import { anchorFactors, type Anchor } from './anchor';

export type Grad = 'none' | 'left' | 'right' | 'bottom';
export type Variant = 'white' | 'blue';

export interface OverlayAssets {
  mark: HTMLImageElement | null;
  word: HTMLImageElement | null;
  markBlue: HTMLImageElement | null;
  wordBlue: HTMLImageElement | null;
}

export interface SpeakerFace {
  name: string;
  title: string;
  photo: HTMLImageElement | null;
}

export interface OverlaySpec {
  gradient?: Grad;
  vignette?: boolean;
  logo?: { anchor: Anchor; scale: number; variant: Variant; mark: boolean };
  // textScale sizes the city pill + date line independently of the logo, so a
  // large lockup doesn't leave the type looking undersized. Defaults to 1.
  coverGroup?: { scale: number; variant: Variant; city: string; date: string; textScale?: number };
  safeZone?: { kind: 'circle' | 'rect'; xf: number; yf: number; wf: number; hf: number };
  // one speaker, photo-forward — see drawSpeakerCard
  speakerCard?: { speaker: SpeakerFace; variant: Variant };
  // three speakers in a row, optional sponsor strip underneath — drawSpeakerTrio
  speakerTrio?: { speakers: SpeakerFace[]; sponsors: (HTMLImageElement | null)[]; variant: Variant; date: string };
  // "in partnership with" + a row of partner logos — drawSponsorBanner
  sponsorBanner?: { label: string; sponsors: (HTMLImageElement | null)[] };
}

type Ctx = CanvasRenderingContext2D;
type Spacing = Ctx & { letterSpacing?: string };
const ok = (im: HTMLImageElement | null): im is HTMLImageElement =>
  !!im && im.complete && im.naturalWidth > 0;
const pickLogo = (a: OverlayAssets, v: Variant) =>
  v === 'blue' ? { mark: a.markBlue, word: a.wordBlue } : { mark: a.mark, word: a.word };

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// directional dark wash for legibility (from BannerBuilder 91-106)
function drawGradient(ctx: Ctx, W: number, H: number, g: Grad) {
  if (g === 'none') return;
  let grad: CanvasGradient;
  if (g === 'bottom') {
    grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(5,7,30,0.25)');
    grad.addColorStop(0.45, 'rgba(5,7,30,0.35)');
    grad.addColorStop(1, 'rgba(5,7,30,0.92)');
  } else {
    grad = g === 'left' ? ctx.createLinearGradient(0, 0, W, 0) : ctx.createLinearGradient(W, 0, 0, 0);
    grad.addColorStop(0, 'rgba(5,7,30,1)');
    grad.addColorStop(0.46, 'rgba(5,7,30,0.72)');
    grad.addColorStop(1, 'rgba(5,7,30,0.18)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// radial vignette (from LumaCoverBuilder 88-92)
function drawVignette(ctx: Ctx, W: number, H: number) {
  const r = Math.min(W, H);
  const vg = ctx.createRadialGradient(W / 2, H / 2, r * 0.18, W / 2, H / 2, r * 0.72);
  vg.addColorStop(0, 'rgba(5,7,30,0.12)');
  vg.addColorStop(1, 'rgba(5,7,30,0.62)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

// logo mark-only or mark + two-line wordmark lockup, placed at a 9-point anchor
// (width-based lockup sizing from BannerBuilder 34-63)
// returns the drawn lockup's pixel height (0 if nothing was drawn), so
// callers can lay out other elements relative to it
export function drawLogo(ctx: Ctx, W: number, H: number, anchor: Anchor, scale: number, a: OverlayAssets, variant: Variant, markOnly: boolean): number {
  const { mark, word } = pickLogo(a, variant);
  if (!ok(mark)) return 0;
  const MAR = mark.naturalWidth / mark.naturalHeight;
  const { fx, fy } = anchorFactors(anchor);
  const padX = W * 0.045;
  const padY = H * 0.07;
  if (markOnly) {
    const mh = Math.min(H, W) * 0.42;
    const mw = mh * MAR;
    const x = padX + (W - mw - 2 * padX) * fx;
    const y = padY + (H - mh - 2 * padY) * fy;
    ctx.drawImage(mark, x, y, mw, mh);
    return mh;
  }
  if (!ok(word)) return 0;
  const WAR = word.naturalWidth / word.naturalHeight;
  const k = MAR + 0.22 + 0.92 * WAR;
  let mh = (W * scale) / k;
  const maxH = H * 0.6;
  if (mh > maxH) mh = maxH;
  const mw = mh * MAR;
  const wh = mh * 0.92;
  const ww = wh * WAR;
  const g = mh * 0.22;
  const totalW = mw + g + ww;
  const x = padX + (W - totalW - 2 * padX) * fx;
  const y = padY + (H - mh - 2 * padY) * fy;
  ctx.drawImage(mark, x, y, mw, mh);
  ctx.drawImage(word, x + mw + g, y + (mh - wh) / 2, ww, wh);
  return mh;
}

// city pill (from LumaCoverBuilder) — white pill, centered navy text, `s` scales it
export function drawPill(ctx: Ctx, cx: number, top: number, city: string, s: number) {
  const fs = 22 * s;
  const lab = (city || '').toUpperCase();
  const ls = `${3 * s}px`;
  const sp = ctx as Spacing;
  ctx.font = `600 ${fs}px "Kode Mono", ui-monospace, monospace`;
  sp.letterSpacing = ls;
  const tw = ctx.measureText(lab).width;
  const padX = 26 * s;
  const padY = 12 * s;
  const pillW = padX * 2 + tw;
  const pillH = fs + padY * 2;
  const x = cx - pillW / 2;
  roundRect(ctx, x, top, pillW, pillH, pillH / 2);
  ctx.fillStyle = '#F4F5FF';
  ctx.fill();
  ctx.fillStyle = '#05071E';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(lab, cx, top + pillH / 2 + 1);
  sp.letterSpacing = '0px';
  return pillH;
}

function drawText(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  size: number,
  opts: { color: string; weight: number; align: CanvasTextAlign; spacing: string; upper?: boolean },
) {
  const sp = ctx as Spacing;
  ctx.font = `${opts.weight} ${size}px "Kode Mono", ui-monospace, monospace`;
  sp.letterSpacing = opts.spacing;
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align;
  ctx.textBaseline = 'middle';
  ctx.fillText(opts.upper ? value.toUpperCase() : value, x, y);
  sp.letterSpacing = '0px';
}

// centered lockup + city pill + date — reproduces LumaCoverBuilder 94-114 + a date line
function drawCoverGroup(ctx: Ctx, W: number, H: number, gs: NonNullable<OverlaySpec['coverGroup']>, a: OverlayAssets, fontsReady: boolean) {
  const S = Math.min(W, H);
  const { mark, word } = pickLogo(a, gs.variant);
  if (!ok(mark) || !ok(word)) return;
  const MAR = mark.naturalWidth / mark.naturalHeight;
  const WAR = word.naturalWidth / word.naturalHeight;
  const k = MAR + 0.22 + 0.92 * WAR;
  const mh = (S * gs.scale) / k;
  const mw = mh * MAR;
  const wh = mh * 0.92;
  const ww = wh * WAR;
  const g = mh * 0.22;
  const lockupW = mw + g + ww;
  const ts = gs.textScale ?? 1;
  const s = (S / 500) * ts;
  // An empty city means no pill at all — otherwise this drew a bare capsule
  // with nothing in it, and the lockup sat high by half the pill's height
  // because the group was still measured as though it were there.
  const hasPill = !!gs.city.trim();
  const pillH = hasPill ? 46 * s : 0; // matches what drawPill returns for this `s`
  const pillGap = hasPill ? S * 0.055 : 0;
  const cx = W / 2;

  // logo + city pill grouped, dead-centre of the frame
  const groupH = mh + pillGap + pillH;
  const top = (H - groupH) / 2;
  const lx = cx - lockupW / 2;
  ctx.drawImage(mark, lx, top, mw, mh);
  ctx.drawImage(word, lx + mw + g, top + (mh - wh) / 2, ww, wh);
  if (!fontsReady) return;
  if (hasPill) drawPill(ctx, cx, top + mh + pillGap, gs.city, s);

  // date / time pinned to the bottom with padding
  if (gs.date.trim()) {
    const dateSize = S * 0.034 * ts;
    const padBottom = S * 0.075;
    drawText(ctx, gs.date, cx, H - padBottom - dateSize / 2, dateSize, {
      color: '#F4F5FF',
      weight: 600,
      align: 'center',
      spacing: `${2 * s}px`,
      upper: true,
    });
  }
}

// crop-to-fill an image into a rect, centred on whichever axis overflows
function drawImageCover(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number, radius = 0) {
  const ir = img.naturalWidth / img.naturalHeight;
  const r = w / h;
  let sx: number, sy: number, sw: number, sh: number;
  if (ir > r) {
    sh = img.naturalHeight;
    sw = sh * r;
    sy = 0;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sw = img.naturalWidth;
    sh = sw / r;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  if (radius > 0) {
    ctx.save();
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  if (radius > 0) ctx.restore();
}

// fit an image inside a box (no crop), centred — for logos/sponsor marks,
// where cropping would cut off part of the mark
function drawImageContain(ctx: Ctx, img: HTMLImageElement, cx: number, cy: number, maxW: number, maxH: number) {
  const ir = img.naturalWidth / img.naturalHeight;
  let w = maxW;
  let h = w / ir;
  if (h > maxH) {
    h = maxH;
    w = h * ir;
  }
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

// dashed box + centred label — an empty photo/logo slot, same read as the
// Placeholder component the slide decks use
function drawSlotPlaceholder(ctx: Ctx, x: number, y: number, w: number, h: number, label: string) {
  ctx.save();
  ctx.strokeStyle = 'rgba(244,245,255,0.28)';
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.008);
  ctx.setLineDash([ctx.lineWidth * 3, ctx.lineWidth * 3]);
  ctx.strokeRect(x + ctx.lineWidth, y + ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
  ctx.setLineDash([]);
  if (Math.min(w, h) > 40) {
    ctx.fillStyle = 'rgba(244,245,255,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fs = Math.max(9, Math.min(w, h) * 0.05);
    const sp = ctx as Spacing;
    ctx.font = `600 ${fs}px "Kode Mono", ui-monospace, monospace`;
    sp.letterSpacing = `${fs * 0.08}px`;
    ctx.fillText(label.toUpperCase(), x + w / 2, y + h / 2);
    sp.letterSpacing = '0px';
  }
  ctx.restore();
}

// one speaker, photo-forward: portrait photo, caption band with name/title,
// small mark badge in the band's corner.
function drawSpeakerCard(ctx: Ctx, W: number, H: number, spec: NonNullable<OverlaySpec['speakerCard']>, a: OverlayAssets, fontsReady: boolean) {
  const { speaker: sp, variant } = spec;
  const photoH = Math.round(H * 0.68);
  if (ok(sp.photo)) drawImageCover(ctx, sp.photo, 0, 0, W, photoH);
  else drawSlotPlaceholder(ctx, 0, 0, W, photoH, 'Photo');

  ctx.fillStyle = '#0B0E2A';
  ctx.fillRect(0, photoH, W, H - photoH);

  const padX = W * 0.08;
  const bandH = H - photoH;
  if (fontsReady) {
    const nameSize = W * 0.05;
    const titleSize = W * 0.032;
    drawText(ctx, sp.name || 'Speaker name', padX, photoH + bandH * 0.4, nameSize, {
      color: '#F4F5FF',
      weight: 800,
      align: 'left',
      spacing: '-0.5px',
    });
    drawText(ctx, sp.title || 'Role, company', padX, photoH + bandH * 0.4 + nameSize * 0.95, titleSize, {
      color: '#B5A6FF',
      weight: 500,
      align: 'left',
      spacing: '0px',
    });
  }

  const { mark } = pickLogo(a, variant);
  if (ok(mark)) {
    const mh = bandH * 0.34;
    const mw = mh * (mark.naturalWidth / mark.naturalHeight);
    ctx.drawImage(mark, W - padX - mw, photoH + (bandH - mh) / 2, mw, mh);
  }
}

// full lockup top-left, sized to match one speaker column's width, with a
// free-text line top-right in the speaker-name size — then each speaker's
// photo over name/title, and an optional sponsor-logo strip along the bottom.
function drawSpeakerTrio(ctx: Ctx, W: number, H: number, spec: NonNullable<OverlaySpec['speakerTrio']>, a: OverlayAssets, fontsReady: boolean) {
  const { speakers, sponsors, variant, date } = spec;
  const hasSponsors = sponsors.some(ok);
  const PAD = W * 0.045;
  const GAP = W * 0.033;
  const colW = (W - PAD * 2 - GAP * 2) / 3;
  const footerH = hasSponsors ? H * 0.13 : 0;

  const logoTop = H * 0.07;
  const logoH = drawLogo(ctx, W, H, 'top-left', colW / W, a, variant, false);

  const dateSize = colW * 0.0975;
  if (fontsReady && date.trim()) {
    drawText(ctx, date, W - PAD, logoTop + dateSize * 0.85, dateSize, {
      color: '#F4F5FF', weight: 800, align: 'right', spacing: '-0.5px', upper: true,
    });
  }

  const headerH = logoTop + logoH + H * 0.035;
  const photoH = colW; // square crop
  const top = headerH + (H - headerH - footerH - photoH - H * 0.16) / 2 + H * 0.035;
  const three: SpeakerFace[] = [0, 1, 2].map((i) => speakers[i] ?? { name: '', title: '', photo: null });

  three.forEach((sp, i) => {
    const x = PAD + i * (colW + GAP);
    if (ok(sp.photo)) drawImageCover(ctx, sp.photo, x, top, colW, photoH, colW * 0.04);
    else drawSlotPlaceholder(ctx, x, top, colW, photoH, `Speaker ${i + 1}`);

    if (!fontsReady) return;
    const nameSize = colW * 0.085;
    const titleSize = colW * 0.0725;
    const ty = top + photoH + nameSize * 1.035;
    drawText(ctx, sp.name || 'Speaker name', x, ty, nameSize, { color: '#F4F5FF', weight: 800, align: 'left', spacing: '-0.5px' });
    drawText(ctx, sp.title || 'Role, company', x, ty + nameSize * 1.15, titleSize, { color: '#F4F5FF', weight: 500, align: 'left', spacing: '0px' });
  });

  if (hasSponsors) {
    ctx.fillStyle = 'rgba(5,7,30,0.4)';
    ctx.fillRect(0, H - footerH, W, footerH);
    drawLogoRow(ctx, sponsors, PAD, H - footerH, W - PAD * 2, footerH);
  }
}

// evenly spaced, vertically centred row of logos inside a band — shared by
// the speaker trio's sponsor strip and the sponsor banner
function drawLogoRow(ctx: Ctx, logos: (HTMLImageElement | null)[], x: number, y: number, w: number, h: number) {
  const n = logos.length || 1;
  const slotW = w / n;
  const maxH = h * 0.55;
  const maxW = slotW * 0.78;
  logos.forEach((logo, i) => {
    const cx = x + slotW * (i + 0.5);
    const cy = y + h / 2;
    if (ok(logo)) drawImageContain(ctx, logo, cx, cy, maxW, maxH);
    else drawSlotPlaceholder(ctx, cx - maxW / 2, cy - maxH / 2, maxW, maxH, 'Logo');
  });
}

// "IN PARTNERSHIP WITH" + a row of partner marks, all on one baseline — no
// wash and no divider, just the field behind everything.
function drawSponsorBanner(ctx: Ctx, W: number, H: number, spec: NonNullable<OverlaySpec['sponsorBanner']>) {
  const padX = W * 0.045;
  const labelSize = H * 0.1;
  drawText(ctx, spec.label, padX, H / 2, labelSize, {
    color: '#F4F5FF',
    weight: 600,
    align: 'left',
    spacing: `${labelSize * 0.12}px`,
    upper: true,
  });

  const sp = ctx as Spacing;
  sp.letterSpacing = `${labelSize * 0.12}px`;
  const labelW = ctx.measureText(spec.label.toUpperCase()).width;
  sp.letterSpacing = '0px';

  const rowX = padX + labelW + W * 0.06;
  drawLogoRow(ctx, spec.sponsors, rowX, 0, W - rowX - padX, H);
}

function drawSafeZone(ctx: Ctx, W: number, H: number, sz: NonNullable<OverlaySpec['safeZone']>) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = Math.max(1.5, Math.min(W, H) * 0.004);
  ctx.setLineDash([ctx.lineWidth * 4, ctx.lineWidth * 4]);
  if (sz.kind === 'circle') {
    const r = (sz.wf * W) / 2;
    ctx.beginPath();
    ctx.arc(sz.xf * W, sz.yf * H, r, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const w = sz.wf * W;
    const h = sz.hf * H;
    ctx.strokeRect(sz.xf * W - w / 2, sz.yf * H - h / 2, w, h);
  }
  ctx.restore();
}

// the single entry point — composites on top of whatever is already drawn (the field).
export function drawOverlay(
  ctx: Ctx,
  W: number,
  H: number,
  spec: OverlaySpec,
  assets: OverlayAssets,
  fontsReady: boolean,
  includeGuides = false,
) {
  if (spec.gradient) drawGradient(ctx, W, H, spec.gradient);
  if (spec.vignette) drawVignette(ctx, W, H);
  if (spec.logo) drawLogo(ctx, W, H, spec.logo.anchor, spec.logo.scale, assets, spec.logo.variant, spec.logo.mark);
  if (spec.coverGroup) drawCoverGroup(ctx, W, H, spec.coverGroup, assets, fontsReady);
  if (spec.speakerCard) drawSpeakerCard(ctx, W, H, spec.speakerCard, assets, fontsReady);
  if (spec.speakerTrio) drawSpeakerTrio(ctx, W, H, spec.speakerTrio, assets, fontsReady);
  if (spec.sponsorBanner) drawSponsorBanner(ctx, W, H, spec.sponsorBanner);
  if (includeGuides && spec.safeZone) drawSafeZone(ctx, W, H, spec.safeZone);
}
