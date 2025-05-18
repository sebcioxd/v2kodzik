# dajkodzik.pl version 2

**Wymagania:**
- Node.js i Bun zainstalowany na twoim systemie.
- Dowonly package manager (npm, pnmp, yarn, bun)
- Baza Supabase oraz Konto Railway
- Ewentualnie serwer VPS oraz CMS typu Coolify czy Dokploy.

**Zmienne środowiskowe /envs**

_SERVER_:
`DATABASE_URL,
SUPABASE_URL,
SUPABASE_SERVICE_ROLE_KEY,
SITE_URL,
CRON_BODY_KEY,
REDIS_HOST,
REDIS_PORT,
REDIS_USERNAME,
REDIS_PASSWORD,`

_CLIENT_:
`API_URL,
NEXT_PUBLIC_API_URL,
NEXT_PUBLIC_SITE_URL,`



**Quick Setup**
1. Sklonuj repozytorium
2. Przejdz do /server, uruchom komendę `npm install` aby zainstalować wszystkie wymagane moduły i bilioteki.
3. Zainicjalizuj schemat bazy danych, używając `npx drizzle-kit push`, po uruchomieniu upewnij się że wszystkie modele są prawidłowo podłączone.
4. Dodaj w Supabase Storage nowy bucket o nazwie `sharebucket`, ustaw **RLS** żeby każdy użytkownik mmiał uprawnienia INSERT oraz SELECT. *Opcjonalne.
5. Przejdź do /client, uruchom komendę `npm install` aby zainstalować wszystkie wymagane moduły i bilioteki.
6. Teraz, w obydwu folderach, urucho polecenie `npm run dev` lub `bun dev` i sprawdż czy serwer oraz klient działają (powinno działac przesyłanie, oraz odnajdowanie linków).


**Deploying**
- Front-end (NextJS) polecany jest żeby deployować na Vercelu lub VPS przy użyciu Coolify lub Dokploy.
- Back-end (NextJS) polecany jest żeby deployować na VPS przy użyciu Coolify lub Dokploy, lub rozwiązanie serverless Railway.

*Aby skompilować backend, zalecane jest użycie buildera `Nixpacks`


**Cron jobs**
- Do efektywnego czyszczenia zbędnych plików i bazy danych, potrzebne są dwa cron joby lub jeden jesli mamy 3rd party serwis.
- Polecam do tego użyć Supabase Cron.

1. Pierwszy cron job:
DELETE FROM shares WHERE expires_at < NOW(); 

To jest SQL statement, ktory sprawdza kolumnę expires_at, jeśli jest mniejsza niż NOW(), to zostanie usunięty link.
*Wszystkie pliki z samego storagu nie zostaną usunięte. Zostanie tylko usunięa tableka i powiązane z nią pliki (Cascade)

2. Drugi cron job:
POST request do /v1/cron z body {"key": ""}. CRON_BODY_KEY configurujecie w env vars. Musi on być zgodny z key jaki dajecie do body. 
