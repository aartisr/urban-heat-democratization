from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4
from typing import Literal

PlanningMode = Literal["best_under_budget", "evidence_first", "benchmark_share", "whole_city_benchmark"]
PLANNING_MODES: tuple[PlanningMode, ...] = (
    "best_under_budget",
    "evidence_first",
    "benchmark_share",
    "whole_city_benchmark",
)

@dataclass(frozen=True)
class PlanningStrategySpec:
    id: str
    benchmark_source_id: str
    allocation_method_label: str
    benchmark_explanation: str
    summary_template: str


DEFAULT_STRATEGY = PlanningStrategySpec(
    id="benchmark-share",
    benchmark_source_id="la-cool-communities-1997",
    allocation_method_label="Inverse-rank benchmark-share allocation using repository comparative sources; not a validated procurement optimizer.",
    benchmark_explanation="Coverage is measured against the repository's coarse whole-city benchmark, not a city-specific exhaustive mitigation estimate.",
    summary_template="Scenario for {city_name}: deploy the full ${budget_usd:,.0f} budget against the intervention ordering described by the real comparative sources stored in this repository.",
)


BOSTON_STRATEGY = PlanningStrategySpec(
    id="boston-benchmark-share",
    benchmark_source_id="la-cool-communities-1997",
    allocation_method_label="Inverse-rank benchmark-share allocation using comparative cooling evidence; suitable for Boston study framing but not yet a procurement optimizer.",
    benchmark_explanation="Coverage is measured against a coarse whole-city benchmark anchor. Boston still lacks a validated city-specific exhaustive mitigation estimate in this app.",
    summary_template="Guided Boston scenario: apply the full ${budget_usd:,.0f} budget to the comparative intervention ordering documented in the repository's real evidence sources.",
)


def resolve_planning_strategy(city_id: str | None) -> PlanningStrategySpec:
    normalized = (city_id or "").strip().lower().replace("_", "-")
    if normalized == "boston":
        return BOSTON_STRATEGY
    return DEFAULT_STRATEGY


def cost_source_by_id(cost_sources: list[dict[str, object]], source_id: str) -> dict[str, object] | None:
    for source in cost_sources:
        if str(source.get("id")) == source_id:
            return source
    return None


def planning_mode_label(mode: PlanningMode) -> str:
    if mode == "best_under_budget":
        return "Best under budget"
    if mode == "evidence_first":
        return "Evidence first"
    if mode == "benchmark_share":
        return "Benchmark share"
    if mode == "whole_city_benchmark":
        return "Whole-city benchmark"
    return mode.replace("_", " ").title()


def normalize_planning_mode(value: str | None) -> PlanningMode:
    normalized = (value or "").strip().lower().replace("-", "_")
    if normalized in PLANNING_MODES:
        return normalized  # type: ignore[return-value]
    return "best_under_budget"


def _estimated_program_cost_usd(item: dict[str, object]) -> int | None:
    unit_cost = item.get("unitCostUsd")
    target_quantity = item.get("targetQuantity")
    if not isinstance(unit_cost, (int, float)) or not isinstance(target_quantity, (int, float)):
        return None
    if int(unit_cost or 0) <= 0 or int(target_quantity or 0) <= 0:
        return None
    return int(unit_cost) * int(target_quantity)


def _action_allocation_cost_usd(item: dict[str, object]) -> int | None:
    program_cost = _estimated_program_cost_usd(item)
    if program_cost is not None:
        return program_cost
    unit_cost = item.get("unitCostUsd")
    if not isinstance(unit_cost, (int, float)):
        return None
    if int(unit_cost or 0) <= 0:
        return None
    return int(unit_cost)


