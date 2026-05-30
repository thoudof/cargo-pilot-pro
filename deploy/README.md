# Развёртывание Fix Logistics на собственном VPS в России

Полностью автономное развёртывание: PostgreSQL + Supabase-стек (Auth, REST, Realtime, Storage, Edge Functions) + фронтенд под Nginx, без зависимости от Lovable Cloud и зарубежных сервисов.

## TL;DR

```bash
git clone <repo> /opt/fix-logistics && cd /opt/fix-logistics/deploy
./scripts/generate-keys.sh > .env.secrets
cat .env.example .env.secrets > .env       # отредактируй домены, SMTP
docker compose up -d db                    # 1) сначала только БД
SOURCE_DB_URL='postgres://...' ./scripts/migrate-from-cloud.sh   # 2) перенос данных
cd .. && npm ci && npm run build           # 3) сборка фронта
cd deploy && docker compose up -d          # 4) поднимаем всё
sudo cp nginx/host-nginx.example.conf /etc/nginx/sites-available/fix-logistics
sudo ln -s ../sites-available/fix-logistics /etc/nginx/sites-enabled/
sudo certbot --nginx -d app.example.ru -d api.example.ru
```

После этого приложение доступно на `https://app.example.ru`, API — на `https://api.example.ru`.

---

## Архитектура

```
                         ┌───────────────────────────────────────┐
        Browser ────────►│  Nginx на хосте (SSL, certbot)        │
                         │                                       │
                         │   app.example.ru → 127.0.0.1:8080 ────┼──► nginx-контейнер (web)
                         │                                        │     └─ /opt/.../dist (Vite build)
                         │   api.example.ru → 127.0.0.1:8000 ────┼──► kong (API gateway)
                         └───────────────────────────────────────┘            │
                                                                              ▼
                  ┌───────────────────────────────────────────────────────────────────┐
                  │  /auth/v1   → gotrue        (JWT, email/password, magic links)    │
                  │  /rest/v1   → postgrest     (CRUD + RLS поверх public.*)          │
                  │  /realtime  → realtime      (websocket, postgres_changes)         │
                  │  /storage   → storage-api   (бакеты documents, avatars + imgproxy)│
                  │  /functions → edge-runtime  (deno, supabase/functions/*)          │
                  └───────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
                              ┌───────────────────────────────────┐
                              │  PostgreSQL 15 (supabase/postgres)│
                              │  схемы: public, auth, storage,    │
                              │         realtime, extensions      │
                              └───────────────────────────────────┘
```

Фронтенд (тот же React-код) использует `@supabase/supabase-js`, который смотрит на `api.example.ru`. Никаких изменений в коде приложения **не требуется** — RLS, auth, storage, realtime, edge-функции работают как в Cloud.

---

## 1. Подготовка VPS

**Минимум:** 4 vCPU, 8 ГБ RAM, 80 ГБ SSD. Ubuntu 22.04 LTS.

Рекомендуемые российские провайдеры: Selectel, Timeweb Cloud, VK Cloud, Yandex Cloud, REG.RU. Регистрация ФЗ-152 (персданные) → выбирайте провайдера с подтверждённой обработкой ПДн в РФ.

### Базовая настройка

```bash
# Обновление + утилиты
apt update && apt -y upgrade
apt -y install ca-certificates curl gnupg ufw fail2ban jq certbot python3-certbot-nginx nginx

# Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt update && apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

### Пользователь и каталог

```bash
useradd -m -s /bin/bash -G docker logistics
mkdir -p /opt/fix-logistics
chown logistics:logistics /opt/fix-logistics
su - logistics
```

---

## 2. Получение кода

```bash
cd /opt/fix-logistics
git clone <ваш-репозиторий> .
cd deploy
```

---

## 3. Генерация секретов и конфигурация

```bash
./scripts/generate-keys.sh > .env.secrets
cp .env.example .env
# Склей: значения из .env.secrets имеют приоритет
cat .env.secrets >> .env

nano .env
```

Обязательно отредактируй:

| Переменная | Что туда |
|---|---|
| `API_EXTERNAL_URL` | `https://api.example.ru` |
| `SITE_URL` | `https://app.example.ru` |
| `ADDITIONAL_REDIRECT_URLS` | `https://app.example.ru` |
| `SMTP_*` | Yandex 360 / Mail.ru для бизнеса |
| `DASHBOARD_USERNAME/PASSWORD` | для Supabase Studio |
| `TELEGRAM_BOT_TOKEN`, `VAPID_*` | если используешь уведомления |
| `LOVABLE_API_KEY` | для финансовой AI-аналитики (Gemini) |

`POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `SECRET_KEY_BASE` уже сгенерированы скриптом.

---

## 4. Поднимаем БД и переносим данные

```bash
docker compose up -d db
docker compose logs -f db    # дождись "database system is ready"
```

### Перенос из Lovable Cloud

Возьми connection string в Lovable Cloud → Backend → Database → "Connection string (URI)".

```bash
export SOURCE_DB_URL='postgres://postgres.PROJECT:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
./scripts/migrate-from-cloud.sh
```

Перенесёт:
- всю схему `public` (таблицы, RLS, функции, триггеры, enum-ы)
- пользователей `auth.users` (с хешами паролей — логины продолжат работать)
- метаданные файлов `storage.objects`

### Перенос файлов из бакетов

```bash
export SOURCE_URL='https://vwrtlbosqtozrloaqisd.supabase.co'
export SOURCE_SERVICE_KEY='<service_role key из Cloud, не из нового!>'
./scripts/migrate-storage.sh
```

> Для крупных бакетов (>10 000 файлов) лучше использовать `rclone` с remote `s3` к Cloud, либо снять напрямую через pg-копию.

---

## 5. Сборка фронтенда

Фронт должен указывать на новый API. Создай `.env.production` в корне репозитория:

```bash
cd /opt/fix-logistics
cat > .env.production <<EOF
VITE_SUPABASE_URL=https://api.example.ru
VITE_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY из deploy/.env>
VITE_SUPABASE_PROJECT_ID=self-hosted
EOF

npm ci
npm run build
```

Результат — папка `dist/`, её монтирует контейнер `web` (см. docker-compose.yml).

---

## 6. Запускаем весь стек

```bash
cd /opt/fix-logistics/deploy
docker compose up -d
docker compose ps   # все должны быть "running"
docker compose logs --tail=50 kong auth rest storage
```

Проверка:
```bash
curl http://localhost:8000/rest/v1/ -H "apikey: $ANON_KEY"
curl http://localhost:8080         # должен отдать index.html
```

---

## 7. Nginx + SSL на хосте

```bash
sudo cp deploy/nginx/host-nginx.example.conf /etc/nginx/sites-available/fix-logistics
sudo nano /etc/nginx/sites-available/fix-logistics    # подставь свои домены
sudo ln -s /etc/nginx/sites-available/fix-logistics /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d app.example.ru -d api.example.ru
```

DNS: A-записи `app` и `api` → IP VPS.

---

## 8. Бэкапы

```bash
sudo mkdir -p /var/backups/fix-logistics
( crontab -l 2>/dev/null; echo "0 3 * * * cd /opt/fix-logistics/deploy && ./scripts/backup.sh >> /var/log/fix-backup.log 2>&1" ) | crontab -
```

Делает дамп БД + tar storage ежедневно в 03:00, хранит 14 дней. Рекомендую дополнительно копировать `/var/backups/fix-logistics` на S3-совместимое хранилище (Selectel S3, VK Cloud Object Storage).

Восстановление:
```bash
gunzip -c /var/backups/fix-logistics/<TS>/db.dump.gz | docker exec -i fix-logistics-db-1 pg_restore -U postgres -d postgres --clean --if-exists
tar -xzf /var/backups/fix-logistics/<TS>/storage.tar.gz -C ./supabase/volumes/
```

---

## 9. Обновление приложения

```bash
cd /opt/fix-logistics
git pull
npm ci && npm run build

cd deploy
# применить новые миграции (если есть) — выполни supabase/migrations/*.sql вручную через psql
for f in ../supabase/migrations/$(date +%Y)*.sql; do
  docker exec -i fix-logistics-db-1 psql -U postgres -d postgres -f - < "$f"
done

docker compose restart functions web
```

---

## 10. Supabase Studio (опционально)

Подключение к админке:
```bash
ssh -L 3001:127.0.0.1:3001 user@vps
# затем в браузере http://localhost:3001
```
Логин/пароль — из `DASHBOARD_USERNAME/PASSWORD`.

---

## Решение типовых проблем

| Симптом | Причина | Решение |
|---|---|---|
| `Invalid JWT` во фронте | `VITE_SUPABASE_PUBLISHABLE_KEY` не совпадает с `ANON_KEY` | Пересобрать `dist` с правильным ключом |
| `401` от `/rest/v1/...` | Не передан `apikey` в Kong | Проверь `client.ts` — должно быть `createClient(URL, ANON_KEY)` |
| Realtime не подключается | Nginx режет websocket | Проверь `Upgrade` header в host-nginx.conf |
| `auth.users` мигрировал, а войти нельзя | Не совпадает `JWT_SECRET` | Cloud использует свой секрет; пользователи могут залогиниться (пароли валидны), но старые JWT станут недействительны — это норма |
| Edge function 404 | Не подмонтировались | Проверь `../supabase/functions:/home/deno/functions` в compose |
| Файлы 404 после миграции | Не скачаны из бакета | Запусти `migrate-storage.sh` |

---

## Безопасность

- БД доступна только на `127.0.0.1` — наружу не торчит.
- Все секреты в `.env` — добавь его в `.gitignore` (уже есть).
- `service_role` ключ **никогда** не должен попасть на фронт.
- Включи `fail2ban` для SSH и Nginx.
- Регулярно обновляй образы: `docker compose pull && docker compose up -d`.
- TLS 1.2+ принудительно (см. host-nginx.example.conf).

---

## Что осталось от Lovable

Ничего. После переключения `VITE_SUPABASE_URL` на `api.example.ru` приложение полностью независимо. Lovable можно использовать как dev-окружение, а в prod катать с этого VPS.
