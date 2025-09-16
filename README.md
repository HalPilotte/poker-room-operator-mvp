# Poker Room Operator — MVP

Monorepo for the Poker Room Operator MVP, designed to streamline development and operations.

## Structure

- `apps/frontend/` — Next.js admin console.
- `apps/mobile/` — React Native staff/player app.
- `services/api/` — NestJS API backend.
- `services/realtime/` — Socket.IO hub.
- `infra/` — Terraform + AWS IaC.
- `docs/` — Specifications and plans.
- `.github/workflows/` — CI/CD pipelines.

## Kanban Workflow

This project uses GitHub Projects for task management:

1. Create issues in the repository and apply appropriate labels.
2. Link issues to the GitHub Project board.
3. Move issues through columns: Backlog → In Progress → Testing → Done.
4. Use labels to indicate blocked or error states.

## Getting Started

- Clone the repository:

  ```bash
  git clone <repo-url>
  ```

- Install dependencies in the frontend, mobile, and api directories:

  ```bash
  pnpm install
  ```

- Start local infrastructure services:

  ```bash
  docker-compose up db redis
  ```

- CI/CD is handled via GitHub Actions configured in `.github/workflows/`.
