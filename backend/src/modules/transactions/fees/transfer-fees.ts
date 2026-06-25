/**
 * Moteur de calcul des frais de transfert AfriTransfer.
 *
 * Commission AfriTransfer = `commissionPercent` % du montant envoyé + `commissionFixed`.
 * Par défaut : **2 % + 100 FCFA** (voir la configuration `commission.*`).
 *
 * Modèle financier :
 *   - `sendAmount`        : montant destiné au bénéficiaire (saisi par l'expéditeur),
 *                           exprimé dans la devise d'envoi.
 *   - `commission`        : commission AfriTransfer (ajoutée par-dessus).
 *   - `geniusPayFees`     : frais du fournisseur de paiement (estimés pour l'affichage,
 *                           la valeur réelle provient de la réponse GeniusPay).
 *   - `totalAmount`       : montant réellement débité = send + commission + frais GeniusPay.
 *   - `receiveAmount`     : montant estimé reçu par le bénéficiaire, converti dans la
 *                           devise d'arrivée (XOF↔XAF = 1:1, tous deux indexés à l'EUR).
 *
 * La fonction est **pure** (aucune dépendance NestJS) afin d'être testable unitairement
 * et réutilisable côté frontend si besoin.
 */

export interface TransferFeesInput {
  /** Montant envoyé au bénéficiaire, dans la devise d'envoi. */
  amount: number;
  sendCurrency: string;
  receiveCurrency: string;
  /** Pourcentage de commission AfriTransfer (ex: 2). */
  commissionPercent: number;
  /** Frais fixes AfriTransfer (ex: 100). */
  commissionFixed: number;
  /** Estimation des frais GeniusPay en pourcentage (affichage uniquement). */
  geniusPayFeePercentEstimate?: number;
  /** Taux de change explicite sendCurrency -> receiveCurrency (sinon table interne). */
  fxRate?: number;
}

export interface TransferFeesResult {
  sendAmount: number;
  sendCurrency: string;
  commission: number;
  geniusPayFees: number;
  /** Montant total débité à l'expéditeur (devise d'envoi). */
  totalAmount: number;
  /** Montant estimé reçu (devise d'arrivée). */
  receiveAmount: number;
  receiveCurrency: string;
  fxRate: number;
  breakdown: {
    commissionPercent: number;
    commissionFixed: number;
    geniusPayFeePercentEstimate: number;
  };
}

/** Nombre de décimales par devise (ISO 4217 usuel pour l'Afrique de l'Ouest/Centrale). */
const CURRENCY_DECIMALS: Record<string, number> = {
  XOF: 0,
  XAF: 0,
  CDF: 0,
  RWF: 0,
  UGX: 0,
  KES: 2,
  SLE: 2,
  ZMW: 2,
  USD: 2,
  EUR: 2,
};

/**
 * Taux de change indicatifs vers XOF (pivot). XOF et XAF sont tous deux indexés à l'euro
 * au même taux (655,957) : leur conversion est donc strictement 1:1.
 * Ces taux servent à l'ESTIMATION d'affichage ; la conversion réelle est faite par GeniusPay.
 */
const RATES_TO_XOF: Record<string, number> = {
  XOF: 1,
  XAF: 1,
  EUR: 655.957,
  USD: 600,
  CDF: 0.21,
  KES: 4.6,
  RWF: 0.48,
  SLE: 28,
  UGX: 0.16,
  ZMW: 24,
};

export function decimalsFor(currency: string): number {
  return CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
}

/** Arrondi demi-vers-le-haut à la précision de la devise. */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Taux de change estimé entre deux devises via le pivot XOF. */
export function estimateFxRate(from: string, to: string): number {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return 1;
  const fromRate = RATES_TO_XOF[f];
  const toRate = RATES_TO_XOF[t];
  if (!fromRate || !toRate) return 1;
  return fromRate / toRate;
}

/**
 * Calcule la décomposition complète des frais d'un transfert.
 *
 * @example
 * calculateTransferFees({
 *   amount: 10000, sendCurrency: 'XOF', receiveCurrency: 'XOF',
 *   commissionPercent: 2, commissionFixed: 100,
 * });
 * // => commission: 300, totalAmount: 10300 (+ frais GeniusPay), receiveAmount: 10000
 */
export function calculateTransferFees(input: TransferFeesInput): TransferFeesResult {
  const {
    amount,
    sendCurrency,
    receiveCurrency,
    commissionPercent,
    commissionFixed,
    geniusPayFeePercentEstimate = 0,
  } = input;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Le montant doit être un nombre strictement positif');
  }

  const sendDecimals = decimalsFor(sendCurrency);
  const receiveDecimals = decimalsFor(receiveCurrency);

  const sendAmount = roundTo(amount, sendDecimals);
  const commission = roundTo((commissionPercent / 100) * sendAmount + commissionFixed, sendDecimals);
  const geniusPayFees = roundTo((geniusPayFeePercentEstimate / 100) * sendAmount, sendDecimals);
  const totalAmount = roundTo(sendAmount + commission + geniusPayFees, sendDecimals);

  const fxRate = input.fxRate ?? estimateFxRate(sendCurrency, receiveCurrency);
  const receiveAmount = roundTo(sendAmount * fxRate, receiveDecimals);

  return {
    sendAmount,
    sendCurrency: sendCurrency.toUpperCase(),
    commission,
    geniusPayFees,
    totalAmount,
    receiveAmount,
    receiveCurrency: receiveCurrency.toUpperCase(),
    fxRate,
    breakdown: {
      commissionPercent,
      commissionFixed,
      geniusPayFeePercentEstimate,
    },
  };
}
