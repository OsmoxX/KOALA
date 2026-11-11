# KOALA – backend

REST API systemu KOALA: Nest.js 12 (ESM, TypeScript), Prisma 7 + PostgreSQL, testy w Vitest.

## Uruchomienie

```bash
cp .env.example .env
npm install
npm run prisma:migrate
npm run start:dev
```

Wszystkie endpointy mają prefiks `/api`. Po pobraniu nowych migracji od zespołu: `npm run prisma:migrate && npm run prisma:generate`.

Bez `RESEND_API_KEY` e-maile nie są wysyłane, tylko wypisywane w logach serwera (razem z linkiem aktywacyjnym), więc lokalnie da się przejść cały przepływ bez konta w Resend.

## Endpointy

| Metoda i ścieżka | Opis |
| --- | --- |
| `GET /api/health` | Status API i bazy |
| `POST /api/auth/register` | Rejestracja nauczyciela; wysyła link aktywacyjny |
| `POST /api/auth/verify-email` | `{ token }` z linku, aktywuje konto |
| `POST /api/auth/resend-verification` | `{ email }`, wysyła nowy link (stary przestaje działać) |
| `POST /api/auth/login` | `{ email, password }`, zwraca `accessToken` (JWT); tylko dla potwierdzonych kont |
| `GET /api/auth/me` | Dane zalogowanego (`Authorization: Bearer <token>`) |

Link w e-mailu prowadzi do strony frontendu (`EMAIL_VERIFICATION_URL?token=...`), która wywołuje `POST /api/auth/verify-email`.

## Skrypty

| Skrypt | Opis |
| --- | --- |
| `npm run start:dev` | Serwer w trybie watch |
| `npm run build` / `npm run start:prod` | Build produkcyjny i uruchomienie |
| `npm run lint` | Oxlint |
| `npm run format` | Prettier |
| `npm test` | Testy jednostkowe (`*.spec.ts`) |
| `npm run test:e2e` | Testy e2e (`test/*.e2e-spec.ts`), wymagają działającej bazy |
| `npm run prisma:migrate` | Nowa migracja / zastosowanie migracji w dev |
| `npm run prisma:deploy` | Zastosowanie migracji na produkcji |

## Struktura

```
prisma/            schemat bazy i migracje
src/prisma/        PrismaService (globalny moduł)
src/health/        GET /api/health
src/users/         dostęp do użytkowników (UsersService)
src/auth/          rejestracja, logowanie JWT, weryfikacja e-mail, JwtAuthGuard
src/mail/          wysyłka przez Resend + szablony wiadomości
test/              testy e2e (Resend zastąpiony atrapą)
```
