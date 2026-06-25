# Sécurité — AfriTransfer

La plateforme manipule des fonds : la sécurité est traitée comme une exigence de
premier ordre, en défense en profondeur.

## 1. Authentification & sessions

- **JWT** : access token court (15 min) + refresh token long (30 j) avec **rotation**
  et révocation (hash stocké en base, jamais le jeton en clair).
- **BCrypt** (12 rounds) pour les mots de passe ; comparaison à temps constant
  même pour un email inconnu (anti-énumération par timing).
- **Politique de mot de passe** : ≥ 8 caractères, majuscule, minuscule, chiffre.
- **2FA** : architecture prête (`twoFactorEnabled` + secret chiffré) ; point
  d'extension `verifyTwoFactor()` pour brancher TOTP (otplib).
- Vérification **email** (jeton 24 h) et **téléphone** (OTP 10 min).

## 2. Protection des secrets

- **AES-256-GCM** (`CryptoService`) pour chiffrer les secrets stockés (secret 2FA,
  clés API en base). Clé issue de `ENCRYPTION_KEY` (32 octets hex).
- Jetons de vérification/refresh stockés en **SHA-256** uniquement.
- `X-API-Secret` GeniusPay strictement côté serveur.

## 3. Intégrité des webhooks

- Vérification **HMAC-SHA256** sur le **corps brut** (préserve l'octet exact reçu).
- **Anti-rejeu** : tolérance de timestamp (5 min) + déduplication par
  `X-Webhook-Delivery`.
- Comparaison de signature à **temps constant** (`crypto.timingSafeEqual`).
- Tous les événements sont journalisés (réussis comme rejetés) pour l'audit.

## 4. Surface d'attaque HTTP

| Menace | Contre-mesure |
|--------|---------------|
| Injection SQL | Prisma (requêtes paramétrées), aucune concaténation. |
| XSS / en-têtes | `helmet`, encodage côté React, pas de `dangerouslySetInnerHTML`. |
| CSRF | API stateless par jeton Bearer (pas de cookie de session), CORS restreint au frontend. |
| Brute-force / abus | Rate limiting global (`@nestjs/throttler`). |
| Données invalides | `class-validator` strict (`whitelist` + `forbidNonWhitelisted`). |
| Fuite d'erreurs | Filtre global masquant les détails internes en production. |

## 5. Journalisation & audit

- `AuditService` : journal transverse (acteur, action, entité, IP, user-agent).
- `transaction_logs` : chaque transition d'état d'une transaction.
- Les corps de requête ne sont jamais journalisés (pas de fuite de secrets/PII).

## 6. Validation d'environnement

Au démarrage, les variables critiques (`DATABASE_URL`, secrets JWT,
`ENCRYPTION_KEY`) sont validées. En **production**, l'application refuse de
démarrer si une variable de sécurité est absente ou trop faible.

## 7. Bonnes pratiques de déploiement

- Régénérer `JWT_*` et `ENCRYPTION_KEY` (`openssl rand -hex 32`) — ne jamais
  utiliser les valeurs d'exemple.
- TLS terminé au niveau de Nginx ; HSTS activé.
- Principe du moindre privilège pour le rôle PostgreSQL applicatif.
- Rotation régulière des clés API GeniusPay et du secret webhook.

## 8. Conformité (évolutions)

Architecture prête pour **KYC**, **AML** et **détection de fraude** (hooks sur le
cycle de vie des transactions + journal d'audit complet).
