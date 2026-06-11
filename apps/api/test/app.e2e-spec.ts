/**
 * تست e2e پایه — نیازمند دیتابیس در حال اجرا (docker compose up -d postgres)
 */
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Glucia API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health → ok', () =>
    request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => expect(res.body.status).toBe('ok')));

  it('GET /glucose بدون توکن → 401', () =>
    request(app.getHttpServer()).get('/api/v1/glucose').expect(401));

  it('POST /auth/login با شماره نامعتبر → 400', () =>
    request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phone: '123', password: 'x' })
      .expect(400));

  it('POST /auth/register و سپس login (چرخه کامل)', async () => {
    const phone = '09' + String(Math.floor(Math.random() * 1e9)).padStart(9, '0');
    const password = 'Test@12345';

    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ phone, password, fullName: 'کاربر تست' })
      .expect(201);
    expect(reg.body.accessToken).toBeDefined();
    expect(reg.body.role).toBe('PATIENT');

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phone, password })
      .expect(200);

    // با توکن: ثبت قند و دریافت آمار
    const token = login.body.accessToken;
    await request(app.getHttpServer())
      .post('/api/v1/glucose')
      .set('Authorization', `Bearer ${token}`)
      .send({ valueMgDl: 120 })
      .expect(201);

    const stats = await request(app.getHttpServer())
      .get('/api/v1/glucose/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(stats.body.count).toBeGreaterThanOrEqual(1);
  });
});
