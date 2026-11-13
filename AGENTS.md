# AGENTS.md

Read `README.md` first: it maps the repository. Read the ADRs in
`docs/adr/` that cover what you're changing: they record why things are the
way they are. A change that contradicts an ADR needs a new ADR that supersedes
it, in the same pull request. Then these rules:

- **This repository is public.** Its files, commit messages, pull requests and
  issues name no internal infrastructure: no secret-store vaults or items,
  secret references, internal repositories or script paths, machine names,
  hostnames, IP addresses or service IDs. Saying it deploys on Dokploy is
  fine. Private business material goes to the private workspace.
- **Media stays out of the repository.** Video, audio, frames and chunk
  transcripts live in `$AGNTENG_MEDIA/<date>/`. Never commit them, and never
  move them into `content/`.
- **Tools and tasks come from `mise.toml`.** `mise install` pins node, pnpm,
  python and gitleaks; run tasks as `mise run <task>` (`mise tasks` lists
  them), which is what CI runs too. Install dependencies from the repository
  root only; add one with `pnpm --filter <app> add <pkg>`.
- **Fitness checks are the definition of done.** `mise run fitness` before
  every pull request; `mise run fitness:render` when a change could alter what
  a page shows (`mise run fitness:snapshots` only when it should). When
  something breaks that no check caught, add a check to `scripts/fitness.py`
  as part of the fix.
- **Shared code goes in `packages/`** only once a second app needs it. The
  brand lives in `packages/brand`: build pages from its components, tokens,
  icons and dither rather than new look-alikes.
- **Talks and Q&A in `content/<date>/` come from production's
  `publish_talks.py`.** Change the source there and re-run it.
- **Event data has one home**: `content/<date>/event.json`. Decks import it;
  don't copy its values into code. Production's `scripts/luma_event.py` fills
  it from Luma.
- **A deploy is done when `mise run fitness:live` passes.** A build that loses
  `LUMA_API_KEY` still returns 200 everywhere (`docs/adr/0002`).
- **Video, write-ups and event tooling live in `agnteng/production`**, checked
  out next to this repository as `../production/`. It reads `event.json` from
  here.
