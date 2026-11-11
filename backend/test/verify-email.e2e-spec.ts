import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  createTestApp,
  lastVerificationToken,
  resetDatabase,
  sentMails,
  validTeacher,
} from './utils.js';

describe('Weryfikacja e-mail (e2e)', () => {
  let app: INestApplication<App>;
  const teacher = validTeacher();
  const email = teacher.email.toLowerCase();

  const http = () => request(app.getHttpServer());
  const verify = (token: string) =>
    http().post('/api/auth/verify-email').send({ token });
  const login = () =>
    http().post('/api/auth/login').send({ email, password: teacher.password });

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    await http().post('/api/auth/register').send(teacher).expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejestracja wysyła e-mail z linkiem aktywacyjnym', () => {
    expect(sentMails).toHaveLength(1);
    expect(sentMails[0].to).toBe(email);
    expect(sentMails[0].html).toContain('token=');
  });

  it('pełny przepływ: rejestracja → link → logowanie', async () => {
    await login().expect(403);
    await verify(lastVerificationToken(email)).expect(200);
    await login().expect(200);
  });

  it('token jest jednorazowy', async () => {
    const token = lastVerificationToken(email);
    await verify(token).expect(200);
    await verify(token).expect(400);
  });

  it('odrzuca nieznany i przeterminowany token', async () => {
    await verify('nieistniejacy-token').expect(400);

    const token = lastVerificationToken(email);
    await app.get(PrismaService).emailVerificationToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await verify(token).expect(400);
    await login().expect(403);
  });

  it('w bazie jest tylko skrót tokenu', async () => {
    const token = lastVerificationToken(email);
    const rows = await app.get(PrismaService).emailVerificationToken.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).not.toBe(token);
  });

  it('ponowne wysłanie unieważnia stary link', async () => {
    const oldToken = lastVerificationToken(email);
    await http()
      .post('/api/auth/resend-verification')
      .send({ email })
      .expect(202);
    const newToken = lastVerificationToken(email);
    expect(newToken).not.toBe(oldToken);
    await verify(oldToken).expect(400);
    await verify(newToken).expect(200);
  });

  it('ponowne wysłanie nie zdradza, czy konto istnieje', async () => {
    const res = await http()
      .post('/api/auth/resend-verification')
      .send({ email: 'nikt@example.com' })
      .expect(202);
    expect(res.body.message).toMatch(/Jeśli konto istnieje/);
    expect(sentMails).toHaveLength(1);
  });
});
