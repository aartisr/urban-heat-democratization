#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python3.11}"
PYTHON_FALLBACK_PATHS=(
  "/opt/homebrew/bin/python3.11"
  "/usr/local/bin/python3.11"
)

find_python311() {
  if command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
    command -v "${PYTHON_BIN}"
    return 0
  fi

  if command -v python3.11 >/dev/null 2>&1; then
    command -v python3.11
    return 0
  fi

  local candidate
  for candidate in "${PYTHON_FALLBACK_PATHS[@]}"; do
    if [[ -x "${candidate}" ]]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done

  return 1
}

install_python311_with_brew() {
  if ! command -v brew >/dev/null 2>&1; then
    return 1
  fi

  echo "python3.11 was not found on PATH."
  echo "Attempting to install Python 3.11 with Homebrew..."
  brew install python@3.11
}

resolve_python311() {
  local resolved
  if resolved="$(find_python311)"; then
    printf '%s\n' "${resolved}"
    return 0
  fi

  if install_python311_with_brew; then
    if resolved="$(find_python311)"; then
      printf '%s\n' "${resolved}"
      return 0
    fi

    if command -v brew >/dev/null 2>&1; then
      local brew_prefix
      brew_prefix="$(brew --prefix python@3.11)"
      if [[ -x "${brew_prefix}/bin/python3.11" ]]; then
        printf '%s\n' "${brew_prefix}/bin/python3.11"
        return 0
      fi
    fi
  fi

  echo "python3.11 was not found and could not be installed automatically." >&2
  echo "This repository is currently pinned for Python 3.11." >&2
  echo "Install Python 3.11 manually, then rerun this script." >&2
  echo "Suggested macOS command: brew install python@3.11" >&2
  exit 1
}

PYTHON_PATH="$(resolve_python311)"

"${PYTHON_PATH}" -m venv .venv
source .venv/bin/activate
python scripts/check_python_env.py
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "Environment created successfully."
echo "Interpreter used: ${PYTHON_PATH}"
echo "Activate it with: source .venv/bin/activate"
