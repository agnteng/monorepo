# Architecture decision records

Decisions that affect only this repository. Decisions that bind more than one
repository live in the workspace's `adr/`; a decision here that turns out to
apply everywhere is promoted there and marked `Superseded by org ADR NNNN`.

- One decision per file, `NNNN-short-title.md`, numbered in order.
- **An accepted ADR is never edited.** A new ADR supersedes it; only the old
  one's status line changes.
- Read the ADRs that cover a change before making it. A change that
  contradicts one needs a new ADR in the same pull request.
- This repository is public: an ADR names no internal infrastructure. The
  reasoning that needs it goes in the workspace.

Template: `# NNNN. Title`, then `Status`, `Date`, and the sections Context,
Decision, Consequences.

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-event-data-has-one-home.md) | Event data has one home: `content/<date>/event.json` | Accepted |
| [0002](0002-luma-key-inlined-at-build.md) | `LUMA_API_KEY` is inlined at build time | Accepted |
| [0003](0003-youtube-text-generated.md) | `youtube.md` is generated from `description.md` | Superseded by 0006 |
| [0004](0004-pnpm-workspace.md) | pnpm workspace; `packages/` only for code two apps share | Accepted |
| [0005](0005-fitness-checks.md) | Every past failure becomes a fitness check | Accepted |
| [0006](0006-production-is-its-own-repository.md) | Video, write-ups and event tooling live in `agnteng/production` | Accepted |
