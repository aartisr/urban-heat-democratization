#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build a live Landsat bridge payload from the official USGS LandsatLook STAC plus the app's base thermal surface."
    )
    parser.add_argument("--city-id", default="boston")
    parser.add_argument("--output", default="data/runtime/live_thermal/providers/boston_landsat_live.json")
    parser.add_argument("--collection-id", default="landsat-c2l2-st", help="Official USGS STAC collection id for Landsat.")
    parser.add_argument("--time-start", default="2024-01-01T00:00:00Z")
    parser.add_argument("--bbox")
    parser.add_argument("--page-size", default="1")
    parser.add_argument("--timeout-sec", default="45")
    parser.add_argument("--header", action="append", default=[])
    args = parser.parse_args()

    command = [
        sys.executable,
        str(repo_root() / "scripts" / "build_live_thermal_bridge.py"),
        "--city-id", args.city_id,
        "--source-id", "landsat",
        "--source-name", "USGS Landsat live bridge",
        "--provider", "USGS LandsatLook STAC",
        "--sensor", "Landsat",
        "--adapter-kind", "landsat-stac-item-bridge",
        "--output", args.output,
        "--time-start", args.time_start,
        "--page-size", args.page_size,
        "--timeout-sec", args.timeout_sec,
        "--source-system", "stac",
        "--stac-collection-id", args.collection_id,
    ]
    if args.bbox:
        command.extend(["--bbox", args.bbox])
    for header in args.header:
        command.extend(["--header", header])
    return subprocess.call(command, cwd=repo_root())


if __name__ == "__main__":
    raise SystemExit(main())
