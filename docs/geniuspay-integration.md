# Intégration GeniusPay — AfriTransfer

Référence officielle : <https://geniuspay.ci/docs/api>
Base URL : `https://geniuspay.ci/api/v1/merchant`
Implémentation :
[`backend/src/modules/geniuspay`](../backend/src/modules/geniuspay/geniuspay.service.ts)

## 1. Authentification

Chaque requête inclut les en-têtes :

| En-tête | Valeur |
|---------|--------|
| `X-API-Key` | Clé publique (`pk_sandbox_…` / `pk_live_…`) |
| `X-API-Secret` | Clé secrète (`sk_sandbox_…` / `sk_live_…`) — **jamais côté client** |
| `Content-Type` | `application/json` |

Configuration via `.env` : `GENIUSPAY_API_KEY`, `GENIUSPAY_API_SECRET`,
`GENIUSPAY_WEBHOOK_SECRET`, `GENIUSPAY_ENVIRONMENT`.

## 2. Endpoints utilisés

| Méthode | Endpoint | Usage AfriTransfer |
|---------|----------|--------------------|
| `POST` | `/payments` | Initier un transfert (collecte). |
| `GET` | `/payments/{reference}` | Synchroniser le statut (repli sur les webhooks). |
| `GET` | `/payments` | Liste des paiements (dashboard admin). |
| `GET` | `/pawapay/providers?country=XX` | Découverte dynamique des opérateurs MMO. |
| `GET` | `/account` | Infos du compte marchand. |
| `GET` | `/account/balance` | Solde marchand (dashboard admin). |

## 3. Création d'un paiement

```jsonc
// POST /payments
{
  "amount": 10550,              // total = montant + commission (+ frais)
  "currency": "XAF",
  "payment_method": "pawapay",  // omis -> page de checkout hébergée
  "mmo_provider": "MTN_MOMO_CMR",
  "customer": { "name": "...", "phone": "+237...", "country": "CM" },
  "success_url": "https://app/transfer/ATR-XXXX?status=success",
  "error_url":   "https://app/transfer/ATR-XXXX?status=error",
  "metadata": { "afritransfer_reference": "ATR-XXXX" }
}
```

### Règle checkout vs payment_url

> **Aucun moyen de paiement choisi → `checkout_url`** (page hébergée GeniusPay,
> l'expéditeur choisit). **Moyen spécifié → `payment_url`** (redirection directe
> vers le gateway).

Le backend stocke les deux URLs et redirige le client vers `payment_url ?? checkout_url`.

### Routage automatique

`TransactionsService.buildPaymentRequest()` décide :

1. opérateur résolu **et** pays `supports_pawapay` → `payment_method=pawapay` + `mmo_provider` ;
2. opérateur avec moyen dédié → `payment_method` (wave, orange_money, mtn_money…) ;
3. sinon → aucun moyen → **checkout** (`checkout_url`).

## 4. Détection automatique pays / opérateur

`GET /pawapay/providers?country=CI` renvoie les opérateurs disponibles. Côté
plateforme, `CountriesService.detectByPhone()` déduit le pays par correspondance
du plus long indicatif, puis liste ses opérateurs — reproduisant l'auto-détection
PawaPay sans appel réseau. `OperatorsService.syncFromGeniusPay()` rafraîchit le
catalogue local.

## 5. Devises & conversion

9 devises locales + XOF/EUR/USD. XOF et XAF sont indexés à l'euro au même taux →
conversion **1:1** (la majorité des corridors MVP). Les autres conversions sont
estimées à l'affichage (table de taux pivot) et confirmées par GeniusPay, qui
stocke en XOF.

## 6. Webhooks

Voir [`architecture.md`](architecture.md#5-diagramme-de-séquence--webhook--confirmation).
Endpoint : `POST /api/webhooks/geniuspay`. Signature :

```
HMAC-SHA256(timestamp + "." + corps_brut, GENIUSPAY_WEBHOOK_SECRET)
```

En-têtes : `X-Webhook-Signature`, `X-Webhook-Timestamp`, `X-Webhook-Event`,
`X-Webhook-Delivery`, `X-Webhook-Environment`.

Événements gérés : `payment.initiated/success/failed/cancelled/refunded/expired`,
`cashout.requested/approved/completed/failed`, `webhook.test`.

## 7. Gestion des erreurs

Le client convertit les erreurs GeniusPay (`{ success:false, error:{ code, message } }`)
en exceptions NestJS en conservant le code et le statut HTTP. Les erreurs réseau
deviennent `503 Service de paiement temporairement indisponible`.

| Code GeniusPay | HTTP |
|----------------|------|
| `MISSING_API_KEY` / `INVALID_API_KEY` | 401 |
| `MERCHANT_INACTIVE` | 403 |
| `PAYMENT_INIT_FAILED` | 400 |
| `TRANSACTION_NOT_FOUND` / `COUNTRY_NOT_SUPPORTED` | 404 |
| `VALIDATION_ERROR` | 422 |
