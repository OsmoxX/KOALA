# KOALA – Frontend

Frontend aplikacji KOALA, stworzony w Next.js, React i TypeScript. Aplikacja umożliwia nauczycielom rejestrację, logowanie oraz weryfikację adresu e-mail.

Frontend komunikuje się z backendem NestJS przez REST API.

## Technologie

- Next.js
- React
- TypeScript
- CSS
- REST API
- JWT

## Uruchomienie

1. Przejdź do katalogu frontend:

```bash
cd frontend
```

2. Zainstaluj zależności:

```bash
npm install
```

3. Utwórz plik `.env.local` i dodaj:

```env
BACKEND_API_URL=http://localhost:3000/api
```

4. Uruchom aplikację:

```bash
npm run dev -- -p 3001
```

Aplikacja będzie dostępna pod adresem:

http://localhost:3001

Do działania wymagany jest uruchomiony backend NestJS na porcie 3000.

## Funkcjonalności

- **Rejestracja** (`/register`) – formularz rejestracji nauczyciela z walidacją danych.
- **Logowanie** (`/login`) – logowanie za pomocą adresu e-mail i hasła.
- **Weryfikacja e-mail** (`/weryfikacja-email`) – aktywacja konta za pomocą linku.
- **Ponowna weryfikacja** – możliwość ponownego wysłania linku aktywacyjnego.
- **Panel nauczyciela** (`/dashboard`) – wyświetlanie danych zalogowanego użytkownika.
- **Wylogowanie** – zakończenie sesji użytkownika.

Aplikacja obsługuje komunikaty błędów oraz uwierzytelnianie za pomocą JWT.

## Integracja z backendem

Frontend korzysta z następujących endpointów:

| Metoda | Endpoint | Opis |
|---|---|---|
| POST | `/api/auth/register` | Rejestracja |
| POST | `/api/auth/login` | Logowanie |
| POST | `/api/auth/verify-email` | Aktywacja konta |
| POST | `/api/auth/resend-verification` | Ponowna weryfikacja |
| GET | `/api/auth/me` | Dane użytkownika |
| POST | `/api/auth/logout` | Wylogowanie (Next.js) |

Token JWT jest przechowywany w ciasteczku `HttpOnly`.

## Testowanie

Podczas lokalnego testowania link aktywacyjny można znaleźć w terminalu backendu NestJS, jeśli wysyłanie e-maili nie jest skonfigurowane.

Po otwarciu linku można aktywować konto, zalogować się i przejść do panelu nauczyciela.

## Struktura projektu

```text
frontend/
├── src/
│   ├── app/
│   │   ├── api/auth/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── register/
│   │   ├── weryfikacja-email/
│   │   ├── globals.css
│   │   └── layout.tsx
│   └── lib/
│       ├── auth-client.ts
│       └── backend.ts
├── package.json
└── next.config.ts
```

## Status projektu

Zaimplementowano rejestrację, logowanie, weryfikację e-mail, obsługę JWT oraz podstawowy panel nauczyciela.

Frontend jest zintegrowany z backendem NestJS.

W kolejnych etapach planowana jest rozbudowa panelu o funkcjonalności związane z obsługą konkursów.
