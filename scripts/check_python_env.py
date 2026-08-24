from __future__ import annotations

import platform
import sys


SUPPORTED_MAJOR = 3
SUPPORTED_MINOR = 11


def main() -> int:
    version = sys.version_info
    current = f"{version.major}.{version.minor}.{version.micro}"
    system = platform.platform()

    print(f"Detected Python: {current}")
    print(f"Platform: {system}")

    if version.major != SUPPORTED_MAJOR or version.minor != SUPPORTED_MINOR:
        print("")
        print("Environment check failed.")
        print(f"This repository is currently pinned for Python 3.{SUPPORTED_MINOR}.")
        print("Why this matters:")
        print("- The scientific stack is pinned to versions tested against Python 3.12.")
        print("- If you use Python 3.9 or a newer interpreter without compatible wheels,")
        print("  pip may try to build SciPy from source.")
        print("- That often fails with Cython/Meson compiler errors like the one you saw.")
        print("")
        print("Use a Python 3.12 interpreter and create the virtual environment with it.")
        print("Example:")
        print("  python3.12 -m venv .venv")
        print("  source .venv/bin/activate")
        print("  pip install -r requirements.txt")
        return 1

    print("")
    print("Environment check passed.")
    print("This interpreter matches the repo's pinned Python target.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
