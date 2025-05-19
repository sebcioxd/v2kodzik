

![logo-small](https://github.com/user-attachments/assets/1eeac40b-9d14-45f3-a751-8afc8dfca023)


# dajkodzik.pl — v2


 Platforma do przesyłania kodu, oraz załączników z niestandardowymi linkami. 

Zbudowana przy użyciu Next.js, Hono, Drizzle ORM, PostgreSQL oraz Supabase. 

---

## 🔧 Wymagania

- [Node.js](https://nodejs.org)  
- [Bun](https://bun.sh/)  
- Dowolny package manager: `npm`, `pnpm`, `yarn`, `bun`  
- Konto i baza danych w [Supabase](https://supabase.com/)  
- Konto w [Railway](https://railway.app/) (lub opcjonalnie serwer VPS z Coolify / Dokploy)

---

## 📁 Zmienne środowiskowe

### Serwer (`/server`)
`DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SITE_URL=
CRON_BODY_KEY=
REDIS_HOST=
REDIS_PORT=
REDIS_USERNAME=
REDIS_PASSWORD=`
### Klient (`/client`)
`API_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=`

## ⚙️ Szybka instalacja (Quick Setup)

1. **Sklonuj repozytorium**

    `git clone https://github.com/sebcioxd/dajkodzik-v2.git`

    `cd dajkodzik-v2`

2. **Zainstaluj zależności back-endu**

    `cd server`

    `npm install # lub bun install`

3. **Zainicjalizuj bazę danych**

    `npx drizzle-kit push`

> Upewnij się, że wszystkie modele są prawidłowo podłączone.

4. **Dodaj bucket do Supabase Storage**

- Nazwa bucketu: `sharebucket`
- Włącz **RLS** i nadaj każdemu użytkownikowi uprawnienia do `INSERT` i `SELECT`

5. **Zainstaluj zależności front-endu**

    `cd ../client`

    `npm install # lub bun install`

6. **Uruchom oba serwery developersko**

    W /server i /client osobno:

    `npm run dev # lub bun dev`

---

## 🚀 Deploy

### Frontend (Next.js)

- ✅ Rekomendowane: [Vercel](https://vercel.com/)
- 💡 Alternatywa: VPS z [Coolify](https://coolify.io/) / [Dokploy](https://dokploy.com/)

### Backend (Next.js API)

- ✅ Railway (Serverless)
- 💡 Alternatywa: VPS + Coolify/Dokploy
- 🧰 Kompilacja: zalecane użycie buildera **Nixpacks**

---

## ⏰ Cron Jobs

### 1. Usuwanie wygasłych rekordów:

```sql
DELETE FROM shares WHERE expires_at < NOW();
```

> Usuwa przeterminowane wpisy z bazy danych.

### 2. Czyszczenie storage (API trigger):

```js 

POST /v1/cron
Content-Type: application/json
{
  "key": "CRON_BODY_KEY"
}
```

> Cron czyszczący wszystkie pliki w storage, które nie mają odpowiednika w bazie danych

### W razie wszelkich błędów, pomocy lub pytań, skontakuj się na [niarde.xyz](https://www.niarde.xyz/)
