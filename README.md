![dajkodzik](https://github.com/user-attachments/assets/4e038145-6be0-4e23-99a9-74fe8c16d3d3)

# dajkodzik.pl — v2

Platforma open-source do przesyłania kodu (wkrótce), oraz załączników z niestandardowymi linkami.

Zbudowana przy użyciu Next.js, Hono, Node.js, Drizzle ORM, PostgreSQL, Amazon S3 i Redis

Całkowicie kompatybilna z Serverless. Brak stałych połączeń w backendzie.

## W planach

- Refactor z Node.js do Deno (Pełen support TypeScript'u)
- Refactor Front-endu, dodanie lepszego supportu TS.
- Zamienienie npm na pnpm w front-endzie.
- Możliwość dodawania również kodu, nie tylko załączania plików

## Contribute (Wesprzyj)

- Projekt jest w pełni open source. Doceniam wszelkie PR.
- Szukam pomocy przy refactorze front-endu
- Back-end jest dobrze wykonany, lecz mogą się pojawiś jakieś małe "przecieki".

## Wymagania

- [Node.js](https://nodejs.org)  
- [pnpm](https://pnpm.io/)  
- Hosting S3 Object Storage ([Amazon](https://aws.amazon.com/s3/), [MinIO](https://min.io/docs/minio/container/index.html), [Hetzner Object Storage](https://www.hetzner.com/storage/object-storage/))
- Hosting PostgreSQL ([Docker](https://hub.docker.com/_/postgres), [Neon](https://neon.com/), [Supabase](https://supabase.com/))
- Hosting Redis ([Redis.io](https://redis.io/), [Docker](https://hub.docker.com/_/redis))
- Cron jobs

## Zmienne środowiskowe

### Backend (`/server`)
[Link do zmiennych środowiskowych dla serwera](https://github.com/sebcioxd/v2kodzik/blob/main/server/.env.example)

### Frontend (`/client`)
[Link do zmiennych środowiskowych dla klienta](https://github.com/sebcioxd/v2kodzik/blob/main/client/.env.local.example)

W każdym projekcie załączone są pliki .env.example

## Szybka instalacja

1. Sklonuj repozytorium
```bash
git clone https://github.com/sebcioxd/dajkodzik-v2.git
cd dajkodzik-v2
```

2. Zainstaluj zależności back-endu
```bash
cd server
pnpm install
```

3. Podłącz wszystkie zmienne środowiskowe (dla serwera i dla klienta)
- Przykłady znajdziecie w `.env.local.example` i `.env.example`

4. Zainicjalizuj schemat bazy danych
```bash
pnpm exec drizzle-kit push # pnpm dlx drizzle-kit push
```

5. Stwórz bucket w kompatybilnym z S3 Object Storage
- Nazwa bucketu: `sharesbucket`
- Bucket może być prywatny

6. Zainstaluj zależności front-endu
```bash
cd ../client
npm install
```

7. Uruchom serwery developerskie
```bash
# W /server
pnpm dev

# W /client
npm run dev
```

## Deploy

### Frontend (Next.js)
- Rekomendowane: Vercel
- Alternatywa: VPS z Coolify/Dokploy

### Backend (Hono + Node.js)
- Serverless: Railway.app, fly.io
- Server VPS: Coolify/Dokploy
- Kompilacja: zalecane użycie Railpack lub Nixpacks

## Czyszczenie storage (Cron)

Endpoint API do uruchomienia czyszczenia:

```javascript
await fetch("https://api.domena.pl/v1/cron", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    key: "CRON_BODY_KEY",
  }),
});
```


**bash**
```bash
curl -s -X POST https://api.domena.pl/v1/cron \
  -H "Content-Type: application/json" \
  -d '{"key": "CRON_BODY_KEY"}'
```

Wystarczy jeden POST do /v1/cron co dobę lub co parę godzin z poprawnym kluczem autoryzacyjnym.

W razie błędów lub pytań, skontaktuj się na [niarde.xyz](https://www.niarde.xyz/)
