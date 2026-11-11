import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Bez env() – `prisma generate` (postinstall) działa także bez pliku .env.
    url: process.env['DATABASE_URL'],
  },
});
