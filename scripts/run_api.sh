#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_UVICORN="${ROOT_DIR}/.venv/bin/uvicorn"

if [[ ! -x "${VENV_UVICORN}" ]]; then
  echo "Virtualenv is missing or uvicorn is not installed."
  echo "Run 'make setup' from ${ROOT_DIR} first."
  exit 1
fi

cd "${ROOT_DIR}"
PYTHONPATH=. "${VENV_UVICORN}" api.main:app --reload "$@"
