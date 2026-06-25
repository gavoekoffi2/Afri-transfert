import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { smsConfig } from '../../../config/configuration';

/**
 * Canal SMS. Architecture prête pour un fournisseur réel (Twilio, Vonage, etc.).
 * Par défaut (`SMS_PROVIDER=console`), les SMS sont journalisés.
 */
@Injectable()
export class SmsChannel {
  private readonly logger = new Logger(SmsChannel.name);

  constructor(@Inject(smsConfig.KEY) private readonly config: ConfigType<typeof smsConfig>) {}

  async send(to: string, body: string): Promise<void> {
    switch (this.config.provider) {
      // case 'twilio': ... brancher le SDK Twilio ici
      // case 'vonage': ...
      case 'console':
      default:
        this.logger.debug(`[SMS:console] à ${to} (exp. ${this.config.senderId}) — ${body}`);
    }
  }
}
