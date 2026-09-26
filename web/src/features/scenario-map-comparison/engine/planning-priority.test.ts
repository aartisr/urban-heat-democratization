import { describe, expect, it } from "vitest";

import { modelPlanningPriority } from "./planning-priority";

const scenario = {
  budgetUsd: 2000000,
  allocationSummary: { allocationCoveragePct: 1 },
  evidenceSummary: { verifiedUnitCostCount: 2, rankingOnlyCount: 0, benchmarkOnlyCount: 0 },
} as any;

describe("modelPlanningPriority", () => {
  it("reduces modeled planning priority without creating a temperature value", () => {
    const result = modelPlanningPriority([{ id: "a", baseline: 100 }, { id: "b", baseline: 20 }], scenario);
    expect(result.cells[0]?.scenario).toBeLessThan(100);
    expect(result.cells[0]?.scenario).toBeGreaterThanOrEqual(0);
    expect(result.cells[0]?.delta).toBeLessThan(0);
    expect(result.changedHighPriorityShare).toBe(1);
  });
});

