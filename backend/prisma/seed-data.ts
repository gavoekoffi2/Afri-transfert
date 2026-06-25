/**
 * Catalogue de référence AfriTransfer.
 *
 * Source : documentation officielle GeniusPay (https://geniuspay.ci/docs/api),
 * section « Pays et opérateurs disponibles » + couverture par région.
 *
 * Ce catalogue sert d'amorçage hors-ligne. En production, la liste réelle des
 * opérateurs disponibles est rafraîchie dynamiquement via
 * `GET /pawapay/providers` (voir OperatorsSyncService).
 */

export type PaymentMethodCode =
  | 'WAVE'
  | 'ORANGE_MONEY'
  | 'MTN_MONEY'
  | 'MOOV_MONEY'
  | 'AIRTEL_MONEY'
  | 'PAWAPAY'
  | 'PAYSTACK'
  | 'CARD';

export interface SeedOperator {
  code: string; // mmo_provider GeniusPay (ex: ORANGE_CIV)
  name: string;
  paymentMethod: PaymentMethodCode;
  gateway: string; // wave | pawapay | orange_money | mtn_momo | moov_money
}

export interface SeedCurrency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface SeedCountry {
  iso2: string;
  iso3: string;
  name: string;
  callingCode: string;
  currencyCode: string;
  region: string;
  flagEmoji: string;
  supportsPawapay: boolean;
  operators: SeedOperator[];
}