def _verified_actions(
    budget_usd: int,
    interventions: list[dict[str, object]],
    *,
    allocation_method_label: str,
) -> tuple[list[dict[str, object]], int]:
    remaining_budget = budget_usd
    actions: list[dict[str, object]] = []
    verified = sorted(
        [
            item
            for item in interventions
            if item.get("costStatus") == "verified_unit_cost"
            and isinstance(item.get("unitCostUsd"), (int, float))
            and int(item.get("unitCostUsd", 0) or 0) > 0
        ],
        key=lambda item: (
            int(item.get("priorityRank", 9999) or 9999),
            int(_action_allocation_cost_usd(item) or 0),
            str(item.get("name", "")),
        ),
    )
    for item in verified:
        allocation_cost = _action_allocation_cost_usd(item)
        if allocation_cost is None or allocation_cost <= 0 or allocation_cost > remaining_budget:
            continue
        unit_cost = int(item.get("unitCostUsd", 0) or 0)
        estimated_program_cost = _estimated_program_cost_usd(item)
        actions.append(
            {
                "interventionId": str(item.get("id")),
                "name": str(item.get("name")),
                "category": str(item.get("category")),
                "measurementUnit": str(item.get("measurementUnit")) if item.get("measurementUnit") is not None else None,
                "costStatus": str(item.get("costStatus")),
                "priorityRank": int(item.get("priorityRank")) if item.get("priorityRank") is not None else None,
                "targetQuantity": int(item.get("targetQuantity")) if item.get("targetQuantity") is not None else None,
                "unitCostUsd": int(item.get("unitCostUsd")) if item.get("unitCostUsd") is not None else None,
                "estimatedProgramCostUsd": estimated_program_cost,
                "allocatedBudgetUsd": allocation_cost,
                "allocationBasis": (
                    f"{allocation_method_label} One verified unit-cost project funded at ${allocation_cost:,.0f}."
                    if estimated_program_cost is None
                    else (
                        f"{allocation_method_label} One verified unit-cost program funded at ${allocation_cost:,.0f} "
                        f"from a ${unit_cost:,.0f} seed unit cost and {int(item.get('targetQuantity') or 0):,} planned unit(s)."
                    )
                ),
                "rationale": str(item.get("sourceNote")),
            }
        )
        remaining_budget -= allocation_cost
    return actions, remaining_budget


def _verified_action_candidates(interventions: list[dict[str, object]]) -> list[dict[str, object]]:
    return sorted(
        [
            item
            for item in interventions
            if item.get("costStatus") == "verified_unit_cost"
            and isinstance(item.get("unitCostUsd"), (int, float))
            and int(item.get("unitCostUsd", 0) or 0) > 0
        ],
        key=lambda item: (
            int(item.get("priorityRank", 9999) or 9999),
            int(item.get("unitCostUsd", 0) or 0),
            str(item.get("name", "")),
        ),
    )


