import type { ReactNode } from 'react';

// Light-mode control primitives for the Animation Builder panel. Same rhythm
// (mono 11px labels, rounded controls) as the old dark sidebar — only the
// colours flip to read on white.

export function Row({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-deep-navy/55">{label}</span>
        {value != null && <span className="font-mono text-[11px] text-deep-navy/40">{value}</span>}
      </div>
      {children}
    </div>
  );
}

export function Slider(props: { min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="range"
      min={props.min}
      max={props.max}
      step={props.step}
      value={props.value}
      onChange={(e) => props.onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-deep-navy/10 accent-electric-blue"
    />
  );
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
            value === o
              ? 'border-electric-blue bg-electric-blue text-white'
              : 'border-black/10 text-deep-navy/60 hover:border-deep-navy/30 hover:text-deep-navy'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
