import type { CalibrationRecord } from "./types";

export function temperatureProjectionGate(record: CalibrationRecord | null) {
  if (!record) return { allowed: false, reasons: ["No city calibration record is available."] };
  const reasons: string[] = [];
  if (!record.observedBaseline) reasons.push("A documented local baseline observation is required.");
  if (!record.observedFollowUp) reasons.push("A comparable local follow-up observation is required.");
  if (!record.counterfactualValidated) reasons.push("A validated counterfactual design is required.");
  if (!record.uncertaintyValidated) reasons.push("Uncertainty diagnostics must be validated.");
  if (!record.governanceApproved) reasons.push("City governance approval is required before public projection use.");
  if (!record.calibrationVersion?.trim()) reasons.push("A versioned calibration artifact is required.");
  return { allowed: reasons.length === 0, reasons };
}
