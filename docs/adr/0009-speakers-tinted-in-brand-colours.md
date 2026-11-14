# 0009. Speakers are tinted in a brand colour

- Status: Accepted; colour pairs, fades and fixed density superseded by 0010
- Date: 2026-11-14 (moved here from the workspace's org ADR 0011 on 2026-11-14; it binds only this repository)
- Refines: org ADR 0010 (speaker masks): the person is no longer shown as photographed; the masks stand

## Context
With one dither behind every speaker, the tiles all looked alike, and the
photos, taken anywhere in any light, didn't look like the brand.

## Decision
Each speaker tile takes one of five brand colour pairs, an animation and a
fade, cycled by its position in the grid. The person (cut out by the org ADR
0010 mask) is shown in greyscale with the tile's colour laid over it, so
every speaker reads in the brand's palette. Cell size and density stay the
same on every tile.

## Consequences
The tint is CSS, so the headshot files are untouched by it. Speaker photos
elsewhere (talk pages, avatars) stay untinted.
