import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  // `rawBody: true` conserve le corps brut des requêtes (nécessaire à la
  // vérification de signature HMAC des webhooks GeniusPay).
  const app = await NestFactory.create(AppModule, { bufferLogs: false, rawBody: true });
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('app.apiPrefix', 'api');
  const port = config.get<number>('app.port', 4000);
  const frontendUrl = config.get<string>('app.frontendUrl', 'http://localhost:3000');

  // --- Sécurité HTTP ---
  app.use(
    helmet({
      contentSecurityPolicy: false, // Swagger UI a besoin d'inline scripts
    }),
  );
  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Les webhooks ont besoin du corps brut pour vérifier la signature HMAC.
  // (configuré par module via un middleware dédié — voir RawBodyMiddleware)
  app.setGlobalPrefix(apiPrefix, { exclude: ['health', 'health/(.*)'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // --- Validation stricte globale ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // --- Enveloppe de réponse + journalisation + gestion d'erreurs ---
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // --- Documentation Swagger / OpenAPI ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AfriTransfer API')
    .setDescription(
      'API de transfert d\'argent panafricain basée sur GeniusPay. ' +
        'Envoyez de l\'argent partout en Afrique, simplement.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Authentification & gestion de compte')
    .addTag('users', 'Profil utilisateur')
    .addTag('beneficiaries', 'Bénéficiaires favoris')
    .addTag('countries', 'Pays, devises & opérateurs')
    .addTag('transactions', 'Envoi d\'argent & historique')
    .addTag('webhooks', 'Webhooks GeniusPay')
    .addTag('admin', 'Dashboard administrateur')
    .addTag('health', 'Supervision')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 AfriTransfer API : http://localhost:${port}/${apiPrefix}`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger        : http://localhost:${port}/${apiPrefix}/docs`);
}

void bootstrap();
