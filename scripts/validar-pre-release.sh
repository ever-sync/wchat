#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> [1/4] Typecheck"
npm run typecheck

echo "==> [2/4] Lint"
npm run lint

echo "==> [3/4] Tests"
npm run test

echo "==> [4/4] Build"
npm run build

echo ""
echo "OK: gate tecnico pre-release aprovado."
