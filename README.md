# EatNext

This repository uses **`main` for infrastructure only**: Docker services, minimal app shells, and the shared Prisma schema. Application features (routes, pages, services, seeds, and UI) live on **feature branches** (for example `setup/infra-local` or topic branches merged via PR).

## What is on `main`

| Path | Purpose |
|------|---------|
| `docker-compose.yml` | PostgreSQL and Redis for local development |
| `backend/` | Minimal Node/TypeScript entrypoint, Prisma schema, env template |
| `frontend/` | Minimal Vite + React + Tailwind shell |

## Branch workflow

1. Branch from `main` for feature work.
2. Implement API routes, services, pages, and seeds on that branch.
3. Open a PR when ready; do not commit full application code directly to `main`.

## Quick start (infra)

1. Copy `backend/.env.example` to `backend/.env` and adjust values.
2. Start dependencies: `docker compose up -d`
3. Backend shell: `cd backend && npm install && npm run dev`
4. Frontend shell: `cd frontend && npm install && npm run dev`

Do not commit `.env`, `.pgdata/`, or `node_modules/`.
