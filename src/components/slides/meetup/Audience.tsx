import { useEffect, useState } from 'react';
import { C, PAD, type Slide, type SlideProps } from '../deck';
import { Backdrop, Body, Frame, Header, Headline } from '../parts';
import type { Speaker } from '../deck';
import type { AudienceData } from '../../../lib/luma';

// Re-polled after mount so the room's numbers stay current through the event
// without anyone reloading the page — see the useEffect in Content below.
const POLL_MS = 30_000;

// ─────────────────────────────────────────────────────────────────────────
// Who's in the room tonight. Four columns: the room's own numbers take the
// left three (bar, legend, intent), speakers take the last one. Centred as
// a single block in the space below the headline.
//
// Intent counts are horizontal bars, not a stat grid — they're absolute
// counts, not shares of a whole like the role bar above them, and a bar
// scaled to the largest count says "how much more" at a glance instead of
// making the reader compare four disconnected numbers.
//
// One text scale for every number+label pair (role share, speaker name/
// title) — STAT_N/STAT_LABEL below — instead of each section picking its
// own size.
//
// "Interested in sponsoring the event" is dropped from intent: that answer is
// for organizers, not something to broadcast to the room.
//
// The headline number follows the same rule as everything else here: before
// the event starts it's total registrations, from start time on it's
// checked-in guests — see data.usingCheckedInOnly, set in getEventAudience
// (src/lib/luma.ts).
// ─────────────────────────────────────────────────────────────────────────

const TRACK_W = 1920 - PAD * 2;
const COL_GAP = 96;
// 3/5 room numbers, 2/5 speakers.
const LEFT_W = Math.round(((TRACK_W - COL_GAP) * 3) / 5);
const RIGHT_W = TRACK_W - COL_GAP - LEFT_W;
const BAR_H = 64;
const SPONSOR_INTENT_LABEL = 'Interested in sponsoring the event';
const LIVE_GREEN = '#16D9A6'; // brand Mint

// One scale, used for the role legend and the speaker names alike.
const STAT_N = 52;
const STAT_LABEL = 24;

const SEGMENT_COLOR: Record<string, string> = {
  Founders: C.brightBlue,
  Engineers: C.periwinkle,
  Others: '#39406B',
};

const CAPTION = {
  fontFamily: 'var(--font-mono)',
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.periwinkle,
};

function Background({ active }: SlideProps) {
  return <Backdrop fade="left" motion={20} paused={!active} />;
}

function LiveDataPill() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 28px',
        borderRadius: 999,
        background: 'rgba(22,217,166,0.18)',
        border: '1.5px solid rgba(22,217,166,0.65)',
        boxShadow: '0 0 28px rgba(22,217,166,0.3)',
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          flex: 'none',
          borderRadius: '50%',
          background: LIVE_GREEN,
          boxShadow: `0 0 12px ${LIVE_GREEN}`,
          animation: 'live-pulse 1.6s ease-in-out infinite',
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 19,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: LIVE_GREEN,
        }}
      >
        Live data
      </span>
    </div>
  );
}

