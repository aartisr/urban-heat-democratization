import type { ScenarioRecord } from "../../../lib/types";

export type PlanningPriorityCell = { id: string; baseline: number };
export type PlanningPriorityResult = {
  cells: Array<{ id: string; baseline: number; scenario: number; delta: number }>;
  changedHighPriorityShare: number;
  attenuation: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * A bounded, deterministic transformation for the Stage 1 planning comparison.
 * It represents modeled priority attenuation only. It is deliberately not a
 * temperature, comfort, or causal-impact model.
 */
export function modelPlanningPriority(cells: PlanningPriorityCell[], scenario: ScenarioRecord): PlanningPriorityResult {
  const budgetIntensity = clamp01(Math.log1p(Math.max(0, scenario.budgetUsd) / 10000) / Math.log1p(2000000 / 10000));
  const coverage = clamp01(scenario.allocationSummary.allocationCoveragePct);
  const evidence = scenario.evidenceSummary;
  const evidenceCount = Math.max(1, evidence.verifiedUnitCostCount + evidence.rankingOnlyCount + evidence.benchmarkOnlyCount);
  const evidenceQuality = clamp01((evidence.verifiedUnitCostCount + (evidence.rankingOnlyCount * 0.68) + (evidence.benchmarkOnlyCount * 0.45)) / evidenceCount);
  const attenuation = clamp01(0.04 + (budgetIntensity * 0.20) + (coverage * 0.12) + (evidenceQuality * 0.08));
  const maxBaseline = Math.max(1, ...cells.map((cell) => cell.baseline));
  let changedHighPriority = 0;
  let highPriority = 0;
  const resultCells = cells.map((cell) => {
    const normalizedPriority = clamp01(cell.baseline / maxBaseline);
    const reduction = attenuation * (0.55 + (normalizedPriority * 0.45));
    const scenarioValue = Math.max(0, cell.baseline * (1 - reduction));
    const delta = scenarioValue - cell.baseline;
    if (normalizedPriority >= 0.7) {
      highPriority += 1;
      if (Math.abs(delta) > 0.001) changedHighPriority += 1;
    }
    return { id: cell.id, baseline: cell.baseline, scenario: scenarioValue, delta };
  });
  return {
    cells: resultCells,
    changedHighPriorityShare: highPriority ? changedHighPriority / highPriority : 0,
    attenuation,
  };
}

