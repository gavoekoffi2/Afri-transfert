import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  AuditActorType,
  Operator,
  PaymentMethod,
  Prisma,
  Transaction,
  TransactionStatus,
} from '@prisma/client';
import { appConfig } from '../../config/configuration';
import { AuditService } from '../../common/audit/audit.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CountriesService } from '../countries/countries.service';
import { OperatorsService } from '../countries/operators.service';
import { CreatePaymentRequest, GeniusPayPayment } from '../geniuspay/geniuspay.types';
import { GeniusPayService } from '../geniuspay/geniuspay.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Templates } from '../notifications/notification-templates';
import { CreateTransferDto, QuoteTransferDto } from './dto/transaction.dto';
import { FeesService } from './fees/fees.service';
import { generateTransactionReference } from './reference.util';
import { isTerminal, mapGeniusPayStatus, mapWebhookEventToStatus } from './transaction-status.util';

/** Correspondance moyen de paiement interne -> code GeniusPay `payment_method`. */
const GENIUSPAY_METHOD: Record<PaymentMethod, string | undefined> = {
  WAVE: 'wave',
  ORANGE_MONEY: 'orange_money',
  MTN_MONEY: 'mtn_money',
  MOOV_MONEY: 'moov_money',
  AIRTEL_MONEY: 'airtel_money',
  PAWAPAY: 'pawapay',
  PAYSTACK: 'paystack',
  CARD: 'card',
  CHECKOUT: undefined,
};

interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly countries: CountriesService,
    private readonly operators: OperatorsService,
    private readonly geniusPay: GeniusPayService,
    private readonly fees: FeesService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  // =========================================================== DEVIS (temps réel)
  async quote(dto: QuoteTransferDto) {
    const [sender, recipient] = await Promise.all([
      this.countries.getByIso2(dto.senderCountryIso2),
      this.countries.getByIso2(dto.recipientCountryIso2),
    ]);
    await this.assertAmountWithinLimits(dto.amount);
    return this.fees.quote({
      amount: dto.amount,
      sendCurrency: sender.currencyCode,
      receiveCurrency: recipient.currencyCode,
    });
  }

  // =========================================================== ENVOI D'ARGENT
  async create(userId: string, dto: CreateTransferDto, ctx: RequestContext = {}) {
    const [sender, recipient] = await Promise.all([
      this.countries.getByIso2(dto.senderCountryIso2),
      this.countries.getByIso2(dto.recipientCountryIso2),
    ]);
    await this.assertAmountWithinLimits(dto.amount);

    // Résolution de l'opérateur de destination (fourni ou auto-détecté).
    const operator = await this.resolveOperator(dto, recipient.id);

    const fees = await this.fees.quote({
      amount: dto.amount,
      sendCurrency: sender.currencyCode,
      receiveCurrency: recipient.currencyCode,
    });

    const reference = generateTransactionReference();

    // 1. On crée d'abord la transaction (PENDING) — traçabilité même si GeniusPay échoue.
    const created = await this.prisma.transaction.create({
      data: {
        reference,
        userId,
        beneficiaryId: dto.beneficiaryId,
        senderCountryId: sender.id,
        recipientCountryId: recipient.id,
        operatorId: operator?.id,
        recipientName: dto.recipientName,
        recipientPhone: dto.recipientPhone,
        paymentMethod: operator?.paymentMethod ?? PaymentMethod.CHECKOUT,
        gateway: operator?.gateway,
        mmoProvider: operator && recipient.supportsPawapay ? operator.code : undefined,
        sendAmount: fees.sendAmount,
        sendCurrency: fees.sendCurrency,
        commissionAmount: fees.commission,
        geniusPayFees: fees.geniusPayFees,
        totalAmount: fees.totalAmount,
        receiveAmount: fees.receiveAmount,
        receiveCurrency: fees.receiveCurrency,
        status: TransactionStatus.PENDING,
        environment: this.geniusPay.environment,
        metadata: { fxRate: fees.fxRate },
      },
    });
    await this.addLog(created.id, null, TransactionStatus.PENDING, 'created', 'user');

    // 2. Appel GeniusPay POST /payments.
    let payment: GeniusPayPayment;
    try {
      payment = await this.geniusPay.createPayment(
        this.buildPaymentRequest(reference, fees.totalAmount, sender, recipient, operator, dto),
      );
    } catch (error) {
      await this.markFailed(created.id, (error as Error).message);
      throw error;
    }

    // 3. Persistance de la réponse GeniusPay.
    const updated = await this.prisma.transaction.update({
      where: { id: created.id },
      data: {
        geniusPayId: String(payment.id),
        geniusPayReference: payment.reference,
        checkoutUrl: payment.checkout_url,
        // Sans payment_method -> checkout_url ; sinon -> payment_url (doc GeniusPay).
        paymentUrl: payment.payment_url ?? payment.checkout_url,
        geniusPayFees: payment.fees ?? fees.geniusPayFees,
        status: mapGeniusPayStatus(payment.status),
        expiresAt: payment.expires_at ? new Date(payment.expires_at) : undefined,
      },
    });

    // 4. Bénéficiaire favori (optionnel) + notification + audit.
    if (dto.saveBeneficiary) {
      await this.saveBeneficiary(userId, dto, recipient.id, operator?.id);
    }
    await this.notifyInitiated(userId, updated);
    await this.audit.log({
      actorType: AuditActorType.USER,
      actorId: userId,
      action: 'transaction.create',
      entity: 'transaction',
      entityId: updated.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { reference, amount: fees.totalAmount },
    });

    return this.serialize(updated, {
      paymentUrl: updated.paymentUrl,
      checkoutUrl: updated.checkoutUrl,
    });
  }

  // =========================================================== HISTORIQUE / DÉTAILS
  async list(userId: string, pagination: PaginationDto, status?: TransactionStatus) {
    const where: Prisma.TransactionWhereInput = { userId, ...(status ? { status } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        include: { senderCountry: true, recipientCountry: true, operator: true },
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return paginate(items.map((t) => this.serialize(t)), total, pagination.page, pagination.limit);
  }

  async getOwnedByReference(userId: string, reference: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { reference },
      include: { senderCountry: true, recipientCountry: true, operator: true, logs: true },
    });
    if (!tx) {
      throw new NotFoundException('Transaction introuvable');
    }
    if (tx.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette transaction');
    }
    return this.serialize(tx, { logs: tx.logs });
  }

  /** Données de reçu (téléchargeable côté frontend en PDF). */
  async getReceipt(userId: string, reference: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { reference },
      include: { senderCountry: true, recipientCountry: true },
    });
    if (!tx) {
      throw new NotFoundException('Transaction introuvable');
    }
    if (tx.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette transaction');
    }
    return {
      reference: tx.reference,
      status: tx.status,
      issuedAt: new Date().toISOString(),
      sender: { country: tx.senderCountry.name },
      recipient: { name: tx.recipientName, phone: tx.recipientPhone, country: tx.recipientCountry.name },
      amounts: {
        sent: Number(tx.sendAmount),
        currency: tx.sendCurrency,
        commission: Number(tx.commissionAmount),
        geniusPayFees: Number(tx.geniusPayFees),
        total: Number(tx.totalAmount),
        received: Number(tx.receiveAmount),
        receivedCurrency: tx.receiveCurrency,
      },
      createdAt: tx.createdAt,
      completedAt: tx.completedAt,
    };
  }

  async cancel(userId: string, reference: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { reference } });
    if (!tx || tx.userId !== userId) {
      throw new NotFoundException('Transaction introuvable');
    }
    if (isTerminal(tx.status)) {
      throw new BadRequestException('Cette transaction ne peut plus être annulée');
    }
    const updated = await this.prisma.transaction.update({
      where: { id: tx.id },
      data: { status: TransactionStatus.CANCELLED },
    });
    await this.addLog(tx.id, tx.status, TransactionStatus.CANCELLED, 'cancelled', 'user');
    return this.serialize(updated);
  }

  /** Repli sur la consultation directe GeniusPay (si un webhook a été manqué). */
  async syncStatus(userId: string, reference: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { reference } });
    if (!tx || tx.userId !== userId) {
      throw new NotFoundException('Transaction introuvable');
    }
    if (!tx.geniusPayReference) {
      return this.serialize(tx);
    }
    const payment = await this.geniusPay.getPayment(tx.geniusPayReference);
    await this.applyGatewayUpdate({
      geniusPayReference: tx.geniusPayReference,
      status: mapGeniusPayStatus(payment.status),
      fees: payment.fees,
      source: 'sync',
      event: 'payment.sync',
    });
    const fresh = await this.prisma.transaction.findUnique({ where: { id: tx.id } });
    return this.serialize(fresh!);
  }

  // =========================================================== APPLICATION D'ÉVÉNEMENT (webhooks/sync)
  /**
   * Met à jour une transaction depuis le gateway de façon **idempotente**.
   * Partagé par le module Webhooks et la synchronisation manuelle.
   */
  async applyGatewayUpdate(params: {
    geniusPayReference: string;
    status?: TransactionStatus | null;
    event: string;
    fees?: number;
    failureReason?: string;
    source?: string;
    payload?: Prisma.InputJsonValue;
  }): Promise<Transaction | null> {
    const tx = await this.prisma.transaction.findUnique({
      where: { geniusPayReference: params.geniusPayReference },
    });
    if (!tx) {
      this.logger.warn(`Aucune transaction pour la réf. GeniusPay ${params.geniusPayReference}`);
      return null;
    }

    const target = params.status ?? mapWebhookEventToStatus(params.event);
    if (!target) {
      return tx;
    }
    // Idempotence : on n'écrase jamais un statut terminal déjà atteint.
    if (isTerminal(tx.status) && tx.status === target) {
      return tx;
    }
    if (isTerminal(tx.status) && target !== TransactionStatus.REFUNDED) {
      this.logger.debug(`Transition ignorée ${tx.status} -> ${target} (réf. ${tx.reference})`);
      return tx;
    }

    const updated = await this.prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: target,
        geniusPayFees: params.fees ?? tx.geniusPayFees,
        failureReason: params.failureReason ?? tx.failureReason,
        completedAt: target === TransactionStatus.COMPLETED ? new Date() : tx.completedAt,
      },
    });
    await this.addLog(tx.id, tx.status, target, params.event, params.source ?? 'webhook', params.payload);
    await this.notifyStatusChange(updated, target);
    return updated;
  }

  // =========================================================== PRIVÉ
  private buildPaymentRequest(
    reference: string,
    amount: number,
    sender: { iso2: string; currencyCode: string },
    recipient: { iso2: string; supportsPawapay: boolean },
    operator: Operator | null,
    dto: CreateTransferDto,
  ): CreatePaymentRequest {
    const req: CreatePaymentRequest = {
      amount,
      currency: sender.currencyCode,
      description: `AfriTransfer ${reference} → ${dto.recipientName}`,
      customer: {
        name: dto.recipientName,
        phone: dto.recipientPhone,
        country: recipient.iso2,
      },
      success_url: `${this.app.frontendUrl}/transfer/${reference}?status=success`,
      error_url: `${this.app.frontendUrl}/transfer/${reference}?status=error`,
      metadata: {
        afritransfer_reference: reference,
        sender_country: sender.iso2,
        recipient_country: recipient.iso2,
      },
    };

    // Routage : opérateur PawaPay -> mmo_provider ; opérateur dédié -> payment_method ;
    // sinon aucun moyen -> page de checkout hébergée (checkout_url).
    if (operator && recipient.supportsPawapay) {
      req.payment_method = 'pawapay';
      req.mmo_provider = operator.code;
      if (operator.gateway) req.gateway = operator.gateway;
    } else if (operator) {
      const method = GENIUSPAY_METHOD[operator.paymentMethod];
      if (method) req.payment_method = method;
    }
    return req;
  }

  private async resolveOperator(dto: CreateTransferDto, recipientCountryId: string): Promise<Operator | null> {
    if (dto.operatorId) {
      const op = await this.operators.findByIdOrFail(dto.operatorId);
      if (op.countryId !== recipientCountryId) {
        throw new BadRequestException("L'opérateur ne correspond pas au pays du bénéficiaire");
      }
      return op;
    }
    // Auto-détection : premier opérateur actif du pays (l'utilisateur peut préciser).
    const detected = await this.countries.detectByPhone(dto.recipientPhone);
    if (detected.country && detected.country.id === recipientCountryId && detected.operators.length === 1) {
      return detected.operators[0];
    }
    return null; // -> mode checkout (l'expéditeur choisit)
  }

  private async assertAmountWithinLimits(amount: number): Promise<void> {
    const [min, max] = await Promise.all([
      this.settingNumber('transfer.min_amount', 200),
      this.settingNumber('transfer.max_amount', 2_000_000),
    ]);
    if (amount < min) {
      throw new BadRequestException(`Le montant minimum est de ${min}`);
    }
    if (amount > max) {
      throw new BadRequestException(`Le montant maximum est de ${max}`);
    }
  }

  private async settingNumber(key: string, fallback: number): Promise<number> {
    const s = await this.prisma.setting.findUnique({ where: { key } });
    const v = s ? Number(s.value) : NaN;
    return Number.isFinite(v) ? v : fallback;
  }

  private async saveBeneficiary(userId: string, dto: CreateTransferDto, countryId: string, operatorId?: string) {
    const exists = await this.prisma.beneficiary.findFirst({
      where: { userId, phone: dto.recipientPhone },
    });
    if (!exists) {
      await this.prisma.beneficiary.create({
        data: { userId, name: dto.recipientName, phone: dto.recipientPhone, countryId, operatorId, isFavorite: true },
      });
    }
  }

  private async markFailed(id: string, reason: string) {
    await this.prisma.transaction.update({
      where: { id },
      data: { status: TransactionStatus.FAILED, failureReason: reason },
    });
    await this.addLog(id, TransactionStatus.PENDING, TransactionStatus.FAILED, 'geniuspay.init_failed', 'system');
  }

  private addLog(
    transactionId: string,
    fromStatus: TransactionStatus | null,
    toStatus: TransactionStatus,
    event: string,
    source: string,
    payload?: Prisma.InputJsonValue,
  ) {
    return this.prisma.transactionLog.create({
      data: { transactionId, fromStatus, toStatus, event, source, payload },
    });
  }

  private async notifyInitiated(userId: string, tx: Transaction) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    await this.notifications.notifyTransaction({
      userId,
      email: user.email,
      phone: user.phone,
      event: 'payment.initiated',
      message: Templates.transactionInitiated(tx.reference, `${tx.totalAmount} ${tx.sendCurrency}`),
      smsBody: `AfriTransfer: transfert ${tx.reference} de ${tx.totalAmount} ${tx.sendCurrency} initié.`,
    });
  }

  private async notifyStatusChange(tx: Transaction, status: TransactionStatus) {
    const user = await this.prisma.user.findUnique({ where: { id: tx.userId } });
    if (!user) return;
    const amount = `${tx.sendAmount} ${tx.sendCurrency}`;
    let message;
    let smsBody;
    let event;
    switch (status) {
      case TransactionStatus.COMPLETED:
        message = Templates.transactionSuccess(tx.reference, amount, tx.recipientName);
        smsBody = `AfriTransfer: transfert ${tx.reference} réussi ✅`;
        event = 'payment.success';
        break;
      case TransactionStatus.FAILED:
        message = Templates.transactionFailed(tx.reference, tx.failureReason ?? 'inconnu');
        smsBody = `AfriTransfer: échec du transfert ${tx.reference}.`;
        event = 'payment.failed';
        break;
      case TransactionStatus.REFUNDED:
        message = Templates.transactionRefunded(tx.reference, amount);
        event = 'payment.refunded';
        break;
      default:
        return;
    }
    await this.notifications.notifyTransaction({
      userId: tx.userId,
      email: user.email,
      phone: user.phone,
      event,
      message,
      smsBody,
    });
  }

  /** Convertit les Decimal Prisma en nombres pour une réponse API propre. */
  private serialize(tx: Transaction & Record<string, unknown>, extra: Record<string, unknown> = {}) {
    const dec = (v: unknown) => (v == null ? null : Number(v as Prisma.Decimal));
    return {
      ...tx,
      sendAmount: dec(tx.sendAmount),
      commissionAmount: dec(tx.commissionAmount),
      geniusPayFees: dec(tx.geniusPayFees),
      totalAmount: dec(tx.totalAmount),
      receiveAmount: dec(tx.receiveAmount),
      ...extra,
    };
  }
}