def _optimized_verified_actions(
    budget_usd: int,
    interventions: list[dict[str, object]],
    *,
    allocation_method_label: str,
) -> tuple[list[dict[str, object]], int]:
    candidates = _verified_action_candidates(interventions)
    if not candidates or budget_usd <= 0:
        return [], budget_usd

    max_budget = budget_usd
    entries: list[tuple[int, float, dict[str, object]]] = []
    for item in candidates:
        allocation_cost = _action_allocation_cost_usd(item)
        if allocation_cost is None or allocation_cost <= 0 or allocation_cost > max_budget:
            continue
        priority_rank = int(item.get("priorityRank", 9999) or 9999)
        utility = 100.0 / max(1.0, float(priority_rank))
        if item.get("targetQuantity") is not None and _estimated_program_cost_usd(item) is not None:
            utility += min(25.0, float(item.get("targetQuantity", 0) or 0) / 50.0)
        entries.append((allocation_cost, utility, item))

    if not entries:
        return [], budget_usd

    scaled_utilities = [int(round(utility * 1000)) for _, utility, _ in entries]
    costs = [cost for cost, _, _ in entries]
    count = len(entries)
    dp: list[list[int]] = [[0] * (max_budget + 1) for _ in range(count + 1)]
    keep: list[list[bool]] = [[False] * (max_budget + 1) for _ in range(count + 1)]

    for i in range(1, count + 1):
        cost = costs[i - 1]
        utility = scaled_utilities[i - 1]
        for capacity in range(max_budget + 1):
            best_without = dp[i - 1][capacity]
            best_with = -1
            if cost <= capacity:
                best_with = dp[i - 1][capacity - cost] + utility
            if best_with > best_without:
                dp[i][capacity] = best_with
                keep[i][capacity] = True
            else:
                dp[i][capacity] = best_without

    chosen_indices: list[int] = []
    capacity = max_budget
    for i in range(count, 0, -1):
        if keep[i][capacity]:
            chosen_indices.append(i - 1)
            capacity -= costs[i - 1]
    chosen_indices.reverse()

    chosen: list[dict[str, object]] = []
    remaining_budget = budget_usd
    for index in chosen_indices:
        item = entries[index][2]
        allocation_cost = _action_allocation_cost_usd(item)
        if allocation_cost is None or allocation_cost <= 0 or allocation_cost > remaining_budget:
            continue
        unit_cost = int(item.get("unitCostUsd", 0) or 0)
        chosen.append(
            {
                "interventionId": str(item.get("id")),
                "name": str(item.get("name")),
                "category": str(item.get("category")),
                "measurementUnit": str(item.get("measurementUnit")) if item.get("measurementUnit") is not None else None,
                "costStatus": str(item.get("costStatus")),
                "priorityRank": int(item.get("priorityRank")) if item.get("priorityRank") is not None else None,
                "targetQuantity": int(item.get("targetQuantity")) if item.get("targetQuantity") is not None else None,
                "unitCostUsd": int(item.get("unitCostUsd")) if item.get("unitCostUsd") is not None else None,
                "estimatedProgramCostUsd": _estimated_program_cost_usd(item),
                "allocatedBudgetUsd": allocation_cost,
                "allocationBasis": (
                    f"{allocation_method_label} Exact knapsack optimizer selected this verified unit-cost action at ${allocation_cost:,.0f} "
                    "because it maximized ranking-weighted value within the available budget."
                ),
                "rationale": str(item.get("sourceNote")),
            }
        )
        remaining_budget -= allocation_cost
    return chosen, remaining_budget


def _ranked_actions(
    budget_usd: int,
    interventions: list[dict[str, object]],
    *,
    allocation_method_label: str,
) -> list[dict[str, object]]:
    actions: list[dict[str, object]] = []
    ranked = sorted(
        [item for item in interventions if item.get("costStatus") == "ranking_only" and item.get("priorityRank") is not None],
        key=lambda item: int(item.get("priorityRank", 9999)),
    )
    weights = [1 / (index + 1) for index in range(len(ranked))]
    total_weight = sum(weights) or 1.0
    for item in ranked:
        rank = int(item.get("priorityRank")) if item.get("priorityRank") is not None else None
        weight = (1 / rank) if rank else 0.0
        allocated_budget = int(round(budget_usd * (weight / total_weight))) if rank else None
        actions.append(
            {
                "interventionId": str(item.get("id")),
                "name": str(item.get("name")),
                "category": str(item.get("category")),
                "measurementUnit": str(item.get("measurementUnit")) if item.get("measurementUnit") is not None else None,
                "costStatus": str(item.get("costStatus")),
                "priorityRank": rank,
                "targetQuantity": int(item.get("targetQuantity")) if item.get("targetQuantity") is not None else None,
                "unitCostUsd": int(item.get("unitCostUsd")) if item.get("unitCostUsd") is not None else None,
                "estimatedProgramCostUsd": _estimated_program_cost_usd(item),
                "allocatedBudgetUsd": allocated_budget,
                "allocationBasis": allocation_method_label,
                "rationale": str(item.get("sourceNote")),
            }
        )
    return actions


