/**
 * Types fidèles à la documentation officielle GeniusPay.
 * Réf. : https://geniuspay.ci/docs/api
 */

// --- Requête de création de paiement (POST /payments) ---------------------------
export interface GeniusPayCustomer {
  name?: string;
  email?: string;
  phone?: string;
  /** Code pays ISO2 (CI, SN, CD…) — utilisé pour le routage PawaPay. */
  country?: string;
}

export interface CreatePaymentRequest {
  /** Montant (min 200). En XOF par défaut. */
  amount: number;
  /** XOF | EUR | USD (+ devises locales PawaPay). Défaut XOF. */
  currency?: string;
  /**
   * wave | pawapay | paystack | orange_money | mtn_money | moov_money | airtel_money | card.
   * Si omis -> page de checkout hébergée GeniusPay.
   */
  payment_method?: string;
  /** Gateway explicite : wave, pawapay, orange_money, mtn_momo, moov_money. */
  gateway?: string;
  /** Code fournisseur MMO PawaPay (ex: ORANGE_CIV). */
  mmo_provider?: string;
  description?: string;
  customer?: GeniusPayCustomer;
  success_url?: string;
  error_url?: string;
  metadata?: Record<string, unknown>;
}

// --- Réponse de paiement --------------------------------------------------------
export interface GeniusPayPayment {
  id: number;
  reference: string;
  amount: number;
  currency?: string;
  fees?: number;
  net_amount?: number;
  status: GeniusPayStatus;
  /** Présent en mode direct (gateway) ou pointe vers le checkout en mode hébergé. */
  payment_url?: string;
  /** Présent en mode checkout (payment_method omis). */
  checkout_url?: string;
  gateway?: string;
  payment_method?: string | null;
  payment_provider?: string;
  environment?: string;
  customer?: GeniusPayCustomer;
  success_url?: string;
  error_url?: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
  created_at?: string;
  completed_at?: string | null;
}

export type GeniusPayStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refunded';

// --- Enveloppe standard ---------------------------------------------------------
export interface GeniusPaySuccess<T> {
  success: true;
  data: T;
  meta?: GeniusPayMeta;
}

export interface GeniusPayError {
  success: false;
  error: { code: string; message: string };
}

export interface GeniusPayMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

// --- PawaPay providers (GET /pawapay/providers) ---------------------------------
export interface PawaPayProvider {
  code: string; // ORANGE_CIV, MTN_MOMO_CMR…
  name: string;
  type: string; // MMO
}

export interface PawaPayCountryProviders {
  country: string; // ISO2
  country_iso3: string;
  country_name: string;
  currency: string;
  providers: PawaPayProvider[];
}

export interface PawaPayAllProviders {
  countries: PawaPayCountryProviders[];
  total_countries: number;
}

// --- Compte & solde -------------------------------------------------------------
export interface MerchantAccount {
  id: number;
  business_name: string;
  email: string;
  status: string;
  environment: string;
  created_at: string;
}

export interface MerchantBalance {
  available: number;
  pending: number;
  total: number;
  currency: string;
}

// --- Filtres de liste (GET /payments) -------------------------------------------
export interface ListPaymentsQuery {
  status?: string;
  payment_method?: string;
  from?: string; // YYYY-MM-DD
  to?: string;
  search?: string;
  per_page?: number;
}
