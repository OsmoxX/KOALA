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
| `POST /api/auth/student/login` | `{ login, password }` ucznia, zwraca `accessToken` i `mustChangePassword` |
| `POST /api/auth/student/change-password` | `{ currentPassword, newPassword }` (uczeń, także z hasłem jednorazowym) |
| `GET /api/students/me` | Profil ucznia: dane, drużyna, szkoła, kategoria, członkowie (tylko rola STUDENT) |
| `GET /api/teams/categories` | Kategorie wiekowe z limitami składu `minMembers`–`maxMembers` (nauczyciel) |
| `GET /api/teams` | Drużyny zalogowanego nauczyciela (`id`, `name`, `categoryName`, `studentsCount`) |
| `POST /api/teams` | `{ name, categoryId }` – nowa drużyna; nazwa unikalna u nauczyciela (409) |
| `GET /api/teams/:id` | Szczegóły drużyny: skład (`students`: imię i login) oraz limity kategorii |
| `POST /api/teams/:id/students` | `{ firstName }` – zakłada konto ucznia, zwraca `login` i `temporaryPassword` (tylko raz); ponad `maxMembers` – 409 |
| `DELETE /api/teams/:id/students/:studentId` | Usuwa ucznia razem z kontem (204) |
| `POST /api/auth/password-reset/request` | `{ login }` – e-mail nauczyciela albo login ucznia; link idzie na e-mail konta, a dla ucznia do opiekuna drużyny |
| `POST /api/auth/password-reset/verify` | `{ token }` z linku, zwraca `kind` (`OWN`/`STUDENT`), imię i login |
| `POST /api/auth/password-reset/confirm` | `{ token, newPassword }`; hasło nadane uczniowi przez opiekuna jest jednorazowe |

Uczeń z hasłem jednorazowym (`mustChangePassword: true`) dostaje token, który działa tylko na zmianę hasła (i `/api/auth/me`); inne endpointy zwracają 403 z `code: "PASSWORD_CHANGE_REQUIRED"`. Role sprawdza `@Roles(...)` razem z `JwtAuthGuard`.

Drużyny (KOALA-12): endpointy `/api/teams` są tylko dla roli TEACHER, a nauczyciel widzi wyłącznie własne drużyny (cudza drużyna daje 404). Kategorie XIII edycji (SP kl. 6–8 i szkoły ponadpodstawowe, po 3–4 uczniów) dodaje migracja `teams_management`. Maksimum składu jest egzekwowane twardo; minimum jest tylko informacją dla frontendu, bo uczniów dodaje się pojedynczo. Login ucznia ma postać `imie.xxxx` (bez polskich znaków), hasło jednorazowe – 10 znaków bez mylących `0/O/1/l/I`.

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
| `npm run seed:demo -- --teacher-email adres` | Dane do pokazu: nauczyciel, drużyna i uczniowie `ola.demo`/`bartek.demo`/`kuba.demo` (hasło `Start2026!`) |
| `npm run mail:sample -- --to adres` | Wysyła przykładowe e-maile resetu hasła przez Resend i zapisuje podgląd w `mail-preview/` |

## Struktura

```
prisma/            schemat bazy i migracje
src/prisma/        PrismaService (globalny moduł)
src/health/        GET /api/health
src/users/         dostęp do użytkowników (UsersService)
src/auth/          rejestracja, logowanie JWT (nauczyciel i uczeń), weryfikacja e-mail, reset hasła, JwtAuthGuard + @Roles
src/students/      profil ucznia (GET /api/students/me)
src/teams/         drużyny nauczyciela, konta uczniów i limity składu (/api/teams)
src/mail/          wysyłka przez Resend + szablony wiadomości
test/              testy e2e (Resend zastąpiony atrapą)
```
