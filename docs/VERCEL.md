# Déploiement Vercel — EatNext

Ce monorepo se déploie en **deux projets Vercel** liés au même dépôt GitHub. Chaque push sur `main` redéploie automatiquement le frontend et le backend.

| Projet Vercel | Dossier racine | URL type |
|---------------|----------------|----------|
| **eatnext** (frontend) | `frontend` | `https://eatnext.vercel.app` |
| **eatnext-api** (backend) | `backend` | `https://eatnext-api.vercel.app` |

## Prérequis

1. Dépôt GitHub : [ABOGO-tech237/EatNext](https://github.com/ABOGO-tech237/EatNext)
2. Base PostgreSQL hébergée (Neon, Supabase, Vercel Postgres, etc.)
3. Redis optionnel (Upstash Redis recommandé ; le backend fonctionne sans cache)
4. Compte [Vercel](https://vercel.com) connecté à GitHub

## 1. Projet backend (`eatnext-api`)

Dans Vercel : **Add New → Project → Import** le dépôt, puis :

- **Root Directory** : `backend`
- **Framework Preset** : Other
- Les fichiers `backend/vercel.json` et `backend/api/index.ts` configurent Express en serverless.

### Variables d'environnement (backend)

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | oui | PostgreSQL (ex. Neon) |
| `JWT_SECRET` | oui | Secret JWT (256 bits) |
| `REFRESH_TOKEN_SECRET` | oui | Secret refresh token |
| `CLIENT_URL` | oui | URL du frontend Vercel (CORS) |
| `APP_URL` | oui | URL publique de l'API |
| `NODE_ENV` | oui | `production` |
| `OSM_SYNC_ON_START` | non | `false` en prod serverless |
| `OSM_SYNC_INTERVAL_HOURS` | non | `0` (utiliser le cron Vercel) |
| `CRON_SECRET` | recommandé | Secret pour `/api/cron/osm-sync` |
| `REDIS_URL` | non | Upstash ou autre Redis |
| `JWT_EXPIRES_IN` | non | `3600` |
| `REFRESH_TOKEN_EXPIRES_IN` | non | `604800` |

Après le premier déploiement, exécuter le seed une fois (local ou script) :

```bash
cd backend
DATABASE_URL="..." npm run prisma:deploy
DATABASE_URL="..." npm run db:seed
DATABASE_URL="..." npm run db:bootstrap
```

## 2. Projet frontend (`eatnext`)

- **Root Directory** : `frontend`
- **Framework Preset** : Vite (auto-détecté)

### Variables d'environnement (frontend)

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://<votre-backend>.vercel.app/v1` |

## 3. Lier les deux projets

1. Déployer d'abord le **backend**, noter son URL.
2. Déployer le **frontend** avec `VITE_API_URL` pointant vers le backend.
3. Mettre à jour `CLIENT_URL` sur le backend avec l'URL du frontend.
4. Redéployer les deux projets si besoin.

## 4. Cron OSM (backend)

`backend/vercel.json` définit un cron quotidien (03:00 UTC) sur `/api/cron/osm-sync`.  
Définir `CRON_SECRET` dans Vercel ; Vercel envoie `Authorization: Bearer <CRON_SECRET>` automatiquement.

## 5. Vérification

- Backend : `GET https://<api>/health` → `{ "success": true, ... }`
- Backend : `GET https://<api>/v1/docs` → Swagger UI
- Frontend : ouvrir l'URL Vercel du projet frontend

## CLI (optionnel)

```bash
npm i -g vercel

# Backend
cd backend && vercel link
vercel env pull .env.local
vercel --prod

# Frontend
cd frontend && vercel link
vercel env add VITE_API_URL
vercel --prod
```

## Notes

- Le scheduler `setInterval` du backend est désactivé en serverless ; seul le cron Vercel resynchronise OSM.
- Les migrations Prisma s'exécutent au build (`prisma migrate deploy`) si `DATABASE_URL` est configurée.
- Ne commitez jamais de fichiers `.env` contenant des secrets.
