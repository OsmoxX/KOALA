import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { type MailMessage, MailService } from '../src/mail/mail.service.js';
import { hashPassword } from '../src/auth/password.js';
import { Role } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/** E-maile „wysłane” w testach (zamiast Resend). */
export const sentMails: MailMessage[] = [];

class FakeMailService {
  send(message: MailMessage): Promise<void> {
    sentMails.push(message);
    return Promise.resolve();
  }
}

/** Wyciąga token z linku w ostatnim e-mailu do danego adresu. */
export function lastVerificationToken(to: string): string {
  const mail = sentMails.filter((m) => m.to === to).at(-1);
  const token = mail?.text.match(/token=([\w-]+)/)?.[1];
  if (!token) throw new Error(`Brak e-maila weryfikacyjnego do ${to}`);
  return decodeURIComponent(token);
}

/** Wyciąga token z linku w ostatnim e-mailu resetu hasła do danego adresu. */
export function lastResetToken(to: string): string {
  const mail = sentMails
    .filter((m) => m.to === to && m.text.includes('reset-hasla'))
    .at(-1);
  const token = mail?.text.match(/token=([\w-]+)/)?.[1];
  if (!token) throw new Error(`Brak e-maila resetu hasła do ${to}`);
  return decodeURIComponent(token);
}

/** Tworzy aplikację do testów e2e. Wymaga bazy z DATABASE_URL. */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MailService)
    .useClass(FakeMailService)
    .compile();
  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

export async function resetDatabase(app: INestApplication): Promise<void> {
  sentMails.length = 0;
  const prisma = app.get(PrismaService);
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "users", "email_verification_tokens", "password_reset_tokens", "teams", "team_categories" CASCADE',
  );
}

export const validTeacher = () => ({
  email: 'Anna.Nowak@Example.com',
  password: 'Koala2026!',
  firstName: 'Anna',
  lastName: 'Nowak',
  schoolName: 'V Liceum Ogólnokształcące',
  schoolCity: 'Poznań',
  acceptTerms: true,
});

export const STUDENT_TEMP_PASSWORD = 'Start2026!';
export const TEACHER_PASSWORD = 'Koala2026!';

/** Kategorie jak w migracji `teams_management` (testy czyszczą tabelę). */
export async function createCategories(app: INestApplication) {
  const prisma = app.get(PrismaService);
  const primary = await prisma.teamCategory.create({
    data: {
      name: 'Szkoła podstawowa, klasy 6–8',
      minMembers: 3,
      maxMembers: 4,
    },
  });
  const secondary = await prisma.teamCategory.create({
    data: { name: 'Szkoła ponadpodstawowa', minMembers: 3, maxMembers: 4 },
  });
  return { primary, secondary };
}

/** Aktywny nauczyciel (e-mail potwierdzony) – istniejący albo nowy. */
export async function createTeacher(
  app: INestApplication,
  email = 'opiekun@example.com',
) {
  const prisma = app.get(PrismaService);
  return (
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(TEACHER_PASSWORD),
        role: Role.TEACHER,
        firstName: 'Anna',
        lastName: 'Nowak',
        emailVerifiedAt: new Date(),
        teacherProfile: {
          create: { schoolName: 'SP nr 1', schoolCity: 'Poznań' },
        },
      },
    }))
  );
}

/**
 * Drużyna z aktywnym opiekunem i uczniami z hasłem jednorazowym – tak jak
 * po założeniu kont przez nauczyciela (API drużyn: KOALA-81/82), ale
 * z ustalonymi loginami, żeby testy logowania były przewidywalne.
 */
export async function createTeamWithStudents(
  app: INestApplication,
  opts: {
    teacherEmail?: string;
    teamName?: string;
    students?: Array<{ firstName: string; login: string }>;
  } = {},
) {
  const prisma = app.get(PrismaService);
  const category =
    (await prisma.teamCategory.findFirst()) ??
    (await prisma.teamCategory.create({
      data: { name: 'Klasy 7–8', minMembers: 2, maxMembers: 4 },
    }));
  const teacher = await createTeacher(app, opts.teacherEmail);
  const team = await prisma.team.create({
    data: {
      name: opts.teamName ?? 'Pitagorejczycy',
      categoryId: category.id,
      teacherId: teacher.id,
    },
  });
  const passwordHash = await hashPassword(STUDENT_TEMP_PASSWORD);
  const students = [];
  for (const s of opts.students ?? [
    { firstName: 'Ola', login: 'ola.k7f3' },
    { firstName: 'Bartek', login: 'bartek.p2m9' },
  ]) {
    students.push(
      await prisma.user.create({
        data: {
          ...s,
          lastName: '',
          role: Role.STUDENT,
          passwordHash,
          mustChangePassword: true,
          teamId: team.id,
        },
      }),
    );
  }
  return { teacher, team, category, students };
}
