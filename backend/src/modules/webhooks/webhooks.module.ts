import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { geniuspayConfig } from '../../config/configuration';
import { TransactionsModule } from '../transactions/transactions.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [TransactionsModule, ConfigModule.forFeature(geniuspayConfig)],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
