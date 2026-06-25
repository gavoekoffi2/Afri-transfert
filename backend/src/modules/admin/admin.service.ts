import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionStatus, UserStatus } from '@prisma/client';
import { paginate } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { OperatorsService } from '../countries/operators.service';
import { GeniusPayService } from '../geniuspay/geniuspay.service';
import { AdminTransactionsQuery, AdminUsersQuery } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geniusPay: GeniusPayService,
    private readonly operators: OperatorsService,
  ) {}

  // ----------------------------------------------------------------- STATISTIQUES
  async stats() {
    const [users, transactions, completed, volume, pending, byStatus, recent] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { status: TransactionStatus.COMPLETED } }),
      this.prisma.transaction.aggregate({
        where: { status: TransactionStatus.COMPLETED },
        _sum: { sendAmount: true, commissionAmount: true },
      }),
      this.prisma.transaction.count({ where: { status: TransactionStatus.PENDING } }),
      this.prisma.transaction.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } }, recipientCountry: { select: { name: true } } },
      }),
    ]);

    return {
      users,
      transactions,
      completedTransactions: completed,
      pendingTransactions: pending,
      totalVolume: Number(volume._sum.sendAmount ?? 0),
      totalCommission: Number(volume._sum.commissionAmount ?? 0),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      recentTransactions: recent.map((t) => ({
        reference: t.reference,
        amount: Number(t.totalAmount),
        currency: t.sendCurrency,
        status: t.status,
        user: t.user.email,
        recipient: t.recipientName,
        country: t.recipientCountry.name,
        createdAt: t.createdAt,
      })),
    };
  }

  // ----------------------------------------------------------------- UTILISATEURS
  async listUsers(query: AdminUsersQuery) {
    const where: Prisma.UserWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, phone: true, firstName: true, lastName: true,
          status: true, role: true, countryIso2: true, emailVerifiedAt: true,
          phoneVerifiedAt: true, createdAt: true, lastLoginAt: true,
          _count: { select: { transactions: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        status: true, role: true, countryIso2: true, emailVerifiedAt: true,
        phoneVerifiedAt: true, createdAt: true, lastLoginAt: true,
        transactions: { take: 20, orderBy: { createdAt: 'desc' } },
        beneficiaries: true,
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  updateUserStatus(id: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, status: true },
    });
  }

  // ----------------------------------------------------------------- TRANSACTIONS
  async listTransactions(query: AdminTransactionsQuery) {
    const where: Prisma.TransactionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { reference: { contains: query.search, mode: 'insensitive' } },
              { recipientName: { contains: query.search, mode: 'insensitive' } },
              { recipientPhone: { contains: query.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
          senderCountry: { select: { name: true, iso2: true } },
          recipientCountry: { select: { name: true, iso2: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return paginate(items.map((t) => this.serializeTx(t)), total, query.page, query.limit);
  }

  async getTransaction(reference: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { reference },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        senderCountry: true,
        recipientCountry: true,
        operator: true,
        logs: { orderBy: { createdAt: 'asc' } },
        webhookEvents: true,
      },
    });
    if (!tx) throw new NotFoundException('Transaction introuvable');
    return this.serializeTx(tx);
  }

  /** Export CSV de l'historique des transactions (rapport). */
  async exportTransactionsCsv(): Promise<string> {
    const rows = await this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10000,
      include: { user: { select: { email: true } } },
    });
    const header = [
      'reference', 'date', 'user', 'recipient', 'phone', 'send_amount', 'currency',
      'commission', 'geniuspay_fees', 'total', 'status', 'gateway',
    ].join(',');
    const lines = rows.map((t) =>
      [
        t.reference,
        t.createdAt.toISOString(),
        t.user.email,
        `"${t.recipientName}"`,
        t.recipientPhone,
        Number(t.sendAmount),
        t.sendCurrency,
        Number(t.commissionAmount),
        Number(t.geniusPayFees),
        Number(t.totalAmount),
        t.status,
        t.gateway ?? '',
      ].join(','),
    );
    return [header, ...lines].join('\n');
  }

  // ----------------------------------------------------------------- PAYS / OPÉRATEURS
  listCountries() {
    return this.prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { operators: true } } },
    });
  }

  setCountryActive(iso2: string, isActive: boolean) {
    return this.prisma.country.update({ where: { iso2: iso2.toUpperCase() }, data: { isActive } });
  }

  syncOperators() {
    return this.operators.syncFromGeniusPay();
  }

  // ----------------------------------------------------------------- PARAMÈTRES
  listSettings() {
    return this.prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  }

  async updateSetting(key: string, value: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException('Paramètre introuvable');
    return this.prisma.setting.update({ where: { key }, data: { value } });
  }

  // ----------------------------------------------------------------- GENIUSPAY
  getBalance() {
    return this.geniusPay.getBalance();
  }

  getGeniusPayAccount() {
    return this.geniusPay.getAccount();
  }

  // ----------------------------------------------------------------- WEBHOOKS
  async listWebhooks(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.webhookEvent.findMany({
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.webhookEvent.count(),
    ]);
    return paginate(
      items.map((w) => ({ ...w, timestamp: w.timestamp.toString() })),
      total,
      page,
      limit,
    );
  }

  private serializeTx(tx: Record<string, unknown>) {
    const dec = (v: unknown) => (v == null ? null : Number(v as Prisma.Decimal));
    return {
      ...tx,
      sendAmount: dec(tx.sendAmount),
      commissionAmount: dec(tx.commissionAmount),
      geniusPayFees: dec(tx.geniusPayFees),
      totalAmount: dec(tx.totalAmount),
      receiveAmount: dec(tx.receiveAmount),
    };
  }
}
