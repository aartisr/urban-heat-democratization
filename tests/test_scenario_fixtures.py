import json
from pathlib import Path


def test_bundled_scenario_fixtures_cover_chart_presets() -> None:
    fixture_path = Path(__file__).parents[1] / "data" / "scenario_fixtures.json"
    payload = json.loads(fixture_path.read_text())
    scenarios = payload["scenarios"]

    assert {scenario["budgetUsd"] for scenario in scenarios} == {50000, 250000}
    assert all(
        scenario["id"].startswith("scenario-boston-")
        and scenario["cityId"] == "boston"
        and scenario["planningMode"] == "best_under_budget"
        for scenario in scenarios
    )