import { describe, expect, it } from "vitest";

import { buildAllocationLedger, createAllocationLedgerExport } from "./allocation";

const baseScenario = {
  id: "scenario-test",
  cityId: "boston",
  label: "Boston test scenario",
  planningMode: "best_under_budget",
  budgetUsd: 10_000,
  allocationSummary: { unallocatedBudgetUsd: 1_000 },
  evidenceSummary: {},
  recommendedActions: [],
} as any;

describe("buildAllocationLedger", () => {
  it("creates whole quantities only from verified unit costs and retains the remainder", () => {
    const ledger = buildAllocationLedger({ ...baseScenario, recommendedActions: [{ interventionId: "tree", name: "Trees", costStatus: "verified_unit_cost", allocatedBudgetUsd: 2_750, unitCostUsd: 1_000, targetQuantity: 2, measurementUnit: "tree" }] });
    expect(ledger.lines[0]).toMatchObject({ state: "costed_quantity", quantity: 2, committedUsd: 2_000, residualUsd: 750 });
    expect(ledger.unallocatedUsd).toBeGreaterThanOrEqual(1_750);
  });

  it("does not manufacture quantities from ranking or benchmark evidence", () => {
    const ledger = buildAllocationLedger({ ...baseScenario, recommendedActions: [
      { interventionId: "rank", name: "Shade", costStatus: "ranking_only", allocatedBudgetUsd: 4_000 },
      { interventionId: "benchmark", name: "Roof", costStatus: "benchmark_only", allocatedBudgetUsd: 2_000 },
    ] });
    expect(ledger.lines.map((line) => line.quantity)).toEqual([null, null]);
    expect(ledger.provisionalUsd).toBe(6_000);
    expect(ledger.committedUsd).toBe(0);
  });
});

describe("createAllocationLedgerExport", () => {
  it("preserves the ledger, evidence state, and explicit limitations", () => {
    const payload = createAllocationLedgerExport(baseScenario, "2026-01-01T00:00:00.000Z");
    expect(payload).toMatchObject({ schemaVersion: 1, kind: "urban-heat-allocation-ledger", exportedAt: "2026-01-01T00:00:00.000Z", scenario: { cityId: "boston", budgetUsd: 10000 } });
    expect(payload.limitations).toHaveLength(3);
    expect(payload.ledger.budgetUsd).toBe(10000);
  });
});
