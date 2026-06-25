# Schéma de base de données — AfriTransfer

Base : **PostgreSQL** · ORM : **Prisma**. Schéma source :
[`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).

## Diagramme entité-association

```mermaid
erDiagram
  users ||--o{ beneficiaries : possède
  users ||--o{ transactions : initie
  users ||--o{ refresh_tokens : a
  users ||--o{ verification_tokens : a
  users ||--o{ notifications : reçoit
  currencies ||--o{ countries : libelle
  countries ||--o{ operators : héberge
  countries ||--o{ beneficiaries : destination
  countries ||--o{ transactions : "sender / recipient"
  operators ||--o{ beneficiaries : via
  operators ||--o{ transactions : via
  transactions ||--o{ transaction_logs : trace
  transactions ||--o{ webhooks : confirme

  users {
    uuid id PK
    string email UK
    string phone UK
    string password_hash
    enum status
    bool two_factor_enabled
  }
  beneficiaries {
    uuid id PK
    uuid user_id FK
    string name
    string phone
    bool is_favorite
  }
  countries {
    uuid id PK
    string iso2 UK
    string currency_code FK
    bool supports_pawapay
  }
  currencies {
    string code PK
    int decimals
  }
  operators {
    uuid id PK
    string code UK
    uuid country_id FK
    enum payment_method
    string gateway
  }
  transactions {
    uuid id PK
    string reference UK
    uuid user_id FK
    decimal send_amount
    decimal commission_amount
    decimal geniuspay_fees
    decimal total_amount
    decimal receive_amount
    enum status
    string geniuspay_reference UK
  }
  transaction_logs {
    uuid id PK
    uuid transaction_id FK
    enum from_status
    enum to_status
    string event
  }
  webhooks {
    uuid id PK
    string event_id
    string delivery_id UK
    bool signature_valid
    bigint timestamp
    json payload
  }
  admins {
    uuid id PK
    string email UK
    enum role
  }
  settings {
    uuid id PK
    string key UK
    string value
    bool is_secret
  }
  audit_logs {
    uuid id PK
    enum actor_type
    string action
  }
```

## Tables

| Table | Rôle |
|-------|------|
| **users** | Comptes clients. Mot de passe en BCrypt, secret 2FA chiffré AES. Statut PENDING→ACTIVE après vérification email. |
| **verification_tokens** | Jetons email/téléphone/reset (hash SHA-256 + expiration + consommation unique). |
| **refresh_tokens** | Sessions de rafraîchissement JWT (hash, rotation, révocation). |
| **currencies** | Référentiel ISO 4217 (XOF, XAF, CDF, USD…) + nombre de décimales. |
| **countries** | Pays supportés (ISO2/ISO3, indicatif, devise, région, `supports_pawapay`). |
| **operators** | Opérateurs Mobile Money (code GeniusPay, moyen de paiement, gateway). |
| **beneficiaries** | Bénéficiaires favoris d'un utilisateur. |
| **transactions** | Transferts : décomposition financière complète, statut, références GeniusPay, URLs de paiement. |
| **transaction_logs** | Historique des transitions d'état (audit du cycle de vie). |
| **webhooks** | Journal des événements GeniusPay reçus (anti-rejeu + idempotence). |
| **admins** | Comptes administrateurs (rôles SUPER_ADMIN / ADMIN / SUPPORT / COMPLIANCE). |
| **settings** | Configuration clé/valeur (commission, environnement…). Valeurs secrètes chiffrées. |
| **audit_logs** | Journal d'audit transverse (qui, quoi, quand, d'où). |
| **notifications** | Notifications émises (canal, statut, destinataire). |

## Décomposition financière d'une transaction

| Colonne | Description |
|---------|-------------|
| `send_amount` | Montant destiné au bénéficiaire (devise d'envoi). |
| `commission_amount` | Commission AfriTransfer = 2 % × montant + 100 FCFA. |
| `geniuspay_fees` | Frais du fournisseur de paiement (réels via réponse/webhook GeniusPay). |
| `total_amount` | Montant débité = `send_amount` + `commission_amount` + `geniuspay_fees`. |
| `receive_amount` | Montant estimé reçu, converti en devise d'arrivée. |

## Migrations & amorçage

```bash
npx prisma migrate deploy   # applique prisma/migrations/0_init
npm run seed                # devises, pays, opérateurs, paramètres, admin
```

Le seed charge 10 devises, 17 pays et 36 opérateurs issus du catalogue GeniusPay
(MVP Afrique de l'Ouest + Centrale + extension PawaPay). En production, les
opérateurs sont rafraîchis dynamiquement via `GET /pawapay/providers`.
