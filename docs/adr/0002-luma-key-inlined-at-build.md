# 0002. `LUMA_API_KEY` is inlined at build time

- Status: Accepted
- Date: 2026-11-13

## Context
Astro inlines `import.meta.env.LUMA_API_KEY` into the server build; it is not
read when the server starts. The deploy writes the service's variables to
`.env` in the build context. Excluding `.env` from the Docker context removed
the key from the build: every page still answered 200 and the deck showed no
audience (`totalGuests: 0`).

## Decision
`.env` stays in the Docker build context, and `astro.config.mjs` reads it
from the repository root (`vite.envDir`). The key appears only in the server
build, never in `dist/client`. After any change to the build, check
`/api/audience.json` for a non-zero `totalGuests`.

## Consequences
A runtime secret source (for example a secrets runner wrapping the server)
would need `src/lib/luma.ts` to read `process.env` first; that change
supersedes this ADR.
