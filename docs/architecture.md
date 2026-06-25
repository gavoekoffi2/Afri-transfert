# Architecture — AfriTransfer

Ce document décrit l'architecture de la plateforme, les diagrammes UML, les
diagrammes de séquence des flux principaux et les choix techniques.

## 1. Vue d'ensemble

AfriTransfer est une plateforme de transfert d'argent panafricaine construite sur
une architecture **modulaire** (NestJS) respectant les principes **SOLID**. Le
paiement est délégué à l'API **GeniusPay**.

```mermaid
graph TB
  subgraph Client
    FE["Frontend Next.js<br/>(TS · Tailwind · React Query)"]
  end

  subgraph "Backend NestJS (API REST v1)"
    AUTH[Auth / Users]
    BEN[Beneficiaries]
    CTRY[Countries / Operators]
    TXN[Transactions + Fee Engine]
    GP[GeniusPay Client]
    WH[Webhooks]
    NOTIF[Notifications]
    ADMIN[Admin]
  end

  subgraph Infrastructure
    PG[(PostgreSQL<br/>Prisma)]
    REDIS[(Redis<br/>BullMQ)]
    S3[(S3 / MinIO)]
  end

  GENIUS[["API GeniusPay<br/>geniuspay.ci"]]

  FE -->|HTTPS + JWT| AUTH
  FE --> BEN
  FE --> CTRY
  FE --> TXN
  TXN --> GP
  GP -->|POST /payments<br/>GET /pawapay/providers| GENIUS
  GENIUS -->|webhooks signés HMAC| WH
  WH --> TXN
  TXN --> NOTIF
  NOTIF --> REDIS
  AUTH --> PG
  TXN --> PG
  WH --> PG
  ADMIN --> PG
  ADMIN --> GP
  NOTIF -.->|reçus / exports| S3
```

## 2. Modules backend

| Module | Responsabilité |
|--------|----------------|
| `auth` | Inscription, connexion, JWT (access/refresh + rotation), vérif. email/tél., reset mot de passe, 2FA (architecture). |
| `users` | Profil utilisateur. |
| `beneficiaries` | Carnet de bénéficiaires favoris (scopé par utilisateur). |
| `countries` | Pays, devises, opérateurs ; détection pays/opérateur ; synchro GeniusPay. |
| `geniuspay` | Client HTTP typé de l'API GeniusPay (paiements, providers, solde). |
| `transactions` | Moteur de frais `calculateTransferFees()`, flux d'envoi, cycle de vie, reçus. |
| `webhooks` | Réception sécurisée des webhooks GeniusPay (HMAC, anti-rejeu, idempotence). |
| `notifications` | File BullMQ + canaux email / SMS / push. |
| `admin` | Dashboard : utilisateurs, transactions, pays, commissions, stats, export, solde, webhooks. |
| `health` | Supervision (liveness/readiness + ping DB). |

Couche transverse (`common/`) : `CryptoService` (AES-256-GCM, HMAC), filtres
d'exceptions, intercepteurs (enveloppe de réponse, logs), garde JWT global,
garde de rôles, `AuditService`, pagination.

## 3. Modèle de domaine (UML)

```mermaid
classDiagram
  class User {
    +uuid id
    +string email
    +string phone
    +UserStatus status
    +datetime emailVerifiedAt
    +bool twoFactorEnabled
  }
  class Beneficiary {
    +uuid id
    +string name
    +string phone
    +bool isFavorite
  }
  class Country {
    +uuid id
    +string iso2
    +string currencyCode
    +bool supportsPawapay
  }
  class Operator {
    +uuid id
    +string code
    +PaymentMethod paymentMethod
    +string gateway
  }
  class Currency {
    +string code
    +int decimals
  }
  class Transaction {
    +uuid id
    +string reference
    +decimal sendAmount
    +decimal commissionAmount
    +decimal geniusPayFees
    +decimal totalAmount
    +decimal receiveAmount
    +TransactionStatus status
    +string geniusPayReference
  }
  class TransactionLog {
    +TransactionStatus fromStatus
    +TransactionStatus toStatus
    +string event
  }
  class WebhookEvent {
    +string eventId
    +string deliveryId
    +bool signatureValid
    +bigint timestamp
  }
  class Admin {
    +uuid id
    +AdminRole role
  }

  User "1" --> "*" Beneficiary
  User "1" --> "*" Transaction
  Country "1" --> "*" Operator
  Currency "1" --> "*" Country
  Country "1" --> "*" Beneficiary
  Operator "1" --> "*" Beneficiary
  Transaction "1" --> "*" TransactionLog
  Transaction "1" --> "*" WebhookEvent
  Transaction "*" --> "1" Country : senderCountry
  Transaction "*" --> "1" Country : recipientCountry
  Transaction "*" --> "0..1" Operator
```

