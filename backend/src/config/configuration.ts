import { registerAs } from '@nestjs/config';

/**
 * Configuration typée par domaine (pattern `registerAs`).
 * Chaque namespace est injectable via `@Inject(xxxConfig.KEY)` avec auto-complétion.
 */

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  name: process.env.APP_NAME ?? 'AfriTransfer',
  port: parseInt(process.env.APP_PORT ?? '4000', 10),
  url: process.env.APP_URL ?? 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX ?? 'api',
}));

export const securityConfig = registerAs('security', () => ({
  encryptionKey: process.env.ENCRYPTION_KEY ?? '',
  throttleTtl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
  bcryptRounds: 12,
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
  accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
  refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '2592000', 10),
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
}));

export const geniuspayConfig = registerAs('geniuspay', () => ({
  baseUrl: process.env.GENIUSPAY_BASE_URL ?? 'https://geniuspay.ci/api/v1/merchant',
  apiKey: process.env.GENIUSPAY_API_KEY ?? '',
  apiSecret: process.env.GENIUSPAY_API_SECRET ?? '',
  webhookSecret: process.env.GENIUSPAY_WEBHOOK_SECRET ?? '',
  environment: process.env.GENIUSPAY_ENVIRONMENT ?? 'sandbox',
  webhookTimestampTolerance: parseInt(process.env.WEBHOOK_TIMESTAMP_TOLERANCE ?? '300', 10),
}));

export const commissionConfig = registerAs('commission', () => ({
  percent: parseFloat(process.env.COMMISSION_PERCENT ?? '2'),
  fixed: parseFloat(process.env.COMMISSION_FIXED ?? '100'),
  currency: process.env.COMMISSION_CURRENCY ?? 'XOF',
}));

export const mailConfig = registerAs('mail', () => ({
  host: process.env.SMTP_HOST ?? '',
  port: parseInt(process.env.SMTP_PORT ?? '587', 10),
  user: process.env.SMTP_USER ?? '',
  password: process.env.SMTP_PASSWORD ?? '',
  from: process.env.SMTP_FROM ?? 'AfriTransfer <no-reply@afritransfer.africa>',
}));

export const smsConfig = registerAs('sms', () => ({
  provider: process.env.SMS_PROVIDER ?? 'console',
  apiKey: process.env.SMS_API_KEY ?? '',
  apiSecret: process.env.SMS_API_SECRET ?? '',
  senderId: process.env.SMS_SENDER_ID ?? 'AfriTransfer',
}));

export const configurations = [
  appConfig,
  securityConfig,
  jwtConfig,
  redisConfig,
  geniuspayConfig,
  commissionConfig,
  mailConfig,
  smsConfig,
];
