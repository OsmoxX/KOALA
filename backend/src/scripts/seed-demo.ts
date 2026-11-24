/**
 * Dane demonstracyjne do lokalnego pokazania logowania ucznia (KOALA-14),
 * dopóki nie ma API tworzenia drużyn i kont uczniów (KOALA-80/81/82).
 *
 *   npm run seed:demo -- --teacher-email twoj@adres.pl
 *
 * Tworzy (lub nadpisuje) aktywnego nauczyciela, kategorię, drużynę i dwóch
 * uczniów z hasłami jednorazowymi. Prośba ucznia o reset hasła wyśle mail
 * na adres nauczyciela – przy Resend ustaw tu adres właściciela konta Resend.
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
];

const prisma = new PrismaService(new ConfigService());
await prisma.$connect();
try {
  const category = await prisma.teamCategory.upsert({
    where: { name: 'Szkoła podstawowa, klasy 7–8' },
    update: {},
    create: {
      name: 'Szkoła podstawowa, klasy 7–8',
      minMembers: 2,
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
