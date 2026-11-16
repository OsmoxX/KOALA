# KOALA

System do obsługi konkursu KOALA (KOmbinatoryka, Algorytmika i LOgika), projekt zespołowy WMI UAM.

| Katalog | Zawartość |
| --- | --- |
| `backend/` | REST API w Nest.js (TypeScript), Prisma, PostgreSQL |
| `frontend/` | Aplikacja w Next.js (React, TypeScript) |
| `docker-compose.yml` | Cały system: baza, backend i frontend |

## Uruchomienie całości (Docker)

Wymagania: Docker z Compose v2.

```bash
docker compose up --build
```

| Usługa | Adres |
| --- | --- |
| Frontend | http://localhost:3001 |
| Backend (API) | http://localhost:3000/api |
| PostgreSQL | `localhost:5433` (użytkownik, hasło i baza: `koala`) |

Backend przy starcie sam stosuje migracje (`prisma migrate deploy`). Dane bazy są w wolumenie `koala-db`, więc przetrwają `docker compose down` (usuwa je dopiero `docker compose down -v`).

Konfiguracja jest opcjonalna: wartości domyślne są w `docker-compose.yml`, a żeby je zmienić (np. `JWT_SECRET` albo `RESEND_API_KEY`), skopiuj `.env.example` do `.env` w katalogu głównym.

Bez `RESEND_API_KEY` e-maile nie są wysyłane, tylko wypisywane w logach backendu. Link aktywacyjny po rejestracji znajdziesz tak:

```bash
docker compose logs backend | grep token=
```

Sprawdzenie API: `curl http://localhost:3000/api/health` zwraca `{"status":"ok","database":"up"}`.

## Praca deweloperska bez Dockera dla aplikacji

Można uruchomić w Dockerze tylko bazę, a backend i frontend lokalnie (Node.js 22+):

```bash
docker compose up -d db       # baza PostgreSQL na localhost:5433
cd backend
cp .env.example .env
npm install                   # instaluje zależności i generuje klienta Prisma
npm run prisma:migrate        # tworzy tabele w bazie
npm run start:dev             # API na http://localhost:3000/api
```

Frontend: [frontend/README.md](frontend/README.md). Szczegóły backendu: [backend/README.md](backend/README.md).
