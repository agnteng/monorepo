# 0005. Every past failure becomes a fitness check

- Status: Accepted
- Date: 2026-11-13

## Context
The same classes of failure kept costing time: a build silently missing its
Luma key, internal names leaking into public text, media and scratch files
handled as if they were source, hand-copied text drifting, refactors that
might change what a deck renders.

## Decision
`scripts/fitness.py` describes a healthy repository as checks, run locally
with `mise run fitness`, in CI on every push and pull request, and against
production after every deploy (`mise run fitness:live`). When something breaks
in a way no check caught, add a check before closing the fix.

## Consequences
CI needs the `PUBLIC_DENYLIST` secret. Deck snapshots under `tests/snapshots/`
change only on purpose (`mise run fitness:snapshots`).
