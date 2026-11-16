# Frontend KOALA (Next.js): build produkcyjny + `next start` na porcie 3001.
FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001

# Bez `-H 0.0.0.0`: z tą flagą Next odrzuca żądania z localhost (403, kontrola origin).
CMD ["npx", "next", "start", "-p", "3001"]
