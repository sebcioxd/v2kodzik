![dajkodzik](https://github.com/user-attachments/assets/4e038145-6be0-4e23-99a9-74fe8c16d3d3)

# dajkodzik.pl — v2

Platforma open-source do przesyłania kodu, oraz załączników z **niestandardowymi** linkami.

Zbudowana przy użyciu Next.js, Hono, Bun/Node.js, Drizzle ORM, PostgreSQL, Amazon S3 i Redis.

Zero vendor lock-inu - Wszystkie technologie jak najbardziej self-hostable.

Backend używa najnowszych funkcji S3 takich jak **presigned URLs**. Przez co, serwer może wytrzymać naprawdę duże obciążenie 
transferu plików.

Zabezpieczona technologią CAPTCHA **Cloudflare Turnstile**.

Ważniejsze endpointy zabezpieczone **rate-limitem**.

Całkowicie kompatybilna z Serverless. Brak stałych połączeń w backendzie.

## Jak maksymalizujemy szybkość wsyłania plików i kodu? (Bun)

Dajkodzik jest **performance-obssesed**. Jest zbudowany żeby wykorzystać maksimum z nowoczesnych rozwiązań, 
ta platforma jest również szybsza niż 90% na rynku. Jedyne nad czym pracujemy to zwiększenie limitu transferu (Płatności w planach)

1. **Natywne API Bun'a które jest znacznie szybsze niż gotowe biblioteki**
   - Wykorzystujemy wbudowany w **Bun'a klient PostgreSQL**, który jest znacznie szybszy od tradycyjnych sterowników Node.js
   - Korzystamy z **natywnego Bun S3 API** co też zwiększa prędość
   - Natywne hasowanie haseł, kodów, dzięki **Bun Password API**
   - Natywny klient redis przez **Bun RedisClient API** co diamentralnie zwiększa prędkość działania.
2. **Presigned URLs dla S3**
   - Zamiast przesyłać pliki przez nasz serwer, generujemy presigned URLs
   - Pozwala to na bezpośrednie przesyłanie plików do S3, omijając nasz serwer
   - Znacząco zmniejsza obciążenie serwera
   - Umożliwia równoległe przesyłanie wielu plików
3. **Indeksowanie bazy danych**
   - Schemat bazy danych ma już gotowe indeksy, co potrafi zwiększyć szybkość niektórych kwerend o nawet 95%
   - [Schemat zindeksowanej bazy danych](https://github.com/sebcioxd/v2kodzik/blob/main/server/src/db/schema.ts)
4. **Cały serwer posiada jedynie **7** zależności, z czego jedna to samo API.**
   - Dzięki wykorzystaniu natywnym API oferowanym przez Bun'a, minimalizujemy wielkość projektu.
   - [Plik z zależnościami](https://github.com/sebcioxd/v2kodzik/blob/main/server/package.json)


Dzięki tym optymalizacjom, **Dajkodzik** może obsłużyć zaskakująco dużą ilość przesyłanego transferu jak na technologię opartą na JavaScripcie.

## W planach

- Refactor z Node.js do Deno lub Bun'a (Pełen support TypeScript'u) 🟢
- Refactor Front-endu, dodanie lepszego supportu TS.
- Wspieranie płatności aby zwiększyć maksymalny transfer pliku (z 100MB do 2GB).
- Zamienienie npm na pnpm w front-endzie. 🟢
- Możliwość dodawania również kodu, nie tylko załączania plików 🟢

## Contribute (Wesprzyj)

- Projekt jest w pełni open source. Doceniam wszelkie PR.
- Szukam pomocy przy refactorze front-endu
- Back-end jest dobrze wykonany, lecz mogą się pojawiś jakieś małe "przecieki".

## Wymagania

- [Bun 1.2+](https://bun.com/) 
- [Node.js 22+](https://nodejs.org), [pnpm](https://pnpm.io/)  
- S3 API, PostgreSQL, Redis.

## Zmienne środowiskowe

### Backend Bun (`/server`)
[Link do zmiennych środowiskowych dla serwera](https://github.com/sebcioxd/v2kodzik/blob/main/server/.env.example)

### Backend Node (`/__node-server`)
[Link do zmiennych środowiskowych dla serwera](https://github.com/sebcioxd/v2kodzik/blob/main/__node-server/.env.example)

### Frontend (`/client`)
[Link do zmiennych środowiskowych dla klienta](https://github.com/sebcioxd/v2kodzik/blob/main/client/.env.local.example)

W każdym projekcie załączone są pliki **.env.example**

## Szybka instalacja

Wybierz instalację Node czy Bun.

Jeśli chcesz korzystać z Bun'a:
- Usuń folder /__node-server

Jeśli chcesz korzystać z Node'a:
- Usuń folder /server
- Zmień nazwę folderu __node-server na server

Różnice:
Serwer działający na Bun runtime jest o wiele szybszy pod wzgledem szybkosci. Używa on natywnych funkcji PostgreSQL i S3.
Również obsługuję pełen support TypeScriptu.

Node jest zostawiony ze względu na jego stabilność.
Polecamy używać Bun'a.

1. Sklonuj repozytorium
```bash
git clone https://github.com/sebcioxd/dajkodzik-v2.git
cd dajkodzik-v2
```

2. Zainstaluj zależności back-endu
```bash
cd server
bun install lub pnpm install jeśli korzystamy z serwera node
```

3. Podłącz wszystkie zmienne środowiskowe (dla serwera i dla klienta)
- Przykłady znajdziecie w `.env.local.example` i `.env.example`

4. Zainicjalizuj schemat bazy danych
##### Uwaga: Jeśli korzystasz z Bun'a, prawdopodobnie otrzymasz ten komunikat:
> To connect to Postgres database - please install either of 'pg', 'postgres', '@neondatabase/serverless' or '@vercel/postgres' drivers
W tym wypadku, koniecznie jest zainstalowanie drivera dla postgresa (Ponieważ drizzle korzysta z natywnego dla buna, lecz drizzle-kit tego nie obsługuję.)



```bash
Dla bun:
bunx drizzle-kit push
bun i pg

Dla node:
pnpm exec drizzle-kit push # pnpm dlx drizzle-kit push
```


5. Stwórz bucket w kompatybilnym z S3 Object Storage
- Nazwa bucketu: `sharesbucket`
- Bucket powinień być prywatny

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
- Alternatywa: VPS z Dokploy

### Backend (Hono + Bun/Node.js)
- Serverless: Railway.app, fly.io
- Server VPS: Dokploy
- Kompilacja: zalecane użycie Railpack lub Nixpacks

## Czyszczenie miejsca, Edge lub Cron jobs

[Funkcja Edge (działa w środowisku serverless) do czyszczenia serwera S3 i Bazy danych](https://github.com/sebcioxd/v2kodzik/blob/main/server/src/lib/edge.ts)


Jeśli macie możliwość i chcecie mieć szybkie crony bazy danych bez obciążania S3, możecie zainstalować rozszerzenie pg-cron do bazy PostgreSQL.

[Obraz Postgresa z SSL oraz rozszerzeniem pg-cron](https://github.com/sebcioxd/v2kodzik/blob/main/pg_image)

[Funkcje cronowe kompatybilne z schematem bazy danych, gotowe do uruchomienia po instalacji bazy danych](https://github.com/sebcioxd/v2kodzik/blob/main/server/src/lib/cron.ts)

Endpoint API do uruchomienia czyszczenia:

**javascript**
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

Wystarczy jeden POST do /v1/cron co dobę lub co parę godzin z poprawnym kluczem autoryzacyjnym. (Lub wystarczy funkcja Edge)
Nie jest to wymagane, lecz po jakimś czasie aplikacja może być przeciążona ilością danych.
Czyszczyenie może być wykonane nawet manualnie co jakiś czas bo cała logika znajduję się w tym Endpoincie.

Czyści:
- Rekordy w bazie danych (Udostępnienia oraz snippety),
- Miejsce na dysku czyli poprostu udostępnione objekty/pliki
- Wszelkie pliki oraz rekordy "duchy", czyli udostępnienia które zostały w jakikolwiek sposób uszkodzone.

W razie błędów lub pytań, skontaktuj się na [niarde.xyz](https://www.niarde.xyz/)

## Bezpieczeństwo (przy self-hostingu)

### Podstawowa konfiguracja 

- Zablokuj wszystkie nieużywane porty na serwerze
- Pozostaw otwarte tylko niezbędne porty:
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)
  - 8080 (API)

Jeśli używasz self-hosted MinIO, dodaj też 9000 oraz 9001.

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


