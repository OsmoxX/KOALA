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


# KOALA – frontend

Aplikacja kliencka systemu konkursowego KOALA: React, TypeScript, Vite, React Router. Responsywny interfejs umożliwiający rejestrację i logowanie nauczycieli oraz obsługę komunikatów dotyczących weryfikacji adresu e-mail.

## Uruchomienie

Przejdź do katalogu `frontend/` i wykonaj:

```bash
npm install
npm run dev
```

Aplikacja jest domyślnie dostępna pod adresem `http://localhost:5173`.

Obecna wersja wykorzystuje mock API, dlatego do uruchomienia formularzy nie jest wymagany działający backend.

## Widoki

| Ścieżka | Opis |
|---|---|
| `/` | Przekierowanie do logowania |
| `/register` | Formularz rejestracji nauczyciela |
| `/login` | Formularz logowania |
| `/login?verified=success` | Komunikat o pomyślnej weryfikacji e-maila (podgląd) |
| `/login?verified=error` | Komunikat o błędzie weryfikacji |
| `/login?verified=pending` | Informacja o konieczności potwierdzenia e-maila |

## Funkcjonalności

### Rejestracja nauczyciela

- Formularz: imię, nazwisko, e-mail, hasło i potwierdzenie hasła.
- Walidacja wymaganych pól.
- Sprawdzanie poprawności adresu e-mail.
- Minimalna długość hasła: 8 znaków.
- Sprawdzanie zgodności haseł.
- Komunikaty błędów pod odpowiednimi polami.
- Symulacja wykrywania istniejącego adresu e-mail.
- Komunikat po poprawnym wypełnieniu formularza.

### Logowanie

- Formularz zawierający e-mail i hasło.
- Walidacja wymaganych pól i formatu e-maila.
- Obsługa komunikatów o błędnych danych logowania.
- Informacja o konieczności weryfikacji e-maila.
- Komunikaty o pomyślnej i nieudanej weryfikacji.
- Przycisk ponowienia wysyłki linku weryfikacyjnego (symulacja).
- Obsługa stanu ładowania formularza.

### Responsywność

- Interfejs dostosowany do komputerów i urządzeń mobilnych.
- Elastyczna szerokość formularzy.
- Czytelne komunikaty błędów i potwierdzeń.
- Nawigacja między rejestracją i logowaniem.

## Komunikacja z backendem

Backend KOALA udostępnia REST API w NestJS z prefiksem `/api`.

| Endpoint | Opis |
|---|---|
| `POST /api/auth/register` | Rejestracja nauczyciela |
| `POST /api/auth/login` | Logowanie użytkownika |
| `POST /api/auth/verify-email` | Weryfikacja adresu e-mail |
| `POST /api/auth/resend-verification` | Ponowne wysłanie linku weryfikacyjnego |
| `GET /api/auth/me` | Pobranie danych zalogowanego użytkownika |

Obecna implementacja `src/api/auth.ts` wykorzystuje mock API do symulowania odpowiedzi serwera.

Rzeczywista rejestracja, uwierzytelnianie JWT oraz wysyłanie wiadomości weryfikacyjnych wymagają integracji z backendem NestJS.

## Testy

Testy przygotowane z wykorzystaniem Vitest i React Testing Library.

Sprawdzane funkcjonalności:

- Walidacja formularza rejestracji.
- Obsługa niepoprawnych adresów e-mail.
- Wykrywanie istniejącego konta (mock).
- Walidacja formularza logowania.
- Obsługa błędów logowania.
- Wyświetlanie komunikatów weryfikacji e-maila.
- Obsługa ponowienia weryfikacji.

Uruchomienie testów:

```bash
npm test
```

Testy w trybie watch:

```bash
npm run test:watch
```

## Skrypty

| Skrypt | Opis |
|---|---|
| `npm run dev` | Uruchomienie serwera Vite |
| `npm run build` | Budowanie aplikacji |
| `npm run preview` | Podgląd wersji produkcyjnej |
| `npm run lint` | Sprawdzanie jakości kodu |
| `npm test` | Testy automatyczne Vitest |
| `npm run test:watch` | Testy w trybie watch |

Skrypty testowe wymagają konfiguracji w `package.json`.

## Struktura

```text
src/
├── api/
│   ├── auth.ts                 mock API rejestracji i logowania
│   └── auth.test.ts            testy funkcji API
├── pages/
│   ├── RegisterPage.tsx        formularz rejestracji
│   ├── RegisterPage.test.tsx   testy rejestracji
│   ├── LoginPage.tsx           formularz logowania
│   └── LoginPage.test.tsx      testy logowania
├── test/
│   └── setup.ts                konfiguracja testów
├── App.tsx                     routing aplikacji
├── main.tsx                    punkt wejścia React
└── index.css                   style i responsywność
```

## Status implementacji

Zaimplementowano frontendowe formularze rejestracji i logowania, walidację danych, komunikaty błędów oraz demonstracyjną obsługę weryfikacji adresu e-mail.

Do pełnego uruchomienia funkcjonalności pozostaje integracja z backendem NestJS, obsługa JWT oraz rzeczywista wysyłka i weryfikacja wiadomości e-mail.
