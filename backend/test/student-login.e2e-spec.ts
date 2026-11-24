import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  createTeamWithStudents,
  createTestApp,
  resetDatabase,
  STUDENT_TEMP_PASSWORD,
} from './utils.js';

/**
 * Przepływ logowania ucznia (KOALA-14, KOALA-136):
 * logowanie hasłem jednorazowym → wymuszona zmiana hasła → ponowne
 * logowanie → profil z własną drużyną, bez dostępu do cudzych danych.
 */
describe('Logowanie ucznia (e2e)', () => {
  let app: INestApplication<App>;
  const NEW_PASSWORD = 'MojeHaslo2026';

  const http = () => request(app.getHttpServer());
  const studentLogin = (login: string, password: string) =>
    http().post('/api/auth/student/login').send({ login, password });
  const changePassword = (
    token: string,
    body: { currentPassword: string; newPassword: string },
  ) =>
    http()
      .post('/api/auth/student/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  const profile = (token: string) =>
    http().get('/api/students/me').set('Authorization', `Bearer ${token}`);

  /** Pierwsze logowanie + zmiana hasła + ponowne logowanie; zwraca pełny token. */
  async function activatedStudentToken(login = 'ola.k7f3'): Promise<string> {
    const first = await studentLogin(login, STUDENT_TEMP_PASSWORD).expect(200);
    await changePassword(first.body.accessToken, {
      currentPassword: STUDENT_TEMP_PASSWORD,
      newPassword: NEW_PASSWORD,
    }).expect(200);
    const second = await studentLogin(login, NEW_PASSWORD).expect(200);
    return second.body.accessToken as string;
  }

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    await createTeamWithStudents(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('logowanie', () => {
    it('loguje loginem i hasłem jednorazowym i wymaga zmiany hasła', async () => {
      const res = await studentLogin('ola.k7f3', STUDENT_TEMP_PASSWORD).expect(
        200,
      );
      expect(res.body).toMatchObject({
        tokenType: 'Bearer',
        mustChangePassword: true,
        user: { firstName: 'Ola', login: 'ola.k7f3', role: 'STUDENT' },
      });
      expect(res.body.accessToken.split('.')).toHaveLength(3);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });

    it('login nie rozróżnia wielkości liter i ignoruje spacje', async () => {
      await studentLogin('  OLA.K7F3 ', STUDENT_TEMP_PASSWORD).expect(200);
    });

    it('złe hasło i nieistniejący login dają ten sam błąd 401', async () => {
      const wrongPassword = await studentLogin('ola.k7f3', 'zle-haslo').expect(
        401,
      );
      const noAccount = await studentLogin('nikt.x', 'zle-haslo').expect(401);
      expect(wrongPassword.body.message).toBe('Nieprawidłowy login lub hasło.');
      expect(noAccount.body.message).toBe(wrongPassword.body.message);
    });

    it('nauczyciel nie zaloguje się formularzem ucznia', async () => {
      await studentLogin('opiekun@example.com', 'Koala2026!').expect(401);
    });

    it('brak loginu lub hasła to błąd walidacji (400)', async () => {
      await http()
        .post('/api/auth/student/login')
        .send({ login: '', password: '' })
        .expect(400);
      await http()
        .post('/api/auth/student/login')
        .send({ login: 'ola.k7f3' })
        .expect(400);
    });
  });

  describe('wymuszona zmiana hasła jednorazowego', () => {
    it('przed zmianą hasła profil jest niedostępny (403)', async () => {
      const res = await studentLogin('ola.k7f3', STUDENT_TEMP_PASSWORD);
      const blocked = await profile(res.body.accessToken).expect(403);
      expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
    });

    it('po zmianie hasła stare przestaje działać, a nowe nie wymaga zmiany', async () => {
      const first = await studentLogin('ola.k7f3', STUDENT_TEMP_PASSWORD);
      await changePassword(first.body.accessToken, {
        currentPassword: STUDENT_TEMP_PASSWORD,
        newPassword: NEW_PASSWORD,
      }).expect(200);

      await studentLogin('ola.k7f3', STUDENT_TEMP_PASSWORD).expect(401);
      const again = await studentLogin('ola.k7f3', NEW_PASSWORD).expect(200);
      expect(again.body.mustChangePassword).toBe(false);
      await profile(again.body.accessToken).expect(200);
    });

    it('odrzuca złe aktualne hasło, słabe i takie samo nowe hasło', async () => {
      const { body } = await studentLogin('ola.k7f3', STUDENT_TEMP_PASSWORD);
      const token = body.accessToken as string;
      await changePassword(token, {
        currentPassword: 'nie-to-haslo',
        newPassword: NEW_PASSWORD,
      }).expect(400);
      await changePassword(token, {
        currentPassword: STUDENT_TEMP_PASSWORD,
        newPassword: 'slabe',
      }).expect(400);
      await changePassword(token, {
        currentPassword: STUDENT_TEMP_PASSWORD,
        newPassword: STUDENT_TEMP_PASSWORD,
      }).expect(400);
    });

    it('zmiana hasła wymaga zalogowania', async () => {
      await http()
        .post('/api/auth/student/change-password')
        .send({ currentPassword: 'x', newPassword: NEW_PASSWORD })
        .expect(401);
    });
  });

  describe('profil ucznia', () => {
    it('pokazuje drużynę, szkołę, kategorię i członków', async () => {
      const res = await profile(await activatedStudentToken()).expect(200);
      expect(res.body).toMatchObject({
        firstName: 'Ola',
        login: 'ola.k7f3',
        team: {
          name: 'Pitagorejczycy',
          schoolName: 'SP nr 1',
          categoryName: 'Klasy 7–8',
        },
      });
      expect(
        res.body.team.members.map((m: { firstName: string }) => m.firstName),
      ).toEqual(['Bartek', 'Ola']);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });

    it('nie pokazuje uczniów z innych drużyn', async () => {
      await createTeamWithStudents(app, {
        teamName: 'Inna drużyna',
        students: [{ firstName: 'Zenon', login: 'zenon.obcy' }],
      });
      const res = await profile(await activatedStudentToken()).expect(200);
      expect(JSON.stringify(res.body)).not.toContain('Zenon');
      expect(res.body.team.name).toBe('Pitagorejczycy');
    });

    it('bez tokenu lub z podrobionym tokenem zwraca 401', async () => {
      await http().get('/api/students/me').expect(401);
      await profile('a.b.c').expect(401);
    });

    it('nauczyciel nie ma dostępu do profilu ucznia (403)', async () => {
      const teacher = await http()
        .post('/api/auth/login')
        .send({ email: 'opiekun@example.com', password: 'Koala2026!' })
        .expect(200);
      await profile(teacher.body.accessToken).expect(403);
    });
  });
});
