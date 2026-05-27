#!/usr/bin/env bash
# Migra schema e Edge Functions para um Supabase self-hosted.
#
# Uso:
#   cp scripts/migrate-to-selfhosted-supabase.env.example scripts/migrate-to-selfhosted-supabase.env
#   # preencha o .env real
#   ./scripts/migrate-to-selfhosted-supabase.sh
#
# Etapas isoladas:
#   STEP=db ./scripts/migrate-to-selfhosted-supabase.sh
#   STEP=functions ./scripts/migrate-to-selfhosted-supabase.sh
#   STEP=functions-env ./scripts/migrate-to-selfhosted-supabase.sh
#   STEP=verify ./scripts/migrate-to-selfhosted-supabase.sh
#
# Dica para VPS sem Postgres exposto:
#   ssh -N -L 65432:127.0.0.1:5432 usuario@seu-servidor
#   SUPABASE_DB_URL=postgresql://postgres:SENHA@127.0.0.1:65432/postgres?sslmode=disable

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/scripts/migrate-to-selfhosted-supabase.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Nao encontrei $ENV_FILE. Copie o .example e preencha os dados da VPS."
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

: "${SUPABASE_PUBLIC_URL:?defina SUPABASE_PUBLIC_URL}"

STEP="${STEP:-all}"
run_step() { [[ "$STEP" == "all" || "$STEP" == "$1" ]]; }

if run_step db; then
  : "${SUPABASE_DB_URL:?defina SUPABASE_DB_URL}"
  echo "Aplicando migrations no Postgres self-hosted..."
  cd "$ROOT"
  npx supabase db push --db-url "$SUPABASE_DB_URL" --include-all --yes
fi

if run_step functions-env; then
  : "${VPS_SSH_TARGET:?defina VPS_SSH_TARGET}"
  : "${VPS_SUPABASE_DIR:?defina VPS_SUPABASE_DIR}"
  VPS_FUNCTIONS_SERVICE="${VPS_FUNCTIONS_SERVICE:-supabase_functions}"

  tmp_env="$(mktemp)"
  trap 'rm -f "$tmp_env"' EXIT

  for key in \
    SUPABASE_SERVICE_ROLE_KEY \
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
      printf '%s=%s\n' "$key" "$val" >> "$tmp_env"
    fi
  done

  if [[ ! -s "$tmp_env" ]]; then
    echo "Nenhuma secret/custom env preenchida; nada para enviar."
  else
    echo "Enviando .env.functions para a VPS..."
    scp "$tmp_env" "${VPS_SSH_TARGET}:${VPS_SUPABASE_DIR}/.env.functions"
    echo "Aplicando envs no servico functions quando ele estiver em Docker Swarm..."
    ssh "$VPS_SSH_TARGET" "set -e
      service='$VPS_FUNCTIONS_SERVICE'
      if ! docker service inspect \"\$service\" >/dev/null 2>&1; then
        service=\$(docker service ls --format '{{.Name}}' | grep -E '(^|_)supabase_functions$' | head -1 || true)
      fi
      if [ -n \"\$service\" ]; then
        while IFS= read -r line; do
          [ -n \"\$line\" ] && docker service update --env-add \"\$line\" \"\$service\" >/dev/null
        done < '${VPS_SUPABASE_DIR}/.env.functions'
      else
        echo 'Servico Swarm nao encontrado. Confirme que o compose referencia .env.functions em env_file.'
      fi"
  fi
fi

if run_step functions; then
  : "${VPS_SSH_TARGET:?defina VPS_SSH_TARGET}"
  : "${VPS_SUPABASE_DIR:?defina VPS_SUPABASE_DIR}"
  : "${VPS_FUNCTIONS_DIR:?defina VPS_FUNCTIONS_DIR}"
  VPS_FUNCTIONS_SERVICE="${VPS_FUNCTIONS_SERVICE:-supabase_functions}"

  echo "Sincronizando Edge Functions para a VPS..."
  rsync -az --delete \
    --exclude '.env' \
    --exclude '.env.*' \
    "${ROOT}/supabase/functions/" \
    "${VPS_SSH_TARGET}:${VPS_FUNCTIONS_DIR}/"

  echo "Recriando servico functions..."
  ssh "$VPS_SSH_TARGET" "set -e
    service='$VPS_FUNCTIONS_SERVICE'
    if ! docker service inspect \"\$service\" >/dev/null 2>&1; then
      service=\$(docker service ls --format '{{.Name}}' | grep -E '(^|_)supabase_functions$' | head -1 || true)
    fi
    if [ -n \"\$service\" ]; then
      docker service update --force \"\$service\" >/dev/null
    else
      cd '$VPS_SUPABASE_DIR'
      docker compose up -d --force-recreate --no-deps supabase_functions
    fi"
fi

if run_step verify; then
  echo "Verificando REST e Edge health..."
  curl -fsS "${SUPABASE_PUBLIC_URL%/}/rest/v1/" >/dev/null || true
  curl -fsS "${SUPABASE_PUBLIC_URL%/}/functions/v1/health"
  echo
fi

echo "Pronto."
