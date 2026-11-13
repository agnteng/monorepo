import { useRef, useState } from 'react';
import BrandColorPicker, { BRAND_COLORS } from './BrandColorPicker';
import Animation, { ANIMATIONS, type AnimName } from './Animation';
import AnimImage, { type ImagePosition } from './Image';
import { Row, Slider, Seg } from './animation-builder/Controls';
import CollapsibleSection from './animation-builder/CollapsibleSection';
import CanvasStage from './animation-builder/CanvasStage';
import TopBar from './animation-builder/TopBar';
import CodeDrawer from './animation-builder/CodeDrawer';
import { exportJpg, exportVideo, exportGif } from './animation-builder/exporters';
import Template from './Template';
import { TEMPLATES, findTemplate, aspectToPx, type TemplateExtra, type TemplateLogo } from './animation-builder/templates';
import { drawOverlay, type Variant } from './animation-builder/overlay';
import { type Anchor } from './animation-builder/anchor';
import AlignPad from './animation-builder/AlignPad';
import { useLogoAssets, useFontsReady } from './animation-builder/useLogoAssets';
import { useImageList } from './animation-builder/useImageList';
import { SpeakerRow, SponsorList, type SpeakerData } from './animation-builder/SpeakerFields';

type Fade = 'none' | 'left' | 'right' | 'up' | 'down' | 'radial';
type Shape = 'square' | 'dot' | 'halftone';

interface Params {
  animation: AnimName;
  color: string;
  edge: string;
  bg: string;
  cell: number;
  gap: number;
  density: number;
  fade: Fade;
  motion: number;
  aspect: string;
  // <Image> child params
  contrast: number;
  edgeGlow: number;
  tone: number;
  shape: Shape;
}

const DEFAULTS: Params = {
  animation: 'aurora',
  color: '#1E2BE6',
  edge: '#ED4BA0',
  bg: '#05071E',
  cell: 2,
  gap: 0,
  density: 0.65,
  fade: 'none',
  motion: 82,
  aspect: '16 / 9',
  contrast: 1.25,
  edgeGlow: 1,
  tone: 0.8,
  shape: 'square',
};

const PRESETS: { name: string; p: Partial<Params> }[] = [
  { name: 'Wave', p: { animation: 'wave', color: '#1E2BE6', edge: '#3A4DFF', bg: '#05071E', cell: 10, gap: 1, density: 0.6, fade: 'none', motion: 70 } },
  { name: 'Aurora', p: { animation: 'aurora', color: '#1E2BE6', edge: '#16D9A6', bg: '#05071E', cell: 9, gap: 1, density: 0.5, fade: 'none', motion: 60 } },
  { name: 'Drift', p: { animation: 'drift', color: '#7C4DF5', edge: '#1FC6E6', bg: '#05071E', cell: 9, gap: 1, density: 0.5, fade: 'none', motion: 45 } },
  { name: 'Rain', p: { animation: 'rain', color: '#1FC6E6', edge: '#B5A6FF', bg: '#05071E', cell: 8, gap: 1, density: 0.16, fade: 'none', motion: 80 } },
  { name: 'Radar', p: { animation: 'radar', color: '#16D9A6', edge: '#B5A6FF', bg: '#05071E', cell: 9, gap: 1, density: 0.14, fade: 'none', motion: 55 } },
  { name: 'Bloom', p: { animation: 'bloom', color: '#ED4BA0', edge: '#7C4DF5', bg: '#05071E', cell: 10, gap: 1, density: 0.42, fade: 'none', motion: 55 } },
  { name: 'Swarm', p: { animation: 'swarm', color: '#1E2BE6', edge: '#1FC6E6', bg: '#05071E', cell: 9, gap: 1, density: 0.2, fade: 'none', motion: 50 } },
];

const FADES: Fade[] = ['none', 'left', 'right', 'up', 'down', 'radial'];
const SHAPES: Shape[] = ['square', 'dot', 'halftone'];
const ASPECTS = ['21 / 9', '16 / 9', '4 / 3', '1 / 1'];
const VARIANTS: Variant[] = ['white', 'blue'];
const LOGO_KIND: ('lockup' | 'mark')[] = ['lockup', 'mark'];
const PALETTE = BRAND_COLORS.map((c) => c.hex);

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor((Math.sin(seed * 99.13) * 0.5 + 0.5) * arr.length) % arr.length];
}

