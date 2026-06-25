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
