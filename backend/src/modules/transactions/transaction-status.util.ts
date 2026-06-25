import { TransactionStatus } from '@prisma/client';

/**
 * Convertit un statut GeniusPay (string) en statut interne AfriTransfer.
 */
export function mapGeniusPayStatus(status: string): TransactionStatus {
  switch (status) {
    case 'completed':
      return TransactionStatus.COMPLETED;
    case 'processing':
      return TransactionStatus.PROCESSING;
    case 'failed':
      return TransactionStatus.FAILED;
    case 'cancelled':
      return TransactionStatus.CANCELLED;
    case 'expired':
      return TransactionStatus.EXPIRED;
    case 'refunded':
      return TransactionStatus.REFUNDED;
    case 'pending':
    default:
      return TransactionStatus.PENDING;
  }
}

/**
 * Convertit un type d'événement webhook GeniusPay en statut interne.
 */
export function mapWebhookEventToStatus(event: string): TransactionStatus | null {
  switch (event) {
    case 'payment.success':
    case 'cashout.completed':
      return TransactionStatus.COMPLETED;
    case 'payment.failed':
    case 'cashout.failed':
      return TransactionStatus.FAILED;
    case 'payment.cancelled':
      return TransactionStatus.CANCELLED;
    case 'payment.expired':
      return TransactionStatus.EXPIRED;
    case 'payment.refunded':
      return TransactionStatus.REFUNDED;
    case 'payment.initiated':
    case 'cashout.requested':
      return TransactionStatus.PROCESSING;
    default:
      return null;
  }
}

/** Statuts terminaux : aucune transition ultérieure n'est autorisée. */
const TERMINAL: TransactionStatus[] = [
  TransactionStatus.COMPLETED,
  TransactionStatus.FAILED,
  TransactionStatus.CANCELLED,
  TransactionStatus.EXPIRED,
  TransactionStatus.REFUNDED,
];

export function isTerminal(status: TransactionStatus): boolean {
  return TERMINAL.includes(status);
}
