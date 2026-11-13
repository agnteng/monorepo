// Server-only Luma API client. Import this ONLY from .astro frontmatter (or
// another server-only module) — never from a .tsx file that ships to the
// browser via client:*, or LUMA_API_KEY ends up in the client bundle.

const LUMA_API_BASE = 'https://api.lu.ma/public/v1';

// The exact ticket type name in Luma, emoji included — this is what
// distinguishes a supporter registration from a free one. If the ticket
// gets renamed in Luma, update this to match.
const SUPPORTER_TICKET_NAME = 'Supporter ❤️';

// Registration question ids on the standard Agentic Engineering form. Same
// form is reused event to event, so these hold across meetups; re-check with
// `event/get` if a question ever gets rebuilt instead of edited in place.
const ROLE_QUESTION_ID = 'f3mmzh5t'; // "Role/Position", single-select dropdown
const INTENT_QUESTION_ID = 'lxacy26a'; // "Anything we should know?", multi-select

interface LumaAnswer {
  question_id: string;
  answer: unknown;
}

export interface LumaGuest {
  name: string;
  checked_in_at: string | null;
  event_ticket?: { name?: string } | null;
  registration_answers?: LumaAnswer[];
}

interface LumaGuestsPage {
  entries: LumaGuest[];
  has_more: boolean;
  next_cursor?: string;
}

/**
 * Every guest for `eventApiId`, paginated to completion. Fetch this once per
 * page render and derive whatever slides need (supporter names, audience
 * mix, ...) from the result, rather than calling it again per slide.
 */
export async function getAllGuests(eventApiId: string): Promise<LumaGuest[]> {
  const apiKey = import.meta.env.LUMA_API_KEY;
  if (!apiKey) {
    console.warn('LUMA_API_KEY is not set — Luma-backed slides will be empty.');
    return [];
  }

  const guests: LumaGuest[] = [];
  let cursor: string | undefined;

  try {
    do {
      const url = new URL(`${LUMA_API_BASE}/event/get-guests`);
      url.searchParams.set('event_api_id', eventApiId);
      if (cursor) url.searchParams.set('pagination_cursor', cursor);

      const res = await fetch(url, { headers: { 'x-luma-api-key': apiKey } });
      if (!res.ok) {
        console.warn(`Luma get-guests failed for ${eventApiId}: ${res.status}`);
        break;
      }

      const page: LumaGuestsPage = await res.json();
      guests.push(...page.entries);
      cursor = page.has_more ? page.next_cursor : undefined;
    } while (cursor);
  } catch (err) {
    console.warn(`Luma get-guests errored for ${eventApiId}:`, err);
  }

  return guests;
}

/** Names of everyone in `guests` registered on a supporter ticket. */
export function getSupporterNames(guests: LumaGuest[]): string[] {
  return guests.filter((g) => g.event_ticket?.name === SUPPORTER_TICKET_NAME).map((g) => g.name);
}

export interface AudienceRole {
  label: string;
  pct: number;
}

export interface AudienceIntent {
  label: string;
  count: number;
}

export interface AudienceData {
  totalGuests: number;
  checkedInCount: number;
  // True once the event has started — the room's makeup then reflects who
  // actually showed up (checked_in_at set) rather than everyone who signed up.
  usingCheckedInOnly: boolean;
  roles: AudienceRole[];
  intent: AudienceIntent[];
}

// Three groups, same split the sponsorship deck uses: engineers absorbs
// researchers and DevRel, everything else not "Founder" falls to the third
// bucket. Order matters — it's the left-to-right order of the bar.
const ROLE_GROUP: Record<string, string> = {
  Founder: 'Founders',
  Engineer: 'Engineers',
  Researcher: 'Engineers',
  DevRel: 'Engineers',
};
const ROLE_FALLBACK_GROUP = 'Others';
const ROLE_ORDER = ['Founders', 'Engineers', 'Others'];

/** Largest-remainder rounding, so shares always sum to exactly 100. */
function roundToHundred(counts: number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return counts.map(() => 0);

  const raw = counts.map((c) => (c / total) * 100);
  const floors = raw.map(Math.floor);
  const remainder = 100 - floors.reduce((a, b) => a + b, 0);
  const byFraction = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let k = 0; k < remainder; k++) result[byFraction[k].i] += 1;
  return result;
}

/**
 * Who's in the room, derived from `guests`. Before `eventStartAt` that's
 * everyone who registered — there's no one checked in yet to filter to. From
 * `eventStartAt` on, it's checked-in guests only, so the slide shows who
 * actually showed up rather than who signed up.
 */
export function getEventAudience(guests: LumaGuest[], eventStartAt: string): AudienceData {
  const checkedInCount = guests.filter((g) => g.checked_in_at).length;
  const usingCheckedInOnly = Date.now() >= new Date(eventStartAt).getTime();
  const pool = usingCheckedInOnly ? guests.filter((g) => g.checked_in_at) : guests;

  const roleCounts: Record<string, number> = { Founders: 0, Engineers: 0, Others: 0 };
  const intentCounts = new Map<string, number>();

  for (const guest of pool) {
    for (const a of guest.registration_answers ?? []) {
      if (a.question_id === ROLE_QUESTION_ID && typeof a.answer === 'string') {
        const group = ROLE_GROUP[a.answer] ?? ROLE_FALLBACK_GROUP;
        roleCounts[group] = (roleCounts[group] ?? 0) + 1;
      }
      if (a.question_id === INTENT_QUESTION_ID && Array.isArray(a.answer)) {
        for (const value of a.answer) {
          if (typeof value === 'string') intentCounts.set(value, (intentCounts.get(value) ?? 0) + 1);
        }
      }
    }
  }

  const pcts = roundToHundred(ROLE_ORDER.map((label) => roleCounts[label] ?? 0));
  const roles = ROLE_ORDER.map((label, i) => ({ label, pct: pcts[i] })).filter((r) => r.pct > 0);

  const intent = [...intentCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));

  return {
    totalGuests: guests.length,
    checkedInCount,
    usingCheckedInOnly,
    roles,
    intent,
  };
}
