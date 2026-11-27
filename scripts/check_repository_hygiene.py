"""Fail CI if generated environments or build outputs enter version control."""

from __future__ import annotations

import subprocess


def is_generated(path: str) -> bool:
    parts = path.split("/")
    return (
        any(part in {"venv", ".venv", "node_modules", "__pycache__", "dist", "build"} for part in parts)
        or any(part.endswith(".egg-info") for part in parts)
        or path.endswith((".pyc", ".pyo"))
    )


def main() -> int:
    tracked = subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0")
    generated = [path for path in tracked if path and is_generated(path)]
    if generated:
        print(f"Generated files tracked in Git ({len(generated)}):")
        for path in generated[:20]:
            print(f"  {path}")
        return 1
    print("Repository hygiene check passed: generated environments and build outputs are untracked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
