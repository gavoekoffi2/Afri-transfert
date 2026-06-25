import { TransactionStatus } from '@prisma/client';
import { isTerminal, mapGeniusPayStatus, mapWebhookEventToStatus } from './transaction-status.util';

describe('mapGeniusPayStatus', () => {
  it('mappe les statuts GeniusPay vers les statuts internes', () => {
    expect(mapGeniusPayStatus('completed')).toBe(TransactionStatus.COMPLETED);
    expect(mapGeniusPayStatus('processing')).toBe(TransactionStatus.PROCESSING);
    expect(mapGeniusPayStatus('failed')).toBe(TransactionStatus.FAILED);
    expect(mapGeniusPayStatus('expired')).toBe(TransactionStatus.EXPIRED);
    expect(mapGeniusPayStatus('refunded')).toBe(TransactionStatus.REFUNDED);
    expect(mapGeniusPayStatus('cancelled')).toBe(TransactionStatus.CANCELLED);
  });

  it('retombe sur PENDING pour un statut inconnu', () => {
    expect(mapGeniusPayStatus('quelque-chose')).toBe(TransactionStatus.PENDING);
  });
});

describe('mapWebhookEventToStatus', () => {
  it('mappe les événements de paiement', () => {
    expect(mapWebhookEventToStatus('payment.success')).toBe(TransactionStatus.COMPLETED);
    expect(mapWebhookEventToStatus('payment.failed')).toBe(TransactionStatus.FAILED);
    expect(mapWebhookEventToStatus('payment.cancelled')).toBe(TransactionStatus.CANCELLED);
    expect(mapWebhookEventToStatus('payment.expired')).toBe(TransactionStatus.EXPIRED);
    expect(mapWebhookEventToStatus('payment.refunded')).toBe(TransactionStatus.REFUNDED);
  });

  it('mappe les événements de retrait (cashout)', () => {
    expect(mapWebhookEventToStatus('cashout.completed')).toBe(TransactionStatus.COMPLETED);
    expect(mapWebhookEventToStatus('cashout.failed')).toBe(TransactionStatus.FAILED);
  });

  it('renvoie null pour un événement non transitionnel', () => {
    expect(mapWebhookEventToStatus('webhook.test')).toBeNull();
  });
});

describe('isTerminal', () => {
  it('identifie les statuts terminaux', () => {
    expect(isTerminal(TransactionStatus.COMPLETED)).toBe(true);
    expect(isTerminal(TransactionStatus.FAILED)).toBe(true);
    expect(isTerminal(TransactionStatus.REFUNDED)).toBe(true);
    expect(isTerminal(TransactionStatus.PENDING)).toBe(false);
    expect(isTerminal(TransactionStatus.PROCESSING)).toBe(false);
  });
});
