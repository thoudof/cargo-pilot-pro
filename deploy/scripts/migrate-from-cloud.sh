#!/usr/bin/env bash
# Переносит схему + данные + пользователей из Lovable Cloud в self-hosted Postgres.
#
# Использование:
#   export SOURCE_DB_URL='postgres://postgres.PROJECT_REF:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
#   ./migrate-from-cloud.sh
#
# SOURCE_DB_URL берётся из Lovable Cloud → Backend → Database → Connection string (URI).
# Локальный self-hosted должен быть уже запущен: docker compose up -d db
#
# ВАЖНО: схемы auth, storage переносятся ПОЛНОСТЬЮ (включая пароли).

set -euo pipefail

: "${SOURCE_DB_URL:?Установи SOURCE_DB_URL — connection string из Lovable Cloud}"
TARGET_CONTAINER="${TARGET_CONTAINER:-fix-logistics-db-1}"
DUMP_DIR="${DUMP_DIR:-./dumps/$(date +%Y%m%d-%H%M%S)}"

mkdir -p "$DUMP_DIR"
echo "==> Дампим из Lovable Cloud в $DUMP_DIR"

# 1) Роли (без паролей CLOUD-овских ролей — у нас свои в init/00-roles.sql)
#    Дампим только данные пользователей, не системные роли.

# 2) Схема public + public-данные
pg_dump "$SOURCE_DB_URL" \
  --schema=public \
  --no-owner --no-privileges \
  --quote-all-identifiers \
  -f "$DUMP_DIR/public.sql"

# 3) auth.users (для сохранения пользователей и их паролей)
pg_dump "$SOURCE_DB_URL" \
  --schema=auth \
  --data-only \
  --no-owner --no-privileges \
  --table='auth.users' \
  --table='auth.identities' \
  --table='auth.mfa_factors' \
  --table='auth.mfa_amr_claims' \
  --table='auth.mfa_challenges' \
  -f "$DUMP_DIR/auth-data.sql" || true

# 4) storage.objects (метаданные файлов; сами файлы переносятся отдельно — см. ниже)
pg_dump "$SOURCE_DB_URL" \
  --schema=storage \
  --data-only \
  --no-owner --no-privileges \
  --table='storage.buckets' \
  --table='storage.objects' \
  -f "$DUMP_DIR/storage-data.sql" || true

echo "==> Загружаем в локальный Postgres ($TARGET_CONTAINER)"

# Применяем public-схему (RLS, функции, триггеры включены)
docker exec -i "$TARGET_CONTAINER" psql -U postgres -d postgres < "$DUMP_DIR/public.sql"

# Данные auth
docker exec -i "$TARGET_CONTAINER" psql -U postgres -d postgres < "$DUMP_DIR/auth-data.sql"

# Данные storage (метаданные)
docker exec -i "$TARGET_CONTAINER" psql -U postgres -d postgres < "$DUMP_DIR/storage-data.sql"

cat <<EOF

✅ База перенесена.

Осталось скопировать сами файлы из бакетов (documents, avatars).
Скачай их через Lovable Cloud → Storage и положи в:
   deploy/supabase/volumes/storage/stub/documents/
   deploy/supabase/volumes/storage/stub/avatars/

Либо используй скрипт: ./migrate-storage.sh
EOF
