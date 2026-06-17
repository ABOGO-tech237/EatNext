# EatNext

Monorepo layout for local development and deployment scaffolding.

## Structure

- **`docker-compose.yml`** — PostgreSQL and Redis for local services
- **`backend/`** — Node API (Express, Prisma, TypeScript)
- **`frontend/`** — Vite + React + Tailwind client

## Quick start

1. Copy `backend/.env.example` to `backend/.env` and adjust values.
2. Start dependencies: `docker compose up -d`
3. Backend: `cd backend && npm install && npm run dev`
4. Frontend: `cd frontend && npm install && npm run dev`

Do not commit `.env`, `.pgdata/`, or `node_modules/`.
