import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { geniuspayConfig } from '../../config/configuration';
import { GeniusPayService } from './geniuspay.service';

/**
 * Encapsule toute la communication avec l'API GeniusPay.
 */
@Module({
  imports: [HttpModule, ConfigModule.forFeature(geniuspayConfig)],
  providers: [GeniusPayService],
  exports: [GeniusPayService],
})
export class GeniusPayModule {}