def _whole_city_benchmark_actions(
    budget_usd: int,
    interventions: list[dict[str, object]],
    *,
    allocation_method_label: str,
) -> list[dict[str, object]]:
    benchmark = next((item for item in interventions if str(item.get("id")) == "whole-city-cooling-package"), None)
    if not isinstance(benchmark, dict):
        return []
    return [
        {
            "interventionId": str(benchmark.get("id")),
            "name": str(benchmark.get("name")),
            "category": str(benchmark.get("category")),
            "measurementUnit": str(benchmark.get("measurementUnit")) if benchmark.get("measurementUnit") is not None else None,
            "costStatus": str(benchmark.get("costStatus")),
            "priorityRank": None,
            "targetQuantity": 1,
            "unitCostUsd": int(benchmark.get("unitCostUsd")) if benchmark.get("unitCostUsd") is not None else None,
            "estimatedProgramCostUsd": _estimated_program_cost_usd(benchmark),
            "allocatedBudgetUsd": budget_usd,
            "allocationBasis": allocation_method_label,
            "rationale": str(benchmark.get("sourceNote")),
        }
    ]


def recommended_actions(
    budget_usd: int,
    interventions: list[dict[str, object]],
    *,
    allocation_method_label: str,
    planning_mode: PlanningMode,
) -> list[dict[str, object]]:
    if planning_mode == "whole_city_benchmark":
        return _whole_city_benchmark_actions(
            budget_usd,
            interventions,
            allocation_method_label=allocation_method_label,
        )

    if planning_mode == "benchmark_share":
        return _ranked_actions(
            budget_usd,
            interventions,
            allocation_method_label=allocation_method_label,
        )

    if planning_mode == "best_under_budget":
        verified_actions, remaining_budget = _optimized_verified_actions(
            budget_usd,
            interventions,
            allocation_method_label=allocation_method_label,
        )
    else:
        verified_actions, remaining_budget = _verified_actions(
            budget_usd,
            interventions,
            allocation_method_label=allocation_method_label,
        )

    if planning_mode == "evidence_first":
        return verified_actions if verified_actions else _ranked_actions(
            budget_usd,
            interventions,
            allocation_method_label=f"{allocation_method_label} No verified unit-cost projects are loaded yet, so the planner fell back to ranked comparative evidence.",
        )

    ranked_actions = _ranked_actions(
        remaining_budget,
        interventions,
        allocation_method_label=(
            f"{allocation_method_label} Remaining budget after verified unit-cost projects is distributed across ranked comparative actions."
            if verified_actions
            else f"{allocation_method_label} No verified unit-cost projects are loaded yet, so the planner fell back to ranked comparative evidence."
        ),
    )
    return verified_actions + ranked_actions


def allocation_summary(budget_usd: int, actions: list[dict[str, object]], *, allocation_method_label: str) -> dict[str, object]:
    total_allocated = sum(
        int(action.get("allocatedBudgetUsd", 0) or 0)
        for action in actions
        if isinstance(action, dict)
    )
    unallocated = max(0, budget_usd - total_allocated)
    coverage = (total_allocated / budget_usd) if budget_usd > 0 else 0.0
    return {
        "totalAllocatedBudgetUsd": total_allocated,
        "unallocatedBudgetUsd": unallocated,
        "allocationCoveragePct": round(coverage, 4),
        "allocationMethod": allocation_method_label,
    }


def evidence_summary(actions: list[dict[str, object]]) -> dict[str, object]:
    verified = 0
    ranking_only = 0
    benchmark_only = 0
    for action in actions:
        if not isinstance(action, dict):
            continue
        status = str(action.get("costStatus", ""))
        if status == "verified_unit_cost":
            verified += 1
        elif status == "ranking_only":
            ranking_only += 1
        elif status == "benchmark_only":
            benchmark_only += 1
    if verified > 0:
        readiness_label = "Partially costable"
        explanation = "At least one recommended action has a verified unit-cost row, but the scenario still depends partly on non-unit-cost evidence."
    elif ranking_only > 0 or benchmark_only > 0:
        readiness_label = "Benchmark only"
        explanation = "This scenario is driven by comparative or benchmark evidence, not a validated intervention unit-cost table."
    else:
        readiness_label = "No evidence"
        explanation = "This scenario does not yet have structured intervention evidence attached."
    return {
        "verifiedUnitCostCount": verified,
        "rankingOnlyCount": ranking_only,
        "benchmarkOnlyCount": benchmark_only,
        "readinessLabel": readiness_label,
        "explanation": explanation,
    }


