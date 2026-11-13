import { ASKS, type SlideProps } from './deck';
import { Backdrop, Frame, Headline, NumberedRow } from './parts';

// ─────────────────────────────────────────────────────────────────────────
// 03 — How to contribute. The pivot of the talk: five concrete jobs, phrased
// as openings rather than chores.
// ─────────────────────────────────────────────────────────────────────────

export function Background({ active }: SlideProps) {
  return <Backdrop fade="left" motion={30} paused={!active} />;
}

export function Content() {
  return (
    <Frame style={{ justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 80, alignItems: 'center' }}>
        <div style={{ width: 560, flex: 'none' }}>
          <Headline style={{ fontSize: 92 }}>How to contribute</Headline>
        </div>

        <div style={{ flex: 1 }}>
          {ASKS.map((a) => (
            <NumberedRow key={a.n} n={a.n} title={a.title} body={a.body} titleWidth={300} size={42} />
          ))}
        </div>
      </div>
    </Frame>
  );
}
