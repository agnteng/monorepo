import { ANCHORS, anchorFactors, type Anchor } from './anchor';

// A single SVG widget for picking one of 9 alignment positions (the corners,
// edges and centre of a frame). The active position is a filled accent dot;
// the rest are faint so all options stay discoverable.
export default function AlignPad({ value, onChange }: { value: Anchor; onChange: (a: Anchor) => void }) {
  const pos = (a: Anchor) => {
    const { fx, fy } = anchorFactors(a);
    return { x: 10 + fx * 24, y: 10 + fy * 24 };
  };
  return (
    <svg viewBox="0 0 44 44" width="40" height="40" className="rounded-md border border-black/10 bg-white">
      <rect x="6.5" y="6.5" width="31" height="31" rx="4" fill="none" stroke="rgba(5,7,30,0.12)" />
      {ANCHORS.map((a) => {
        const { x, y } = pos(a);
        const active = value === a;
        return (
          <g key={a} onClick={() => onChange(a)} style={{ cursor: 'pointer' }} aria-label={a}>
            <rect x={x - 6} y={y - 6} width={12} height={12} fill="transparent" />
            <circle cx={x} cy={y} r={active ? 4 : 2.3} fill={active ? '#1E2BE6' : 'rgba(5,7,30,0.22)'} />
          </g>
        );
      })}
    </svg>
  );
}
