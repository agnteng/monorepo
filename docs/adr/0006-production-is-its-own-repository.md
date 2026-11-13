# 0006. Production is its own repository

- Status: Accepted
- Date: 2026-11-13

## Context
This repository held the site and decks alongside the video pipeline, its
skills, the transcription benchmark and every talk's write-ups. The site uses
none of that: it reads only `content/<date>/event.json` and the speaker
photos. Pipeline changes ran the site's CI and render snapshots for nothing,
and pre-event tooling had no natural home.

## Decision
The pipeline (`scripts/` except `fitness.py`), the `meetup-video` and
`agentic-engineering-description` skills, the benchmark and the write-ups
under `content/<date>/` move to `agnteng/production`, a public repository,
with their history. `event.json` stays here, because the decks build from it
(ADR 0001); production reads it from a checkout next to this one. ADR 0003
moves with the code it governs and is production's ADR 0001.

## Consequences
This repository is the website only. The `youtube-md` fitness check moves to
production; `events`, `render` and `live` stay here. A change to an event's
identity is still one edit, here.