## 4. Diagramme de séquence — Envoi d'argent

```mermaid
sequenceDiagram
  actor U as Utilisateur
  participant FE as Frontend
  participant API as Backend (Transactions)
  participant FEE as Fee Engine
  participant GP as GeniusPay
  participant DB as PostgreSQL

  U->>FE: Pays, bénéficiaire, montant
  FE->>API: POST /transactions/quote
  API->>FEE: calculateTransferFees(2% + 100)
  FEE-->>API: { commission, total, reçu estimé }
  API-->>FE: Devis (affiché en temps réel)

  U->>FE: Confirmer « Envoyer »
  FE->>API: POST /transactions
  API->>DB: Créer transaction (PENDING)
  API->>GP: POST /payments (amount, mmo_provider, customer)
  alt Aucun moyen choisi
    GP-->>API: { checkout_url }
  else Moyen spécifié
    GP-->>API: { payment_url }
  end
  API->>DB: Enregistrer réf. GeniusPay + URL
  API-->>FE: { reference, paymentUrl | checkoutUrl }
  FE->>U: Redirection vers la page de paiement GeniusPay
```

## 5. Diagramme de séquence — Webhook & confirmation

```mermaid
sequenceDiagram
  participant GP as GeniusPay
  participant WH as Webhooks
  participant CR as CryptoService
  participant TXN as Transactions
  participant NOTIF as Notifications
  participant DB as PostgreSQL

  GP->>WH: POST /api/webhooks/geniuspay (corps + signature)
  WH->>CR: HMAC-SHA256(timestamp + "." + rawBody, secret)
  CR-->>WH: signature attendue
  WH->>WH: comparaison à temps constant
  alt Signature invalide
    WH-->>GP: 401 Invalid signature
  else Timestamp périmé (> 5 min)
    WH-->>GP: 400 Timestamp too old
  else Livraison déjà reçue
    WH-->>GP: 200 { duplicate: true }
  else Valide
    WH->>DB: Journaliser l'événement (table webhooks)
    WH->>TXN: applyGatewayUpdate(status) [idempotent]
    TXN->>DB: Mettre à jour la transaction + log
    TXN->>NOTIF: Notifier (succès / échec)
    WH-->>GP: 200 { received: true }
  end
```

## 6. Authentification

```mermaid
sequenceDiagram
  actor U as Utilisateur
  participant API as Auth
  participant DB as PostgreSQL

  U->>API: POST /auth/login (email, password)
  API->>DB: Charger l'utilisateur
  API->>API: bcrypt.compare (temps constant)
  API->>API: Signer access (15 min) + refresh (30 j)
  API->>DB: Stocker le hash du refresh token
  API-->>U: { accessToken, refreshToken }

  Note over U,API: À l'expiration de l'access token
  U->>API: POST /auth/refresh (refreshToken)
  API->>DB: Vérifier + révoquer l'ancien (rotation)
  API-->>U: Nouvelle paire de jetons
```

## 7. Choix techniques

- **Séparation collecte / décaissement** : la commission AfriTransfer est ajoutée
  au montant collecté ; les frais réels GeniusPay proviennent de la réponse/des
  webhooks. La conversion de devise (XOF↔XAF = 1:1) est estimée à l'affichage et
  confirmée par GeniusPay.
- **Idempotence des webhooks** : déduplication par `X-Webhook-Delivery` + statuts
  terminaux non réécrits, garantissant l'exactitude malgré les renvois.
- **Sécurité des secrets** : clés/secret chiffrés AES-256-GCM avant stockage ;
  jetons stockés en SHA-256 (jamais en clair).
- **Scalabilité** : traitements asynchrones (BullMQ/Redis), index PostgreSQL sur
  les colonnes de filtrage, pagination systématique, statelessness de l'API (JWT).

Voir aussi : [`database-schema.md`](database-schema.md),
[`geniuspay-integration.md`](geniuspay-integration.md),
[`security.md`](security.md), [`deployment.md`](deployment.md).
