# Agentic Engineering

Everything public for the Agentic Engineering meetups in one repository: the
brand, the decks shown on the night, the sponsor deck, each event's write-ups,
and the pipeline that turns a recording into published talks. They share one
context on purpose: the talk descriptions, the decks and the YouTube uploads
all read the same event data, and the website will join them under `apps/`.

What must not be public (Luma numbers, attendee and supporter lists, sponsor
terms) lives in the private `agnteng/private` repository. Video and audio live
in neither: see *Media* below.

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
| `apps/branding/` | [branding.agnteng.com](https://branding.agnteng.com) (Astro): brand guidelines, playground, website mockups, the `slides/<city>-<date>` decks, `sponsorship`, and `api/audience.json` (live Luma numbers for tonight's deck). Also builds [sponsors.agnteng.com](https://sponsors.agnteng.com). |
| `apps/branding/src/components/slides/` | The deck engine and primitives; `slides/meetup/` holds the slides every meetup deck shares, `slides-<date>/` one meetup's own. |
| `apps/branding/src/lib/luma.ts` | Server-only Luma client. Import it only from `.astro` frontmatter or `src/pages/api/`, so `LUMA_API_KEY` stays out of the browser bundle. |
| `packages/` | Code shared by two or more apps, consumed as raw source. Empty until the website arrives; the brand tokens and logos move here then. |
| `content/<date>/` | One event: `event.json` (city, venue, Luma ids, speakers; the decks import it as `@content/<date>/event.json`), `README.md`, and one folder per talk with its transcript and descriptions. |
| `scripts/` | The video pipeline: cut, transcribe, write up, upload. See `scripts/README.md`. |
| `.claude/skills/` | `meetup-video` (recording → published talks) and `agentic-engineering-description` (the house format for a talk description). |

## Media

Camera files, audio, frames, chunk transcripts and clips are never in the
repository. They live in `~/agnteng-media/<date>/` (`raw/`, `work/`, one `.mp4`
per talk), and the scripts find them from the event's date. Set
`AGNTENG_MEDIA` to keep them somewhere else, such as an external disk.

## A new meetup

1. `content/<date>/event.json`, copied from the last event and edited.
2. `apps/branding/src/components/slides-<date>/`: copy the last deck's
   `content.ts` and `SlideDeck.tsx` (point the `@content` import at the new
   date), plus `apps/branding/src/pages/slides/<city>-<date>.astro`. Point
   `src/pages/api/audience.json.ts` at the new deck's `content.ts`, so the live
   audience slide polls tonight's event.
3. After the event, the camera files go in `~/agnteng-media/<date>/raw/` and the
   `meetup-video` skill takes it from there.

## Develop

pnpm workspace with Turborepo. Install from the repository root only.

```sh
pnpm install
pnpm --filter branding dev   # Astro on 127.0.0.1:4321
pnpm build                   # every app, through turbo
```

The deck pages and `api/audience.json` render on demand. `LUMA_API_KEY` is read
from `.env` at the repository root and inlined at build time; without it they
render with no Luma data.

## Deploy

Two Dokploy services build from `main`, with the repository root as build
context: `branding` (`apps/branding/Dockerfile`, a node server) and `sponsors`
(`apps/branding/Dockerfile.sponsors`, nginx serving only the sponsor deck).
