import type { PlanningMode, ScenarioRecord } from "../../../lib/types";

export type ScenarioSelection = { cityId: string; budgetUsd: number; planningMode: PlanningMode };

/** The comparison must never borrow a record from another city, budget, or mode. */
export function selectExactScenario(records: readonly ScenarioRecord[], selection: ScenarioSelection): ScenarioRecord | null {
  return records.find((record) => record.cityId === selection.cityId
    && record.budgetUsd === selection.budgetUsd
    && record.planningMode === selection.planningMode) ?? null;
}

/** Keep a successful generation visible immediately, even if a list refetch lags behind. */
export function upsertScenario(records: readonly ScenarioRecord[] | undefined, scenario: ScenarioRecord): ScenarioRecord[] {
  return [scenario, ...(records ?? []).filter((record) => record.id !== scenario.id)];
}
