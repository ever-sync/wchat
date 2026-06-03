#!/usr/bin/env bash
#
# deploy-migrations.sh — aplica migrations pendentes de supabase/migrations/
# no Postgres do Supabase SELF-HOSTED, de forma idempotente.
#
# Por que existe: o `supabase db push --linked` aponta para um projeto cloud
# que NÃO é o nosso banco (o real é self-hosted em supabasewchat.eversync.space,
# com o Postgres não exposto à internet). Este script roda no próprio servidor,
# via `docker exec`, e usa a tabela supabase_migrations.schema_migrations (a
# mesma do CLI) para saber o que já foi aplicado.
#
# ---------------------------------------------------------------------------
# USO (rode no servidor onde está o docker do Supabase, dentro do repo):
#
#   ./scripts/deploy-migrations.sh                 # dry-run: lista o que falta
#   ./scripts/deploy-migrations.sh --apply         # aplica as pendentes
#   ./scripts/deploy-migrations.sh --baseline VER  # marca <= VER como aplicadas
#                                                  #   SEM executar (reconcilia)
#
# Conexão (escolha uma):
#   - docker (padrão): detecta o container do Postgres; sobreponha com
#       SUPABASE_DB_CONTAINER=supabase-db
#   - direto: defina DATABASE_URL=postgresql://postgres:SENHA@host:5432/postgres
#
# Variáveis opcionais: MIGRATIONS_DIR (padrão supabase/migrations),
#   PGUSER (postgres), PGDATABASE (postgres).
#
# ---------------------------------------------------------------------------
# CENÁRIO IMPORTANTE — tracking vazio:
#   Se o dry-run listar CENTENAS de migrations pendentes, a tabela de tracking
#   do self-hosted está vazia/desatualizada (o banco já tem o schema, mas o
#   registro não). NÃO rode --apply nesse caso: você reaplicaria migrations
#   antigas. Em vez disso, descubra a última migration que JÁ está no banco e
#   rode `--baseline <aquela_versao>` para registrar tudo até ela sem executar;
#   depois `--apply` roda só as genuinamente novas.
# ---------------------------------------------------------------------------
set -euo pipefail

MIGRATIONS_DIR="${MIGRATIONS_DIR:-supabase/migrations}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-postgres}"
MODE="dry-run"
BASELINE_VERSION=""

usage() {
  sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply)    MODE="apply"; shift ;;
    --dry-run)  MODE="dry-run"; shift ;;
    --baseline) MODE="baseline"; BASELINE_VERSION="${2:-}"; shift 2 ;;
    -h|--help)  usage; exit 0 ;;
    *) echo "Argumento desconhecido: $1" >&2; echo "Use --help." >&2; exit 1 ;;
  esac
done

# --- camada de conexão -----------------------------------------------------
if [[ -n "${DATABASE_URL:-}" ]]; then
  CONN_DESC="DATABASE_URL (psql direto)"
  psql_exec() { psql "$DATABASE_URL" "$@"; }
else
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERRO: docker não encontrado e DATABASE_URL não definida." >&2
    exit 1
  fi
  CONTAINER="${SUPABASE_DB_CONTAINER:-}"
  if [[ -z "$CONTAINER" ]]; then
    CONTAINER="$(docker ps --format '{{.Names}}' \
      | grep -Ei 'supabase[-_].*db|db[-_].*supabase|^supabase-db$|postgres' | head -1 || true)"
  fi
  if [[ -z "$CONTAINER" ]]; then
    echo "ERRO: não achei o container do Postgres. Defina SUPABASE_DB_CONTAINER." >&2
    echo "Containers ativos:" >&2
    docker ps --format '  {{.Names}}  ({{.Image}})' >&2 || true
    exit 1
  fi
  CONN_DESC="docker exec ${CONTAINER}"
  psql_exec() { docker exec -i "$CONTAINER" psql -U "$PGUSER" -d "$PGDATABASE" "$@"; }
fi

psql_scalar() { psql_exec -tA -q -c "$1" | tr -d '\r'; }

echo "==> Conexão: ${CONN_DESC}"
echo "==> Diretório de migrations: ${MIGRATIONS_DIR}"

# valida conectividade cedo, com mensagem clara
if ! psql_scalar "select 1;" >/dev/null 2>&1; then
  echo "ERRO: não consegui conectar/consultar o Postgres." >&2
  echo "  - via docker: confira SUPABASE_DB_CONTAINER / PGUSER / PGDATABASE" >&2
  echo "  - via DATABASE_URL: confira host, porta e senha" >&2
  exit 1
