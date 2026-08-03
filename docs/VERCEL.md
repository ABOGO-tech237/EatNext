# Déploiement Vercel — EatNext (CLI, plan Free)

Deux projets Vercel depuis le **même dépôt GitHub**, déployés entièrement en **CLI**. Le plan **Hobby (gratuit)** suffit pour les deux.

| Projet | Dossier | Commande |
|--------|---------|----------|
| **eatnext-api** | `backend/` | `cd backend && vercel --prod` |
| **eatnext** | `frontend/` | `cd frontend && vercel --prod` |

## 0. Installation (une fois)

```bash
npm i -g vercel
# ou sans installation globale :
# npx vercel@latest <commande>
```

Connexion au compte Vercel (ouvre le navigateur) :

```bash
vercel login
vercel whoami   # doit afficher votre compte
```

## 1. Backend — `eatnext-api`

```bash
cd backend
vercel link
```

Réponses suggérées à `vercel link` :

- **Set up and deploy?** → `N` (on configure d'abord les variables)
- **Which scope?** → votre compte perso ou équipe
- **Link to existing project?** → `N`
- **Project name** → `eatnext-api`
- **In which directory is your code?** → `./` (vous êtes déjà dans `backend/`)

### Variables d'environnement (backend)

Remplacer les valeurs entre `<…>` avant de coller. Chaque commande demande la valeur puis l'environnement → choisir **Production** (et **Preview** si vous voulez).

```bash
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add REFRESH_TOKEN_SECRET production
vercel env add NODE_ENV production          # valeur : production
vercel env add APP_URL production           # temporaire : https://eatnext-api.vercel.app
vercel env add CLIENT_URL production        # temporaire : https://eatnext.vercel.app
vercel env add OSM_SYNC_ON_START production # valeur : false
vercel env add OSM_SYNC_INTERVAL_HOURS production  # valeur : 0
vercel env add CRON_SECRET production       # long secret aléatoire
```

Optionnel :

```bash
vercel env add REDIS_URL production         # Upstash Redis (gratuit)
vercel env add JWT_EXPIRES_IN production    # 3600
vercel env add REFRESH_TOKEN_EXPIRES_IN production  # 604800
```

### Premier déploiement backend

```bash
vercel --prod
```

Noter l'URL affichée, ex. `https://eatnext-api.vercel.app`.

Vérifier :

```bash
curl https://eatnext-api.vercel.app/health
```

### Base de données (une fois)

Avec une base PostgreSQL hébergée (Neon, Supabase, Vercel Postgres…) :

```bash
# depuis backend/, avec la même DATABASE_URL que sur Vercel
export DATABASE_URL="postgresql://..."
npm run prisma:deploy
npm run db:seed
npm run db:bootstrap
```

### Lier GitHub (auto-deploy à chaque push)

Depuis la racine du dépôt ou `backend/` :

```bash
vercel git connect
```

Choisir le dépôt **ABOGO-tech237/EatNext**. Vercel redéploie automatiquement à chaque push sur `main`.

> Dans le dashboard Vercel, vérifier que le **Root Directory** du projet `eatnext-api` est bien `backend`.

---

## 2. Frontend — `eatnext`

```bash
cd frontend
vercel link
```

- **Project name** → `eatnext`
- **Directory** → `./`

```bash
vercel env add VITE_API_URL production
# valeur : https://eatnext-api.vercel.app/v1  (URL réelle du backend)
```

```bash
vercel --prod
```

Noter l'URL, ex. `https://eatnext.vercel.app`.

---

## 3. Relier frontend ↔ backend (CORS)

Mettre à jour `CLIENT_URL` sur le backend avec l'URL réelle du frontend :

```bash
cd backend
vercel env rm CLIENT_URL production
vercel env add CLIENT_URL production   # https://eatnext.vercel.app
vercel env rm APP_URL production
vercel env add APP_URL production      # https://eatnext-api.vercel.app
vercel --prod
```

---

## 4. Commandes utiles au quotidien

```bash
# Redéployer en prod
cd backend  && vercel --prod
cd frontend && vercel --prod

# Prévisualiser une branche (preview URL gratuite)
vercel

# Voir les logs
vercel logs eatnext-api --prod
vercel logs eatnext --prod

# Lister les variables
vercel env ls

# Télécharger les vars en local (backend)
cd backend && vercel env pull .env.local
```

---

## 5. Cron OSM (backend, plan Pro requis pour cron)

`backend/vercel.json` déclare un cron quotidien sur `/api/cron/osm-sync`.  
Sur le **plan Free**, les crons Vercel ne tournent pas — lancez la sync manuellement :

```bash
curl -X POST https://eatnext-api.vercel.app/v1/restaurants/osm/sync \
  -H "Content-Type: application/json" \
  -d '{"lat":3.8667,"lng":11.5167,"radius":8000,"limit":150}'
```

Ou appelez `/api/cron/osm-sync` avec `Authorization: Bearer <CRON_SECRET>` depuis un cron externe (GitHub Actions, cron-job.org…).

---

## 6. Checklist finale

- [ ] `GET https://<api>/health` → `{ "success": true }`
- [ ] `GET https://<api>/v1/docs` → Swagger
- [ ] Frontend charge et appelle l'API (pas d'erreur CORS)
- [ ] `vercel git connect` sur les deux projets (optionnel mais pratique)

## Notes

- Les dossiers `.vercel/` sont locaux (lien projet) — ne pas les committer.
- Le scheduler `setInterval` du backend est inactif en serverless ; pas de sync OSM au démarrage en prod (`OSM_SYNC_ON_START=false`).
- Les migrations Prisma s'exécutent au build si `DATABASE_URL` est définie.
- Ne commitez jamais de fichiers `.env` contenant des secrets.
