import { C, PAD, type Slide, type SlideProps } from '../deck';
import { Backdrop, Body, Frame, Header, Headline, Placeholder, Subhead } from '../parts';

// ─────────────────────────────────────────────────────────────────────────
// 02 — The community. Title and subhead centred, not left-aligned — this
// slide is a statement rather than a data readout, so it reads as one the
// way a poster does. Below it, a 3×2 grid of photo slots rather than three
// dated event cards: no city, no date, just the room. Slots without a photo
// fall back to a placeholder box, same pattern as the sponsor slide's logo
// and screenshot.
// ─────────────────────────────────────────────────────────────────────────

const COLS = 3;
const GAP = 32;
const TRACK_W = 1920 - PAD * 2;
const CARD_W = (TRACK_W - GAP * (COLS - 1)) / COLS;
const CARD_H = Math.round(CARD_W * 0.64);

function Background({ active }: SlideProps) {
  return <Backdrop fade="radial" motion={22} paused={!active} />;
}

export interface CommunityCopy {
  headline: string;
  subhead: string;
}

function Content({ community, photos }: { community: CommunityCopy; photos: (string | null)[] }) {
  return (
    <Frame style={{ alignItems: 'center' }}>
      <Header style={{ textAlign: 'center' }}>
        <Headline style={{ textAlign: 'center' }}>{community.headline}</Headline>
        <Subhead style={{ textAlign: 'center', lineHeight: 1.34, maxWidth: 1450 }}>{community.subhead}</Subhead>
      </Header>

      <Body>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${CARD_W}px)`,
            gap: GAP,
          }}
        >
          {photos.map((photo, i) =>
            photo ? (
              <img
                key={i}
                src={photo}
                alt="Agentic Engineering"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  objectFit: 'cover',
                  borderRadius: 20,
                  border: '1px solid rgba(181,166,255,0.18)',
                  background: C.panelNavy,
                }}
              />
            ) : (
              <Placeholder key={i} height={CARD_H} label="Photo" />
            ),
          )}
        </div>
      </Body>
    </Frame>
  );
}

// Shared by every meetup deck since 26 Aug 2026; the per-event values come in
// through the factory below, from that deck's content.ts.
export function createCommunitySlide(community: CommunityCopy, photos: (string | null)[]): Slide {
  return { Background, Content: () => <Content community={community} photos={photos} /> };
}
