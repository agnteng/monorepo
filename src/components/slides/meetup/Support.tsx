import { ASKS, C, type Slide, type SlideProps } from '../deck';
import { Backdrop, Body, Frame, Header, Headline, NumberedRow } from '../parts';

// ─────────────────────────────────────────────────────────────────────────
// 04 — Support the meetup. The standing "how to contribute" table on the
// left; on the right, a live thank-you list of everyone who registered on a
// supporter ticket, pulled from Luma at build time (src/lib/luma.ts) and
// handed down as a prop rather than fetched here — this file ships to the
// browser, and the Luma key must not. Under the list, a screenshot of the
// Luma ticket picker itself — proof, not just a claim, that the Supporter
// tier is one click away.
// ─────────────────────────────────────────────────────────────────────────

const TICKET_IMG_W = 580;
const TICKET_IMG_H = Math.round((TICKET_IMG_W * 603) / 930);

function Content({ supporters, lumaUrl, active }: { supporters: string[]; lumaUrl: string; active: boolean }) {
  return (
    <Frame>
      <Header>
        <Headline>Support the meetup</Headline>
      </Header>

      <Body>
        <div style={{ display: 'flex', gap: 80, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {ASKS.map((a) => (
              <NumberedRow
                key={a.n}
                n={a.n}
                title={a.title}
                body={a.body}
                titleWidth={300}
                size={34}
                divider={false}
              />
            ))}
          </div>

          <div style={{ width: 660, flex: 'none' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.periwinkle,
              }}
            >
              Thank you to tonight&rsquo;s supporters
            </div>

            {supporters.length > 0 ? (
              <div
                style={{
                  marginTop: 28,
                  columnCount: supporters.length > 6 ? 2 : 1,
                  columnGap: 40,
                }}
              >
                {supporters.map((name) => (
                  <div
                    key={name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '10px 0',
                      breakInside: 'avoid',
                    }}
                  >
                    <span style={{ width: 8, height: 8, flex: 'none', background: C.brightBlue }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 600, color: C.white }}>
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  marginTop: 28,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 28,
                  color: 'rgba(244,245,255,0.55)',
                }}
              >
                No supporters yet this month — be the first.
              </p>
            )}

            <a
              href={lumaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              tabIndex={active ? 0 : -1}
              style={{
                display: 'block',
                marginTop: 32,
                width: TICKET_IMG_W,
                pointerEvents: active ? 'auto' : 'none',
                cursor: 'pointer',
              }}
            >
              <img
                src="/assets/luma/supporter-ticket.png"
                alt="Get a Supporter ticket on Luma"
                style={{
                  display: 'block',
                  width: '100%',
                  height: TICKET_IMG_H,
                  objectFit: 'cover',
                  borderRadius: 16,
                  border: '1px solid rgba(181,166,255,0.22)',
                }}
              />
            </a>
          </div>
        </div>
      </Body>
    </Frame>
  );
}

function Background({ active }: SlideProps) {
  return <Backdrop fade="left" motion={30} paused={!active} />;
}

/** supporters arrives as a build-time-fetched prop, so the slide is built per deck instance. */
export function createSupportSlide(supporters: string[], lumaUrl: string): Slide {
  return {
    Background,
    Content: (p) => <Content supporters={supporters} lumaUrl={lumaUrl} active={p.active} />,
  };
}
