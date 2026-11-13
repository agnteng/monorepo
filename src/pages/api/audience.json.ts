// On-demand (not prerendered) so every request re-fetches Luma. This is the
// only place a client is allowed to reach Luma data from — LUMA_API_KEY is
// read here, server-side, and never included in the JSON returned below.
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAllGuests, getEventAudience } from '../../lib/luma';
import { LUMA_EVENT_API_ID, LUMA_EVENT_START_AT } from '../../components/slides-2026-11-11/content';

export const GET: APIRoute = async () => {
  const guests = await getAllGuests(LUMA_EVENT_API_ID);
  const audience = getEventAudience(guests, LUMA_EVENT_START_AT);

  return new Response(JSON.stringify(audience), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};
