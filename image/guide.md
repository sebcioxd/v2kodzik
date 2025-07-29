# Przewodnik Konfiguracji Obrazu Dockera PostgreSQL z SSL

## Wymagania wstępne
- Docker zainstalowany na lokalnej maszynie
- Railway account
- Git (opcjonalnie)

## Konfiguracja lokalna i wdrażanie obrazu Docker

### 1. Docker Login
Najpierw uwierzytelnij się w rejestrze Docker:
```bash
docker login
```

### 2. Zbuduj obraz Dockera
Przejdź do katalogu zawierającego Dockerfile i zbuduj obraz:
```bash
docker build -t yourusername/postgres-extensions:latest .
```

### 3. Oznacz obraz Dockera
Oznacz swój obraz zgodnie z rejestrem:
```bash
docker tag your-image-name your-registry/your-image-name:latest
```

### 4. Wypchnij do rejestru Docker
Wypchnij oznaczony obraz do rejestru:
```bash
docker push yourusername/postgres-extensions:latest
```

## Konfiguracja Railway

### 1. Konfiguracja wolumenu
Przed skonfigurowaniem zmiennych środowiskowych, kluczowe jest dołączenie trwałego wolumenu:

1. Przejdź do ustawień projektu Railway
2. Przejdź do sekcji "Volumes"
3. Kliknij "Add Volume"
4. Skonfiguruj wolumin:
   - Ścieżka montowania: `/var/lib/postgresql/data`
   - Rozmiar: Wybierz według potrzeb (np. 10GB)
5. Zapisz konfigurację wolumenu

To zapewnia, że dane PostgreSQL będą zachowane między wdrożeniami i restartami.

### 2. Zmienne środowiskowe
Ustaw następujące zmienne środowiskowe w swoim projekcie Railway:

```env
DATABASE_PUBLIC_URL="postgresql://${{PGUSER}}:${{POSTGRES_PASSWORD}}@${{RAILWAY_TCP_PROXY_DOMAIN}}:${{RAILWAY_TCP_PROXY_PORT}}/${{PGDATABASE}}"
DATABASE_URL="postgresql://${{PGUSER}}:${{POSTGRES_PASSWORD}}@${{RAILWAY_PRIVATE_DOMAIN}}:5432/${{PGDATABASE}}"
PGDATABASE="${{POSTGRES_DB}}"
PGDATA="/var/lib/postgresql/data/pgdata"
PGHOST="${{RAILWAY_PRIVATE_DOMAIN}}"
PGPASSWORD="SECURE_PASSWORD"
PGPORT="5432"
PGUSER="${{POSTGRES_USER}}"
POSTGRES_DB="railway"
POSTGRES_PASSWORD="SECURE_PASSWORD"
POSTGRES_USER="postgres"
RAILWAY_DEPLOYMENT_DRAINING_SECONDS="60"
SSL_CERT_DAYS="820"
```

### 3. Konfiguracja proxy TCP
1. Przejdź do ustawień projektu Railway
2. Przejdź do sekcji "TCP Proxy"
3. Kliknij "Enable TCP Proxy"
4. Dodaj nową regułę proxy:
   - Port źródłowy: 5432
   - Port docelowy: 5432

### 4. Weryfikacja wdrożenia
Po skonfigurowaniu wolumenu, zmiennych środowiskowych i proxy TCP:
1. Railway automatycznie wykryje Dockerfile i zbuduje usługę
2. Monitoruj logi wdrożenia, aby upewnić się o pomyślnym uruchomieniu
3. Instancja PostgreSQL będzie dostępna zarówno przez prywatne, jak i publiczne URL-e skonfigurowane w zmiennych środowiskowych
4. Sprawdź, czy wolumin jest prawidłowo zamontowany, sprawdzając logi inicjalizacji bazy danych

## Dodatkowe informacje
- Obraz zawiera PostgreSQL 16 z obsługą SSL
- Zainstalowane dodatkowe rozszerzenia: `postgresql-16-cron` i `postgresql-16-http`
- `pg_cron` jest skonfigurowany do działania na bazie danych `postgres`
- Certyfikaty SSL będą ważne przez 820 dni, jak określono w zmiennych środowiskowych
- Dane są przechowywane w zamontowanym wolumenie w `/var/lib/postgresql/data`

## Względy bezpieczeństwa
- Zachowaj bezpieczeństwo i unikalność `POSTGRES_PASSWORD`
- Używaj prywatnych URL-i dla usług wewnętrznych
- Publiczne URL-e powinny być używane tylko gdy wymagany jest dostęp zewnętrzny
- Rozważ wdrożenie dodatkowych reguł zapory sieciowej w razie potrzeby
- Regularnie wykonuj kopie zapasowe danych wolumenu

## Rozwiązywanie problemów
Jeśli napotkasz problemy:
1. Sprawdź logi wdrożenia Railway
2. Zweryfikuj, czy wszystkie zmienne środowiskowe są poprawnie ustawione
3. Upewnij się, że proxy TCP jest prawidłowo skonfigurowane
4. Potwierdź, że twój obraz Docker został pomyślnie zbudowany i wypchnięty
5. Sprawdź status montowania wolumenu i uprawnienia
6. Jeśli baza danych nie uruchamia się, sprawdź montowanie wolumenu i ścieżkę PGDATA
