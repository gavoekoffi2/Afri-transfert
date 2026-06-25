import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CryptoService } from '../../common/crypto/crypto.service';
import { WebhooksService } from './webhooks.service';
import { GeniusPayWebhookPayload } from './webhook.types';

const WEBHOOK_SECRET = 'whsec_test_secret';

function buildService() {
  const crypto = new CryptoService({
    encryptionKey: '0'.repeat(64),
    throttleTtl: 60,
    throttleLimit: 120,
    bcryptRounds: 12,
  });

  const prisma = {
    webhookEvent: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'wh_1' }),
      update: jest.fn().mockResolvedValue({}),
    },
    transaction: { findUnique: jest.fn() },
  };

  const transactions = { applyGatewayUpdate: jest.fn().mockResolvedValue({ id: 'tx_1' }) };

  const config = {
    baseUrl: 'https://geniuspay.ci/api/v1/merchant',
    apiKey: 'pk',
    apiSecret: 'sk',
    webhookSecret: WEBHOOK_SECRET,
    environment: 'sandbox',
    webhookTimestampTolerance: 300,
  };

  const service = new WebhooksService(prisma as any, crypto, transactions as any, config);
  return { service, crypto, prisma, transactions };
}

function makePayload(event = 'payment.success'): GeniusPayWebhookPayload {
  return {
    id: 'evt_123',
    event,
    timestamp: Math.floor(Date.now() / 1000),
    data: { reference: 'MTX-ABC123', status: 'completed', fees: 250 },
  };
}

function sign(crypto: CryptoService, timestamp: string, rawBody: string): string {
  return crypto.hmacSha256(`${timestamp}.${rawBody}`, WEBHOOK_SECRET);
}

describe('WebhooksService', () => {
  it('accepte un webhook correctement signé et applique la mise à jour', async () => {
    const { service, crypto, prisma, transactions } = buildService();
    const payload = makePayload();
    const raw = JSON.stringify(payload);
    const ts = String(payload.timestamp);
    const signature = sign(crypto, ts, raw);

    const result = await service.handleIncoming(
      raw,
      { signature, timestamp: ts, event: payload.event, delivery: 'dlv_1', environment: 'sandbox' },
      payload,
    );

    expect(result.received).toBe(true);
    expect(prisma.webhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ signatureValid: true }) }),
    );
    expect(transactions.applyGatewayUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ geniusPayReference: 'MTX-ABC123', event: 'payment.success', fees: 250 }),
    );
  });

  it('rejette une signature invalide (401) tout en journalisant l\'événement', async () => {
    const { service, prisma, transactions } = buildService();
    const payload = makePayload();
    const raw = JSON.stringify(payload);
    const ts = String(payload.timestamp);

    await expect(
      service.handleIncoming(
        raw,
        { signature: 'deadbeef', timestamp: ts, event: payload.event, delivery: 'dlv_2' },
        payload,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    // L'événement est tout de même journalisé avec signatureValid = false (audit).
    expect(prisma.webhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ signatureValid: false }) }),
    );
    // Mais aucune transaction n'est modifiée.
    expect(transactions.applyGatewayUpdate).not.toHaveBeenCalled();
  });

  it('rejette un timestamp périmé (protection contre le rejeu)', async () => {
    const { service, crypto } = buildService();
    const oldTs = String(Math.floor(Date.now() / 1000) - 10_000); // bien au-delà de 300 s
    const payload = { ...makePayload(), timestamp: Number(oldTs) };
    const raw = JSON.stringify(payload);
    const signature = sign(crypto, oldTs, raw);

    await expect(
      service.handleIncoming(raw, { signature, timestamp: oldTs, delivery: 'dlv_3' }, payload),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('déduplique les livraisons déjà reçues (rejeu)', async () => {
    const { service, crypto, prisma, transactions } = buildService();
    prisma.webhookEvent.findUnique.mockResolvedValueOnce({ id: 'wh_existing' });
    const payload = makePayload();
    const raw = JSON.stringify(payload);
    const ts = String(payload.timestamp);
    const signature = sign(crypto, ts, raw);

    const result = await service.handleIncoming(raw, { signature, timestamp: ts, delivery: 'dlv_dup' }, payload);

    expect(result.duplicate).toBe(true);
    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
    expect(transactions.applyGatewayUpdate).not.toHaveBeenCalled();
  });

  it('refuse un webhook sans en-têtes de signature', async () => {
    const { service } = buildService();
    const payload = makePayload();
    await expect(
      service.handleIncoming(JSON.stringify(payload), {}, payload),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
