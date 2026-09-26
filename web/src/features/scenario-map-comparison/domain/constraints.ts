import type { CandidateEligibility, EligibleArea } from "./types";

/**
 * Deterministic, explainable gate for candidate placement. This deliberately
 * evaluates supplied geometry metadata only; it never fabricates a site.
 */
export function evaluateCandidateEligibility(area: EligibleArea, interventionId: string, requestedQuantity = 1): CandidateEligibility {
  const reasons: string[] = [];
  const capacity = Math.max(0, area.capacityByIntervention[interventionId] ?? 0);
  if (!area.allowedInterventionIds.includes(interventionId)) reasons.push("This intervention is not permitted for the candidate area.");
  if (area.feasibility <= 0) reasons.push("The candidate area has no positive feasibility score.");
  if (requestedQuantity <= 0) reasons.push("Requested quantity must be positive.");
  if (capacity < requestedQuantity) reasons.push(`Available capacity is ${capacity}; ${requestedQuantity} requested.`);
  if (!area.source.label.trim()) reasons.push("Candidate-area source provenance is required.");
  return { areaId: area.id, interventionId, eligible: reasons.length === 0, reasons, availableCapacity: capacity };
}
