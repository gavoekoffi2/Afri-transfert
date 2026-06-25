import { plainToInstance } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength, validateSync } from 'class-validator';

/**
 * Validation des variables d'environnement critiques au démarrage.
 * En production, l'application refuse de booter si une variable de sécurité manque.
 */
class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  @IsOptional()
  NODE_ENV?: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(16)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(16)
  JWT_REFRESH_SECRET!: string;

  // Clé hex de 64 caractères (32 octets) pour AES-256-GCM.
  @IsString()
  @MinLength(64)
  ENCRYPTION_KEY!: string;

  @IsString()
  @IsOptional()
  GENIUSPAY_API_KEY?: string;

  @IsString()
  @IsOptional()
  GENIUSPAY_WEBHOOK_SECRET?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const isProd = (config.NODE_ENV ?? 'development') === 'production';
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const message = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    // Hors production, on tolère les défauts de dev mais on prévient bruyamment.
    if (isProd) {
      throw new Error(`Configuration d'environnement invalide : ${message}`);
    }
    // eslint-disable-next-line no-console
    console.warn(`⚠️  Variables d'environnement incomplètes (mode dev) : ${message}`);
  }

  return config;
}
