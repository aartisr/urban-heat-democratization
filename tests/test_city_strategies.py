from core.city_strategies import benchmark_scenario, exhaustive_estimate_summary, normalize_planning_mode


INTERVENTIONS = [
    {
        "id": "verified-a",
        "name": "Verified Action A",
        "category": "surface cooling",
        "measurementUnit": "project",
        "unitCostUsd": 120000,
        "costStatus": "verified_unit_cost",
        "priorityRank": 1,
        "sourceNote": "Verified unit cost.",
    },
    {
        "id": "ranked-a",
        "name": "Ranked Action A",
        "category": "urban forestry",
        "measurementUnit": "program",
        "unitCostUsd": None,
        "costStatus": "ranking_only",
        "priorityRank": 1,
        "sourceNote": "Ranking evidence.",
    },
    {
        "id": "whole-city-cooling-package",
        "name": "Whole-city cooling package",
        "category": "citywide benchmark",
        "measurementUnit": "citywide program",
        "unitCostUsd": 1000000000,
        "costStatus": "benchmark_only",
        "priorityRank": None,
        "sourceNote": "Benchmark source.",
    },
]


COST_SOURCES = [
    {
        "id": "la-cool-communities-1997",
        "estimatedCostUsd": 1000000000,
    }
]


def test_normalize_planning_mode_defaults_to_best_under_budget():
    assert normalize_planning_mode("evidence-first") == "evidence_first"
    assert normalize_planning_mode("not-a-real-mode") == "best_under_budget"


def test_best_under_budget_prefers_verified_unit_cost_actions():
    scenario = benchmark_scenario(
        "boston",
        "Boston",
        250000,
        INTERVENTIONS,
        COST_SOURCES,
        planning_mode="best_under_budget",
    )

    assert scenario["planningMode"] == "best_under_budget"
    assert scenario["recommendedActions"][0]["interventionId"] == "verified-a"
    assert scenario["recommendedActions"][0]["allocatedBudgetUsd"] == 120000
    assert scenario["confidence"] is not None
    assert scenario["confidence"] > 0.4
    assert scenario["heatReductionC"] is not None
    assert scenario["equityScore"] is not None


def test_best_under_budget_spends_verified_program_cost_when_target_quantity_exists():
    interventions = [
        {
            "id": "verified-program",
            "name": "Verified Program",
            "category": "urban forestry",
            "measurementUnit": "tree",
            "unitCostUsd": 50,
            "targetQuantity": 1000,
            "costStatus": "verified_unit_cost",
            "priorityRank": 1,
            "sourceNote": "Verified program cost.",
        }
    ]

    scenario = benchmark_scenario(
        "boston",
        "Boston",
        60000,
        interventions,
        COST_SOURCES,
        planning_mode="best_under_budget",
    )

    assert scenario["recommendedActions"][0]["interventionId"] == "verified-program"
    assert scenario["recommendedActions"][0]["allocatedBudgetUsd"] == 50000
    assert scenario["recommendedActions"][0]["estimatedProgramCostUsd"] == 50000


def test_whole_city_benchmark_mode_uses_benchmark_package_action():
    scenario = benchmark_scenario(
        "boston",
        "Boston",
        500000,
        INTERVENTIONS,
        COST_SOURCES,
        planning_mode="whole_city_benchmark",
    )

    assert scenario["planningMode"] == "whole_city_benchmark"
    assert len(scenario["recommendedActions"]) == 1
    assert scenario["recommendedActions"][0]["interventionId"] == "whole-city-cooling-package"
    assert scenario["recommendedActions"][0]["allocatedBudgetUsd"] == 500000


def test_exhaustive_estimate_summary_requires_verified_rows_with_target_quantities():
    summary = exhaustive_estimate_summary([], INTERVENTIONS)
    assert summary["available"] is False
    assert summary["estimatedCostUsd"] is None

    verified_rows = [
        {
            "id": "verified-a",
            "costStatus": "verified_unit_cost",
            "unitCostUsd": 120000,
            "targetQuantity": 3,
        }
    ]
    funded_actions = [
        {
            "interventionId": "verified-a",
            "costStatus": "verified_unit_cost",
            "allocatedBudgetUsd": 120000,
        }
    ]
    summary = exhaustive_estimate_summary(funded_actions, verified_rows)
    assert summary["available"] is True
    assert summary["estimatedCostUsd"] == 360000
    assert summary["remainingGapUsd"] == 240000
