from __future__ import annotations

import json
from pathlib import Path

from core.city_experience import bundled_package_specs
from core.city_package_contract import validate_bundled_package


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    payload = [
        validate_bundled_package(repo_root, package_id)
        for package_id in bundled_package_specs().keys()
    ]
    print(json.dumps(payload, indent=2))
    return 0 if all(item.get("valid") for item in payload) else 1


if __name__ == "__main__":
    raise SystemExit(main())