def confidence_score(actions: list[dict[str, object]], *, planning_mode: PlanningMode, benchmark_cost: int | None) -> float | None:
    if not actions:
        return None
    total_allocated = sum(int(action.get("allocatedBudgetUsd", 0) or 0) for action in actions if isinstance(action, dict))
    if total_allocated <= 0:
        return 0.2
    verified_allocated = sum(
        int(action.get("allocatedBudgetUsd", 0) or 0)
        for action in actions
        if isinstance(action, dict) and str(action.get("costStatus")) == "verified_unit_cost"
    )
    benchmark_allocated = sum(
        int(action.get("allocatedBudgetUsd", 0) or 0)
        for action in actions
        if isinstance(action, dict) and str(action.get("costStatus")) == "benchmark_only"
    )
    verified_share = verified_allocated / total_allocated
    benchmark_share = benchmark_allocated / total_allocated
    score = 0.22
    if planning_mode == "whole_city_benchmark":
        score = 0.38
    elif planning_mode == "benchmark_share":
        score = 0.3
    elif planning_mode == "evidence_first":
        score = 0.48
    elif planning_mode == "best_under_budget":
        score = 0.42
    score += verified_share * 0.4
    score += benchmark_share * 0.08
    if benchmark_cost and benchmark_cost > 0:
        score += 0.05
    return round(min(score, 0.95), 2)


def heat_reduction_proxy_c(actions: list[dict[str, object]], *, planning_mode: PlanningMode) -> float | None:
    if not actions:
        return None
    total_allocated = sum(int(action.get("allocatedBudgetUsd", 0) or 0) for action in actions if isinstance(action, dict))
    if total_allocated <= 0:
        return 0.0
    verified_allocated = sum(
        int(action.get("allocatedBudgetUsd", 0) or 0)
        for action in actions
        if isinstance(action, dict) and str(action.get("costStatus")) == "verified_unit_cost"
    )
    weighted_actions = []
    for index, action in enumerate(actions, start=1):
        if not isinstance(action, dict):
            continue
        budget = int(action.get("allocatedBudgetUsd", 0) or 0)
        if budget <= 0:
            continue
        status = str(action.get("costStatus"))
        evidence_weight = 1.0 if status == "verified_unit_cost" else 0.68 if status == "ranking_only" else 0.45
        category = str(action.get("category", "")).lower()
        layer_weight = 1.0 if any(token in category for token in ("tree", "forest", "green", "plant")) else 0.92 if "shade" in category else 0.84 if "roof" in category or "surface" in category else 0.72
        priority_rank = int(action.get("priorityRank") or index)
        priority_weight = max(0.35, 1 - ((priority_rank - 1) / max(1, len(actions) - 1)))
        budget_weight = min(1.0, 0.25 + (budget / max(1, total_allocated)))
        weighted_actions.append(evidence_weight * layer_weight * priority_weight * budget_weight)
    structural_gain = 0.12
    if planning_mode == "best_under_budget":
        structural_gain = 0.18
    elif planning_mode == "evidence_first":
        structural_gain = 0.20
    elif planning_mode == "benchmark_share":
        structural_gain = 0.14
    elif planning_mode == "whole_city_benchmark":
        structural_gain = 0.10
    weighted_sum = sum(weighted_actions)
    verified_share = verified_allocated / total_allocated if total_allocated > 0 else 0.0
    proxy = structural_gain * (0.8 + weighted_sum)
    proxy += verified_share * 0.6
    proxy += min(0.35, total_allocated / 1_500_000)
    return round(min(proxy, 4.0), 2)


