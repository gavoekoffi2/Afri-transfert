# Guide de déploiement — AfriTransfer

## 1. Prérequis

- **VPS Ubuntu** 22.04+ (2 vCPU / 4 Go RAM minimum recommandés)
- **Docker** + **Docker Compose** (déploiement conteneurisé), ou
- **Node.js ≥ 20**, **PostgreSQL 16**, **Redis 7**, **Nginx**, **PM2** (déploiement manuel)
- Un compte **GeniusPay** (clés API + secret webhook)

## 2. Configuration

```bash
cp .env.example .env
```

Renseignez impérativement :

```ini
# Secrets — régénérer (ne JAMAIS utiliser les valeurs d'exemple)
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# GeniusPay
GENIUSPAY_API_KEY=pk_live_...
GENIUSPAY_API_SECRET=sk_live_...
GENIUSPAY_WEBHOOK_SECRET=whsec_live_...
GENIUSPAY_ENVIRONMENT=live

# Base & domaine
DATABASE_URL=postgresql://user:pass@postgres:5432/afritransfer?schema=public
FRONTEND_URL=https://app.afritransfer.africa
NEXT_PUBLIC_API_URL=https://api.afritransfer.africa/api
```

## 3. Déploiement Docker (recommandé)

```bash
docker compose up -d --build
```

Cela démarre PostgreSQL, Redis, MinIO, le backend (applique automatiquement les
migrations via `prisma migrate deploy`) et le frontend. Amorcez ensuite :

```bash
docker compose exec backend npm run seed
```

| Service | URL |
|---------|-----|
| API | http://SERVEUR:4000/api |
| Swagger | http://SERVEUR:4000/api/docs |
| Frontend | http://SERVEUR:3000 |

## 4. Déploiement manuel (PM2)

```bash
# Backend
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run build
pm2 start dist/main.js --name afritransfer-api

# Frontend
cd ../frontend
npm ci
npm run build
pm2 start npm --name afritransfer-web -- start

pm2 save && pm2 startup
```

## 5. Reverse proxy Nginx + TLS

Voir [`deploy/nginx.conf`](../deploy/nginx.conf). Activez HTTPS avec Let's Encrypt :

```bash
sudo certbot --nginx -d api.afritransfer.africa -d app.afritransfer.africa
```

**Important** : le webhook `POST /api/webhooks/geniuspay` exige le corps **brut**.
Nginx ne doit pas altérer le corps (configuration par défaut OK ; ne pas activer
de réécriture de corps).

## 6. Configuration du webhook GeniusPay

Dans le dashboard GeniusPay, créez un webhook pointant vers :

```
https://api.afritransfer.africa/api/webhooks/geniuspay
```

Événements : `payment.success`, `payment.failed`, `payment.cancelled`,
`payment.expired`, `payment.refunded`, `cashout.completed`, `cashout.failed`.
Conservez le `whsec_…` retourné dans `GENIUSPAY_WEBHOOK_SECRET`.

## 7. CI/CD (GitHub Actions)

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) exécute, à chaque push :
lint/typecheck, build et tests backend (avec PostgreSQL + Redis de service), puis
build du frontend. Étendez-le avec un job de déploiement (SSH/registry) selon votre cible.

## 8. Migrations en production

```bash
npx prisma migrate deploy      # applique les migrations en attente (idempotent)
```

Ne jamais utiliser `migrate dev` ou `db push` en production.

## 9. Supervision & exploitation

- **Santé** : `GET /health` (liveness + ping PostgreSQL) — à brancher sur l'uptime-check.
- **Logs** : `pm2 logs` ou `docker compose logs -f backend`.
- **Files** : surveiller Redis/BullMQ (notifications) ; prévoir un dashboard Bull.
- **Sauvegardes** : `pg_dump` quotidien + rétention ; tester la restauration.

## 10. Mise à l'échelle

- API **stateless** (JWT) → réplicable horizontalement derrière le load-balancer Nginx.
- Externaliser PostgreSQL (managé) et Redis (managé) à la croissance.
- Index déjà posés sur les colonnes de filtrage des transactions.
- Le traitement asynchrone (BullMQ) absorbe les pics de notifications.
