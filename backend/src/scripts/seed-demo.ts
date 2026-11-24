/**
 * Dane demonstracyjne do lokalnego pokazania logowania ucznia (KOALA-14)
 * bez klikania w panelu nauczyciela. Drużyny i konta uczniów normalnie
 * zakłada nauczyciel przez API drużyn (KOALA-80/81/82, `/api/teams`).
 *
 *   npm run seed:demo -- --teacher-email twoj@adres.pl
 *
 * Tworzy (lub nadpisuje) aktywnego nauczyciela, drużynę i trzech uczniów
 * z hasłami jednorazowymi (kategoria pochodzi z migracji, w razie braku
 * jest dodawana). Prośba ucznia o reset hasła wyśle mail na adres
 * nauczyciela – przy Resend ustaw tu adres właściciela konta Resend.
 */
import { parseArgs } from 'node:util';
import { ConfigService } from '@nestjs/config';
import { Role } from '../generated/prisma/client.js';
import { hashPassword } from '../auth/password.js';
import { PrismaService } from '../prisma/prisma.service.js';

const { values } = parseArgs({
  options: {
    'teacher-email': { type: 'string', default: 'nauczyciel@koala.test' },
  },
});

const teacherEmail = values['teacher-email'].trim().toLowerCase();
const TEACHER_PASSWORD = 'Koala2026!';
const STUDENT_PASSWORD = 'Start2026!';
const students = [
  { firstName: 'Ola', login: 'ola.demo' },
  { firstName: 'Bartek', login: 'bartek.demo' },
  { firstName: 'Kuba', login: 'kuba.demo' },
];

const prisma = new PrismaService(new ConfigService());
await prisma.$connect();
try {
  const category = await prisma.teamCategory.upsert({
    where: { name: 'Szkoła podstawowa, klasy 6–8' },
    update: {},
    create: {
      name: 'Szkoła podstawowa, klasy 6–8',
      minMembers: 3,
      maxMembers: 4,
    },
  });

  const teacherData = {
    passwordHash: await hashPassword(TEACHER_PASSWORD),
    role: Role.TEACHER,
    firstName: 'Anna',
    lastName: 'Nowak',
    emailVerifiedAt: new Date(),
    termsAcceptedAt: new Date(),
  };
  const teacher = await prisma.user.upsert({
    where: { email: teacherEmail },
    update: teacherData,
    create: {
      ...teacherData,
      email: teacherEmail,
      teacherProfile: {
        create: { schoolName: 'Szkoła Podstawowa nr 1', schoolCity: 'Poznań' },
      },
    },
  });

  const team =
    (await prisma.team.findFirst({
      where: { teacherId: teacher.id, name: 'Pitagorejczycy' },
    })) ??
    (await prisma.team.create({
      data: {
        name: 'Pitagorejczycy',
        categoryId: category.id,
        teacherId: teacher.id,
      },
    }));

  const passwordHash = await hashPassword(STUDENT_PASSWORD);
  for (const s of students) {
    const data = {
      firstName: s.firstName,
      lastName: '',
      role: Role.STUDENT,
      passwordHash,
      mustChangePassword: true,
      teamId: team.id,
    };
    await prisma.user.upsert({
      where: { login: s.login },
      update: data,
      create: { ...data, login: s.login },
    });
  }

  console.log('Dane demonstracyjne gotowe:');
  console.log(`  nauczyciel: ${teacherEmail} / ${TEACHER_PASSWORD}`);
  console.log(`  drużyna:    ${team.name} (${category.name})`);
  for (const s of students) {
    console.log(
      `  uczeń:      ${s.login} / ${STUDENT_PASSWORD} (hasło jednorazowe)`,
    );
  }
} finally {
  await prisma.$disconnect();
}
