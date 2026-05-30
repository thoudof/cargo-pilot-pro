#!/usr/bin/env bash
# Скачивает файлы из Storage-бакетов Lovable Cloud и складывает в локальный storage.
#
# Требует:
#   SOURCE_URL          — публичный URL Cloud-проекта (https://xxx.supabase.co)
#   SOURCE_SERVICE_KEY  — service_role key (см. .env)
#   TARGET_DIR          — путь к ./deploy/supabase/volumes/storage/stub
#
# Скачает все объекты из bucket'ов 'documents' и 'avatars'.

set -euo pipefail

: "${SOURCE_URL:?Установи SOURCE_URL}"
: "${SOURCE_SERVICE_KEY:?Установи SOURCE_SERVICE_KEY}"
TARGET_DIR="${TARGET_DIR:-./supabase/volumes/storage/stub}"

mkdir -p "$TARGET_DIR/documents" "$TARGET_DIR/avatars"

download_bucket() {
  local bucket="$1"
  echo "==> $bucket"
  # Получаем плоский список путей через storage API
  # (для крупных бакетов лучше пройтись pg-запросом по storage.objects.name)
  local prefix=""
  local list_url="$SOURCE_URL/storage/v1/object/list/$bucket"
  curl -s -X POST "$list_url" \
    -H "apikey: $SOURCE_SERVICE_KEY" \
    -H "Authorization: Bearer $SOURCE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"prefix\":\"$prefix\",\"limit\":10000}" \
  | jq -r '.[].name' | while read -r path; do
      [ -z "$path" ] && continue
      mkdir -p "$TARGET_DIR/$bucket/$(dirname "$path")"
      curl -s "$SOURCE_URL/storage/v1/object/$bucket/$path" \
        -H "Authorization: Bearer $SOURCE_SERVICE_KEY" \
        -o "$TARGET_DIR/$bucket/$path"
      echo "  ✓ $path"
    done
}

download_bucket documents
download_bucket avatars

echo "✅ Файлы скачаны в $TARGET_DIR"
