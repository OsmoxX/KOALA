import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  createCategories,
  createTeacher,
  createTeamWithStudents,
  createTestApp,
  resetDatabase,
  STUDENT_TEMP_PASSWORD,
  TEACHER_PASSWORD,
} from './utils.js';

/**
 * Przepływ tworzenia drużyny (KOALA-12, KOALA-137): nauczyciel tworzy
 * drużynę, dodaje uczniów (system generuje login i hasło jednorazowe),
 * pilnuje limitów składu i usuwa uczniów. Nauczyciel widzi tylko swoje
 * drużyny, a uczeń nie ma dostępu do API drużyn.
 */
describe('Drużyny nauczyciela (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let categoryId: string;

  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  async function teacherToken(email = 'opiekun@example.com'): Promise<string> {
    await createTeacher(app, email);
    const res = await http()
      .post('/api/auth/login')
      .send({ email, password: TEACHER_PASSWORD })
      .expect(200);
    return res.body.accessToken as string;
  }

  const createTeam = (name = 'Pitagorejczycy', t = token) =>
    http().post('/api/teams').set(auth(t)).send({ name, categoryId });
  const addStudent = (teamId: string, firstName: string, t = token) =>
    http()
      .post(`/api/teams/${teamId}/students`)
      .set(auth(t))
      .send({ firstName });
  const getTeam = (teamId: string, t = token) =>
    http().get(`/api/teams/${teamId}`).set(auth(t));

  async function teamWithStudents(names: string[]): Promise<string> {
    const { body } = await createTeam().expect(201);
    for (const name of names) {
      await addStudent(body.id, name).expect(201);
    }
    return body.id as string;
  }

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    const { primary } = await createCategories(app);
    categoryId = primary.id;
    token = await teacherToken();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('kategorie', () => {
    it('zwraca kategorie wiekowe z limitami składu', async () => {
      const res = await http()
        .get('/api/teams/categories')
        .set(auth(token))
        .expect(200);
      expect(res.body).toEqual([
        {
          id: categoryId,
          name: 'Szkoła podstawowa, klasy 6–8',
          minMembers: 3,
          maxMembers: 4,
        },
        expect.objectContaining({ name: 'Szkoła ponadpodstawowa' }),
      ]);
    });
  });

  describe('tworzenie drużyny', () => {
    it('tworzy pustą drużynę i pokazuje ją na liście', async () => {
      const created = await createTeam('  Pitagorejczycy  ').expect(201);
      expect(created.body).toMatchObject({
        name: 'Pitagorejczycy',
        categoryName: 'Szkoła podstawowa, klasy 6–8',
        studentsCount: 0,
      });

      const list = await http().get('/api/teams').set(auth(token)).expect(200);
      expect(list.body).toEqual([created.body]);
    });

    it('odrzuca brak nazwy, za długą nazwę i niepoprawną kategorię (400)', async () => {
      await createTeam('   ').expect(400);
      await createTeam('x'.repeat(101)).expect(400);
      await http()
        .post('/api/teams')
        .set(auth(token))
        .send({ name: 'Drużyna', categoryId: 'nie-uuid' })
        .expect(400);
      await http()
        .post('/api/teams')
        .set(auth(token))
        .send({ name: 'Drużyna' })
        .expect(400);
    });

    it('odrzuca nieistniejącą kategorię (400)', async () => {
      const res = await http()
        .post('/api/teams')
        .set(auth(token))
        .send({
          name: 'Drużyna',
          categoryId: '00000000-0000-4000-8000-000000000000',
        })
        .expect(400);
      expect(res.body.message).toBe('Wybrana kategoria wiekowa nie istnieje.');
    });

    it('nazwa jest unikalna u nauczyciela bez względu na wielkość liter (409)', async () => {
      await createTeam('Pitagorejczycy').expect(201);
      const res = await createTeam('PITAGOREJCZYCY').expect(409);
      expect(res.body.message).toBe('Masz już drużynę o tej nazwie.');
    });

    it('inny nauczyciel może mieć drużynę o tej samej nazwie', async () => {
      await createTeam('Pitagorejczycy').expect(201);
      const other = await teacherToken('inny@example.com');
      await createTeam('Pitagorejczycy', other).expect(201);
    });
  });

  describe('dodawanie uczniów i generowanie kont', () => {
    it('generuje unikalny login i hasło jednorazowe', async () => {
      const { body: team } = await createTeam().expect(201);
      const res = await addStudent(team.id, ' Łucja ').expect(201);

      expect(res.body.login).toMatch(/^lucja\.[a-z0-9]{4}$/);
      expect(res.body.temporaryPassword).toMatch(/^[A-Za-z2-9]{10}$/);
      expect(res.body.student).toEqual({
        id: expect.any(String),
        firstName: 'Łucja',
        login: res.body.login,
      });
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });

    it('uczeń loguje się wygenerowanymi danymi i musi zmienić hasło', async () => {
      const { body: team } = await createTeam().expect(201);
      const { body: creds } = await addStudent(team.id, 'Ola').expect(201);

      const login = await http()
        .post('/api/auth/student/login')
        .send({ login: creds.login, password: creds.temporaryPassword })
        .expect(200);
      expect(login.body.mustChangePassword).toBe(true);
      expect(login.body.user).toMatchObject({
        firstName: 'Ola',
        login: creds.login,
        role: 'STUDENT',
      });
    });

    it('szczegóły drużyny zawierają skład i limity, bez haseł', async () => {
      const teamId = await teamWithStudents(['Ola', 'Bartek']);
      const res = await getTeam(teamId).expect(200);
      expect(res.body).toMatchObject({
        id: teamId,
        name: 'Pitagorejczycy',
        categoryName: 'Szkoła podstawowa, klasy 6–8',
        studentsCount: 2,
        minMembers: 3,
        maxMembers: 4,
      });
      expect(
        res.body.students.map((s: { firstName: string }) => s.firstName),
      ).toEqual(['Ola', 'Bartek']);
      expect(JSON.stringify(res.body)).not.toMatch(
        /passwordHash|temporaryPassword/,
      );
    });

    it('uczniowie o tym samym imieniu dostają różne loginy', async () => {
      const { body: team } = await createTeam().expect(201);
      const a = await addStudent(team.id, 'Ola').expect(201);
      const b = await addStudent(team.id, 'Ola').expect(201);
      expect(a.body.login).not.toBe(b.body.login);
    });

    it('nie pozwala przekroczyć maksymalnego składu (409)', async () => {
      const teamId = await teamWithStudents(['Ola', 'Bartek', 'Kuba', 'Zosia']);
      const res = await addStudent(teamId, 'Piąty').expect(409);
      expect(res.body.message).toContain('maksymalną liczbę uczniów (4)');
      expect((await getTeam(teamId)).body.studentsCount).toBe(4);
    });

    it('równoległe dodawanie nie przekracza limitu', async () => {
      const teamId = await teamWithStudents(['Ola', 'Bartek', 'Kuba']);
      const results = await Promise.all(
        ['Zosia', 'Janek', 'Ewa'].map((name) => addStudent(teamId, name)),
      );
      expect(results.map((r) => r.status).sort((a, b) => a - b)).toEqual([
        201, 409, 409,
      ]);
      expect((await getTeam(teamId)).body.studentsCount).toBe(4);
    });

    it('odrzuca puste imię (400)', async () => {
      const { body: team } = await createTeam().expect(201);
      await addStudent(team.id, '  ').expect(400);
      await http()
        .post(`/api/teams/${team.id}/students`)
        .set(auth(token))
        .send({ firstName: 'Ola', login: 'wlasny' })
        .expect(400);
    });
  });

  describe('edycja i usuwanie drużyny', () => {
    it('zmienia nazwę drużyny i pozwala na zmianę wielkości liter', async () => {
      const teamId = await teamWithStudents(['Ola']);
      const renamed = await http()
        .patch(`/api/teams/${teamId}`)
        .set(auth(token))
        .send({ name: '  Nowa Nazwa  ' })
        .expect(200);
      expect(renamed.body.name).toBe('Nowa Nazwa');
      expect(renamed.body.studentsCount).toBe(1);

      const recased = await http()
        .patch(`/api/teams/${teamId}`)
        .set(auth(token))
        .send({ name: 'nowa nazwa' })
        .expect(200);
      expect(recased.body.name).toBe('nowa nazwa');
    });

    it('odrzuca pustą, za długą lub zduplikowaną nazwę drużyny (400/409)', async () => {
      const teamA = await teamWithStudents([]);
      await createTeam('Druga').expect(201);

      await http()
        .patch(`/api/teams/${teamA}`)
        .set(auth(token))
        .send({ name: '   ' })
        .expect(400);
      await http()
        .patch(`/api/teams/${teamA}`)
        .set(auth(token))
        .send({ name: 'x'.repeat(101) })
        .expect(400);

      const dup = await http()
        .patch(`/api/teams/${teamA}`)
        .set(auth(token))
        .send({ name: 'DRUGA' })
        .expect(409);
      expect(dup.body.message).toBe('Masz już drużynę o tej nazwie.');
    });

    it('usuwa drużynę razem z kontami wszystkich jej uczniów', async () => {
      const { body: team } = await createTeam().expect(201);
      const ola = await addStudent(team.id, 'Ola').expect(201);
      const bartek = await addStudent(team.id, 'Bartek').expect(201);

      await http().delete(`/api/teams/${team.id}`).set(auth(token)).expect(204);

      await getTeam(team.id).expect(404);
      const list = await http().get('/api/teams').set(auth(token)).expect(200);
      expect(list.body).toEqual([]);

      await http()
        .post('/api/auth/student/login')
        .send({ login: ola.body.login, password: ola.body.temporaryPassword })
        .expect(401);
      await http()
        .post('/api/auth/student/login')
        .send({
          login: bartek.body.login,
          password: bartek.body.temporaryPassword,
        })
        .expect(401);
    });

    it('nauczyciel nie zmieni ani nie usunie cudzej drużyny (404)', async () => {
      const teamId = await teamWithStudents(['Ola']);
      const other = await teacherToken('inny@example.com');

      await http()
        .patch(`/api/teams/${teamId}`)
        .set(auth(other))
        .send({ name: 'Przejęta' })
        .expect(404);
      await http().delete(`/api/teams/${teamId}`).set(auth(other)).expect(404);
      expect((await getTeam(teamId)).body.name).toBe('Pitagorejczycy');
    });
  });

  describe('usuwanie uczniów', () => {
    it('usuwa ucznia razem z kontem', async () => {
      const { body: team } = await createTeam().expect(201);
      const { body: creds } = await addStudent(team.id, 'Ola').expect(201);

      await http()
        .delete(`/api/teams/${team.id}/students/${creds.student.id}`)
        .set(auth(token))
        .expect(204);

      expect((await getTeam(team.id)).body.students).toEqual([]);
      await http()
        .post('/api/auth/student/login')
        .send({ login: creds.login, password: creds.temporaryPassword })
        .expect(401);
    });

    it('pozwala zejść poniżej minimum (minimum to informacja)', async () => {
      const teamId = await teamWithStudents(['Ola', 'Bartek', 'Kuba']);
      const { body } = await getTeam(teamId);
      await http()
        .delete(`/api/teams/${teamId}/students/${body.students[0].id}`)
        .set(auth(token))
        .expect(204);
      const after = await getTeam(teamId).expect(200);
      expect(after.body.studentsCount).toBeLessThan(after.body.minMembers);
    });

    it('nie usuwa ucznia z innej drużyny (404)', async () => {
      const teamA = await teamWithStudents(['Ola']);
      const { body: teamB } = await createTeam('Inna').expect(201);
      const { body } = await getTeam(teamA);
      await http()
        .delete(`/api/teams/${teamB.id}/students/${body.students[0].id}`)
        .set(auth(token))
        .expect(404);
      expect((await getTeam(teamA)).body.studentsCount).toBe(1);
    });
  });

  describe('uprawnienia', () => {
    it('bez tokenu zwraca 401', async () => {
      await http().get('/api/teams').expect(401);
      await http()
        .post('/api/teams')
        .send({ name: 'X', categoryId })
        .expect(401);
    });

    it('nauczyciel nie widzi ani nie zmienia cudzych drużyn (404)', async () => {
      const teamId = await teamWithStudents(['Ola']);
      const other = await teacherToken('inny@example.com');

      const list = await http().get('/api/teams').set(auth(other)).expect(200);
      expect(list.body).toEqual([]);
      await getTeam(teamId, other).expect(404);
      await addStudent(teamId, 'Intruz', other).expect(404);
      const { body } = await getTeam(teamId);
      await http()
        .delete(`/api/teams/${teamId}/students/${body.students[0].id}`)
        .set(auth(other))
        .expect(404);
    });

    it('niepoprawne id drużyny to 404', async () => {
      await getTeam('nie-uuid').expect(404);
      await getTeam('00000000-0000-4000-8000-000000000000').expect(404);
    });

    it('uczeń nie ma dostępu do API drużyn (403)', async () => {
      await createTeamWithStudents(app, {
        teamName: 'Uczniowska',
        students: [{ firstName: 'Ola', login: 'ola.test' }],
      });
      const first = await http()
        .post('/api/auth/student/login')
        .send({ login: 'ola.test', password: STUDENT_TEMP_PASSWORD })
        .expect(200);
      await http()
        .post('/api/auth/student/change-password')
        .set(auth(first.body.accessToken))
        .send({
          currentPassword: STUDENT_TEMP_PASSWORD,
          newPassword: 'MojeHaslo2026',
        })
        .expect(200);
      const student = await http()
        .post('/api/auth/student/login')
        .send({ login: 'ola.test', password: 'MojeHaslo2026' })
        .expect(200);

      await http()
        .get('/api/teams')
        .set(auth(student.body.accessToken))
        .expect(403);
    });
  });
});