def equity_score_proxy(actions: list[dict[str, object]], *, planning_mode: PlanningMode) -> float | None:
    if not actions:
        return None
    total_allocated = sum(int(action.get("allocatedBudgetUsd", 0) or 0) for action in actions if isinstance(action, dict))
    if total_allocated <= 0:
        return 0.0
    scored_actions = []
    for index, action in enumerate(actions, start=1):
        if not isinstance(action, dict):
            continue
        budget = int(action.get("allocatedBudgetUsd", 0) or 0)
        if budget <= 0:
            continue
        name = f"{action.get('name', '')} {action.get('category', '')}".lower()
        equity_weight = 1.0
        if any(token in name for token in ("school", "transit", "shade", "tree", "curb", "park")):
            equity_weight = 1.15
        if any(token in name for token in ("benchmark", "whole-city")):
            equity_weight = 0.9
        status = str(action.get("costStatus"))
        evidence_weight = 1.0 if status == "verified_unit_cost" else 0.88 if status == "ranking_only" else 0.76
        priority_rank = int(action.get("priorityRank") or index)
        priority_weight = max(0.5, 1 - ((priority_rank - 1) / max(1, len(actions))))
        scored_actions.append(equity_weight * evidence_weight * priority_weight * (budget / total_allocated))
    planning_weight = {
        "best_under_budget": 0.86,
        "evidence_first": 0.92,
        "benchmark_share": 0.74,
        "whole_city_benchmark": 0.68,
    }.get(planning_mode, 0.8)
    proxy = planning_weight * (0.4 + sum(scored_actions))
    return round(min(proxy, 1.0), 2)


def exhaustive_estimate_summary(
    actions: list[dict[str, object]],
    interventions: list[dict[str, object]],
) -> dict[str, object]:
    verified_rows = [
        item
        for item in interventions
        if str(item.get("costStatus")) == "verified_unit_cost"
        and isinstance(item.get("unitCostUsd"), (int, float))
        and int(item.get("unitCostUsd", 0) or 0) > 0
        and isinstance(item.get("targetQuantity"), (int, float))
        and float(item.get("targetQuantity", 0) or 0) > 0
    ]
    if not verified_rows:
        return {
            "available": False,
            "estimatedCostUsd": None,
            "fundedCostUsd": sum(int(action.get("allocatedBudgetUsd", 0) or 0) for action in actions if isinstance(action, dict)),
            "remainingGapUsd": None,
            "coveragePct": None,
            "costableActions": 0,
            "methodology": "No exhaustive estimate is available yet because the repo has no verified unit-cost rows with explicit target quantities.",
        }
    total_cost = sum(
        int(item.get("unitCostUsd", 0) or 0) * int(float(item.get("targetQuantity", 0) or 0))
        for item in verified_rows
    )
    funded_cost = sum(
        int(action.get("allocatedBudgetUsd", 0) or 0)
        for action in actions
        if isinstance(action, dict) and str(action.get("costStatus")) == "verified_unit_cost"
    )
    gap = max(0, total_cost - funded_cost)
    coverage = (funded_cost / total_cost) if total_cost > 0 else None
    return {
        "available": total_cost > 0,
        "estimatedCostUsd": total_cost if total_cost > 0 else None,
        "fundedCostUsd": funded_cost,
        "remainingGapUsd": gap if total_cost > 0 else None,
        "coveragePct": round(coverage, 4) if coverage is not None else None,
        "costableActions": len(verified_rows),
        "methodology": "Exhaustive estimate is computed only across verified unit-cost rows that also declare explicit target quantities in the planner data contract.",
    }


