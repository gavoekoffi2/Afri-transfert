<div align="center">

# 🌍 AfriTransfer

### Envoyez de l'argent partout en Afrique, simplement.

Plateforme panafricaine de transfert d'argent — moderne, rapide, sécurisée et évolutive.
Construite sur l'API de paiement **[GeniusPay](https://geniuspay.ci/docs/api)**.

</div>

---

## Sommaire

- [Vision](#vision)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Structure du dépôt](#structure-du-dépôt)
- [Intégration GeniusPay](#intégration-geniuspay)
- [Calcul des frais](#calcul-des-frais)
- [Webhooks](#webhooks)
- [Sécurité](#sécurité)
- [Tests](#tests)
- [Documentation](#documentation)
- [Feuille de route](#feuille-de-route)

---

## Vision

Envoyer de l'argent entre pays africains reste aujourd'hui difficile (Cameroun → Togo,
Congo → Sénégal, RDC → Côte d'Ivoire…). AfriTransfer supprime cette complexité.

L'utilisateur choisit uniquement :

1. le **pays de départ** ;
2. le **pays d'arrivée** ;
3. le **montant** ;
4. le **bénéficiaire**.

Tout le reste — détection de l'opérateur, devise, frais, routage du paiement, suivi —
est **entièrement automatisé**. L'expérience doit donner la même impression de simplicité
que Wave.

### Couverture du MVP

| Zone | Pays |
|------|------|
| **Afrique de l'Ouest** | Togo, Côte d'Ivoire, Sénégal, Bénin, Burkina Faso, Mali, Niger |
| **Afrique Centrale** | Cameroun, Congo, RDC, Gabon, RCA |

L'architecture est extensible à **tous** les pays supportés par GeniusPay.

---

## Fonctionnalités

- 🔐 **Authentification** — inscription, connexion, vérification email/téléphone, reset
  mot de passe, JWT (access + refresh), architecture 2FA prête.
- 💸 **Envoi d'argent** — formulaire pays→pays, calcul de frais en temps réel, suivi live.
- 🌍 **Détection automatique** — pays, opérateur et devise déduits du numéro Mobile Money
  via `GET /pawapay/providers`.
- 🧾 **Reçus & historique** — historique paginé, reçus téléchargeables.
- 👥 **Bénéficiaires favoris** — carnet d'adresses des destinataires.
- 🔔 **Notifications** — email, SMS et push (architecture prête) sur chaque étape.
- 🪝 **Webhooks GeniusPay** — vérification HMAC, anti-rejeu, mise à jour automatique.
- 🛠️ **Dashboard admin** — utilisateurs, transactions, pays, opérateurs, commissions,
  statistiques, export CSV, solde GeniusPay, historique webhooks, configuration.

---

## Architecture

AfriTransfer suit une architecture **modulaire NestJS** respectant les principes SOLID.

```
┌──────────────┐      HTTPS/JWT      ┌──────────────────────────────────────┐
│  Frontend    │ ─────────────────▶ │            Backend (NestJS)           │
│  Next.js     │ ◀───────────────── │                                       │
└──────────────┘                    │  Auth │ Users │ Beneficiaries         │
                                    │  Countries │ Transactions │ Admin     │
                                    │  GeniusPay client │ Webhooks          │
                                    │  Notifications (BullMQ)               │
                                    └───┬─────────────┬───────────┬─────────┘
                                        │             │           │
                                  ┌─────▼────┐  ┌─────▼────┐  ┌───▼─────┐
                                  │PostgreSQL│  │  Redis   │  │GeniusPay│
                                  │ (Prisma) │  │ BullMQ   │  │   API   │
                                  └──────────┘  └──────────┘  └─────────┘
```

Voir [`docs/architecture.md`](docs/architecture.md) pour le détail, les diagrammes UML et
les diagrammes de séquence.

---

## Stack technique

| Couche | Technologies |
|--------|--------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, React Query |
| **Backend** | NestJS 10, TypeScript, Prisma ORM, PostgreSQL, Redis, BullMQ |
| **Sécurité** | JWT, BCrypt, Helmet, rate-limiting, chiffrement AES-256-GCM, validation stricte |
| **Infra** | Docker, Docker Compose, Nginx, GitHub Actions, PM2 |
| **Stockage** | S3 compatible (MinIO en local) |
| **Docs API** | Swagger / OpenAPI |

---

## Démarrage rapide

### Prérequis

- Node.js ≥ 20, npm ≥ 10
- Docker & Docker Compose (recommandé)

### 1. Cloner et configurer

```bash
git clone <repo>
cd Afri-transfert
cp .env.example .env       # renseignez vos clés GeniusPay
```

### 2. Tout démarrer avec Docker

```bash
docker compose up -d
```

- Backend API  → http://localhost:4000/api
- Swagger      → http://localhost:4000/api/docs
- Frontend     → http://localhost:3000

### 3. Démarrage manuel (backend)

```bash
cd backend
npm install
npx prisma migrate dev      # crée le schéma
npm run seed                # pays, devises, opérateurs, admin par défaut
npm run start:dev
```

### 4. Démarrage manuel (frontend)

```bash
cd frontend
npm install
npm run dev
```

---

## Structure du dépôt

```
Afri-transfert/
├── backend/            # API NestJS (cœur de la plateforme)
│   ├── prisma/         # Schéma + seed de la base de données
│   ├── src/
│   │   ├── common/     # Garde-fous transverses : crypto, guards, filtres…
│   │   ├── config/     # Configuration typée et validée
│   │   ├── modules/    # Modules métier (auth, transactions, geniuspay, webhooks…)
│   │   └── main.ts
│   └── test/           # Tests e2e
├── frontend/           # Application Next.js
├── docs/               # Architecture, schéma BDD, diagrammes, déploiement
├── docker-compose.yml
└── .env.example
```

---

## Intégration GeniusPay

Toute la communication paiement passe par l'API GeniusPay (`https://geniuspay.ci/api/v1/merchant`).
Le client est entièrement typé et fidèle à la [documentation officielle](https://geniuspay.ci/docs/api) :

- `POST /payments` — initie un paiement. Sans `payment_method`, on utilise le `checkout_url`
  hébergé ; avec, on redirige vers le `payment_url` du gateway.
- `GET /pawapay/providers` — découverte des opérateurs Mobile Money par pays.
- `GET /account/balance` — solde marchand (exposé au dashboard admin).

Voir [`docs/geniuspay-integration.md`](docs/geniuspay-integration.md).

---

## Calcul des frais

La commission AfriTransfer est de **2 % + 100 FCFA**, calculée **côté backend** par la
fonction dédiée `calculateTransferFees()`
([`backend/src/modules/transactions/fees/transfer-fees.ts`](backend/src/modules/transactions/fees/transfer-fees.ts)).

```
Exemple — 10 000 FCFA :
  Commission AfriTransfer = 2% × 10 000 + 100 = 300 FCFA
  Frais GeniusPay (estimés, ex. 2,5%)         = 250 FCFA
  Montant total débité                        = 10 550 FCFA
  Montant reçu estimé                         = 10 000 FCFA
```

---

## Webhooks

Endpoint : `POST /api/webhooks/geniuspay`. Chaque webhook est :

1. **vérifié** par signature `HMAC-SHA256(timestamp + "." + payload, whsec)` ;
2. **protégé contre le rejeu** (tolérance de timestamp de 5 min + déduplication par delivery id) ;
3. **journalisé** intégralement (table `webhooks`) ;
4. **appliqué** à la transaction correspondante de façon idempotente.

Événements gérés : `payment.success`, `payment.failed`, `payment.cancelled`,
`payment.expired`, `payment.refunded`, `cashout.completed`, `cashout.failed`, etc.

---

## Sécurité

JWT • BCrypt • validation stricte (class-validator) • Helmet (XSS/headers) • rate limiting •
ORM paramétré (anti-injection SQL) • chiffrement AES-256-GCM des secrets • journalisation
d'audit complète • architecture 2FA prête. Voir [`docs/security.md`](docs/security.md).

---

## Tests

```bash
cd backend
npm test            # tests unitaires (frais, signature webhook…)
npm run test:e2e    # tests d'intégration
npm run test:cov    # couverture
```

---

## Documentation

| Document | Contenu |
|----------|---------|
| [`docs/architecture.md`](docs/architecture.md) | Architecture, UML, diagrammes de séquence |
| [`docs/database-schema.md`](docs/database-schema.md) | Schéma de base de données détaillé |
| [`docs/geniuspay-integration.md`](docs/geniuspay-integration.md) | Intégration GeniusPay |
| [`docs/security.md`](docs/security.md) | Modèle de sécurité |
| [`docs/deployment.md`](docs/deployment.md) | Guide de déploiement (VPS, Docker, CI/CD) |
| Swagger | `http://localhost:4000/api/docs` |

---

## Feuille de route

Architecture prête pour : Flutterwave, Paystack direct, Stripe, Stellar/USDT, Bitcoin
Lightning, wallet interne, cartes virtuelles/physiques, API publique + SDK, app Flutter,
programme d'affiliation, KYC/AML, détection de fraude, multi-langue (FR/EN/PT).

---

<div align="center">
<sub>AfriTransfer — construit pour gérer des millions de transactions. 🚀</sub>
</div>
