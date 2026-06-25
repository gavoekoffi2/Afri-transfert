import { Injectable, Logger } from '@nestjs/common';

/**
 * Canal Push (architecture prête). À brancher sur FCM / APNs / Web Push.
 * Les tokens d'appareil seront stockés sur l'utilisateur dans une évolution future.
 */
@Injectable()
export class PushChannel {
  private readonly logger = new Logger(PushChannel.name);

  async send(to: string, title: string, body: string): Promise<void> {
    // TODO: intégrer Firebase Cloud Messaging (admin.messaging().send(...))
    this.logger.debug(`[PUSH:console] à ${to} — ${title}: ${body}`);
  }
}
