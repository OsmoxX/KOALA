import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  createTeamWithStudents,
  createTestApp,
  lastResetToken,
  resetDatabase,
  sentMails,
} from './utils.js';

describe('Reset hasła (e2e)', () => {
  let app: INestApplication<App>;
  const teacherEmail = 'opiekun@example.com';

  const http = () => request(app.getHttpServer());
  const requestReset = (login: string) =>
    http().post('/api/auth/password-reset/request').send({ login });
  const confirm = (token: string, newPassword: string) =>
    http()
      .post('/api/auth/password-reset/confirm')
      .send({ token, newPassword });

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    await createTeamWithStudents(app, { teacherEmail });
  });

  afterAll(async () => {
    await app.close();
  });

  it('nauczyciel dostaje link na swój adres i ustawia nowe hasło', async () => {
    await requestReset('Opiekun@Example.com').expect(202);
    expect(sentMails).toHaveLength(1);
    expect(sentMails[0].subject).toBe('Resetowanie hasła – Konkurs KOALA');

    const token = lastResetToken(teacherEmail);
    const info = await http()
      .post('/api/auth/password-reset/verify')
      .send({ token })
      .expect(200);
    expect(info.body).toMatchObject({ kind: 'OWN', firstName: 'Anna' });

    await confirm(token, 'NoweHaslo2026').expect(200);
    await http()
      .post('/api/auth/login')
      .send({ email: teacherEmail, password: 'NoweHaslo2026' })
      .expect(200);
    await http()
      .post('/api/auth/login')
      .send({ email: teacherEmail, password: 'Koala2026!' })
      .expect(401);
  });

  it('prośba ucznia trafia do opiekuna, a uczeń musi potem zmienić hasło', async () => {
    await requestReset('OLA.k7f3').expect(202);
    expect(sentMails).toHaveLength(1);
    expect(sentMails[0].to).toBe(teacherEmail);
    expect(sentMails[0].subject).toContain('Ola');
    expect(sentMails[0].html).toContain('ola.k7f3');
    expect(sentMails[0].html).toContain('Pitagorejczycy');

    const token = lastResetToken(teacherEmail);
    const res = await confirm(token, 'Nadane2026x').expect(200);
    expect(res.body.kind).toBe('STUDENT');

    const login = await http()
      .post('/api/auth/student/login')
      .send({ login: 'ola.k7f3', password: 'Nadane2026x' })
      .expect(200);
    expect(login.body.mustChangePassword).toBe(true);
  });

  it('odpowiedź nie zdradza, czy konto istnieje', async () => {
    const known = await requestReset(teacherEmail).expect(202);
    const unknown = await requestReset('nikt@example.com').expect(202);
    const unknownStudent = await requestReset('nie.ma.takiego').expect(202);
    expect(unknown.body).toEqual(known.body);
    expect(unknownStudent.body).toEqual(known.body);
    expect(sentMails).toHaveLength(1);
  });

  it('link działa tylko raz', async () => {
    await requestReset(teacherEmail).expect(202);
    const token = lastResetToken(teacherEmail);
    await confirm(token, 'NoweHaslo2026').expect(200);
    await confirm(token, 'InneHaslo2026').expect(400);
    await http()
      .post('/api/auth/password-reset/verify')
      .send({ token })
      .expect(400);
  });

  it('wygasły link jest odrzucany', async () => {
    await requestReset(teacherEmail).expect(202);
    const token = lastResetToken(teacherEmail);
    await app.get(PrismaService).passwordResetToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await confirm(token, 'NoweHaslo2026').expect(400);
  });

  it('nie wysyła kolejnego maila od razu (ochrona przed spamem)', async () => {
    await requestReset(teacherEmail).expect(202);
    await requestReset(teacherEmail).expect(202);
    expect(sentMails).toHaveLength(1);
  });

  it('słabe nowe hasło jest odrzucane (400)', async () => {
    await requestReset(teacherEmail).expect(202);
    await confirm(lastResetToken(teacherEmail), 'krotkie').expect(400);
  });
});
