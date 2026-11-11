import { type INestApplication, ValidationPipe } from '@nestjs/common';

/** Wspólna konfiguracja aplikacji dla main.ts i testów e2e. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
