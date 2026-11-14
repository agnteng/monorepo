# 0010. Speaker tiles use the brand's animation presets

- Status: Accepted
- Date: 2026-11-14 (moved here from the workspace's org ADR 0015 on 2026-11-14; it binds only this repository)
- Supersedes: the colour pairs, fades and fixed density of 0009

## Decision
Speaker tiles cycle through five presets chosen in the brand's animation
builder (color, edge, background and density; cell 4, no gap, motion 82, no
fade, square cells) and the animations aurora, drift, bloom and swarm, by
their position in the grid. The tile's background is the preset's
background colour; the person is tinted in the preset's main colour.

## Consequences
The presets live in `apps/site/src/components/SpeakerPhoto.astro`; changing
the look means changing them there.