def benchmark_summary(budget_usd: int, benchmark_cost: int | None, *, benchmark_explanation: str) -> dict[str, object]:
    if not benchmark_cost or benchmark_cost <= 0:
        return {
            "wholeCityBenchmarkUsd": None,
            "budgetGapUsd": None,
            "budgetCoveragePct": None,
            "benchmarkLabel": "No benchmark available",
            "explanation": "This repository does not currently have a whole-city benchmark anchor for this scenario.",
        }
    gap = max(0, benchmark_cost - budget_usd)
    coverage = budget_usd / benchmark_cost
    if coverage >= 1.0:
        label = "At or above benchmark"
    elif coverage >= 0.5:
        label = "Substantial benchmark coverage"
    elif coverage >= 0.1:
        label = "Partial benchmark coverage"
    else:
        label = "Early-stage benchmark coverage"
    return {
        "wholeCityBenchmarkUsd": benchmark_cost,
        "budgetGapUsd": gap,
        "budgetCoveragePct": round(coverage, 4),
        "benchmarkLabel": label,
        "explanation": benchmark_explanation,
    }


def benchmark_scenario(
    city_id: str,
    city_name: str,
    budget_usd: int,
    interventions: list[dict[str, object]],
    cost_sources: list[dict[str, object]],
    *,
    label: str | None = None,
    preset_key: str | None = None,
    planning_mode: PlanningMode = "benchmark_share",
) -> dict[str, object]:
    strategy = resolve_planning_strategy(city_id)
    benchmark = cost_source_by_id(cost_sources, strategy.benchmark_source_id)
    benchmark_cost = int(benchmark.get("estimatedCostUsd", 0)) if isinstance(benchmark, dict) and benchmark.get("estimatedCostUsd") else 0
    benchmark_share = (budget_usd / benchmark_cost) if benchmark_cost > 0 else 0.0
    actions = recommended_actions(
        budget_usd,
        interventions,
        allocation_method_label=f"{planning_mode_label(planning_mode)} mode. {strategy.allocation_method_label}",
        planning_mode=planning_mode,
    )
    ordered_interventions = [str(item.get("name")) for item in actions]
    summary_parts = [strategy.summary_template.format(city_name=city_name, budget_usd=budget_usd)]
    summary_parts.append(f"Planning mode: {planning_mode_label(planning_mode)}.")
    if preset_key:
        summary_parts.append(f"Scenario preset: {preset_key}.")
    if ordered_interventions:
        summary_parts.append(f"Current conservative priority order: {', '.join(ordered_interventions)}.")
    if benchmark_cost > 0:
        summary_parts.append(
            f"Against the published Los Angeles whole-city cooling benchmark of about ${benchmark_cost:,.0f}, this budget covers roughly {benchmark_share * 100:.2f}% of a large-city package."
        )
    if planning_mode in {"best_under_budget", "evidence_first"}:
        summary_parts.append("When verified unit-cost rows are present, these modes fund them first. When they are absent, the planner falls back to ranked comparative evidence instead of inventing precision.")
    summary_parts.append("Temperature reduction and equity scores are now transparent proxy estimates derived from the action mix, not city-calibrated causal outputs.")
    return {
        "id": f"scenario-{city_id}-{uuid4().hex[:10]}",
        "label": label or f"Scenario what-if ${budget_usd:,.0f}",
        "cityId": city_id,
        "planningMode": planning_mode,
        "budgetUsd": budget_usd,
        "estimatedCostUsd": budget_usd,
        "heatReductionC": heat_reduction_proxy_c(actions, planning_mode=planning_mode),
        "equityScore": equity_score_proxy(actions, planning_mode=planning_mode),
        "confidence": confidence_score(actions, planning_mode=planning_mode, benchmark_cost=benchmark_cost if benchmark_cost > 0 else None),
        "summary": " ".join(summary_parts),
        "recommendedActions": actions,
        "allocationSummary": allocation_summary(
            budget_usd,
            actions,
            allocation_method_label=f"{planning_mode_label(planning_mode)} mode. {strategy.allocation_method_label}",
        ),
        "evidenceSummary": evidence_summary(actions),
        "benchmarkSummary": benchmark_summary(
            budget_usd,
            benchmark_cost if benchmark_cost > 0 else None,
            benchmark_explanation=strategy.benchmark_explanation,
        ),
        "exhaustiveEstimateSummary": exhaustive_estimate_summary(actions, interventions),
    }
