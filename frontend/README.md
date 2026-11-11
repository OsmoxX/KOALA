# KOALA – frontend

Aplikacja webowa systemu KOALA: Next.js (App Router), React, TypeScript i CSS. Frontend komunikuje się z backendem NestJS przez REST API.

## Uruchomienie

```bash
npm install
npm run dev -- -p 3001
```

Frontend dostępny jest pod adresem `http://localhost:3001`.

Utwórz plik `.env.local` w katalogu `frontend/`:

```env
BACKEND_API_URL=http://localhost:3000/api
```

Do poprawnego działania rejestracji i logowania wymagany jest uruchomiony backend NestJS oraz baza PostgreSQL.

## Funkcjonalności

| **Ścieżka** | **Opis** |
|---|---|
| `/register` | Rejestracja nauczyciela z walidacją formularza |
| `/login` | Logowanie nauczyciela i ponowne wysyłanie linku aktywacyjnego |
| `/weryfikacja-email` | Aktywacja konta przy użyciu jednorazowego tokenu |
| `/dashboard` | Podstawowy panel nauczyciela i wylogowanie |

Po zalogowaniu JWT przechowywany jest w ciasteczku HttpOnly. Next.js przekazuje żądania do backendu NestJS.

Bez skonfigurowanego Resend link aktywacyjny jest wypisywany w logach backendu.

## Endpointy

| **Metoda i ścieżka** | **Opis** |
|---|---|
| `POST /api/auth/register` | Rejestracja nauczyciela |
| `POST /api/auth/login` | Logowanie |
| `POST /api/auth/verify-email` | Weryfikacja adresu e-mail |
| `POST /api/auth/resend-verification` | Ponowne wysłanie linku |
| `GET /api/auth/me` | Dane zalogowanego użytkownika |
| `POST /api/auth/logout` | Usunięcie lokalnej sesji |

Endpointy są obsługiwane przez Next.js i przekazywane do NestJS, z wyjątkiem wylogowania obsługiwanego lokalnie.

## Skrypty

| **Skrypt** | **Opis** |
|---|---|
| `npm run dev -- -p 3001` | Uruchomienie aplikacji w trybie developerskim |
| `npm run build` | Build produkcyjny |
| `npm run start` | Uruchomienie buildu produkcyjnego |
| `npm run lint` | Sprawdzenie kodu przez ESLint |

## Struktura

```text
src/app/                   Strony aplikacji (App Router)
src/app/api/auth/          Endpointy API Next.js
src/app/register/          Formularz rejestracji
src/app/login/             Formularz logowania
src/app/weryfikacja-email/ Weryfikacja adresu e-mail
src/app/dashboard/         Panel nauczyciela
src/lib/                   Komunikacja z backendem i funkcje autoryzacji
src/app/globals.css        Style aplikacji
public/                    Pliki statyczne
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
