from __future__ import annotations

import json
from pathlib import Path

from api.main import _benchmark_suite


SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "boston_benchmark_suite.json"


def _normalize_suite(payload: dict[str, object]) -> dict[str, object]:
    return {
        "cityId": payload["cityId"],
        "cityName": payload["cityName"],
        "headline": payload["headline"],
        "cases": [
            {
                "label": case["label"],
                "budgetUsd": case["budgetUsd"],
                "planningMode": case["planningMode"],
                "actionCount": case["actionCount"],
                "allocationCoveragePct": case["allocationCoveragePct"],
                "benchmarkLabel": case["benchmarkLabel"],
                "exhaustiveAvailable": case["exhaustiveAvailable"],
            }
            for case in payload["cases"]
        ],
    }


def test_boston_benchmark_suite_matches_snapshot():
    snapshot = json.loads(SNAPSHOT_PATH.read_text())
    assert _normalize_suite(_benchmark_suite("boston")) == snapshot
