import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './common/audit/audit.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { configurations } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { BeneficiariesModule } from './modules/beneficiaries/beneficiaries.module';
import { CountriesModule } from './modules/countries/countries.module';
import { GeniusPayModule } from './modules/geniuspay/geniuspay.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
  imports: [
    // --- Configuration globale + validation des variables d'environnement ---
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configurations,
      validate: validateEnv,
    }),

    // --- Rate limiting (anti-abus / brute-force) ---
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('security.throttleTtl', 60) * 1000,
            limit: config.get<number>('security.throttleLimit', 120),
          },
        ],
      }),
    }),

    // --- File de jobs BullMQ (Redis) ---
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password') || undefined,
        },
      }),
    }),

    ScheduleModule.forRoot(),

    // --- Infrastructure transverse ---
    PrismaModule,
    CryptoModule,
    AuditModule,

    // --- Modules métier ---
    AuthModule,
    UsersModule,
    BeneficiariesModule,
    CountriesModule,
    GeniusPayModule,
    TransactionsModule,
    WebhooksModule,
    NotificationsModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    // Limitation de débit appliquée globalement.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Authentification JWT appliquée globalement (sauf routes @Public()).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
