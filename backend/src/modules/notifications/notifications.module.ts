import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, mailConfig, smsConfig } from '../../config/configuration';
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';
import { SmsChannel } from './channels/sms.channel';
import { NOTIFICATIONS_QUEUE } from './notifications.constants';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
    ConfigModule.forFeature(appConfig),
    ConfigModule.forFeature(mailConfig),
    ConfigModule.forFeature(smsConfig),
  ],
  providers: [NotificationsService, NotificationsProcessor, EmailChannel, SmsChannel, PushChannel],
  exports: [NotificationsService],
})
export class NotificationsModule {}
