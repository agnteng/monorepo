// Form controls for the speaker/sponsor templates — one speaker's name/title/
// photo, and a variable-length list of sponsor logo uploads. Same input/
// upload styling as the rest of the builder panel (Controls.tsx, the Image
// section in WaveFieldBuilder), just repeated per row instead of once.

export interface SpeakerData {
  name: string;
  title: string;
  photo: string; // blob: URL, or '' for empty
}

const input =
  'w-full min-w-0 rounded-md border border-black/15 bg-white px-2.5 py-1.5 font-mono text-[11px] text-deep-navy placeholder:text-deep-navy/30 focus:border-electric-blue focus:outline-none';
const uploadBtn =
  'flex-1 cursor-pointer truncate rounded-md border border-black/10 px-2.5 py-1.5 text-center font-mono text-[11px] text-deep-navy/70 transition-colors hover:border-electric-blue hover:text-deep-navy';
const clearBtn =
  'shrink-0 rounded-md border border-black/10 px-2.5 py-1.5 font-mono text-[11px] text-deep-navy/70 transition-colors hover:border-coral hover:text-coral';

export function SpeakerRow({
  index,
  value,
  onChange,
}: {
  index: number;
  value: SpeakerData;
  onChange: (v: SpeakerData) => void;
}) {
  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (value.photo) URL.revokeObjectURL(value.photo);
    onChange({ ...value, photo: URL.createObjectURL(f) });
  };
  const clear = () => {
    if (value.photo) URL.revokeObjectURL(value.photo);
    onChange({ ...value, photo: '' });
  };

  return (
    <div className="space-y-2 rounded-md border border-black/10 p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-deep-navy/45">Speaker {index + 1}</div>
      <input
        type="text"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="Name"
        className={input}
      />
      <input
        type="text"
        value={value.title}
        onChange={(e) => onChange({ ...value, title: e.target.value })}
        placeholder="Role, company"
        className={input}
      />
      <div className="flex gap-1.5">
        <label className={uploadBtn}>
          {value.photo ? 'replace photo…' : 'upload photo…'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {value.photo && (
          <button type="button" onClick={clear} className={clearBtn}>
            clear
          </button>
        )}
      </div>
    </div>
  );
}

export function SponsorList({ sponsors, onChange }: { sponsors: string[]; onChange: (v: string[]) => void }) {
  const onFile = (i: number, f: File | undefined) => {
    if (!f) return;
    const next = [...sponsors];
    if (next[i]) URL.revokeObjectURL(next[i]);
    next[i] = URL.createObjectURL(f);
    onChange(next);
  };
  const clear = (i: number) => {
    const next = [...sponsors];
    if (next[i]) URL.revokeObjectURL(next[i]);
    next[i] = '';
    onChange(next);
  };
  const remove = (i: number) => {
    if (sponsors[i]) URL.revokeObjectURL(sponsors[i]);
    onChange(sponsors.filter((_, j) => j !== i));
  };
  const add = () => onChange([...sponsors, '']);

  return (
    <div className="space-y-2 pt-1">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-deep-navy/55">Sponsor logos</span>
        <span className="font-mono text-[11px] text-deep-navy/40">SVG or PNG</span>
      </div>
      {sponsors.map((src, i) => (
        <div key={i} className="flex gap-1.5">
          <label className={uploadBtn}>
            {src ? `logo ${i + 1} — loaded` : `upload logo ${i + 1}…`}
            <input
              type="file"
              accept="image/*,.svg"
              className="hidden"
              onChange={(e) => {
                onFile(i, e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {src && (
            <button type="button" onClick={() => clear(i)} className={clearBtn}>
              clear
            </button>
          )}
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label={`Remove sponsor ${i + 1}`}
            className="shrink-0 rounded-md border border-black/10 px-2 py-1.5 font-mono text-[11px] text-deep-navy/50 transition-colors hover:border-coral hover:text-coral"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full rounded-md border border-dashed border-black/15 py-1.5 font-mono text-[11px] text-deep-navy/50 transition-colors hover:border-electric-blue hover:text-electric-blue"
      >
        + add logo
      </button>
    </div>
  );
}
