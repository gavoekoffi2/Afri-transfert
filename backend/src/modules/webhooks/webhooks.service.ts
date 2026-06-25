import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { geniuspayConfig } from '../../config/configuration';
import { CryptoService } from '../../common/crypto/crypto.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mapWebhookEventToStatus } from '../transactions/transaction-status.util';
import { TransactionsService } from '../transactions/transactions.service';
import { GeniusPayWebhookPayload, WebhookHeaders } from './webhook.types';

export interface WebhookResult {
  received: boolean;
  duplicate?: boolean;
  event?: string;
}

/**
 * Traitement sécurisé des webhooks GeniusPay :
 *   1. vérification de la signature HMAC-SHA256 sur le corps **brut** ;
 *   2. protection contre le rejeu (tolérance de timestamp + déduplication) ;
 *   3. journalisation de **tous** les événements (table `webhooks`) ;
 *   4. mise à jour idempotente de la transaction associée.
 *
 * Signature attendue : `HMAC-SHA256(timestamp + "." + rawBody, webhookSecret)`.
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly transactions: TransactionsService,
    @Inject(geniuspayConfig.KEY) private readonly config: ConfigType<typeof geniuspayConfig>,
  ) {}

  async handleIncoming(
    rawBody: Buffer | string | undefined,
    headers: WebhookHeaders,
    body: GeniusPayWebhookPayload,
  ): Promise<WebhookResult> {
    if (!headers.signature || !headers.timestamp) {
      throw new BadRequestException('En-têtes de signature webhook manquants');
    }

    const rawString = this.rawString(rawBody, body);
    const signatureValid = this.verifySignature(headers.timestamp, rawString, headers.signature);

    // --- Déduplication (protection rejeu par identifiant de livraison) ---
    if (headers.delivery) {
      const existing = await this.prisma.webhookEvent.findUnique({
        where: { deliveryId: headers.delivery },
      });
      if (existing) {
        this.logger.debug(`Webhook déjà reçu (delivery ${headers.delivery})`);
        return { received: true, duplicate: true, event: body.event };
      }
    }

    // --- Journalisation systématique (audit), avec le verdict de signature ---
    const record = await this.store(headers, body, signatureValid);

    // --- Application des contrôles de sécurité ---
    if (!signatureValid) {
      this.logger.warn(`Signature webhook invalide (event ${body.event}, id ${body.id})`);
      throw new UnauthorizedException('Invalid signature');
    }
    this.assertFreshTimestamp(headers.timestamp);

    // --- Traitement métier ---
    await this.process(record.id, body);
    return { received: true, event: body.event };
  }

  /**
   * Vérifie la signature HMAC à temps constant.
   */
  verifySignature(timestamp: string, rawBody: string, providedSignature: string): boolean {
    if (!this.config.webhookSecret) {
      this.logger.error('GENIUSPAY_WEBHOOK_SECRET non configuré — webhooks rejetés');
      return false;
    }
    const expected = this.crypto.hmacSha256(`${timestamp}.${rawBody}`, this.config.webhookSecret);
    return this.crypto.safeCompare(expected, providedSignature);
  }

  /**
   * Rejette les webhooks dont le timestamp s'écarte trop de l'heure courante (anti-rejeu).
   */
  private assertFreshTimestamp(timestamp: string): void {
    const now = Math.floor(Date.now() / 1000);
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(now - ts) > this.config.webhookTimestampTolerance) {
      throw new BadRequestException('Timestamp too old');
    }
  }

  private rawString(rawBody: Buffer | string | undefined, body: unknown): string {
    if (Buffer.isBuffer(rawBody)) return rawBody.toString('utf8');
    if (typeof rawBody === 'string') return rawBody;
    // Repli si le corps brut n'est pas disponible (déconseillé : voir RawBody dans main.ts).
    return JSON.stringify(body);
  }

  private async store(headers: WebhookHeaders, body: GeniusPayWebhookPayload, signatureValid: boolean) {
    return this.prisma.webhookEvent.create({
      data: {
        eventId: body.id ?? 'unknown',
        deliveryId: headers.delivery,
        event: body.event ?? headers.event ?? 'unknown',
        signatureValid,
        timestamp: BigInt(headers.timestamp ?? '0'),
        environment: headers.environment ?? body.environment,
        payload: body as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Applique l'événement à la transaction (idempotent) et marque le webhook traité.
   */
  private async process(webhookId: string, body: GeniusPayWebhookPayload): Promise<void> {
    const status = mapWebhookEventToStatus(body.event);
    const reference = body.data?.reference;
    const afritransferRef = body.data?.metadata?.afritransfer_reference as string | undefined;

    let transactionId: string | undefined;
    let error: string | undefined;

    try {
      if (body.event === 'webhook.test') {
        this.logger.log('Webhook de test reçu et vérifié ✅');
      } else if (reference || afritransferRef) {
        const tx = reference
          ? await this.transactions.applyGatewayUpdate({
              geniusPayReference: reference,
              status,
              event: body.event,
              fees: body.data?.fees,
              failureReason: status === null ? undefined : this.failureReason(body),
              source: 'webhook',
              payload: body as unknown as Prisma.InputJsonValue,
            })
          : await this.applyByInternalRef(afritransferRef!, body);
        transactionId = tx?.id;
      } else {
        this.logger.warn(`Webhook ${body.event} sans référence de transaction`);
      }
    } catch (e) {
      error = (e as Error).message;
      this.logger.error(`Échec de traitement du webhook ${body.event}: ${error}`);
    }

    await this.prisma.webhookEvent.update({
      where: { id: webhookId },
      data: { processed: !error, processedAt: new Date(), transactionId, error },
    });
  }

  private async applyByInternalRef(internalRef: string, body: GeniusPayWebhookPayload) {
    const tx = await this.prisma.transaction.findUnique({ where: { reference: internalRef } });
    if (!tx?.geniusPayReference) return null;
    return this.transactions.applyGatewayUpdate({
      geniusPayReference: tx.geniusPayReference,
      status: mapWebhookEventToStatus(body.event),
      event: body.event,
      fees: body.data?.fees,
      source: 'webhook',
      payload: body as unknown as Prisma.InputJsonValue,
    });
  }

  private failureReason(body: GeniusPayWebhookPayload): string | undefined {
    if (body.event.endsWith('.failed')) return 'Paiement échoué (notifié par GeniusPay)';
    if (body.event.endsWith('.expired')) return 'Lien de paiement expiré';
    if (body.event.endsWith('.cancelled')) return 'Paiement annulé';
    return undefined;
  }
}
