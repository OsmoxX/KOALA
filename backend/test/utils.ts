import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { type MailMessage, MailService } from '../src/mail/mail.service.js';
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
    'TRUNCATE TABLE "users", "email_verification_tokens" CASCADE',
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
