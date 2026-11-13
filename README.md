# Agentic Engineering

The Agentic Engineering website: the brand, the decks, the sponsor deck and
each event's identity (`content/<date>/event.json`). Recordings, talk
write-ups and the video pipeline live in
[agnteng/production](https://github.com/agnteng/production), which reads that
event data from here.

What must not be public (Luma numbers, attendee and supporter lists, sponsor
terms) lives in the private workspace repository. Video and audio live
in no repository.

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
| `content/<date>/event.json` | One event's identity: city, venue, Luma ids, speakers. The decks import it as `@content/<date>/event.json`; production reads it for the write-ups. |
| `scripts/fitness.py` | The fitness checks (`docs/adr/0005`). |
| `docs/adr/` | Decisions about this repository, and why. Org-wide decisions live in the workspace. |
| `tests/snapshots/` | What every page renders (without Luma data); `mise run fitness:render` compares against it. |

## A new meetup

1. `content/<date>/event.json`, copied from the last event and edited.
2. `apps/branding/src/components/slides-<date>/`: copy the last deck's
   `content.ts` and `SlideDeck.tsx` (point the `@content` import at the new
   date), plus `apps/branding/src/pages/slides/<city>-<date>.astro`. Point
   `src/pages/api/audience.json.ts` at the new deck's `content.ts`, so the live
   audience slide polls tonight's event.
3. After the event, production's `meetup-video` skill turns the recording into
   published talks.

## Develop

Tool versions are pinned in `mise.toml`; tasks run the same locally and in CI.

```sh
mise install            # node, pnpm, python, gitleaks
mise run install        # dependencies, from the repository root
mise run dev            # branding site on 127.0.0.1:4321
mise run fitness        # the repository checks CI runs
mise tasks              # everything else
```

The deck pages and `api/audience.json` render on demand. `LUMA_API_KEY` is read
from `.env` at the repository root and inlined at build time
(`docs/adr/0002`); without it they render with no Luma data.

## Deploy

Two Dokploy services build from `main`, with the repository root as build
context: `branding` (`apps/branding/Dockerfile`, a node server) and `sponsors`
(`apps/branding/Dockerfile.sponsors`, nginx serving only the sponsor deck).
After every deploy, `mise run fitness:live` checks production.
