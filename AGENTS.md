# AGENTS.md

Read `README.md` first: it maps the repository. Then these rules, which the
code can't tell you:

- **This repository is public.** Its files, commit messages, pull requests and
  issues name no internal infrastructure: no secret-store vaults or items,
  secret references, internal repositories or script paths, machine names,
  hostnames, IP addresses or service IDs. Saying it deploys on Dokploy is
  fine. Private business material goes to `agnteng/private`.
- **Media stays out of the repository.** Video, audio, frames and chunk
  transcripts live in `~/agnteng-media/<date>/`. Never commit them, and never
  move them into `content/`.
- **pnpm from the root.** `pnpm install` at the repository root only; add a
  dependency with `pnpm --filter <app> add <pkg>`.
- **Shared code goes in `packages/`** only once a second app needs it.
- **Event data has one home**: `content/<date>/event.json`. Decks import it;
  don't copy its values into code.
- **A build that loses `LUMA_API_KEY` still returns 200 everywhere.** After any
  change to the build or deploy, check `/api/audience.json` for a non-zero
  `totalGuests`.
- Recordings → published talks: the `meetup-video` skill. Talk descriptions:
  `agentic-engineering-description`.
