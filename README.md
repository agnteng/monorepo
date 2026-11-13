# Agentic Engineering

Everything for the Agentic Engineering meetups in one repository: the brand,
the decks shown on the night, the sponsor deck, and each event's videos and
write-ups. They share one context on purpose: the talk descriptions, the deck
and the YouTube uploads all read the same event data.

This repository is public. Credentials live in `.env` (ignored) or come from a
secrets manager at runtime; never commit one. Every push and pull request is
scanned by gitleaks, and GitHub push protection is on. For the same scan
locally before each commit, run once per clone:

```sh
git config core.hooksPath .githooks   # needs: brew install gitleaks
```

## Layout

| Path | What |
|---|---|
| `src/pages/` | The site at [branding.agnteng.com](https://branding.agnteng.com): brand guidelines, playground, website mockups, `slides/<city>-<date>` decks, `sponsorship`, and `api/audience.json` (live Luma numbers for tonight's deck). |
| `src/components/slides/` | The deck engine and primitives (`deck.ts`, `parts.tsx`, `DeckEngine.tsx`); `slides/meetup/` holds the slides every meetup deck shares. |
| `src/components/slides-<date>/` | One meetup's deck: its `content.ts`, `SlideDeck.tsx`, and any slide only that night had. |
| `src/components/slides-sponsor/` | The sponsor deck, also served at [sponsors.agnteng.com](https://sponsors.agnteng.com). |
| `src/lib/luma.ts` | Server-only Luma client. Import it only from `.astro` frontmatter or `src/pages/api/`, so `LUMA_API_KEY` stays out of the browser bundle. |
| `content/<date>/` | One event: `event.json` (city, venue, Luma ids, speakers; the deck imports it), `README.md`, and one folder per talk with its transcript and descriptions. Video and `work/` stay on disk, untracked. |
| `scripts/` | The video pipeline: cut, transcribe, write up, upload. See `scripts/README.md`. |
| `.claude/skills/` | `meetup-video` (recording → published talks) and `agentic-engineering-description` (the house format for a talk description). |

## A new meetup

1. `content/<date>/event.json`, copied from the last event and edited.
2. `src/components/slides-<date>/`: copy the last deck's `content.ts` and
   `SlideDeck.tsx` (point its `event.json` import at the new date), plus
   `src/pages/slides/<city>-<date>.astro`. Point `src/pages/api/audience.json.ts`
   at the new deck's `content.ts`, so the live audience slide polls tonight's
   event.
3. After the event, the camera files go in `content/<date>/raw/` and the
   `meetup-video` skill takes it from there.

## Develop

```sh
npm install
npm run dev      # Astro on port 4321
npm run build    # → dist/ (client + the node server for the on-demand routes)
```

The deck pages and `api/audience.json` render on demand and read
`LUMA_API_KEY` from the environment. Without it they render with no Luma data.

## Deploy

Two Dokploy services build from `main`: `branding` (the `Dockerfile`, a node
server) and `sponsors` (`Dockerfile.sponsors`, nginx serving only the sponsor
deck). Merging does not deploy by itself; trigger a deploy afterwards.
