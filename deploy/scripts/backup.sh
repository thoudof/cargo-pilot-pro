#!/usr/bin/env bash
# Ежедневный бэкап БД + storage. Положить в cron:
#   0 3 * * * /opt/fix-logistics/deploy/scripts/backup.sh >> /var/log/fix-backup.log 2>&1

set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/fix-logistics}"
KEEP_DAYS="${KEEP_DAYS:-14}"
TS=$(date +%Y%m%d-%H%M%S)
DIR="$BACKUP_ROOT/$TS"
mkdir -p "$DIR"

# Дамп БД
docker exec fix-logistics-db-1 pg_dump -U postgres -d postgres -Fc \
  | gzip > "$DIR/db.dump.gz"

# Архив storage
tar -czf "$DIR/storage.tar.gz" -C ./supabase/volumes storage

# Чистка старых бэкапов
find "$BACKUP_ROOT" -maxdepth 1 -type d -mtime +$KEEP_DAYS -exec rm -rf {} +

echo "✅ Бэкап сохранён в $DIR"
