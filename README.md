![testloga](https://github.com/user-attachments/assets/722b7478-66d8-4988-a7c6-c9e917da11b6)

# dajkodzik.pl — v2

 Platforma do przesyłania kodu, oraz załączników z niestandardowymi linkami. 

Zbudowana przy użyciu Next.js, Hono, Node.js, Drizzle ORM, PostgreSQL, Amazon S3

**W planach**: 

- Refactor z Node.js do Deno (Pełen support TypeScript'u)

- Refactor niektórych plików Front-endu oraz dodanie więcej typów.

- Możliwość dodawania również kodu, nie tylko załączania plików

---

## 🔧 Wymagania

- [Node.js](https://nodejs.org)  
- [pnpm](https://pnpm.io/)  
- Hosting S3 Object Storage (Amazon, MinIO)
- Hosting bazy danych (PostgreSQL)
- Hosting Redis (Do rate-limitowania)
- Cron jobs (prace periodyczne)

---

## 📁 Zmienne środowiskowe

### Serwer (`/server`)
`DATABASE_URL=
ENVIRONMENT
SITE_URL=
CRON_BODY_KEY=
REDIS_HOST=
REDIS_PORT=
REDIS_USERNAME=
REDIS_PASSWORD=
S3_REGION=
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
DOMAIN_WILDCARD=
SMTP_USER=
SMTP_PASS=
`
### Klient (`/client`)
`API_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=
BETTER_AUTH_URL=
NEXT_PUBLIC_BETTER_AUTH_URL=`

## ⚙️ Szybka instalacja (Quick Setup)

1. **Sklonuj repozytorium**

    `git clone https://github.com/sebcioxd/dajkodzik-v2.git`

    `cd dajkodzik-v2`

2. **Zainstaluj zależności back-endu**

    `cd server`

    `pnpm install`

3. **Zainicjalizuj schemat bazy danych**

    `npx drizzle-kit push`

> Upewnij się, że wszystkie modele są prawidłowo podłączone.

4. **Dodaj bucket do Amazon S3 lub MinIO**

- Nazwa bucketu: `sharebucket`
- Bukcet może być prywatny.

5. **Zainstaluj zależności front-endu**

    `cd ../client`

    `npm install`

6. **Uruchom oba serwery developersko**

    W /server:

    `pnpm dev`

    W /client:

    `npm run dev # lub bun dev`

---

## 🚀 Deploy (Hosting)

### Frontend (Next.js)

- ✅ Rekomendowane: [Vercel](https://vercel.com/)
- 💡 Alternatywa: VPS z [Coolify](https://coolify.io/) / [Dokploy](https://dokploy.com/)

### Backend (Hono + Node.js)

- ✅ Serverless: Railway.app, fly.io
- ✅ Server VPS: [Coolify](https://coolify.io/) / [Dokploy](https://dokploy.com/)
- 🧰 Kompilacja: zalecane użycie buildera **Nixpacks**

---

## ⏰ Cron Jobs

### Czyszczenie storage (API trigger):

**javascript**
```js 
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

**pseudokod**
```js
POST /v1/cron
Content-Type: application/json
{
  "key": "CRON_BODY_KEY"
}
```
> Cron czyszczący wszystkie pliki w storage, które nie mają odpowiednika w bazie danych. 
> Każdy cron da sobię radę. Wystarczy jeden POST do /v1/cron co dobę lub co parę godzin. w POST BODY musicie dać poprawny klucz aby chronić się przed nadużyciem

### W razie wszelkich błędów, pomocy lub pytań, skontakuj się na [niarde.xyz](https://www.niarde.xyz/)
