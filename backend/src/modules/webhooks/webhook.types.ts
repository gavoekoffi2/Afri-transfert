/**
 * Structure d'un événement webhook GeniusPay.
 * Réf. : https://geniuspay.ci/docs/api (section Webhooks).
 */
export interface GeniusPayWebhookPayload {
  id: string; // identifiant unique de l'événement (UUID)
  event: string; // payment.success, cashout.completed…
  timestamp: number; // epoch (secondes)
  created_at?: string;
  environment?: string;
  api_version?: string;
  data: {
    object?: string;
    id?: number;
    reference?: string;
    amount?: number;
    currency?: string;
    fees?: number;
    net_amount?: number;
    status?: string;
    payment_method?: string;
    provider?: string;
    customer_name?: string;
    customer_phone?: string;
    merchant_id?: number;
    metadata?: Record<string, unknown>;
  };
}

/** En-têtes de signature/livraison émis par GeniusPay. */
export interface WebhookHeaders {
  signature?: string; // X-Webhook-Signature
  timestamp?: string; // X-Webhook-Timestamp
  event?: string; // X-Webhook-Event
  delivery?: string; // X-Webhook-Delivery
  environment?: string; // X-Webhook-Environment
}

/** Liste exhaustive des événements supportés. */
export const SUPPORTED_WEBHOOK_EVENTS = [
  'payment.initiated',
  'payment.success',
  'payment.failed',
  'payment.cancelled',
  'payment.refunded',
  'payment.expired',
  'cashout.requested',
  'cashout.approved',
  'cashout.completed',
  'cashout.failed',
  'webhook.test',
] as const;
