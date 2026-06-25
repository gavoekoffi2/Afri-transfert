import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { securityConfig } from '../../config/configuration';
import { CryptoService } from './crypto.service';

/**
 * Module global exposant le service cryptographique partagé.
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(securityConfig)],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
