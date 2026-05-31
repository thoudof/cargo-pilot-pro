# Развёртывание Fix Logistics на собственном VPS в России — подробная инструкция

Полностью автономное развёртывание: PostgreSQL + Supabase-стек (Auth, REST, Realtime, Storage, Edge Functions) + фронтенд под Nginx, без зависимости от Lovable Cloud и зарубежных сервисов.

Инструкция написана так, чтобы её мог пройти человек, который **впервые** видит Docker и Linux. Каждая команда сопровождается комментарием: что она делает, что должна вернуть и где брать значения для подстановки.

---

## Содержание

0. [Что вам понадобится перед началом](#0-что-вам-понадобится-перед-началом)
1. [Подготовка VPS](#1-подготовка-vps)
2. [Получение кода проекта](#2-получение-кода-проекта)
3. [Генерация секретов](#3-генерация-секретов)
4. [Заполнение `.env` — построчно](#4-заполнение-env--построчно)
5. [Запуск БД и перенос данных из Lovable Cloud](#5-запуск-бд-и-перенос-данных-из-lovable-cloud)
6. [Перенос файлов из Storage](#6-перенос-файлов-из-storage)
7. [Сборка фронтенда с новыми ключами](#7-сборка-фронтенда-с-новыми-ключами)
8. [Запуск всего стека](#8-запуск-всего-стека)
9. [DNS, Nginx и SSL-сертификаты](#9-dns-nginx-и-ssl-сертификаты)
10. [Бэкапы](#10-бэкапы)
11. [Обновление приложения](#11-обновление-приложения)
12. [Доступ к Supabase Studio (админка БД)](#12-доступ-к-supabase-studio-админка-бд)
13. [Решение типовых проблем (FAQ)](#13-решение-типовых-проблем-faq)
14. [Чек-лист безопасности](#14-чек-лист-безопасности)

---

## Архитектура

Краткая картинка, чтобы вы понимали, что куда ходит:

```
                          ┌───────────────────────────────────────┐
        Browser ─────────►│  Nginx на ХОСТЕ (SSL, certbot)        │
                          │                                       │
                          │   app.example.ru  → 127.0.0.1:8080 ───┼──► контейнер web (Nginx + dist/)
                          │   api.example.ru  → 127.0.0.1:8000 ───┼──► контейнер kong (API gateway)
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

Фронтенд (тот же React-код) использует `@supabase/supabase-js`, который смотрит на `api.example.ru`. Никаких изменений в коде приложения **не требуется** — RLS, auth, storage, realtime и edge-функции работают как в Cloud.

---

## 0. Что вам понадобится перед началом

Подготовьте заранее, чтобы не прерываться:

| Что | Где взять | Зачем |
|---|---|---|
| **VPS** в РФ, Ubuntu 22.04 LTS, ≥4 vCPU / 8 GB RAM / 80 GB SSD | Selectel, Timeweb Cloud, VK Cloud, Yandex Cloud, REG.RU | Сервер для всего стека |
| **Публичный IP** этого VPS | В панели провайдера, обычно показан сразу | Привязка домена |
| **2 поддомена**, напр. `app.example.ru` и `api.example.ru` | Любой регистратор (REG.RU, RU-Center, beget) | Адрес приложения и API |
| **Доступ к DNS** этого домена | Панель регистратора | Сделать A-записи на IP VPS |
| **SMTP-аккаунт** (Yandex 360 / Mail.ru для бизнеса / Beget Mail) | Регистрация у провайдера | Письма подтверждения email и сброса пароля |
| **Connection string** текущего Cloud-проекта | Lovable Cloud → Backend → Database → "Connection string (URI)" | Перенос данных |
| **service_role key** текущего Cloud-проекта | Lovable Cloud → Backend → API → Project API keys → `service_role` (secret) | Скачивание файлов из Storage |
| **Доступ по SSH** на VPS под root (или sudo) | Провайдер высылает после создания | Установка всего |

> Замените в командах ниже `app.example.ru` и `api.example.ru` на ваши реальные поддомены.

---

## 1. Подготовка VPS

Подключитесь по SSH:
```bash
ssh root@<IP_вашего_VPS>
```

### 1.1 Обновление и базовые утилиты

```bash
# Обновляем индекс пакетов и сами пакеты
apt update && apt -y upgrade

# Утилиты: curl/gpg для добавления репозиториев Docker,
# ufw — firewall, fail2ban — защита SSH от перебора,
# jq — парсинг JSON в скриптах миграции,
# certbot — Let's Encrypt SSL, nginx — реверс-прокси на хосте
apt -y install ca-certificates curl gnupg ufw fail2ban jq \
               certbot python3-certbot-nginx nginx \
               git nodejs npm
```

> Если `nodejs` ниже 18 — поставьте новее через nvm или `apt install nodejs npm` из репозитория NodeSource. Нужен Node 18+ для сборки фронта.

### 1.2 Установка Docker

```bash
# Ключ репозитория Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Сам репозиторий
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list

apt update
apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Проверка
docker --version           # должно быть Docker version 24+ или 27+
docker compose version     # Docker Compose version v2.x
```

### 1.3 Firewall

Откроем только SSH и веб-порты (80/443). Всё остальное — закрыто.

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'    # 80 + 443
ufw --force enable
ufw status                # должно быть active + правила выше
```

> **БД (5432) и Kong (8000) наружу не торчат** — они слушают только `127.0.0.1`. Доступ к ним идёт через Nginx на хосте.

### 1.4 Отдельный пользователь

Не работать же из-под root:

```bash
useradd -m -s /bin/bash -G docker logistics   # добавляем в группу docker, чтобы запускать docker без sudo
passwd logistics                              # задайте пароль
mkdir -p /opt/fix-logistics
chown logistics:logistics /opt/fix-logistics
su - logistics                                # переключились
```

Дальше все команды — от пользователя `logistics` (если не указано иное).

---

## 2. Получение кода проекта

```bash
cd /opt/fix-logistics
git clone <URL_вашего_GitHub_репозитория> .   # точка в конце = в текущую папку
ls                                            # должны быть: src/, supabase/, deploy/, package.json и т.д.
cd deploy
```

> Если репозиторий приватный — настройте SSH-ключ или GitHub Personal Access Token.

---

## 3. Генерация секретов

Скрипт `generate-keys.sh` создаст случайные значения для:
- `POSTGRES_PASSWORD` — пароль БД
- `JWT_SECRET` — секрет подписи JWT (для auth)
- `ANON_KEY`, `SERVICE_ROLE_KEY` — публичный и админский ключи API (это JWT, подписанные `JWT_SECRET`)
- `SECRET_KEY_BASE` — секрет для Realtime
- `DASHBOARD_PASSWORD` — пароль для Supabase Studio

```bash
cd /opt/fix-logistics/deploy
chmod +x scripts/*.sh                        # на всякий случай делаем исполняемыми
./scripts/generate-keys.sh > .env.secrets
cat .env.secrets                             # посмотрите, что получилось
```

Сохраните `.env.secrets` себе локально (на всякий) — это **единственное** место, где видны эти значения в открытом виде. Дальше они уйдут в `.env` и в БД.

> **Не теряйте `JWT_SECRET`** — если он сменится, все старые JWT-токены (включая сессии пользователей) станут недействительны.

---

## 4. Заполнение `.env` — построчно

```bash
cp .env.example .env
cat .env.secrets >> .env       # дописываем сгенерированные секреты в конец
nano .env                      # редактируем
```

Ниже — что **обязательно** изменить. Слева — переменная, справа — что подставить и где взять.

### 4.1 PostgreSQL

| Переменная | Значение | Откуда |
|---|---|---|
| `POSTGRES_PASSWORD` | (уже подставлено `generate-keys.sh`) | автогенерация |
| `POSTGRES_DB` | `postgres` | оставить как есть |
| `POSTGRES_PORT` | `5432` | оставить как есть |

### 4.2 JWT и ключи

Все четыре значения уже подставлены `generate-keys.sh`. Проверьте, что они есть:
- `JWT_SECRET` — 48 символов
- `JWT_EXPIRY` — `3600` (1 час, оставить)
- `ANON_KEY` — длинный JWT, начинается с `eyJ`
- `SERVICE_ROLE_KEY` — длинный JWT, начинается с `eyJ`
- `SECRET_KEY_BASE` — 64 символа

### 4.3 Внешние URL — **ОБЯЗАТЕЛЬНО ИЗМЕНИТЬ**

```env
API_EXTERNAL_URL=https://api.example.ru    # ← ваш поддомен для API
SITE_URL=https://app.example.ru            # ← ваш поддомен для приложения
ADDITIONAL_REDIRECT_URLS=https://app.example.ru
```

> `API_EXTERNAL_URL` пойдёт в `VITE_SUPABASE_URL` фронта.
> `SITE_URL` используется в ссылках email-писем подтверждения.

### 4.4 SMTP — **ОБЯЗАТЕЛЬНО ИЗМЕНИТЬ**

Без рабочего SMTP пользователи не смогут подтвердить email и сбросить пароль.

Пример для **Yandex 360 для бизнеса** (`smtp.yandex.ru`, порт 465, SSL):

```env
SMTP_ADMIN_EMAIL=admin@example.ru          # ← ваш email (для системных уведомлений GoTrue)
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=noreply@example.ru               # ← логин в Yandex 360
SMTP_PASS=пароль_приложения                # ← НЕ обычный пароль! Создайте "пароль приложения" в Yandex ID → Безопасность
SMTP_SENDER_NAME=Fix Logistics
```

Альтернативы:
- **Mail.ru для бизнеса**: `smtp.mail.ru:465`, тоже нужен пароль приложения
- **Beget Mail**: `smtp.beget.com:465`

### 4.5 Studio (админка БД)

```env
DASHBOARD_USERNAME=admin                   # ← придумайте логин
DASHBOARD_PASSWORD=...                     # ← уже подставлено generate-keys.sh
```

### 4.6 Секреты edge-функций

Заполняйте только если используете соответствующую функциональность:

| Переменная | Где взять |
|---|---|
| `LOVABLE_API_KEY` | Lovable AI Gateway — нужно, если используете финансовую AI-аналитику (Gemini). Можно оставить пустым → AI-аналитика просто не будет работать |
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) → `/newbot` → токен вида `12345:AAA...` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Сгенерируйте: `npx web-push generate-vapid-keys` |

> Если оставите пустыми — push-уведомления и Telegram-бот просто не будут работать, на основной функционал не влияет.

### 4.7 Порты (обычно не трогать)

```env
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443
WEB_HTTP_PORT=8080
```

Сохраните файл: `Ctrl+O`, `Enter`, `Ctrl+X`.

---

## 5. Запуск БД и перенос данных из Lovable Cloud

### 5.1 Поднимаем только БД (без остальных сервисов)

```bash
cd /opt/fix-logistics/deploy
docker compose up -d db                    # -d = в фоне
docker compose logs -f db                  # смотрим логи, ждём "database system is ready to accept connections"
# Ctrl+C чтобы выйти из просмотра логов (контейнер останется работать)
```

Проверка:
```bash
docker compose ps                          # db должен быть Up (healthy)
docker exec -it fix-logistics-db-1 psql -U postgres -c '\l'   # список БД, должна быть postgres
```

### 5.2 Получите connection string из Lovable Cloud

1. Откройте проект в Lovable
2. Backend (раздел Cloud) → **Database** → **Connection string** → вкладка **URI**
3. Скопируйте строку вида:
   ```
   postgres://postgres.vwrtlbosqtozrloaqisd:ВАШ_ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```
4. Замените `[YOUR-PASSWORD]` на реальный пароль БД (его можно посмотреть/сбросить там же)

### 5.3 Запускаем перенос

```bash
export SOURCE_DB_URL='postgres://postgres.vwrtlbosqtozrloaqisd:ВАШ_ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
./scripts/migrate-from-cloud.sh
```

Скрипт:
1. Сделает дамп схемы `public` (все таблицы, RLS-политики, функции, триггеры, enum-ы) в `./dumps/<timestamp>/public.sql`
2. Сделает дамп `auth.users`, `auth.identities` и MFA-таблиц (с **хешами паролей** — логины продолжат работать!)
3. Сделает дамп `storage.buckets` и `storage.objects` (метаданные файлов — без самих файлов)
4. Применит всё это к локальной БД

Что должно вывестись в конце:
```
✅ База перенесена.
Осталось скопировать сами файлы из бакетов...
```

Если что-то упало — смотрите `./dumps/<timestamp>/` (там сохранились SQL-дампы) и применяйте вручную через `psql`.

### 5.4 Проверка

```bash
docker exec -it fix-logistics-db-1 psql -U postgres -d postgres -c \
  "SELECT count(*) FROM auth.users;"
docker exec -it fix-logistics-db-1 psql -U postgres -d postgres -c \
  "SELECT count(*) FROM public.trips;"
```
Цифры должны совпадать с тем, что было в Cloud.

---

## 6. Перенос файлов из Storage

База перенесена, но сами файлы (PDF документов, аватарки) пока лежат в Cloud. Скачиваем их.

### 6.1 Получите `service_role` ключ Cloud-проекта

Lovable Cloud → Backend → **API** → **Project API keys** → **`service_role`** (рядом будет надпись `secret`). Скопируйте.

> ⚠️ Это **админский** ключ Cloud-проекта. Никогда не коммитьте его в git и не выкладывайте на фронт.

### 6.2 Запускаем скачивание

```bash
export SOURCE_URL='https://vwrtlbosqtozrloaqisd.supabase.co'    # из старого .env, поле VITE_SUPABASE_URL
export SOURCE_SERVICE_KEY='eyJhbGciOi...сюда_service_role_ключ_Cloud...'
./scripts/migrate-storage.sh
```

Скрипт пройдёт по бакетам `documents` и `avatars` и сложит файлы в:
```
deploy/supabase/volumes/storage/stub/documents/...
deploy/supabase/volumes/storage/stub/avatars/...
```

Проверка:
```bash
ls deploy/supabase/volumes/storage/stub/documents/ | head
du -sh deploy/supabase/volumes/storage/stub/
```

> Для бакетов с тысячами файлов скрипт может работать медленно. Альтернатива: `rclone` с remote типа `s3` (Supabase Storage = совместимый S3) или прямой `scp` дампа.

---

## 7. Сборка фронтенда с новыми ключами

Фронт должен указывать на новый API. Создайте отдельный файл `.env.production` в **корне репозитория** (не в `deploy/`!):

```bash
cd /opt/fix-logistics
cat > .env.production <<EOF
VITE_SUPABASE_URL=https://api.example.ru
VITE_SUPABASE_PUBLISHABLE_KEY=ВСТАВЬТЕ_СЮДА_ANON_KEY_из_deploy/.env
VITE_SUPABASE_PROJECT_ID=self-hosted
EOF
```

Где взять `ANON_KEY`:
```bash
grep '^ANON_KEY=' deploy/.env
```

> `VITE_SUPABASE_PROJECT_ID` может быть любым — он используется только во внутренних логах.

Собираем:
```bash
npm ci          # установка зависимостей строго по lock-файлу
npm run build   # vite build → создаётся папка dist/
ls dist/        # index.html, assets/ — должна появиться
```

> Если `npm ci` падает на `bun.lockb` — удалите его или используйте `bun install && bun run build`.

---

## 8. Запуск всего стека

```bash
cd /opt/fix-logistics/deploy
docker compose up -d            # поднимет все контейнеры: db, auth, rest, realtime, storage, imgproxy, functions, kong, studio, meta, web
docker compose ps               # все должны быть Up (healthy там, где есть healthcheck)
```

Если какой-то контейнер падает в Restarting — смотрите логи:
```bash
docker compose logs --tail=100 <имя_сервиса>
# например:
docker compose logs --tail=100 auth
docker compose logs --tail=100 kong
```

### Локальная проверка (с самого VPS)

```bash
# REST: должен вернуть JSON со списком endpoints или 401 — это норма
curl http://localhost:8000/rest/v1/ -H "apikey: $(grep ^ANON_KEY deploy/.env | cut -d= -f2)"

# Auth: должен вернуть {"version":"..."}
curl http://localhost:8000/auth/v1/health

# Фронт: должен вернуть HTML
curl -s http://localhost:8080 | head -5
```

---

## 9. DNS, Nginx и SSL-сертификаты

### 9.1 DNS-записи

В панели вашего регистратора домена создайте **две A-записи**:

| Host | Type | Value (IP вашего VPS) | TTL |
|---|---|---|---|
| `app` | A | `123.45.67.89` | 300 |
| `api` | A | `123.45.67.89` | 300 |

Проверка (после распространения, обычно 1–15 минут):
```bash
dig +short app.example.ru
dig +short api.example.ru
# обе должны вернуть IP вашего VPS
```

### 9.2 Nginx-конфиг

```bash
sudo cp /opt/fix-logistics/deploy/nginx/host-nginx.example.conf \
        /etc/nginx/sites-available/fix-logistics
sudo nano /etc/nginx/sites-available/fix-logistics
```

В файле замените **все** `app.example.ru` и `api.example.ru` на ваши реальные домены (есть и в `server_name`, и в путях SSL-сертификатов).

Активируем:
```bash
sudo ln -s /etc/nginx/sites-available/fix-logistics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default      # убрать дефолтный сайт, если есть
sudo nginx -t                                    # проверка синтаксиса, должно быть "syntax is ok"
sudo systemctl reload nginx
```

### 9.3 SSL-сертификаты (Let's Encrypt)

```bash
sudo certbot --nginx -d app.example.ru -d api.example.ru
# certbot спросит email и согласие — отвечайте y
# выберет автоматический редирект HTTP → HTTPS — выбирайте опцию 2 (Redirect)
```

Сертификат обновится автоматически (certbot ставит таймер в systemd). Проверка:
```bash
sudo certbot renew --dry-run
```

### 9.4 Финальная проверка

Откройте в браузере: `https://app.example.ru` — должно загрузиться приложение, должна работать авторизация (входите старыми email/паролем из Cloud).

---

## 10. Бэкапы

```bash
sudo mkdir -p /var/backups/fix-logistics
sudo chown logistics:logistics /var/backups/fix-logistics

# Добавляем в crontab пользователя logistics
crontab -e
```

Вставьте строку (ежедневно в 03:00):
```
0 3 * * * cd /opt/fix-logistics/deploy && ./scripts/backup.sh >> /var/log/fix-backup.log 2>&1
```

Скрипт делает:
- `pg_dump` всей БД → `db.dump.gz`
- `tar.gz` папки `supabase/volumes/storage`
- удаляет бэкапы старше 14 дней

**Рекомендуется** дополнительно копировать `/var/backups/fix-logistics` на внешнее хранилище (Selectel S3, VK Cloud Object Storage) через `rclone` — на случай отказа диска VPS.

### Восстановление

```bash
# Восстановить БД
gunzip -c /var/backups/fix-logistics/<TS>/db.dump.gz \
  | docker exec -i fix-logistics-db-1 pg_restore -U postgres -d postgres --clean --if-exists

# Восстановить файлы
tar -xzf /var/backups/fix-logistics/<TS>/storage.tar.gz -C /opt/fix-logistics/deploy/supabase/volumes/
docker compose restart storage
```

---

## 11. Обновление приложения

Когда вы внесли изменения в Lovable и хотите выкатить новую версию:

```bash
cd /opt/fix-logistics
git pull                          # подтягиваем код
npm ci && npm run build           # пересобираем фронт

cd deploy

# Применяем новые миграции, если они появились в supabase/migrations/
# (просто прогоняем все .sql файлы — старые миграции идемпотентны и не сломаются)
for f in ../supabase/migrations/*.sql; do
  echo ">>> $f"
  docker exec -i fix-logistics-db-1 psql -U postgres -d postgres < "$f"
done

# Перезапускаем то, что изменилось
docker compose restart functions web
```

> Если хотите аккуратнее — храните в БД таблицу `schema_migrations` и применяйте только новые файлы. Для начала подойдёт и так — миграции написаны через `IF NOT EXISTS`.

---

## 12. Доступ к Supabase Studio (админка БД)

Studio торчит только на `127.0.0.1:3001` — наружу не выпущена. Доступ через SSH-туннель:

```bash
# На вашем локальном компьютере (не на VPS!):
ssh -L 3001:127.0.0.1:3001 logistics@<IP_VPS>
```

Пока сессия открыта — открывайте в браузере `http://localhost:3001`. Логин/пароль — из `.env` (`DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD`).

---

## 13. Решение типовых проблем (FAQ)

| Симптом | Причина | Решение |
|---|---|---|
| `Invalid JWT` во фронте | `VITE_SUPABASE_PUBLISHABLE_KEY` ≠ `ANON_KEY` из deploy/.env | Пересоберите фронт (`npm run build`) с правильным ключом |
| `401` от `/rest/v1/...` | Не передан `apikey` или ANON_KEY не совпадает | Проверьте `src/integrations/supabase/client.ts` — там должен быть `createClient(URL, ANON_KEY)`; пересоберите фронт |
| Realtime не подключается | Nginx режет websocket | В `/etc/nginx/sites-available/fix-logistics` для `api.example.ru` должны быть строки `proxy_set_header Upgrade $http_upgrade;` и `proxy_set_header Connection "upgrade";` |
| Пользователи перенеслись, а войти не могут | `JWT_SECRET` отличается от Cloud → старые JWT-сессии недействительны | Это норма. Пароли валидны → пользователи могут залогиниться заново |
| Edge function 404 | Папка `supabase/functions` не подмонтировалась | В `docker-compose.yml` проверьте volume у сервиса `functions`: `../supabase/functions:/home/deno/functions` |
| Файлы 404 после миграции | Не скачаны из бакета | Запустите `./scripts/migrate-storage.sh` ещё раз |
| `docker: permission denied` | Пользователь не в группе docker | `sudo usermod -aG docker logistics` и **перелогиньтесь** |
| `certbot` не выпустил сертификат | DNS ещё не распространился или 80 порт занят | `dig app.example.ru`, `sudo lsof -i :80` |
| Контейнер `realtime` в Restarting | Несовпадение `SECRET_KEY_BASE` или короткий ключ | Должно быть ровно 64 символа |
| `pg_dump: error: server version mismatch` | Версии разные | Используйте `pg_dump` из контейнера: `docker run --rm postgres:15 pg_dump ...` |

Сбор всех логов сразу:
```bash
cd /opt/fix-logistics/deploy
docker compose logs --tail=200 > /tmp/all.log
less /tmp/all.log
```

---

## 14. Чек-лист безопасности

- [ ] БД (`5432`) и Kong (`8000`) слушают только `127.0.0.1` (проверить: `ss -tlnp | grep -E '5432|8000'`)
- [ ] Файл `deploy/.env` не закоммичен в git (он в `.gitignore`)
- [ ] `SERVICE_ROLE_KEY` нигде не появляется во фронте (`grep -r SERVICE_ROLE_KEY src/` → пусто)
- [ ] SSH по паролю отключён, только ключи (`PasswordAuthentication no` в `/etc/ssh/sshd_config`)
- [ ] `fail2ban` запущен (`systemctl status fail2ban`)
- [ ] TLS 1.2+ принудительно (в host-nginx.conf уже так)
- [ ] Бэкапы запущены и проверено восстановление на тестовом окружении
- [ ] Образы регулярно обновляются: `docker compose pull && docker compose up -d` (раз в месяц)
- [ ] Studio закрыта от интернета (только SSH-туннель)

---

## Что осталось от Lovable

Ничего. После переключения `VITE_SUPABASE_URL` на `api.example.ru` приложение полностью независимо от Lovable Cloud. Lovable можно продолжать использовать как dev-окружение (редактировать код, тестировать), а в prod катать готовый билд на этот VPS через `git pull && npm run build`.
