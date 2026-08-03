# EatNext

EatNext est une plateforme de restauration (monorepo) : API REST Node.js/Express avec Prisma, client web React (Vite + Tailwind), PostgreSQL et Redis pour le cache et les sessions.

## Structure du dépôt

- **`backend/`** — API REST (Express, Prisma, TypeScript)
- **`frontend/`** — Application web (Vite, React, Tailwind)
- **`docker-compose.yml`** — Services PostgreSQL et Redis (optionnel si Docker est disponible)

## Prérequis

- **Node.js 22+**
- **PostgreSQL 12**
- **Redis**
- **npm**

> **Note :** Si Docker n’est pas disponible sur votre machine, utilisez PostgreSQL et Redis installés localement (instructions ci-dessous).

## PostgreSQL en mode utilisateur (`.pgdata`)

Sans Docker, vous pouvez faire tourner PostgreSQL 12 avec un répertoire de données dans le projet :

```bash
export PG_BIN=/usr/lib/postgresql/12/bin
export PGDATA="$PWD/.pgdata"

# Une seule fois : initialiser le cluster
"$PG_BIN/initdb" -D "$PGDATA" -U "$(whoami)" --encoding=UTF8 --locale=C

# Démarrer le serveur (à refaire à chaque session)
"$PG_BIN/pg_ctl" -D "$PGDATA" -l "$PGDATA/postgresql.log" start

# Créer la base attendue par backend/.env.example
"$PG_BIN/createdb" -h localhost eatnext 2>/dev/null || true
# Pour l’utilisateur eatnext / mot de passe eatnext (voir DATABASE_URL) :
# psql -h localhost -d postgres -c "CREATE USER eatnext WITH PASSWORD 'eatnext' CREATEDB;"
# psql -h localhost -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE eatnext TO eatnext;"
```

Arrêter PostgreSQL :

```bash
"$PG_BIN/pg_ctl" -D "$PGDATA" stop
```

Vérifiez que Redis répond : `redis-cli ping` (réponse attendue : `PONG`).

## Démarrage rapide (API réelle + Docker)

1. **PostgreSQL et Redis (Docker)**

   ```bash
   docker-compose up -d
   ```

   Connexion par défaut : `postgresql://eatnext:eatnext@localhost:5432/eatnext` (voir [`backend/.env.example`](backend/.env.example)).

2. **Backend** (port **3000**)

   ```bash
   cp backend/.env.example backend/.env
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run db:import-ayilaa -- --fallback-centroid
   npm run dev
   ```

   `db:seed` crée le compte admin. `db:import-ayilaa` importe les restaurants depuis [`ayilaa_data.jsonl`](ayilaa_data.jsonl) (géocodage Nominatim, ~20 min pour ~1 150 établissements).

   Alternative OSM : `npm run db:bootstrap` (voir [docs/OSM.md](docs/OSM.md)).

   Documentation API : [http://localhost:3000/v1/docs](http://localhost:3000/v1/docs)

3. **Frontend** (port **5173**)

   ```bash
   cp frontend/.env.example frontend/.env
   cd frontend
   npm install
   npm run dev
   ```

   Le frontend appelle uniquement l’API backend (aucune donnée mock locale).

4. Ouvrir [http://localhost:5173](http://localhost:5173) — l’API est sur [http://localhost:3000/v1](http://localhost:3000/v1).

### Compte admin (seed)

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin@eatnext.africa` | `Password123!` | admin |

Les restaurants proviennent du fichier **Ayilaa** (`db:import-ayilaa`) ou d'**OpenStreetMap** (`db:bootstrap`).

## Données Ayilaa

Fichier source : [`ayilaa_data.jsonl`](ayilaa_data.jsonl) (~1 150 restaurants au Cameroun).

```bash
cd backend
npm run db:import-ayilaa -- --fallback-centroid   # purge + import + géocodage
npm run db:import-ayilaa -- --no-purge --limit 10  # test sur 10 lignes
```

Options : `--fallback-centroid`, `--no-purge`, `--limit N`, `--file chemin.jsonl`.

Pour une base Ayilaa uniquement : `OSM_SYNC_ON_START=false` dans `backend/.env`.

## OpenStreetMap / Overpass (hybride)

EatNext alimente PostgreSQL **uniquement depuis OpenStreetMap** (Overpass API) pour les zones configurées (Yaoundé et Douala par défaut). Voir [docs/OSM.md](docs/OSM.md).

```bash
# Remplissage initial ou resync manuelle (purge les données hors OSM)
cd backend && npm run db:bootstrap
```

Endpoints principaux :
- `GET /v1/restaurants/osm/nearby?lat=&lng=&radius=&sync=`
- `POST /v1/restaurants/osm/sync`
- `GET /v1/restaurants/nearby?includeOsm=true`

## Stratégie de branches

- **`main`** — infrastructure uniquement (Docker, socle minimal backend/frontend, schéma Prisma partagé, documentation infra)
- **`develop`** — branche d’intégration ; toutes les branches `feature/*` fusionnent ici
- **`feature/*`** — une fonctionnalité par branche ; ouvrir une PR vers `develop`

Les mises à jour infra vont sur `main` ; le code applicatif passe par `develop`. Pour une release, `develop` peut être fusionnée dans `main` (optionnel, selon la politique du projet).

## Déploiement Vercel

Frontend et backend se déploient en **deux projets Vercel** (plan Free) via la CLI. Voir [docs/VERCEL.md](docs/VERCEL.md) — guide pas à pas avec `vercel link`, `vercel env add` et `vercel --prod`.

## Fichiers à ne pas committer

Ne commitez pas : `.env`, `.pgdata/`, `node_modules/`, ni d’autres secrets ou artefacts locaux.