export const CURRENCIES: SeedCurrency[] = [
  { code: 'XOF', name: 'Franc CFA (UEMOA)', symbol: 'FCFA', decimals: 0 },
  { code: 'XAF', name: 'Franc CFA (CEMAC)', symbol: 'FCFA', decimals: 0 },
  { code: 'CDF', name: 'Franc congolais', symbol: 'FC', decimals: 0 },
  { code: 'USD', name: 'Dollar américain', symbol: '$', decimals: 2 },
  { code: 'KES', name: 'Shilling kényan', symbol: 'KSh', decimals: 2 },
  { code: 'RWF', name: 'Franc rwandais', symbol: 'FRw', decimals: 0 },
  { code: 'SLE', name: 'Leone sierra-léonais', symbol: 'Le', decimals: 2 },
  { code: 'UGX', name: 'Shilling ougandais', symbol: 'USh', decimals: 0 },
  { code: 'ZMW', name: 'Kwacha zambien', symbol: 'ZK', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
];

// Raccourcis pour limiter la répétition.
const orange = (code: string, country: string): SeedOperator => ({
  code,
  name: `Orange Money ${country}`,
  paymentMethod: 'ORANGE_MONEY',
  gateway: 'orange_money',
});
const mtn = (code: string, country: string): SeedOperator => ({
  code,
  name: `MTN Mobile Money ${country}`,
  paymentMethod: 'MTN_MONEY',
  gateway: 'mtn_momo',
});
const moov = (code: string, country: string): SeedOperator => ({
  code,
  name: `Moov Money ${country}`,
  paymentMethod: 'MOOV_MONEY',
  gateway: 'moov_money',
});
const wave = (code: string, country: string): SeedOperator => ({
  code,
  name: `Wave ${country}`,
  paymentMethod: 'WAVE',
  gateway: 'wave',
});
const airtel = (code: string, country: string): SeedOperator => ({
  code,
  name: `Airtel Money ${country}`,
  paymentMethod: 'AIRTEL_MONEY',
  gateway: 'pawapay',
});
// Opérateurs routés exclusivement via l'agrégateur PawaPay (pas de gateway dédié).
const pawapay = (code: string, name: string): SeedOperator => ({
  code,
  name,
  paymentMethod: 'PAWAPAY',
  gateway: 'pawapay',
});

export const COUNTRIES: SeedCountry[] = [
  // ----------------------------- Afrique de l'Ouest (MVP) -----------------------------
  {
    iso2: 'CI', iso3: 'CIV', name: "Côte d'Ivoire", callingCode: '+225',
    currencyCode: 'XOF', region: 'UEMOA', flagEmoji: '🇨🇮', supportsPawapay: true,
    operators: [orange('ORANGE_CIV', 'CI'), mtn('MTN_MOMO_CIV', 'CI'), moov('MOOV_CIV', 'CI'), wave('WAVE_CIV', 'CI')],
  },
  {
    iso2: 'SN', iso3: 'SEN', name: 'Sénégal', callingCode: '+221',
    currencyCode: 'XOF', region: 'UEMOA', flagEmoji: '🇸🇳', supportsPawapay: true,
    operators: [orange('ORANGE_SEN', 'SN'), pawapay('FREE_SEN', 'Free Money Sénégal'), wave('WAVE_SEN', 'SN')],
  },
  {
    iso2: 'BJ', iso3: 'BEN', name: 'Bénin', callingCode: '+229',
    currencyCode: 'XOF', region: 'UEMOA', flagEmoji: '🇧🇯', supportsPawapay: true,
    operators: [mtn('MTN_MOMO_BEN', 'BJ'), moov('MOOV_BEN', 'BJ')],
  },
  {
    iso2: 'TG', iso3: 'TGO', name: 'Togo', callingCode: '+228',
    currencyCode: 'XOF', region: 'UEMOA', flagEmoji: '🇹🇬', supportsPawapay: false,
    operators: [moov('MOOV_TGO', 'TG'), { code: 'TMONEY_TGO', name: 'T-Money (Togocom)', paymentMethod: 'MTN_MONEY', gateway: 'mtn_momo' }],
  },
  {
    iso2: 'BF', iso3: 'BFA', name: 'Burkina Faso', callingCode: '+226',
    currencyCode: 'XOF', region: 'UEMOA', flagEmoji: '🇧🇫', supportsPawapay: false,
    operators: [orange('ORANGE_BFA', 'BF'), moov('MOOV_BFA', 'BF')],
  },
  {
    iso2: 'ML', iso3: 'MLI', name: 'Mali', callingCode: '+223',
    currencyCode: 'XOF', region: 'UEMOA', flagEmoji: '🇲🇱', supportsPawapay: false,
    operators: [orange('ORANGE_MLI', 'ML'), moov('MOOV_MLI', 'ML')],
  },
  {
    iso2: 'NE', iso3: 'NER', name: 'Niger', callingCode: '+227',
    currencyCode: 'XOF', region: 'UEMOA', flagEmoji: '🇳🇪', supportsPawapay: false,
    operators: [orange('ORANGE_NER', 'NE'), airtel('AIRTEL_NER', 'NE'), moov('MOOV_NER', 'NE')],
  },

  // ----------------------------- Afrique Centrale (MVP) -----------------------------
  {
    iso2: 'CM', iso3: 'CMR', name: 'Cameroun', callingCode: '+237',
    currencyCode: 'XAF', region: 'CEMAC', flagEmoji: '🇨🇲', supportsPawapay: true,
    operators: [mtn('MTN_MOMO_CMR', 'CM'), orange('ORANGE_CMR', 'CM')],
  },
  {
    iso2: 'CG', iso3: 'COG', name: 'République du Congo', callingCode: '+242',
    currencyCode: 'XAF', region: 'CEMAC', flagEmoji: '🇨🇬', supportsPawapay: true,
    operators: [airtel('AIRTEL_COG', 'CG'), mtn('MTN_MOMO_COG', 'CG')],
  },
  {
    iso2: 'CD', iso3: 'COD', name: 'RD Congo', callingCode: '+243',
    currencyCode: 'CDF', region: 'Afrique Centrale', flagEmoji: '🇨🇩', supportsPawapay: true,
    operators: [airtel('AIRTEL_COD', 'CD'), orange('ORANGE_COD', 'CD'), pawapay('VODACOM_MPESA_COD', 'Vodacom M-Pesa RDC')],
  },
  {
    iso2: 'GA', iso3: 'GAB', name: 'Gabon', callingCode: '+241',
    currencyCode: 'XAF', region: 'CEMAC', flagEmoji: '🇬🇦', supportsPawapay: true,
    operators: [airtel('AIRTEL_GAB', 'GA')],
  },
  {
    iso2: 'CF', iso3: 'CAF', name: 'République Centrafricaine', callingCode: '+236',
    currencyCode: 'XAF', region: 'CEMAC', flagEmoji: '🇨🇫', supportsPawapay: false,
    operators: [orange('ORANGE_CAF', 'CF'), { code: 'TELECEL_CAF', name: 'Telecel Centrafrique', paymentMethod: 'MOOV_MONEY', gateway: 'moov_money' }],
  },

  // ----------------------------- Extension PawaPay (hors MVP) -----------------------------
  {
    iso2: 'KE', iso3: 'KEN', name: 'Kenya', callingCode: '+254',
    currencyCode: 'KES', region: "Afrique de l'Est", flagEmoji: '🇰🇪', supportsPawapay: true,
    operators: [pawapay('MPESA_KEN', 'M-Pesa (Safaricom)')],
  },
  {
    iso2: 'RW', iso3: 'RWA', name: 'Rwanda', callingCode: '+250',
    currencyCode: 'RWF', region: "Afrique de l'Est", flagEmoji: '🇷🇼', supportsPawapay: true,
    operators: [airtel('AIRTEL_RWA', 'RW'), mtn('MTN_MOMO_RWA', 'RW')],
  },
  {
    iso2: 'SL', iso3: 'SLE', name: 'Sierra Leone', callingCode: '+232',
    currencyCode: 'SLE', region: "Afrique de l'Ouest", flagEmoji: '🇸🇱', supportsPawapay: true,
    operators: [orange('ORANGE_SLE', 'SL')],
  },
  {
    iso2: 'UG', iso3: 'UGA', name: 'Ouganda', callingCode: '+256',
    currencyCode: 'UGX', region: "Afrique de l'Est", flagEmoji: '🇺🇬', supportsPawapay: true,
    operators: [airtel('AIRTEL_UGA', 'UG'), mtn('MTN_MOMO_UGA', 'UG')],
  },
  {
    iso2: 'ZM', iso3: 'ZMB', name: 'Zambie', callingCode: '+260',
    currencyCode: 'ZMW', region: 'Afrique Australe', flagEmoji: '🇿🇲', supportsPawapay: true,
    operators: [mtn('MTN_MOMO_ZMB', 'ZM'), pawapay('ZAMTEL_ZMB', 'Zamtel Money')],
  },
];
