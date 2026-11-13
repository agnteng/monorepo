import { useEffect, useRef, type ReactNode } from 'react';
import { drawOverlay, type OverlayAssets } from './animation-builder/overlay';
import {
  normalizeWH,
  type Template as TemplateDef,
  type TemplateExtra,
  type TemplateLogo,
  type TemplateText,
} from './animation-builder/templates';

// <Template> wraps <Animation>: the field flows underneath, and the template's
// design elements (logo lockup, city pill, date, speaker photos, sponsor
// logos) are composited on top via a resolution-independent overlay canvas.
// Banners also render the real platform UI around the frame (preview only —
// never part of the export).
//
//   <Template template={tpl} text={...} logo={...} ...><Animation .../></Template>

const NO_EXTRA: TemplateExtra = { speakers: [], sponsors: [] };

interface Props {
  template: TemplateDef;
  text: TemplateText;
  logo: TemplateLogo;
  extra?: TemplateExtra;
  assets: OverlayAssets;
  fontsReady: boolean;
  mockup: boolean;
  guides: boolean;
  children: ReactNode; // the <Animation> field
}

const AVATAR = '/assets/logo/ae-icon.svg';

export default function Template({ template, text, logo, extra = NO_EXTRA, assets, fontsReady, mockup, guides, children }: Props) {
  const disp = normalizeWH(template.frame.w, template.frame.h);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  // overlay backing res ≈ native frame (capped) so logo/text stay crisp when zoomed
  const cap = 2048;
  const bs = Math.min(1, cap / Math.max(template.frame.w, template.frame.h));
  const bw = Math.round(template.frame.w * bs);
  const bh = Math.round(template.frame.h * bs);

  useEffect(() => {
    const cv = overlayRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    cv.width = bw;
    cv.height = bh;
    ctx.clearRect(0, 0, bw, bh);
    drawOverlay(ctx, bw, bh, template.build(text, logo, extra), assets, fontsReady, guides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, text.city, text.date, logo.scale, logo.variant, logo.anchor, logo.mark, extra, assets, fontsReady, guides, bw, bh]);

  return (
    <>
      {children}
      <canvas ref={overlayRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {mockup && template.chrome && <Chrome kind={template.chrome} W={disp.w} H={disp.h} />}
    </>
  );
}

// ── platform mockup chrome (DOM, preview only) ──────────────────────────────
function Chrome({ kind, W, H }: { kind: NonNullable<TemplateDef['chrome']>; W: number; H: number }) {
  if (kind === 'x') {
    const d = W * 0.092;
    return (
      <>
        <div className="bg-black" style={{ position: 'absolute', top: H, left: 0, width: W }}>
          <div
            className="flex items-start justify-between"
            style={{ paddingLeft: W * 0.012, paddingRight: W * 0.025, paddingTop: H * 0.04, paddingBottom: H * 0.07 }}
          >
            <div style={{ marginLeft: d + W * 0.016, marginTop: H * 0.02 }}>
              <div className="font-sans font-bold text-white" style={{ fontSize: W * 0.024, lineHeight: 1.1 }}>Agentic Engineering</div>
              <div className="font-mono text-white/50" style={{ fontSize: W * 0.016 }}>@agenteng</div>
            </div>
            <span className="rounded-full bg-white font-semibold text-black" style={{ fontSize: W * 0.016, padding: `${H * 0.04}px ${W * 0.018}px` }}>Follow</span>
          </div>
        </div>
        <img src={AVATAR} alt="" style={{ position: 'absolute', width: d, height: d, left: W * 0.018, top: H - d * 0.5, borderRadius: '9999px', border: `${W * 0.005}px solid #000` }} />
      </>
    );
  }
  if (kind === 'linkedin') {
    const d = W * 0.072;
    return (
      <>
        <div className="bg-white" style={{ position: 'absolute', top: H, left: 0, width: W }}>
          <div className="flex items-end justify-between" style={{ padding: `${H * 0.18}px ${W * 0.03}px ${H * 0.22}px` }}>
            <div>
              <div className="font-sans font-bold text-panel-navy" style={{ fontSize: W * 0.022 }}>Agentic Engineering</div>
              <div className="font-sans text-panel-navy/55" style={{ fontSize: W * 0.014 }}>Monthly meetup · Lisbon · 1,240 followers</div>
            </div>
            <span className="rounded-full bg-electric-blue font-semibold text-white" style={{ fontSize: W * 0.014, padding: `${H * 0.07}px ${W * 0.018}px` }}>+ Follow</span>
          </div>
        </div>
        <img src={AVATAR} alt="" style={{ position: 'absolute', width: d, height: d, left: W * 0.02, top: H - d * 0.55, borderRadius: W * 0.012, border: `${W * 0.005}px solid #fff` }} />
      </>
    );
  }
  if (kind === 'substack' || kind === 'luma') {
    const luma = kind === 'luma';
    return (
      <div className="bg-white" style={{ position: 'absolute', top: H, left: 0, width: W }}>
        <div className="flex items-center" style={{ gap: W * 0.018, padding: `${W * 0.016}px ${W * 0.03}px` }}>
          <img src={AVATAR} alt="" style={{ width: W * 0.058, height: W * 0.058, borderRadius: luma ? W * 0.012 : '9999px', flex: 'none' }} />
          <div style={{ flex: 1 }}>
            <div className="font-sans font-bold text-panel-navy" style={{ fontSize: W * 0.022 }}>Agentic Engineering</div>
            <div className="font-sans text-panel-navy/55" style={{ fontSize: W * 0.014 }}>{luma ? 'Calendar · Lisbon' : 'Recaps & field notes after every meetup.'}</div>
          </div>
          <span className={luma ? 'rounded-lg bg-[#1a1a1a] font-semibold text-white' : 'rounded-md bg-[#FF6719] font-semibold text-white'} style={{ fontSize: W * 0.014, padding: `${W * 0.01}px ${W * 0.018}px` }}>Subscribe</span>
        </div>
      </div>
    );
  }
  return null; // youtube + telegram use the dashed safe-zone guide instead
}
