# 0004. pnpm workspace; `packages/` only for shared code

- Status: Accepted
- Date: 2026-11-13

## Context
The website and other apps will join the branding site. Extracting shared
packages before a second consumer exists means guessing their interface.

## Decision
pnpm workspace with Turborepo: `apps/<name>/` per app, `packages/` for code
two or more apps use, consumed as raw source. Install from the root only;
tool versions are pinned in `mise.toml`. Each app builds with the repository
root as Docker context and its own Dockerfile.

## Consequences
The brand tokens and logos move to `packages/` when the website arrives. Until
then `packages/` is empty.
