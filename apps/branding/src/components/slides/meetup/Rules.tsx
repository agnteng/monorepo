import { RULES, type SlideProps } from '../deck';
import { Backdrop, Body, Frame, Header, Headline, NumberedRow } from '../parts';

// ─────────────────────────────────────────────────────────────────────────
// Talk rules — same content as ../slides/SlideRules.tsx, forked so this deck
// can centre the list in the space below the headline (and run it in its own
// order — "No pitches" leads here) without changing the earlier decks.
// ─────────────────────────────────────────────────────────────────────────

// Same three rules, this deck's own order — indices into the shared RULES.
const ORDER = [2, 0, 1];

export function Background({ active }: SlideProps) {
  return <Backdrop fade="right" motion={26} paused={!active} />;
}

export function Content() {
  return (
    <Frame>
      <Header>
        <Headline>Talk rules</Headline>
      </Header>

      <Body>
        {ORDER.map((idx, i) => {
          const r = RULES[idx];
          return (
            <NumberedRow
              key={r.n}
              n={String(i + 1).padStart(2, '0')}
              title={r.title}
              body={r.body}
              titleWidth={560}
              size={56}
              divider={false}
            />
          );
        })}
      </Body>
    </Frame>
  );
}
