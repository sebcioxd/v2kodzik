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

## Bezpieczeństwo

### Podstawowa konfiguracja (self-hosting)

- Zablokuj wszystkie nieużywane porty na serwerze
- Pozostaw otwarte tylko niezbędne porty:
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)
  - 8080 (API)

### Zalecane praktyki

1. **Ochrona baz danych**
   - Używaj silnych haseł dla PostgreSQL i Redis
   - Skonfiguruj uwierzytelnianie dla Redis
   - Ogranicz dostęp do baz danych tylko z określonych adresów IP (opcjonalne)

2. **Cloudflare**
   - Używaj Cloudflare Proxy do ukrycia rzeczywistego IP serwera
   - Włącz ochronę DDoS/DoS
   - Skonfiguruj Web Application Firewall (WAF)

3. **Środowisko produkcyjne**
   - Używaj wyłącznie połączeń SSL/TLS
   - Łącz się wyłacznie za pomocą połączeń wewnętrznych
   Czyli, np:
      - `External Host` - ❌
      - `Internal Host` - ✔️
   - Dajkodzik za ciebie już implementuje rate-limiting dla ważynch rout'ów, lecz jeśli to potrzebne,
   użyj gotowego rozwiązania też gdzie indziej

### Development lokalny

Dla bezpiecznego połączenia z bazami danych w środowisku developerskim, używaj tunelu SSH:

```bash
ssh -L 5433:localhost:54463 -L 6380:localhost:9443 root@ip-serwera
```

Gdzie:
- `5433` - lokalny port dla PostgreSQL
- `54463` - zdalny port PostgreSQL
- `6380` - lokalny port dla Redis
- `9443` - zdalny port Redis

### Dodatkowe zalecenia

- Regularnie wykonuj kopie zapasowe danych
- Używaj uwierzytelniania dwuskładnikowego (2FA) dla wszystkich kont administracyjnych
- Implementuj system logowania zdarzeń bezpieczeństwa
- Przeprowadzaj regularne audyty bezpieczeństwa


