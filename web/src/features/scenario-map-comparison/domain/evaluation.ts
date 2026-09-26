import type { ImplementationEvaluationRecord } from "./types";

/** Prevent planning assumptions from being presented as measured outcomes. */
export function measuredOutcomeGate(record: ImplementationEvaluationRecord | null) {
  if (!record) return { allowed: false, reasons: ["No implementation evaluation record is available."] };
  const reasons: string[] = [];
  if (!record.interventionGeometryVerified) reasons.push("Verified intervention geometry is required.");
  if (!record.baselineObserved) reasons.push("An observed pre-implementation baseline is required.");
  if (!record.followUpObserved) reasons.push("An observed post-implementation follow-up is required.");
  if (!record.comparisonDesignValidated) reasons.push("A validated comparison or counterfactual design is required.");
  if (!record.uncertaintyReported) reasons.push("Uncertainty and robustness results must be reported.");
  if (!record.governanceApproved) reasons.push("Governance approval is required for a public outcome claim.");
  if (!record.evaluationVersion?.trim()) reasons.push("A versioned evaluation artifact is required.");
  return { allowed: reasons.length === 0, reasons };
}
