# 0008. Each event's gallery lives in `content/<date>/photos/`

- Status: Accepted
- Date: 2026-11-14
- Supersedes: 0007, for event photos only

## Context
Event pages show a gallery of the night (org ADR 0008). ADR 0007 put event
photos in `apps/branding/public/`, which serves them as-is on both domains
with no checks.

## Decision
A gallery's web copies and their alt text live in `content/<date>/photos/`
and `photos.json`, written by production's `event_photos.py`. The site imports
them through `astro:assets`, which serves resized WebP. Photos already in
`apps/branding/public/` (the decks', the speakers') stay where they are.

## Consequences
The `photos` fitness check covers every file there: listed with alt text, at
most 600 KB and 1600px, no EXIF, XMP or IPTC.