function Content({ data: initialData, speakers }: { data: AudienceData; speakers: Speaker[] }) {
  const [data, setData] = useState(initialData);

  // Server-rendered `initialData` is already fresh (the deck page is
  // on-demand, not prerendered — see the deck's page under src/pages/slides/), so this just
  // keeps it fresh as more people check in while the deck stays open.
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/audience.json', { cache: 'no-store' });
        if (!res.ok) return;
        const next: AudienceData = await res.json();
        if (!cancelled) setData(next);
      } catch {
        // Transient network hiccup — keep showing the last good data and
        // try again on the next tick.
      }
    }

    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const intent = data.intent.filter((i) => i.label !== SPONSOR_INTENT_LABEL);
  const maxIntent = Math.max(1, ...intent.map((i) => i.count));
  const roomCount = data.usingCheckedInOnly ? data.checkedInCount : data.totalGuests;

  return (
    <Frame>
      <style>{'@keyframes live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }'}</style>

      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Headline>{roomCount} in the room tonight</Headline>
          <LiveDataPill />
        </div>
      </Header>

      <Body>
        <div style={{ display: 'flex', gap: COL_GAP, alignItems: 'flex-start' }}>
          <div style={{ width: LEFT_W, flex: 'none' }}>
            {data.roles.length > 0 ? (
              <>
                <div style={{ display: 'flex', width: LEFT_W, height: BAR_H, borderRadius: 10, overflow: 'hidden' }}>
                  {data.roles.map((r) => (
                    <div key={r.label} style={{ width: `${r.pct}%`, background: SEGMENT_COLOR[r.label] }} />
                  ))}
                </div>

                <div style={{ display: 'flex', width: LEFT_W, marginTop: 30 }}>
                  {data.roles.map((r) => (
                    <div key={r.label} style={{ width: `${r.pct}%`, paddingRight: 20, minWidth: 0 }}>
                      <Stat n={`${r.pct}%`} label={r.label} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 26, color: 'rgba(244,245,255,0.55)' }}>
                No one checked in yet — check back once doors open.
              </p>
            )}

            {intent.length > 0 ? (
              <div style={{ marginTop: 92, display: 'flex', flexDirection: 'column', gap: 40 }}>
                {intent.map((it) => (
                  <IntentBar key={it.label} label={it.label} count={it.count} max={maxIntent} />
                ))}
              </div>
            ) : (
              <p
                style={{
                  marginTop: 92,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 24,
                  color: 'rgba(244,245,255,0.55)',
                }}
              >
                Nobody has flagged anything yet.
              </p>
            )}
          </div>

          <div style={{ width: RIGHT_W, flex: 'none' }}>
            <div style={CAPTION}>Tonight&rsquo;s speakers</div>
            <div style={{ marginTop: 28 }}>
              {speakers.map((s, i) => (
                <SpeakerRow key={i} speaker={s} />
              ))}
            </div>
          </div>
        </div>
      </Body>
    </Frame>
  );
}

/** Absolute counts, not shares — a bar scaled to the largest one, not a pie. */
function IntentBar({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20 }}>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: STAT_LABEL,
            fontWeight: 600,
            color: 'rgba(244,245,255,0.85)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: STAT_LABEL,
            fontWeight: 800,
            color: C.white,
            flex: 'none',
          }}
        >
          {count}
        </span>
      </div>
      <div style={{ marginTop: 14, height: 16, borderRadius: 8, background: 'rgba(244,245,255,0.08)' }}>
        <div
          style={{
            height: '100%',
            width: `${(count / max) * 100}%`,
            borderRadius: 8,
            background: C.brightBlue,
          }}
        />
      </div>
    </div>
  );
}

const HEADSHOT = 132;

function SpeakerRow({ speaker }: { speaker: Speaker }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '26px 0' }}>
      {speaker.photo ? (
        <img
          src={speaker.photo}
          alt={speaker.name}
          style={{ width: HEADSHOT, height: HEADSHOT, flex: 'none', borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            width: HEADSHOT,
            height: HEADSHOT,
            flex: 'none',
            borderRadius: '50%',
            background: 'rgba(244,245,255,0.04)',
            border: '2px dashed rgba(244,245,255,0.22)',
          }}
        />
      )}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: C.white,
          }}
        >
          {speaker.name}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-sans)',
            fontSize: STAT_LABEL,
            fontWeight: 500,
            color: 'rgba(244,245,255,0.55)',
          }}
        >
          {speaker.title}
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: string | number; label: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: STAT_N,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          color: C.white,
        }}
      >
        {n}
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: 'var(--font-sans)',
          fontSize: STAT_LABEL,
          fontWeight: 500,
          color: 'rgba(244,245,255,0.62)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** data arrives as a build-time-fetched prop, so the slide is built per deck instance. */
export function createAudienceSlide(data: AudienceData, speakers: Speaker[]): Slide {
  return {
    Background,
    Content: () => <Content data={data} speakers={speakers} />,
  };
}
