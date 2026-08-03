#!/usr/bin/env bash
# Déploiement EatNext sur Vercel (CLI, plan Free)
# Prérequis : vercel login && backend/.env rempli
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/backend/.env"
VERCEL="$ROOT/backend/node_modules/.bin/vercel"
if [[ ! -x "$VERCEL" ]]; then
  VERCEL="npx --yes vercel@latest"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Erreur : créez $ENV_FILE (voir backend/.env.example)"
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

echo "==> Vérification connexion Vercel…"
$VERCEL whoami

vercel_env() {
  local name="$1" value="$2" target="${3:-production}"
  printf '%s' "$value" | $VERCEL env add "$name" "$target" --force 2>/dev/null \
    || printf '%s' "$value" | $VERCEL env add "$name" "$target"
}

echo "==> Migrations Prisma…"
cd "$ROOT/backend"
npx prisma generate
npx prisma migrate deploy

echo "==> Seed + bootstrap OSM (première fois)…"
npm run db:seed || true
npm run db:bootstrap || true

echo "==> Backend — link + env + deploy…"
$VERCEL link --yes --project eatnext-api 2>/dev/null \
  || $VERCEL link --yes

vercel_env DATABASE_URL "$DATABASE_URL"
vercel_env JWT_SECRET "$JWT_SECRET"
vercel_env REFRESH_TOKEN_SECRET "$REFRESH_TOKEN_SECRET"
vercel_env NODE_ENV "${NODE_ENV:-production}"
vercel_env APP_URL "${APP_URL:-https://eatnext-api.vercel.app}"
vercel_env CLIENT_URL "${CLIENT_URL:-https://eatnext.vercel.app}"
vercel_env OSM_SYNC_ON_START "${OSM_SYNC_ON_START:-false}"
vercel_env OSM_SYNC_INTERVAL_HOURS "${OSM_SYNC_INTERVAL_HOURS:-0}"
vercel_env CRON_SECRET "${CRON_SECRET:-changeme}"

API_URL=$($VERCEL --prod --yes 2>&1 | tee /dev/stderr | grep -oE 'https://[a-z0-9-]+\.vercel\.app' | tail -1 || true)
echo "Backend déployé : ${API_URL:-voir sortie ci-dessus}"

echo "==> Frontend — link + env + deploy…"
cd "$ROOT/frontend"
$VERCEL link --yes --project eatnext 2>/dev/null \
  || $VERCEL link --yes

API_BASE="${API_URL:-${APP_URL:-https://eatnext-api.vercel.app}}"
vercel_env VITE_API_URL "${API_BASE}/v1"

WEB_URL=$($VERCEL --prod --yes 2>&1 | tee /dev/stderr | grep -oE 'https://[a-z0-9-]+\.vercel\.app' | tail -1 || true)
echo "Frontend déployé : ${WEB_URL:-voir sortie ci-dessus}"

if [[ -n "${WEB_URL:-}" ]]; then
  echo "==> Mise à jour CLIENT_URL sur le backend…"
  cd "$ROOT/backend"
  vercel_env CLIENT_URL "$WEB_URL"
  $VERCEL --prod --yes
fi

echo ""
echo "✓ Terminé"
echo "  API  : ${API_URL:-https://eatnext-api.vercel.app}"
echo "  Web  : ${WEB_URL:-https://eatnext.vercel.app}"
