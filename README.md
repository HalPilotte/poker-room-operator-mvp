# Poker Room Operator — MVP

Monorepo scaffold for the Poker-Room-Operator MVP plan. Uses Kanban JSON files under `ops/kanban/` to track work across Backlog, In Progress, Testing, and Finished.

> Note: This scaffold is stack-agnostic until the Development Stack file is confirmed. Replace placeholders once the stack is finalized.

## Structure
- `apps/frontend/` — UI scaffold placeholder.
- `services/api/` — API scaffold placeholder.
- `infra/` — IaC and deployment scripts placeholder.
- `ops/kanban/` — Kanban JSON: `Backlog.json`, `InProgress.json`, `Finished.json`.
- `docs/` — Plans and specifications.
- `scripts/` — Local dev and CI helper scripts.

## Kanban Workflow
1. Create ticket in `Backlog.json`.
2. Move to `InProgress.json` and set `status` to "In Progress" when work starts.
3. Set `status` to "Testing" once initial tests pass.
4. Move to `Finished.json` with `status` "Finished" when complete.
5. If blocked, keep in `InProgress.json`, set `status` to "Blocked", and add `error` details.

Timestamps are ISO 8601 UTC. PII must be masked.

## Getting Started
- Initialize Git:
  ```bash
  git init
  git add .
  git commit -m "chore: scaffold MVP repo"
  ```
- Replace placeholders based on the confirmed Development Stack.
- Optional: add GitHub Actions, Dockerfiles, and IaC once stack is set.