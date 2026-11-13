// Shared brand palette + a swatch picker, so every colour control in the
// playgrounds pulls from the brand colours (no free-form picking).
export const BRAND_COLORS: { name: string; hex: string }[] = [
  { name: 'Electric Blue', hex: '#1E2BE6' },
  { name: 'Bright Blue', hex: '#3A4DFF' },
  { name: 'Periwinkle', hex: '#B5A6FF' },
  { name: 'Cyan', hex: '#1FC6E6' },
  { name: 'Mint', hex: '#16D9A6' },
  { name: 'Violet', hex: '#7C4DF5' },
  { name: 'Magenta', hex: '#ED4BA0' },
  { name: 'Coral', hex: '#FF6E4D' },
  { name: 'Amber', hex: '#FF9E2C' },
  { name: 'Signal Yellow', hex: '#F9C835' },
  { name: 'Soft White', hex: '#F4F5FF' },
  { name: 'Panel Navy', hex: '#0B0E2A' },
  { name: 'Deep Navy', hex: '#05071E' },
];

interface Props {
  value: string;
  onChange: (hex: string) => void;
  // `dark` (default) suits the navy tools; `light` is for the light builder
  // chrome — flips the active ring-offset and idle border so swatches read on
  // a white panel.
  tone?: 'dark' | 'light';
}

export default function BrandColorPicker({ value, onChange, tone = 'dark' }: Props) {
  const sel = (value || '').toLowerCase();
  const activeCls =
    tone === 'light'
      ? 'border-deep-navy ring-2 ring-electric-blue ring-offset-1 ring-offset-white'
      : 'border-soft-white ring-2 ring-bright-blue ring-offset-1 ring-offset-panel-navy';
  const idleCls =
    tone === 'light' ? 'border-black/15 hover:border-black/40' : 'border-white/15 hover:border-white/45';
  return (
    <div className="flex flex-wrap gap-1.5">
      {BRAND_COLORS.map((c) => {
        const active = sel === c.hex.toLowerCase();
        return (
          <button
            key={c.hex}
            type="button"
            title={`${c.name} · ${c.hex}`}
            aria-label={c.name}
            onClick={() => onChange(c.hex)}
            className={`h-7 w-7 rounded-md border transition ${active ? activeCls : idleCls}`}
            style={{ background: c.hex }}
          />
        );
      })}
    </div>
  );
}
