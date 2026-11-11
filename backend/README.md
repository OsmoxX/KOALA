# KOALA – backend

REST API systemu KOALA: Nest.js 12 (ESM, TypeScript), Prisma 7 + PostgreSQL, testy w Vitest.

## Uruchomienie

```bash
cp .env.example .env
npm install
npm run prisma:migrate
npm run start:dev
```

Wszystkie endpointy mają prefiks `/api`.

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
```
