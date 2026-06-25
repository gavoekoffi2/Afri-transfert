import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

/**
 * Tests d'intégration end-to-end.
 * Prérequis : PostgreSQL + Redis accessibles, base migrée et amorcée (`npm run seed`).
 */
describe('AfriTransfer API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health -> ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status ?? res.body.data?.status).toBeDefined();
  });

  it('GET /api/v1/countries -> liste des pays', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/countries').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/auth/register puis quote authentifié', async () => {
    const email = `e2e_${Date.now()}@example.com`;
    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, firstName: 'E2E', lastName: 'Test', password: 'Password123', countryIso2: 'CM' })
      .expect(201);
    accessToken = reg.body.data.tokens.accessToken;
    expect(accessToken).toBeDefined();

    const quote = await request(app.getHttpServer())
      .post('/api/v1/transactions/quote')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ senderCountryIso2: 'CM', recipientCountryIso2: 'TG', amount: 10000 })
      .expect(200);
    expect(quote.body.data.commission).toBe(300);
    expect(quote.body.data.totalAmount).toBe(10550);
  });

  it('refuse un devis non authentifié (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/transactions/quote')
      .send({ senderCountryIso2: 'CM', recipientCountryIso2: 'TG', amount: 10000 })
      .expect(401);
  });
});
