import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NotificationChannel } from '@prisma/client';
import { Queue } from 'bullmq';
import { appConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { NOTIFICATIONS_QUEUE, NotificationJobData } from './notifications.constants';
import { RenderedMessage, Templates } from './notification-templates';

interface EnqueueParams {
  channel: NotificationChannel;
  to: string;
  body: string;
  subject?: string;
  userId?: string;
  event?: string;
}

/**
 * Point d'entrée des notifications. Persiste chaque notification puis délègue l'envoi
 * à une file BullMQ (traitement asynchrone, retries). Canaux : email, SMS, push.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
    private readonly prisma: PrismaService,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  // --------------------------------------------------------------- bas niveau
  async enqueue(params: EnqueueParams): Promise<void> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        channel: params.channel,
        to: params.to,
        subject: params.subject,
        body: params.body,
        event: params.event,
      },
    });

    const job: NotificationJobData = {
      notificationId: notification.id,
      channel: params.channel,
      to: params.to,
      subject: params.subject,
      body: params.body,
    };

    try {
      await this.queue.add('send', job, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      });
    } catch (error) {
      // Si Redis/BullMQ est indisponible, on ne bloque pas le flux métier.
      this.logger.warn(`File de notifications indisponible: ${(error as Error).message}`);
    }
  }

  // --------------------------------------------------------------- haut niveau (auth)
  async sendEmailVerification(to: string, name: string, token: string): Promise<void> {
    const url = `${this.app.frontendUrl}/verify-email?token=${token}`;
    await this.email(to, Templates.emailVerification(name, url), 'auth.email_verification');
  }

  async sendWelcome(to: string, name: string): Promise<void> {
    await this.email(to, Templates.welcome(name), 'auth.welcome');
  }

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    const url = `${this.app.frontendUrl}/reset-password?token=${token}`;
    await this.email(to, Templates.passwordReset(name, url), 'auth.password_reset');
  }

  async sendPhoneOtp(to: string, code: string): Promise<void> {
    await this.enqueue({
      channel: NotificationChannel.SMS,
      to,
      body: Templates.phoneOtp(code),
      event: 'auth.phone_otp',
    });
  }

  // --------------------------------------------------------------- haut niveau (transactions)
  /**
   * Notifie l'utilisateur d'un événement de transaction sur tous les canaux pertinents.
   */
  async notifyTransaction(params: {
    userId?: string;
    email?: string | null;
    phone?: string | null;
    message: RenderedMessage;
    smsBody?: string;
    event: string;
  }): Promise<void> {
    if (params.email) {
      await this.email(params.email, params.message, params.event, params.userId);
    }
    if (params.phone && params.smsBody) {
      await this.enqueue({
        channel: NotificationChannel.SMS,
        to: params.phone,
        body: params.smsBody,
        userId: params.userId,
        event: params.event,
      });
    }
  }

  private email(to: string, msg: RenderedMessage, event: string, userId?: string): Promise<void> {
    return this.enqueue({
      channel: NotificationChannel.EMAIL,
      to,
      subject: msg.subject,
      body: msg.body,
      event,
      userId,
    });
  }
}
