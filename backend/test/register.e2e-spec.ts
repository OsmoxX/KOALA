import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDatabase, validTeacher } from './utils.js';

describe('POST /api/auth/register (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('tworzy konto nauczyciela z zahashowanym hasłem', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validTeacher())
      .expect(201);

    expect(res.body).toMatchObject({
      email: 'anna.nowak@example.com',
      role: 'TEACHER',
      emailVerifiedAt: null,
    });
    expect(res.body).not.toHaveProperty('passwordHash');

    const user = await app.get(PrismaService).user.findUniqueOrThrow({
      where: { email: 'anna.nowak@example.com' },
      include: { teacherProfile: true },
    });
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(user.passwordHash).not.toContain('Koala2026!');
    expect(user.termsAcceptedAt).not.toBeNull();
    expect(user.teacherProfile?.schoolCity).toBe('Poznań');
  });

  it('odrzuca zajęty e-mail (bez względu na wielkość liter)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validTeacher())
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...validTeacher(), email: 'ANNA.NOWAK@example.com' })
      .expect(409);
  });

  it.each([
    ['niepoprawny e-mail', { email: 'to-nie-email' }],
    ['za krótkie hasło', { password: 'Ab1' }],
    ['hasło bez cyfry', { password: 'KoalaKoala' }],
    ['hasło bez wielkiej litery', { password: 'koala2026!' }],
    ['brak akceptacji regulaminu', { acceptTerms: false }],
    ['puste imię', { firstName: '   ' }],
    ['nadmiarowe pole', { role: 'ADMIN' }],
  ])('zwraca 400: %s', async (_name, override) => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...validTeacher(), ...override })
      .expect(400);
  });
});
