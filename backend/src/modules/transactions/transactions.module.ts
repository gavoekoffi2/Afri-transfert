import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, commissionConfig, geniuspayConfig } from '../../config/configuration';
import { CountriesModule } from '../countries/countries.module';
import { GeniusPayModule } from '../geniuspay/geniuspay.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FeesService } from './fees/fees.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    CountriesModule,
    GeniusPayModule,
    NotificationsModule,
    ConfigModule.forFeature(appConfig),
    ConfigModule.forFeature(commissionConfig),
    ConfigModule.forFeature(geniuspayConfig),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, FeesService],
  exports: [TransactionsService, FeesService],
})
export class TransactionsModule {}
