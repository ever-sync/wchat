#!/usr/bin/env bash
# Recria toda a infra Supabase (schema + RLS + buckets + edge functions + secrets)
# num projeto novo. Idempotente onde o CLI deixa ser.
#
# Uso:
#   cp scripts/migrate-to-new-supabase.env.example scripts/migrate-to-new-supabase.env
#   # preencha o .env (ref, anon key, db password, secrets)
#   ./scripts/migrate-to-new-supabase.sh
#
# Pode rodar com etapas isoladas:
#   STEP=link ./scripts/migrate-to-new-supabase.sh
#   STEP=db ./scripts/migrate-to-new-supabase.sh
#   STEP=secrets ./scripts/migrate-to-new-supabase.sh
#   STEP=functions ./scripts/migrate-to-new-supabase.sh
#   STEP=verify ./scripts/migrate-to-new-supabase.sh
# Sem STEP, roda todas em sequência.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/scripts/migrate-to-new-supabase.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Não encontrei $ENV_FILE — copie de scripts/migrate-to-new-supabase.env.example e preencha."
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

: "${NEW_PROJECT_REF:?defina NEW_PROJECT_REF}"
: "${NEW_SUPABASE_URL:?defina NEW_SUPABASE_URL}"
: "${NEW_ANON_KEY:?defina NEW_ANON_KEY}"
: "${NEW_DB_PASSWORD:?defina NEW_DB_PASSWORD}"

export SUPABASE_DB_PASSWORD="$NEW_DB_PASSWORD"

STEP="${STEP:-all}"
run_step() { [[ "$STEP" == "all" || "$STEP" == "$1" ]]; }

# ───────────────────────────────────────────── link
if run_step link; then
  echo "▶ link → $NEW_PROJECT_REF"
  cd "$ROOT"
  npx supabase link --project-ref "$NEW_PROJECT_REF"

  echo "▶ atualizando .env do frontend"
  python3 - "$NEW_SUPABASE_URL" "$NEW_ANON_KEY" "$NEW_DB_PASSWORD" <<'PY'
import sys, pathlib
url, anon, pw = sys.argv[1], sys.argv[2], sys.argv[3]
p = pathlib.Path(".env")
kept = []
keys = {"VITE_SUPABASE_URL": url, "VITE_SUPABASE_ANON_KEY": anon, "SUPABASE_DB_PASSWORD": pw}
seen = set()
if p.exists():
    for ln in p.read_text().splitlines():
        k = ln.split("=", 1)[0].strip()
        if k in keys:
            kept.append(f"{k}={keys[k]}")
            seen.add(k)
        else:
            kept.append(ln)
for k, v in keys.items():
    if k not in seen:
        kept.append(f"{k}={v}")
p.write_text("\n".join(kept) + "\n")
PY
fi

# ───────────────────────────────────────────── db push
if run_step db; then
  echo "▶ db push (142 migrations)"
  cd "$ROOT"
  npx supabase db push --linked --yes
fi

# ───────────────────────────────────────────── secrets
if run_step secrets; then
  echo "▶ supabase secrets set"
  cd "$ROOT"

  # Constrói o conjunto a partir das vars não-vazias do .env de migração.
  args=()
  for key in \
    ANTHROPIC_API_KEY \
    OPENAI_API_KEY \
    VOYAGE_API_KEY \
    RESEND_API_KEY \
    N8N_SERVICE_KEY \
    TWILIO_ACCOUNT_SID \
    TWILIO_AUTH_TOKEN \
    TWILIO_NUMBER \
    RECAPTCHA_SECRET_KEY \
    RECAPTCHA_ALLOW_TEST_SECRET \
    IPINFO_TOKEN \
    CRON_SECRET \
    APP_SITE_URL \
    PUBLIC_APP_URL \
    MARKETING_EMAIL_FROM
  do
    val="${!key-}"
    if [[ -n "$val" ]]; then
      args+=("${key}=${val}")
    else
      echo "  ⏭  $key vazio — pulando"
    fi
  done

  if [[ ${#args[@]} -gt 0 ]]; then
    npx supabase secrets set --project-ref "$NEW_PROJECT_REF" "${args[@]}"
  fi
fi

# ───────────────────────────────────────────── functions deploy
if run_step functions; then
  echo "▶ deploy de edge functions"
  cd "$ROOT"
  for fn in supabase/functions/*/; do
    name="$(basename "$fn")"
    [[ "$name" == _* ]] && continue   # diretórios privados (_shared)
    echo "  ▸ $name"
    npx supabase functions deploy "$name" --project-ref "$NEW_PROJECT_REF" --no-verify-jwt 2>&1 | tail -5
  done
fi

# ───────────────────────────────────────────── verify
if run_step verify; then
  echo "▶ verificando índices de performance"
  cd "$ROOT"
  npx supabase db execute --linked --file - <<'SQL'
select indexname, tablename
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'whatsapp_chats_tenant_last_message_at_idx',
    'whatsapp_chats_customer_id_idx',
    'whatsapp_chats_instance_id_idx',
    'whatsapp_messages_chat_created_idx',
    'whatsapp_messages_tenant_created_idx',
    'whatsapp_messages_instance_id_idx',
    'customers_tenant_status_idx'
  )
order by tablename, indexname;
SQL
fi

echo "✓ pronto"
