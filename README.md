# MeghJatra

AI-powered travel planning platform. Monorepo with a Next.js frontend, an Express/TypeScript API, and a shared package of types/schemas.

## Structure

```
apps/web       Next.js 14 (App Router) frontend
apps/api       Express + TypeScript API
packages/shared  Shared TS types / zod schemas used by both apps
```

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (for local Postgres, added in a later commit)

## Setup

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

## Development

```bash
npm run dev:api    # starts the API (placeholder until Commit 2)
npm run dev:web    # starts the web app (placeholder until Commit 4)
```

## Other scripts

```bash
npm run build       # build all workspaces
npm run lint        # lint all workspaces
npm run typecheck   # typecheck all workspaces
```

## Build status

This project is being built commit-by-commit following a staged plan (foundations → auth → destinations/AI → trip planning → budget → accommodations/food → wishlist/reviews → admin → advanced features → hardening/deployment). See commit history for progress.
