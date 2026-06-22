# OpenStreetMap / Overpass — stratégie hybride EatNext

EatNext combine **Overpass API** (découverte dynamique) et **PostgreSQL** (persistance + données utilisateur) pour les restaurants issus d'OpenStreetMap.

## Pourquoi hybride ?

| Besoin | Solution |
|--------|----------|
| Trouver des restaurants près d'un point sans données locales | Overpass API en temps réel |
| Avis, favoris, plaintes sur un lieu OSM | Sync en base → `id` UUID + `osmId` unique |
| Recherches répétées dans la même zone | Cache Redis (Overpass ~10 min) + lignes PostgreSQL |
| Données utilisateur (soumissions propriétaires) | `source = USER_SUBMITTED`, modération `pending` |

## Flux

1. **Découverte dynamique** — `GET /v1/restaurants/osm/nearby?lat=&lng=&radius=`
   - Appel Overpass → POIs `amenity=restaurant|cafe|fast_food|bar…` et `shop=bakery`
   - Résultats avec id synthétique `osm-{type}-{id}` si non synchronisés

2. **Sync zone** — `POST /v1/restaurants/osm/sync` ou `GET …/osm/nearby?sync=true`
   - Overpass → upsert Prisma par `osmId`
   - Statut `published`, `source = OSM_SYNC`, tags bruts dans `osmTags` (JSON)

3. **Recherche fusionnée** — `GET /v1/restaurants/nearby?includeOsm=true`
   - Restaurants publiés en base + POIs OSM non déjà présents (déduplication par `osmId`)

## Champs Prisma (`Restaurant`)

- `osmId` (unique), `osmType` (node/way/relation)
- `source` : `USER_SUBMITTED` | `OSM_SYNC`
- `osmTags` (JSON), `lastSyncedAt`, `openingHours`, `phone`, `website`

## Configuration

```env
OVERPASS_URL=https://overpass-api.de/api/interpreter
OVERPASS_TIMEOUT_MS=15000
REDIS_URL=redis://localhost:6379
```

## Bonnes pratiques

- Respecter les serveurs Overpass publics : rayons raisonnables (&lt; 5 km), pas de polling agressif.
- Préférer `sync=true` ou `/osm/sync` pour les zones que les utilisateurs consultent souvent.
- Les POIs OSM n'ont pas de note EatNext tant qu'aucun avis utilisateur n'est posté.

## Exemple (Yaoundé)

```bash
curl "http://localhost:3000/v1/restaurants/osm/nearby?lat=3.8667&lng=11.5167&radius=2000&limit=10"
```
