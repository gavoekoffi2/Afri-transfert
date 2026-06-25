const DECIMALS: Record<string, number> = {
  XOF: 0,
  XAF: 0,
  CDF: 0,
  RWF: 0,
  UGX: 0,
};

/** Formate un montant selon sa devise (FCFA sans décimales, etc.). */
export function formatMoney(amount: number, currency: string): string {
  const decimals = DECIMALS[currency] ?? 2;
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${formatted} ${currency}`;
}

/**
 * Met un numéro de téléphone au format international.
 * - retire espaces/séparateurs ;
 * - « 00xx » → « +xx » ;
 * - numéro local (commençant par 0 ou sans indicatif) → préfixe l'indicatif du
 *   pays sélectionné (ex : 0712345678 + CM(+237) → +237712345678).
 */
export function toInternationalPhone(raw: string, callingCode?: string): string {
  const v = raw.replace(/[\s().-]/g, '');
  if (!v) return '';
  if (v.startsWith('+')) return v;
  if (v.startsWith('00')) return '+' + v.slice(2);
  if (callingCode) return callingCode + v.replace(/^0+/, '');
  return v;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

export const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'bg-amber-100 text-amber-700' },
  PROCESSING: { label: 'En cours', className: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Réussi', className: 'bg-emerald-100 text-emerald-700' },
  FAILED: { label: 'Échoué', className: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Annulé', className: 'bg-slate-100 text-slate-600' },
  EXPIRED: { label: 'Expiré', className: 'bg-slate-100 text-slate-600' },
  REFUNDED: { label: 'Remboursé', className: 'bg-violet-100 text-violet-700' },
};
