import { RULES, type SlideProps } from './deck';
import { Backdrop, Frame, Headline, NumberedRow } from './parts';

// ─────────────────────────────────────────────────────────────────────────
// 04 — Talk rules. Three rules, large, nothing competing with them. Bodies are
// length-matched in deck.ts so they set as one even line each.
// ─────────────────────────────────────────────────────────────────────────

export function Background({ active }: SlideProps) {
  return <Backdrop fade="right" motion={26} paused={!active} />;
}

export function Content() {
  return (
    <Frame>
      <Headline>Talk rules</Headline>

      <div style={{ marginTop: 'auto' }}>
        {RULES.map((r) => (
          <NumberedRow key={r.n} n={r.n} title={r.title} body={r.body} titleWidth={560} size={56} />
        ))}
      </div>
    </Frame>
  );
}