type SectionId = 'presets' | 'template' | 'animation' | 'colors' | 'field' | 'frame' | 'image' | 'export';

// ── builder ────────────────────────────────────────────────────────────────
export default function WaveFieldBuilder() {
  const [p, setP] = useState<Params>(DEFAULTS);
  const [copied, setCopied] = useState(false);
  const [seed, setSeed] = useState(1);
  const [src, setSrc] = useState('');
  const [imgPos, setImgPos] = useState<ImagePosition>('center');
  const [urlDraft, setUrlDraft] = useState('');
  const [imgStatus, setImgStatus] = useState<'ok' | 'cors' | 'error' | null>(null);
  const [paused, setPaused] = useState(false);
  const [secs, setSecs] = useState(4);
  const [busy, setBusy] = useState<'jpg' | 'gif' | 'mp4' | null>(null);
  const [prog, setProg] = useState(0);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [text, setText] = useState({ city: 'Lisbon', date: 'Thu 24 Jun · 19:00' });
  const [logo, setLogo] = useState<TemplateLogo>({ scale: 0.3, variant: 'white', anchor: 'center', mark: false });
  const [speakers, setSpeakers] = useState<SpeakerData[]>([
    { name: '', title: '', photo: '' },
    { name: '', title: '', photo: '' },
    { name: '', title: '', photo: '' },
  ]);
  const [sponsors, setSponsors] = useState<string[]>(['', '']);
  const [mockup, setMockup] = useState(true);
  const [guides, setGuides] = useState(true);
  const [open, setOpen] = useState<Record<SectionId, boolean>>({
    presets: true,
    template: true,
    animation: true,
    colors: true,
    field: true,
    frame: false,
    image: false,
    export: false,
  });
  const blobRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const assets = useLogoAssets();
  const fontsReady = useFontsReady();
  const tpl = findTemplate(templateId);
  const speakerPhotos = useImageList(speakers.map((s) => s.photo || null));
  const sponsorLogos = useImageList(sponsors.map((s) => s || null));
  const extra: TemplateExtra = {
    speakers: speakers.map((s, i) => ({ name: s.name, title: s.title, photo: speakerPhotos[i] ?? null })),
    sponsors: sponsorLogos,
  };
  const set = <K extends keyof Params>(k: K, v: Params[K]) => setP((s) => ({ ...s, [k]: v }));
  const setLogoK = <K extends keyof TemplateLogo>(k: K, v: TemplateLogo[K]) => setLogo((l) => ({ ...l, [k]: v }));
  const apply = (patch: Partial<Params>) => setP((s) => ({ ...s, ...patch }));
  const toggle = (id: SectionId) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  // selecting a template adopts its default logo placement/scale
  const selectTemplate = (id: string | null) => {
    setTemplateId(id);
    const t = findTemplate(id);
    if (t) setLogo({ anchor: t.defaults.logoAnchor, scale: t.defaults.logoScale, variant: t.defaults.variant, mark: t.defaults.mark });
  };

  const revokeBlob = () => {
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }
  };
  const loadUrl = () => {
    const u = urlDraft.trim();
    if (u) { revokeBlob(); setImgStatus(null); setSrc(u); }
  };
  const onFile = (f: File | undefined) => {
    if (!f) return;
    revokeBlob();
    const u = URL.createObjectURL(f);
    blobRef.current = u;
    setImgStatus(null);
    setUrlDraft('');
    setSrc(u);
  };
  const clearImg = () => { revokeBlob(); setSrc(''); setUrlDraft(''); setImgStatus(null); };

  const imgSrcOut = src.startsWith('blob:') ? '/your-image.jpg' : src;
  const animProps = `  animation="${p.animation}"\n  color="${p.color}"\n  edge="${p.edge}"\n  bg="${p.bg}"\n  cell={${p.cell}}\n  gap={${p.gap}}\n  density={${p.density}}\n  motion={${p.motion}}\n  fade="${p.fade}"\n  shape="${p.shape}"`;
  const animBlock = src
    ? `<Animation\n${animProps}\n>\n  <Image src="${imgSrcOut}" contrast={${p.contrast}} edgeGlow={${p.edgeGlow}} tone={${p.tone}} position="${imgPos}" />\n</Animation>`
    : `<Animation\n${animProps}\n/>`;
  let code = animBlock;
  if (tpl && (tpl.group === 'speaker' || tpl.group === 'sponsor')) {
    code = `/* ${tpl.name} has no JSX embed — names, photos and logos live in this\n   session's form state, so export it as an image (JPG/GIF/MP4) instead. */`;
  } else if (tpl) {
    const inner = animBlock.split('\n').map((l) => '  ' + l).join('\n');
    const openTag =
      tpl.group === 'banner'
        ? `<Template platform="${tpl.id.replace('banner-', '')}" logoAnchor="${logo.anchor}" logoMark={${logo.mark}} logoScale={${logo.scale}} logoVariant="${logo.variant}">`
        : tpl.group === 'avatar'
          ? `<Template kind="avatar" logoAnchor="${logo.anchor}" logoMark={${logo.mark}} logoScale={${logo.scale}} logoVariant="${logo.variant}">`
          : `<Template kind="luma-cover" city="${text.city}" date="${text.date}" logoScale={${logo.scale}}>`;
    code = `${openTag}\n${inner}\n</Template>`;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked */
    }
  };

  const randomize = () => {
    const s = seed + 1;
    setSeed(s);
    apply({
      animation: pick(ANIMATIONS, s + 11),
      color: pick(PALETTE.slice(0, 5), s),
      edge: pick(PALETTE, s + 7),
      cell: 6 + Math.floor((Math.sin(s * 12.9) * 0.5 + 0.5) * 14),
      gap: Math.floor((Math.sin(s * 3.1) * 0.5 + 0.5) * 3),
      density: Number((0.35 + (Math.sin(s * 7.7) * 0.5 + 0.5) * 0.4).toFixed(2)),
      fade: pick(FADES, s + 3),
      motion: Math.floor((Math.sin(s * 5.5) * 0.5 + 0.5) * 100),
    });
  };

  const doExport = async (kind: 'jpg' | 'gif' | 'mp4') => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setExportMsg(null);
    setBusy(kind);
    setProg(0);
    try {
      const out = tpl ? tpl.frame : { w: canvas.width, h: canvas.height };
      const overlay = tpl
        ? (ctx: CanvasRenderingContext2D, W: number, H: number) =>
            drawOverlay(ctx, W, H, tpl.build(text, logo, extra), assets, fontsReady, false)
        : undefined;
      const target = { source: canvas, out, bg: p.bg, overlay };
      const name = tpl ? `agentic-${tpl.id}-${out.w}x${out.h}` : `agentic-${p.animation}${src ? '-image' : ''}`;
      if (kind === 'jpg') await exportJpg(target, name);
      else if (kind === 'mp4') await exportVideo(target, secs, name);
      else await exportGif(target, secs, name, 12, setProg);
    } catch (e) {
      console.error('export failed', e);
      setExportMsg('export failed — a CORS-tainted image can block it');
    } finally {
      setBusy(null);
      setProg(0);
    }
  };

  const presetBtn =
    'rounded-md border border-black/10 px-2.5 py-1.5 font-mono text-[11px] text-deep-navy/70 transition-colors hover:border-electric-blue hover:text-deep-navy';
  const exportBtn =
    'rounded-md border border-black/10 py-2 font-mono text-[11px] uppercase tracking-wider text-deep-navy/70 transition-colors hover:border-electric-blue hover:text-electric-blue disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-black/10 disabled:hover:text-deep-navy/70';
  const fieldBtn =
    'shrink-0 rounded-md border border-black/10 px-2.5 py-1.5 font-mono text-[11px] text-deep-navy/70 transition-colors hover:border-electric-blue hover:text-deep-navy';
  const tplBtn = (active: boolean) =>
    `rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
      active ? 'border-electric-blue bg-electric-blue text-white' : 'border-black/10 text-deep-navy/70 hover:border-electric-blue hover:text-deep-navy'
    }`;

  const fieldEl = (
    <Animation
      animation={p.animation}
      color={p.color}
      edge={p.edge}
      bg={p.bg}
      cell={p.cell}
      gap={p.gap}
      density={p.density}
      fade={p.fade}
      motion={p.motion}
      shape={p.shape}
      paused={paused}
      canvasRef={canvasRef}
      onStatus={setImgStatus}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      {src && <AnimImage src={src} contrast={p.contrast} edgeGlow={p.edgeGlow} tone={p.tone} position={imgPos} />}
    </Animation>
  );

  return (
    <div className="grid h-screen grid-cols-[1fr_312px] grid-rows-[52px_1fr] bg-canvas font-sans text-deep-navy">
      <TopBar />

      {/* canvas column — stage fills, code drawer sits below it */}
      <div className="flex min-h-0 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1">
          <CanvasStage aspect={p.aspect} frame={tpl?.frame} bg={p.bg} paused={paused} onTogglePlay={() => setPaused((v) => !v)}>
            {tpl ? (
              <Template template={tpl} text={text} logo={logo} extra={extra} assets={assets} fontsReady={fontsReady} mockup={mockup} guides={guides}>
                {fieldEl}
              </Template>
            ) : (
              fieldEl
            )}
          </CanvasStage>

          {src && imgStatus === 'cors' && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
              <div className="rounded-md bg-coral px-3 py-1.5 font-mono text-[10px] text-deep-navy shadow">
                image blocked by CORS — upload the file instead of loading it by URL
              </div>
            </div>
          )}
        </div>

        <CodeDrawer code={code} copied={copied} onCopy={copy} />
      </div>

      {/* right params panel */}
      <aside className="overflow-y-auto border-l border-line bg-panel">
        <CollapsibleSection title="Presets" open={open.presets} onToggle={() => toggle('presets')}>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((pr) => (
              <button key={pr.name} type="button" onClick={() => apply(pr.p)} className={presetBtn}>
                {pr.name}
              </button>
            ))}
            <button
              type="button"
              onClick={randomize}
              className="rounded-md border border-electric-blue/40 bg-electric-blue/10 px-2.5 py-1.5 font-mono text-[11px] text-electric-blue transition-colors hover:bg-electric-blue/15"
            >
              random ⟳
            </button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Template" open={open.template} onToggle={() => toggle('template')} right={tpl ? tpl.name : 'none'}>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => selectTemplate(null)} className={tplBtn(templateId === null)}>None</button>
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => selectTemplate(t.id)} className={tplBtn(templateId === t.id)}>{t.name}</button>
            ))}
          </div>

          {tpl && (
            <>
              {tpl.group === 'banner' && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                  <label className="flex items-center gap-1.5 font-mono text-[11px] text-deep-navy/70">
                    <input type="checkbox" checked={mockup} onChange={(e) => setMockup(e.target.checked)} className="accent-electric-blue" /> platform UI
                  </label>
                  <label className="flex items-center gap-1.5 font-mono text-[11px] text-deep-navy/70">
                    <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} className="accent-electric-blue" /> guides
                  </label>
                </div>
              )}
              {tpl.group === 'avatar' && (
                <label className="flex items-center gap-1.5 font-mono text-[11px] text-deep-navy/70">
                  <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} className="accent-electric-blue" /> crop guide
                </label>
              )}
              {tpl.group === 'cover' && (
                <>
                  <Row label="City">
                    <input type="text" value={text.city} onChange={(e) => setText((s) => ({ ...s, city: e.target.value }))} className="w-full min-w-0 rounded-md border border-black/15 bg-white px-2.5 py-1.5 font-mono text-[11px] text-deep-navy focus:border-electric-blue focus:outline-none" />
                  </Row>
                  <Row label="Date">
                    <input type="text" value={text.date} onChange={(e) => setText((s) => ({ ...s, date: e.target.value }))} className="w-full min-w-0 rounded-md border border-black/15 bg-white px-2.5 py-1.5 font-mono text-[11px] text-deep-navy focus:border-electric-blue focus:outline-none" />
                  </Row>
                </>
              )}
              {tpl.id === 'speaker-trio' && (
                <Row label="Top right text">
                  <input
                    type="text"
                    value={text.date}
                    onChange={(e) => setText((s) => ({ ...s, date: e.target.value }))}
                    className="w-full min-w-0 rounded-md border border-black/15 bg-white px-2.5 py-1.5 font-mono text-[11px] text-deep-navy focus:border-electric-blue focus:outline-none"
                  />
                </Row>
              )}
              {tpl.group === 'speaker' && (
                <div className="space-y-2 pt-1">
                  {(tpl.id === 'speaker-card' ? speakers.slice(0, 1) : speakers).map((sp, i) => (
                    <SpeakerRow
                      key={i}
                      index={i}
                      value={sp}
                      onChange={(v) => setSpeakers((s) => s.map((x, j) => (j === i ? v : x)))}
                    />
                  ))}
                  {tpl.id === 'speaker-trio' && <SponsorList sponsors={sponsors} onChange={setSponsors} />}
                </div>
              )}
              {tpl.group === 'sponsor' && <SponsorList sponsors={sponsors} onChange={setSponsors} />}
              {tpl.group !== 'cover' && tpl.group !== 'speaker' && tpl.group !== 'sponsor' && (
                <>
                  <Row label="Logo placement"><AlignPad value={logo.anchor} onChange={(a) => setLogoK('anchor', a)} /></Row>
                  <Row label="Logo"><Seg options={LOGO_KIND} value={logo.mark ? 'mark' : 'lockup'} onChange={(v) => setLogoK('mark', v === 'mark')} /></Row>
                </>
              )}
              {tpl.group === 'cover' && (
                <Row label="Logo size" value={logo.scale.toFixed(2)}>
                  <Slider min={0.15} max={0.9} step={0.01} value={logo.scale} onChange={(v) => setLogoK('scale', v)} />
                </Row>
              )}
              {tpl.group !== 'cover' && tpl.group !== 'speaker' && tpl.group !== 'sponsor' && !logo.mark && (
                <Row label="Logo size" value={logo.scale.toFixed(2)}>
                  <Slider min={0.15} max={0.55} step={0.01} value={logo.scale} onChange={(v) => setLogoK('scale', v)} />
                </Row>
              )}
              {tpl.group !== 'sponsor' && (
                <Row label="Logo color"><Seg options={VARIANTS} value={logo.variant} onChange={(v) => setLogoK('variant', v)} /></Row>
              )}
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Animation" open={open.animation} onToggle={() => toggle('animation')}>
          <Row label="Animation"><Seg options={ANIMATIONS} value={p.animation} onChange={(v) => set('animation', v)} /></Row>
          <Row label="Shape"><Seg options={SHAPES} value={p.shape} onChange={(v) => set('shape', v)} /></Row>
        </CollapsibleSection>

        <CollapsibleSection title="Colors" open={open.colors} onToggle={() => toggle('colors')}>
          <Row label="Base color"><BrandColorPicker tone="light" value={p.color} onChange={(v) => set('color', v)} /></Row>
          <Row label="Edge color"><BrandColorPicker tone="light" value={p.edge} onChange={(v) => set('edge', v)} /></Row>
          <Row label="Background"><BrandColorPicker tone="light" value={p.bg} onChange={(v) => set('bg', v)} /></Row>
        </CollapsibleSection>

        <CollapsibleSection title="Field" open={open.field} onToggle={() => toggle('field')}>
          <Row label="Cell size" value={`${p.cell}px`}><Slider min={2} max={28} step={1} value={p.cell} onChange={(v) => set('cell', v)} /></Row>
          <Row label="Gap" value={`${p.gap}px`}><Slider min={0} max={6} step={1} value={p.gap} onChange={(v) => set('gap', v)} /></Row>
          <Row label="Density" value={p.density.toFixed(2)}><Slider min={0} max={1} step={0.01} value={p.density} onChange={(v) => set('density', v)} /></Row>
          <Row label="Motion" value={p.motion === 0 ? 'static' : String(p.motion)}><Slider min={0} max={100} step={1} value={p.motion} onChange={(v) => set('motion', v)} /></Row>
          <Row label="Fade"><Seg options={FADES} value={p.fade} onChange={(v) => set('fade', v)} /></Row>
        </CollapsibleSection>

        <CollapsibleSection title="Frame" open={open.frame} onToggle={() => toggle('frame')} right={tpl ? `${tpl.frame.w}×${tpl.frame.h}` : undefined}>
          {tpl ? (
            <p className="font-mono text-[10px] leading-relaxed text-deep-navy/45">
              Frame is set by the <span className="text-deep-navy/70">{tpl.name}</span> template ({tpl.frame.w}×{tpl.frame.h}). Switch the template to None to use a free aspect ratio.
            </p>
          ) : (
            <Row label="Aspect ratio"><Seg options={ASPECTS} value={p.aspect} onChange={(v) => set('aspect', v)} /></Row>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Image"
          open={open.image}
          onToggle={() => toggle('image')}
          right={src ? 'loaded' : 'optional'}
        >
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') loadUrl(); }}
                placeholder="https://image-url.jpg"
                className="min-w-0 flex-1 rounded-md border border-black/15 bg-white px-2.5 py-1.5 font-mono text-[11px] text-deep-navy placeholder:text-deep-navy/30 focus:border-electric-blue focus:outline-none"
              />
              <button type="button" onClick={loadUrl} className={fieldBtn}>load</button>
            </div>
            <div className="flex gap-1.5">
              <label className="flex-1 cursor-pointer rounded-md border border-black/10 px-2.5 py-1.5 text-center font-mono text-[11px] text-deep-navy/70 transition-colors hover:border-electric-blue hover:text-deep-navy">
                upload…
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }}
                />
              </label>
              {src && (
                <button
                  type="button"
                  onClick={clearImg}
                  className="shrink-0 rounded-md border border-black/10 px-2.5 py-1.5 font-mono text-[11px] text-deep-navy/70 transition-colors hover:border-coral hover:text-coral"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {src && (
            <>
              <Row label="Position"><AlignPad value={imgPos} onChange={setImgPos} /></Row>
              <Row label="Contrast" value={p.contrast.toFixed(2)}><Slider min={0.6} max={2.4} step={0.05} value={p.contrast} onChange={(v) => set('contrast', v)} /></Row>
              <Row label="Edge glow" value={p.edgeGlow.toFixed(2)}><Slider min={0} max={2.5} step={0.05} value={p.edgeGlow} onChange={(v) => set('edgeGlow', v)} /></Row>
              <Row label="Tone" value={p.tone.toFixed(2)}><Slider min={0} max={1} step={0.05} value={p.tone} onChange={(v) => set('tone', v)} /></Row>
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Export" open={open.export} onToggle={() => toggle('export')}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-deep-navy/55">Seconds</span>
            <input
              type="number"
              min={1}
              max={15}
              value={secs}
              onChange={(e) => setSecs(Math.max(1, Math.min(15, Math.round(Number(e.target.value) || 1))))}
              className="w-16 rounded-md border border-black/15 bg-white px-2.5 py-1.5 font-mono text-[11px] text-deep-navy focus:border-electric-blue focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button" onClick={() => doExport('jpg')} disabled={!!busy} className={exportBtn}>JPG</button>
            <button type="button" onClick={() => doExport('gif')} disabled={!!busy} className={exportBtn}>GIF</button>
            <button type="button" onClick={() => doExport('mp4')} disabled={!!busy} className={exportBtn}>MP4</button>
          </div>
          {busy ? (
            <div className="font-mono text-[10px] text-electric-blue">
              exporting {busy.toUpperCase()}…{busy === 'gif' ? ` ${Math.round(prog * 100)}%` : ''}
            </div>
          ) : exportMsg ? (
            <div className="font-mono text-[10px] text-coral">{exportMsg}</div>
          ) : (
            <p className="font-mono text-[10px] leading-relaxed text-deep-navy/40">
              Seconds set GIF &amp; MP4 length. JPG grabs the current frame — pause to pick one.
            </p>
          )}
        </CollapsibleSection>

        <div className="p-4">
          <button
            type="button"
            onClick={() => setP(DEFAULTS)}
            className="w-full rounded-md border border-black/10 py-2 font-mono text-[11px] uppercase tracking-wider text-deep-navy/60 transition-colors hover:border-deep-navy/30 hover:text-deep-navy"
          >
            reset to default
          </button>
        </div>
      </aside>
    </div>
  );
}
