import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { mailConfig } from '../../../config/configuration';

/**
 * Canal email (SMTP via nodemailer). En l'absence de configuration SMTP,
 * les messages sont journalisés en console (mode développement).
 */
@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private transporter?: nodemailer.Transporter;

  constructor(@Inject(mailConfig.KEY) private readonly config: ConfigType<typeof mailConfig>) {
    if (this.config.host) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.port === 465,
        auth: this.config.user ? { user: this.config.user, pass: this.config.password } : undefined,
      });
    }
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    if (!this.transporter) {
      this.logger.debug(`[EMAIL:console] à ${to} — ${subject}\n${body}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.config.from,
      to,
      subject,
      html: body,
    });
  }
}
