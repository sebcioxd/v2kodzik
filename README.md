![logo-small](https://github.com/user-attachments/assets/cbdea055-7bc0-4249-92ed-b9e404c1be88)

# dajkodzik.pl — v2

 Platforma do przesyłania kodu, oraz załączników z niestandardowymi linkami. 

Zbudowana przy użyciu Next.js, Hono, Node.js, Drizzle ORM, PostgreSQL, Amazon S3

**W planach**: Refactor z Node.js do Deno (Pełen support TypeScript'u)

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

```js 

POST /v1/cron
Content-Type: application/json
{
  "key": "CRON_BODY_KEY"
}

```

> Cron czyszczący wszystkie pliki w storage, które nie mają odpowiednika w bazie danych. 
> Każdy cron da sobię radę. Wystarczy jeden POST do /v1/cron co dobę lub co parę godzin.

### W razie wszelkich błędów, pomocy lub pytań, skontakuj się na [niarde.xyz](https://www.niarde.xyz/)
