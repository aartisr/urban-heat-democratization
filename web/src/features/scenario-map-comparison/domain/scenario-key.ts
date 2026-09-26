import type { ComparisonAllocation } from "./types";

/** Stable browser cache key; allocation order cannot change the same scenario. */
export function scenarioComparisonKey(input: {
  cityId: string;
  baselineVersion: string;
  budgetUsd: number;
  policyId: string;
  effectModelVersion: string;
  allocations: ComparisonAllocation[];
}) {
  const allocations = [...input.allocations]
    .map((allocation) => ({
      interventionId: allocation.interventionId,
      quantity: allocation.quantity,
      unit: allocation.unit,
      capitalCostUsd: allocation.capitalCostUsd,
      maintenanceCostUsd: allocation.maintenanceCostUsd,
      evidenceStatus: allocation.evidenceStatus,
      spatialStatus: allocation.spatialStatus,
      areaIds: [...allocation.areaIds].sort(),
    }))
    .sort((left, right) => left.interventionId.localeCompare(right.interventionId));
  return JSON.stringify({
    cityId: input.cityId,
    baselineVersion: input.baselineVersion,
    budgetUsd: input.budgetUsd,
    policyId: input.policyId,
    effectModelVersion: input.effectModelVersion,
    allocations,
  });
}

