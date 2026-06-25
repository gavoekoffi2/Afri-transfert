import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { NotificationStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';
import { SmsChannel } from './channels/sms.channel';
import { NOTIFICATIONS_QUEUE, NotificationJobData } from './notifications.constants';

/**
 * Worker BullMQ : consomme les jobs de notification et délègue au bon canal,
 * puis met à jour le statut (SENT / FAILED) de la notification persistée.
 */
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailChannel,
    private readonly sms: SmsChannel,
    private readonly push: PushChannel,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { notificationId, channel, to, subject, body } = job.data;
    try {
      switch (channel) {
        case 'EMAIL':
          await this.email.send(to, subject ?? 'AfriTransfer', body);
          break;
        case 'SMS':
          await this.sms.send(to, body);
          break;
        case 'PUSH':
          await this.push.send(to, subject ?? 'AfriTransfer', body);
          break;
      }
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.SENT, sentAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Échec d'envoi (${channel} -> ${to}): ${(error as Error).message}`);
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.FAILED, error: (error as Error).message },
      });
      throw error; // laisse BullMQ gérer les retries
    }
  }
}
