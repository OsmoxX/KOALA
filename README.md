# KOALA

System do obsługi konkursu KOALA (KOmbinatoryka, Algorytmika i LOgika), projekt zespołowy WMI UAM.

| Katalog | Zawartość |
| --- | --- |
| `backend/` | REST API w Nest.js (TypeScript), Prisma, PostgreSQL |
| `docker-compose.yml` | Lokalna baza PostgreSQL do pracy deweloperskiej |

## Szybki start (backend)

Wymagania: Node.js 22+, Docker (albo własny PostgreSQL 16).

```bash
docker compose up -d          # baza PostgreSQL na localhost:5432
cd backend
cp .env.example .env          # uzupełnij sekrety, jeśli trzeba
npm install                   # instaluje zależności i generuje klienta Prisma
npm run prisma:migrate        # tworzy tabele w bazie
npm run start:dev             # API na http://localhost:3000/api
```

Sprawdzenie: `curl http://localhost:3000/api/health` zwraca `{"status":"ok","database":"up"}`.

Szczegóły backendu: [backend/README.md](backend/README.md).
