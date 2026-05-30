#!/usr/bin/env bash
# Генерирует JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY, SECRET_KEY_BASE и POSTGRES_PASSWORD
# Использование: ./generate-keys.sh > .env.secrets

set -euo pipefail

need() { command -v "$1" >/dev/null 2>&1 || { echo "Нужен $1"; exit 1; }; }
need openssl
need node

JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n=' | head -c 48)
SECRET_KEY_BASE=$(openssl rand -base64 64 | tr -d '\n=' | head -c 64)
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n=/+' | head -c 32)
DASHBOARD_PASSWORD=$(openssl rand -base64 16 | tr -d '\n=/+' | head -c 16)

# JWT генерируем через Node (минимальная зависимость)
generate_jwt() {
  local role=$1
  node -e "
    const crypto = require('crypto');
    const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
    const now = Math.floor(Date.now()/1000);
    const payload = Buffer.from(JSON.stringify({
      role: '$role',
      iss: 'supabase',
      iat: now,
      exp: now + 60*60*24*365*10
    })).toString('base64url');
    const data = header + '.' + payload;
    const sig = crypto.createHmac('sha256','$JWT_SECRET').update(data).digest('base64url');
    process.stdout.write(data + '.' + sig);
  "
}

ANON_KEY=$(generate_jwt anon)
SERVICE_ROLE_KEY=$(generate_jwt service_role)

cat <<EOF
# === Сгенерировано $(date -Iseconds) — вставь в .env ===
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
SECRET_KEY_BASE=$SECRET_KEY_BASE
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD
EOF
