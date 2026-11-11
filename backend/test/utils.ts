import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/** Tworzy aplikację do testów e2e. Wymaga bazy z DATABASE_URL. */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

export async function resetDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
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
