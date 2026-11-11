import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDatabase, validTeacher } from './utils.js';

describe('Logowanie JWT (e2e)', () => {
  let app: INestApplication<App>;
  const teacher = validTeacher();

  const login = (email: string, password: string) =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });

  const markVerified = () =>
    app.get(PrismaService).user.update({
      where: { email: teacher.email.toLowerCase() },
      data: { emailVerifiedAt: new Date() },
    });

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(teacher)
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('nie wpuszcza przed weryfikacją e-mail (403)', async () => {
    await login(teacher.email, teacher.password).expect(403);
  });

  it('po weryfikacji zwraca token JWT, który działa na /api/auth/me', async () => {
    await markVerified();
    const res = await login('anna.nowak@EXAMPLE.com', teacher.password).expect(
      200,
    );
    expect(res.body.tokenType).toBe('Bearer');
    expect(res.body.accessToken.split('.')).toHaveLength(3);
    expect(res.body.user).not.toHaveProperty('passwordHash');

    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200);
    expect(me.body).toMatchObject({
      email: 'anna.nowak@example.com',
      role: 'TEACHER',
    });
  });

  it('złe hasło i nieistniejące konto dają ten sam błąd 401', async () => {
    await markVerified();
    const wrongPassword = await login(teacher.email, 'Zle-haslo-1').expect(401);
    const noAccount = await login('nikt@example.com', 'Koala2026!').expect(401);
    expect(wrongPassword.body.message).toBe(noAccount.body.message);
  });

  it('/api/auth/me bez tokenu lub z podrobionym tokenem zwraca 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer a.b.c')
      .expect(401);
  });
});
