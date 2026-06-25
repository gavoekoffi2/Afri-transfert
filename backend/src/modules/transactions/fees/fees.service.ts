import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { commissionConfig, geniuspayConfig } from '../../../config/configuration';
import { PrismaService } from '../../../prisma/prisma.service';
import { calculateTransferFees, TransferFeesResult } from './transfer-fees';

interface QuoteParams {
  amount: number;
  sendCurrency: string;
  receiveCurrency: string;
}

/**
 * Service applicatif autour du moteur `calculateTransferFees`.
 * Charge les paramètres de commission depuis la configuration, avec possibilité
 * de surcharge dynamique via la table `settings` (dashboard admin).
 */
@Injectable()
export class FeesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(commissionConfig.KEY) private readonly commission: ConfigType<typeof commissionConfig>,
    @Inject(geniuspayConfig.KEY) private readonly geniuspay: ConfigType<typeof geniuspayConfig>,
  ) {}

  /** Lit un paramètre numérique surchargé en base, sinon la valeur par défaut. */
  private async settingNumber(key: string, fallback: number): Promise<number> {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    const parsed = setting ? Number(setting.value) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  async getRates() {
    const [percent, fixed, feeEstimate] = await Promise.all([
      this.settingNumber('commission.percent', this.commission.percent),
      this.settingNumber('commission.fixed', this.commission.fixed),
      this.settingNumber('geniuspay.fee_percent_estimate', 2.5),
    ]);
    return { percent, fixed, feeEstimate };
  }

  async quote(params: QuoteParams): Promise<TransferFeesResult> {
    const { percent, fixed, feeEstimate } = await this.getRates();
    return calculateTransferFees({
      amount: params.amount,
      sendCurrency: params.sendCurrency,
      receiveCurrency: params.receiveCurrency,
      commissionPercent: percent,
      commissionFixed: fixed,
      geniusPayFeePercentEstimate: feeEstimate,
    });
  }
}
