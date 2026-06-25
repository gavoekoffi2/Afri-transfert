import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Operator, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GeniusPayService } from '../geniuspay/geniuspay.service';

/**
 * Gestion des opérateurs Mobile Money + synchronisation dynamique depuis
 * `GET /pawapay/providers` (GeniusPay). Le catalogue local sert de repli hors-ligne.
 */
@Injectable()
export class OperatorsService {
  private readonly logger = new Logger(OperatorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geniusPay: GeniusPayService,
  ) {}

  findById(id: string): Promise<Operator | null> {
    return this.prisma.operator.findUnique({ where: { id } });
  }

  findByCode(code: string): Promise<Operator | null> {
    return this.prisma.operator.findUnique({ where: { code } });
  }

  async findByIdOrFail(id: string): Promise<Operator> {
    const operator = await this.findById(id);
    if (!operator) {
      throw new NotFoundException('Opérateur introuvable');
    }
    return operator;
  }

  /**
   * Déduit le moyen de paiement et le gateway GeniusPay à partir du code opérateur
   * (ex: ORANGE_CIV -> ORANGE_MONEY / orange_money).
   */
  static inferMethod(code: string): { paymentMethod: PaymentMethod; gateway: string } {
    const c = code.toUpperCase();
    if (c.startsWith('WAVE')) return { paymentMethod: PaymentMethod.WAVE, gateway: 'wave' };
    if (c.startsWith('ORANGE')) return { paymentMethod: PaymentMethod.ORANGE_MONEY, gateway: 'orange_money' };
    if (c.startsWith('MTN')) return { paymentMethod: PaymentMethod.MTN_MONEY, gateway: 'mtn_momo' };
    if (c.startsWith('MOOV')) return { paymentMethod: PaymentMethod.MOOV_MONEY, gateway: 'moov_money' };
    if (c.startsWith('AIRTEL')) return { paymentMethod: PaymentMethod.AIRTEL_MONEY, gateway: 'pawapay' };
    // Free, Vodacom/M-Pesa, Zamtel… : routés via l'agrégateur PawaPay.
    return { paymentMethod: PaymentMethod.PAWAPAY, gateway: 'pawapay' };
  }

  /**
   * Synchronise tout le catalogue d'opérateurs depuis GeniusPay.
   * Sûr à exécuter régulièrement (upsert idempotent).
   */
  async syncFromGeniusPay(): Promise<{ countries: number; operators: number }> {
    const data = await this.geniusPay.getAllProviders();
    let operatorCount = 0;

    for (const c of data.countries) {
      const country = await this.prisma.country.upsert({
        where: { iso2: c.country },
        update: {
          iso3: c.country_iso3,
          name: c.country_name,
          currencyCode: c.currency,
          supportsPawapay: true,
        },
        create: {
          iso2: c.country,
          iso3: c.country_iso3,
          name: c.country_name,
          currencyCode: c.currency,
          supportsPawapay: true,
        },
      });

      for (const p of c.providers) {
        const { paymentMethod, gateway } = OperatorsService.inferMethod(p.code);
        await this.prisma.operator.upsert({
          where: { code: p.code },
          update: { name: p.name, type: p.type, countryId: country.id, paymentMethod, gateway },
          create: {
            code: p.code,
            name: p.name,
            type: p.type,
            countryId: country.id,
            paymentMethod,
            gateway,
          },
        });
        operatorCount++;
      }
    }

    this.logger.log(`Synchronisation GeniusPay : ${data.countries.length} pays, ${operatorCount} opérateurs`);
    return { countries: data.countries.length, operators: operatorCount };
  }
}
