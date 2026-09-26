import type { ScenarioAction, ScenarioRecord } from "../../../lib/types";

export type AllocationEvidenceState = "costed_quantity" | "ranked_envelope" | "benchmark_envelope" | "unallocated";

export type AllocationLedgerLine = {
  id: string;
  label: string;
  state: AllocationEvidenceState;
  allocatedUsd: number;
  committedUsd: number;
  residualUsd: number;
  quantity: number | null;
  measurementUnit: string | null;
  evidenceLabel: string;
  explanation: string;
};

export type AllocationLedger = {
  budgetUsd: number;
  committedUsd: number;
  provisionalUsd: number;
  unallocatedUsd: number;
  reconciliationUsd: number;
  lines: AllocationLedgerLine[];
};

export type AllocationLedgerExport = {
  schemaVersion: 1;
  kind: "urban-heat-allocation-ledger";
  exportedAt: string;
  scenario: {
    id: string;
    cityId: string;
    label: string;
    planningMode: ScenarioRecord["planningMode"];
    budgetUsd: number;
  };
  allocationSummary: ScenarioRecord["allocationSummary"];
  evidenceSummary: ScenarioRecord["evidenceSummary"];
  ledger: AllocationLedger;
  limitations: string[];
};

const nonNegative = (value: number | null | undefined) => Math.max(0, value ?? 0);

function lineForAction(action: ScenarioAction): AllocationLedgerLine {
  const allocatedUsd = nonNegative(action.allocatedBudgetUsd);
  if (action.costStatus === "verified_unit_cost" && action.unitCostUsd != null && action.unitCostUsd > 0) {
    const availableQuantity = action.targetQuantity == null ? Number.POSITIVE_INFINITY : Math.max(0, Math.floor(action.targetQuantity));
    const quantity = Math.min(Math.floor(allocatedUsd / action.unitCostUsd), availableQuantity);
    const committedUsd = quantity * action.unitCostUsd;
    return {
      id: action.interventionId,
      label: action.name,
      state: "costed_quantity",
      allocatedUsd,
      committedUsd,
      residualUsd: allocatedUsd - committedUsd,
      quantity,
      measurementUnit: action.measurementUnit ?? null,
      evidenceLabel: "Verified unit cost",
      explanation: "A whole quantity is shown only because this action has a stated unit cost. Any amount below one unit remains unallocated.",
    };
  }

  const benchmark = action.costStatus === "benchmark_only";
  return {
    id: action.interventionId,
    label: action.name,
    state: benchmark ? "benchmark_envelope" : "ranked_envelope",
    allocatedUsd,
    committedUsd: 0,
    residualUsd: 0,
    quantity: null,
    measurementUnit: action.measurementUnit ?? null,
    evidenceLabel: benchmark ? "Benchmark-only" : "Ranking-only",
    explanation: benchmark
      ? "This is a benchmark planning envelope, not a source-supported installation quantity."
      : "This is a comparative planning envelope, not a source-supported installation quantity.",
  };
}

/**
 * Converts an existing scenario record into an auditable display ledger.
 * It never creates quantities for actions without a verified unit-cost input.
 */
export function buildAllocationLedger(scenario: ScenarioRecord): AllocationLedger {
  const lines = scenario.recommendedActions.map(lineForAction);
  const committedUsd = lines.reduce((sum, line) => sum + line.committedUsd, 0);
  const provisionalUsd = lines.filter((line) => line.state !== "costed_quantity").reduce((sum, line) => sum + line.allocatedUsd, 0);
  const wholeUnitResidualUsd = lines.reduce((sum, line) => sum + line.residualUsd, 0);
  const actionAllocationUsd = lines.reduce((sum, line) => sum + line.allocatedUsd, 0);
  const summaryUnallocatedUsd = nonNegative(scenario.allocationSummary.unallocatedBudgetUsd);
  const reconciliationUsd = Math.max(0, scenario.budgetUsd - actionAllocationUsd - summaryUnallocatedUsd);
  const unallocatedUsd = summaryUnallocatedUsd + wholeUnitResidualUsd + reconciliationUsd;
  return { budgetUsd: scenario.budgetUsd, committedUsd, provisionalUsd, unallocatedUsd, reconciliationUsd, lines };
}

/** A portable audit record; it preserves uncertainty rather than filling gaps. */
export function createAllocationLedgerExport(scenario: ScenarioRecord, exportedAt = new Date().toISOString()): AllocationLedgerExport {
  return {
    schemaVersion: 1,
    kind: "urban-heat-allocation-ledger",
    exportedAt,
    scenario: {
      id: scenario.id,
      cityId: scenario.cityId,
      label: scenario.label,
      planningMode: scenario.planningMode,
      budgetUsd: scenario.budgetUsd,
    },
    allocationSummary: scenario.allocationSummary,
    evidenceSummary: scenario.evidenceSummary,
    ledger: buildAllocationLedger(scenario),
    limitations: [
      "This is a planning allocation record, not a procurement authorization, completed-project register, or temperature forecast.",
      "Only verified unit-cost actions receive a stated quantity; ranked and benchmark envelopes retain their uncertainty.",
      "No project location is implied unless a separately governed candidate or verified geometry record exists.",
    ],
  };
}
