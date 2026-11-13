import { C, PAD, type SlideProps } from '../slides/deck';
import { Backdrop, Frame, Headline, Subhead } from '../slides/parts';
import { COLLECT, INTENT, ROLE_TOTAL, ROLES, STATS } from './content';

// ─────────────────────────────────────────────────────────────────────────
// 03 — Who is in the room.
//
// Two questions, answered in order down the slide. Who are these people: one
// bar divided three ways, because they are shares of one whole and separate
// bars would encode "how big is each", which is not what a sponsor is asking.
// Then, can I reach the right ones: three columns across the bottom.
//
// Those three columns are the third attempt at this band, so the two failures
// are worth writing down.
//
// Side by side as headings-with-explanations, one heading had no explanation
// and the row read as a field somebody forgot to fill in. Writing a subtitle
// for it only moved the problem: the slide was then explaining the word
// "Company" to people who buy sponsorships.
//
// Stacked full width, every column got its line and the slide grew a bigger
// hole down the right-hand side instead, because two short lists cannot fill
// 1664px however they are arranged.
//
// What fixes it is that the three columns are three different SHAPES rather
// than three instances of one shape: two numbers, a list, a list with a
// trailing detail. Nothing has to line up with anything, so nothing can fail
// to. Intent leads the two lists because it is the part a sponsor cannot get
// anywhere else — every event can tell you someone's job title, and none of
// them can tell you that person turned up looking for a co-founder.
//
// The three columns take the only auto margin now that the footnote is gone,
// so every spare pixel opens the gap between the legend and them — the space
// grows with the slide instead of being pinned to a number that goes stale the
// next time the content changes.
//
// Every box sets flexShrink: 0. The Frame is a flex column, so without it a
// slide that outgrows the stage silently thins its own bar instead of
// overflowing, and the gutter check sees nothing wrong.
// ─────────────────────────────────────────────────────────────────────────

const TRACK_W = 1920 - PAD * 2;
const BAR_H = 72;
const COL_GAP = 88;

const SEGMENT_COLOR: Record<string, string> = {
  Founders: C.brightBlue,
  Engineers: C.periwinkle,
  'Investors & others': '#39406B',
};

const MONO_LABEL = {
  fontFamily: 'var(--font-mono)',
  fontSize: 22,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: C.periwinkle,
};

const LIST_ROW = {
  marginTop: 14,
  fontFamily: 'var(--font-sans)',
  fontSize: 27,
  fontWeight: 600,
  lineHeight: 1.2,
  color: 'rgba(244,245,255,0.88)',
};

export function Background({ active }: SlideProps) {
  return <Backdrop fade="left" motion={20} paused={!active} />;
}

export function Content() {
  return (
    <Frame>
      <Headline>Who&rsquo;s in the room</Headline>
      <Subhead style={{ margin: '18px 0 0' }}>{ROLE_TOTAL}</Subhead>

      {/* one whole, divided */}
      <div
        style={{
          display: 'flex',
          width: TRACK_W,
          height: BAR_H,
          flexShrink: 0,
          marginTop: 90,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {ROLES.map((r) => (
          <div key={r.label} style={{ width: `${r.pct}%`, background: SEGMENT_COLOR[r.label] }} />
        ))}
      </div>

      {/* Each label sits on the left edge of the band it names, so the bar is
          its own legend. */}
      <div style={{ display: 'flex', width: TRACK_W, flexShrink: 0, marginTop: 24 }}>
        {ROLES.map((r) => (
          <div key={r.label} style={{ width: `${r.pct}%`, paddingRight: 24, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: C.white,
              }}
            >
              {r.pct}%
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: 'var(--font-sans)',
                fontSize: 26,
                fontWeight: 500,
                color: 'rgba(244,245,255,0.62)',
              }}
            >
              {r.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: COL_GAP, flexShrink: 0, marginTop: 'auto' }}>
        <div style={{ flex: 3, minWidth: 0 }}>
          <div style={MONO_LABEL}>{STATS.label}</div>
          {/* Stacked, not side by side. The two columns beside this one are
              vertical lists, so a horizontal pair here was the only thing on
              the row reading left-to-right, and it made the stats block half
              the height of its neighbours. Stacked, all three columns run down
              the slide and finish at roughly the same depth.

              Both numbers are white. Picking out the attendance in blue made it
              the answer and the registrations the setup, which is a judgement
              the slide does not need to make for the reader. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 18 }}>
            {STATS.items.map((it) => (
              <div key={it.label}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 64,
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    color: C.white,
                  }}
                >
                  {it.n}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 25,
                    fontWeight: 500,
                    color: 'rgba(244,245,255,0.62)',
                  }}
                >
                  {it.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 4, minWidth: 0 }}>
          <div style={MONO_LABEL}>{INTENT.label}</div>
          {INTENT.items.map((it) => (
            <div key={it} style={LIST_ROW}>
              {it}
            </div>
          ))}
        </div>

        <div style={{ flex: 4, minWidth: 0 }}>
          <div style={MONO_LABEL}>{COLLECT.label}</div>
          {COLLECT.items.map((it) => (
            <div key={it.name} style={{ ...LIST_ROW, display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span>{it.name}</span>
              {/* The platforms ride along on the same line rather than becoming
                  three more rows. They are one field, not three. */}
              {it.detail && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 21,
                    fontWeight: 400,
                    color: 'rgba(244,245,255,0.5)',
                  }}
                >
                  {it.detail}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* A second auto margin. With only the band claiming one, every spare
          pixel piled up above it and the note sat tight against the columns;
          split between the two, the footnote reads as a footnote. */}
    </Frame>
  );
}
