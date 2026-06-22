# OpenStreetMap / Overpass — stratégie hybride EatNext

EatNext combine **Overpass API** (côté backend uniquement) et **PostgreSQL** (persistance + données utilisateur).

**Règle importante :** le frontend ne contacte jamais Overpass directement. Toute découverte et tout remplissage de la base passent par l’**API EatNext** (`/v1/restaurants/osm/*`).

## Architecture

```
Frontend React  →  API Express  →  Overpass API (dynamique)
                        ↓
                  PostgreSQL (Docker) + Redis (cache)
```

| Besoin | Solution |
|--------|----------|
| Découvrir des POIs alimentaires | `GET /v1/restaurants/osm/nearby` ou `GET /v1/restaurants/nearby?includeOsm=true` |
| **Remplir PostgreSQL** | `POST /v1/restaurants/osm/sync` ou `GET …/osm/nearby?sync=true` ou `GET …/osm/:type/:id?sync=true` |
| Avis, favoris, plaintes | Restaurant avec UUID en base (`source = OSM_SYNC`) |
| Cache | Redis (~10 min) sur requêtes Overpass |

## Endpoints de remplissage BDD

### Sync d’une zone (batch)

```bash
curl -X POST http://localhost:3000/v1/restaurants/osm/sync \
  -H "Content-Type: application/json" \
  -d '{"lat":3.8667,"lng":11.5167,"radius":2000,"limit":30}'
```

Réponse : `{ synced: N, items: [...] }` — upsert Prisma par `osmId` unique.

### Sync à la lecture

```bash
curl "http://localhost:3000/v1/restaurants/osm/nearby?lat=3.8667&lng=11.5167&radius=2000&sync=true"
```

### Sync d’un POI

```bash
curl "http://localhost:3000/v1/restaurants/osm/node/123456?sync=true"
```

## Interface (SearchPage)

- **Mode proximité** — `GET /restaurants/nearby?includeOsm=true`
- **Synchroniser la zone** — `POST /restaurants/osm/sync` (remplit PostgreSQL)
- **Carte Leaflet** — marqueurs bleus (OSM dynamique) / verts (en base)
- **Fiche OSM** — sync automatique puis redirection `/restaurants/:uuid`

## Champs Prisma (`Restaurant`)

- `osmId` (unique), `osmType` (node/way/relation)
- `source` : `USER_SUBMITTED` | `OSM_SYNC`
- `osmTags` (JSON), `lastSyncedAt`, `openingHours`, `phone`, `website`

## Configuration

```env
DATABASE_URL=postgresql://eatnext:eatnext@localhost:5432/eatnext
OVERPASS_URL=https://overpass-api.de/api/interpreter
OVERPASS_TIMEOUT_MS=15000
REDIS_URL=redis://localhost:6379
```

## Vérifier la base après sync

```sql
SELECT count(*) FROM restaurants WHERE source = 'OSM_SYNC';
```

## Bonnes pratiques

- Rayons raisonnables (&lt; 5 km) pour respecter les serveurs Overpass publics.
- Utiliser **Synchroniser la zone** pour les zones consultées souvent.
- Les POIs OSM n’ont pas de note EatNext tant qu’aucun avis utilisateur n’est posté.