fi

# --- garante a tabela de tracking (compatível com a do CLI) ----------------
psql_exec -v ON_ERROR_STOP=1 -q <<'SQL'
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text not null primary key
);
SQL

# --- coleta arquivos e versões já aplicadas --------------------------------
shopt -s nullglob
files=( "${MIGRATIONS_DIR}"/*.sql )
shopt -u nullglob
if [[ ${#files[@]} -eq 0 ]]; then
  echo "Nenhum arquivo .sql em ${MIGRATIONS_DIR}." >&2
  exit 1
fi
# glob do bash já vem ordenado lexicograficamente (timestamps com mesmo tamanho)

APPLIED="$(psql_scalar "select version from supabase_migrations.schema_migrations;")"

is_applied() { grep -qxF "$1" <<<"$APPLIED"; }
version_of()  { local b; b="$(basename "$1")"; echo "${b%%_*}"; }

pending=()
for f in "${files[@]}"; do
  ver="$(version_of "$f")"
  is_applied "$ver" || pending+=("$f")
done

applied_count="$(grep -c . <<<"$APPLIED" || true)"
echo "==> Migrations no repo: ${#files[@]} | já aplicadas: ${applied_count} | pendentes: ${#pending[@]}"
echo

# --- modo baseline: registra como aplicadas sem executar -------------------
if [[ "$MODE" == "baseline" ]]; then
  if [[ -z "$BASELINE_VERSION" ]]; then
    echo "ERRO: --baseline requer uma versão. Ex: --baseline 20260628320000" >&2
    exit 1
  fi
  echo "==> BASELINE: registrando (sem executar) migrations com versão <= ${BASELINE_VERSION}"
  count=0
  for f in "${pending[@]}"; do
    ver="$(version_of "$f")"
    if [[ "$ver" < "$BASELINE_VERSION" || "$ver" == "$BASELINE_VERSION" ]]; then
      psql_exec -v ON_ERROR_STOP=1 -q -c \
        "insert into supabase_migrations.schema_migrations (version) values ('${ver}') on conflict (version) do nothing;"
      echo "  registrada: $(basename "$f")"
      count=$((count+1))
    fi
  done
  echo "==> ${count} migration(s) marcadas como aplicadas (baseline). Nenhuma SQL foi executada."
  exit 0
fi

if [[ ${#pending[@]} -eq 0 ]]; then
  echo "Tudo em dia — nada a aplicar."
  exit 0
fi

echo "Pendentes:"
for f in "${pending[@]}"; do echo "  - $(basename "$f")"; done
echo

# --- dry-run (padrão) ------------------------------------------------------
if [[ "$MODE" == "dry-run" ]]; then
  if [[ ${#pending[@]} -gt 5 ]]; then
    echo "AVISO: ${#pending[@]} pendentes é muito. Provável tracking vazio num banco"
    echo "que já tem o schema. NÃO rode --apply: use --baseline <ultima_versao_ja_no_banco>"
    echo "para reconciliar e só depois --apply. Veja o cabeçalho do script."
    echo
  fi
  echo "(dry-run) Nada foi aplicado. Para aplicar: $0 --apply"
  exit 0
fi

# --- apply -----------------------------------------------------------------
if [[ ${#pending[@]} -gt 5 ]]; then
  echo "AVISO: ${#pending[@]} migrations pendentes. Se o banco já tem o schema,"
  echo "isto pode reaplicar migrations antigas. Confirme que isso é esperado."
  read -r -p "Continuar e aplicar ${#pending[@]} migration(s)? [y/N] " ans
  [[ "$ans" =~ ^[yY]$ ]] || { echo "Abortado."; exit 1; }
fi

applied=0
for f in "${pending[@]}"; do
  ver="$(version_of "$f")"
  echo "==> aplicando $(basename "$f") ..."
  # cada arquivo numa única transação; registra a versão no mesmo COMMIT.
  if {
        cat "$f"
        printf "\ninsert into supabase_migrations.schema_migrations (version) values ('%s') on conflict (version) do nothing;\n" "$ver"
      } | psql_exec -v ON_ERROR_STOP=1 --single-transaction -f - ; then
    echo "    ok"
    applied=$((applied+1))
  else
    echo "ERRO ao aplicar $(basename "$f"). Migração revertida (transação). Parando." >&2
    exit 1
  fi
done

echo
echo "==> Concluído: ${applied} migration(s) aplicada(s)."
