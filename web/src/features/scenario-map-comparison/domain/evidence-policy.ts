import type { ComparisonBudgetPreset, ComparisonEvidenceLevel, ComparisonMetric, ScenarioComparisonPayload } from "./types";

export const COMPARISON_BUDGET_PRESETS: readonly ComparisonBudgetPreset[] = [10000, 50000, 250000, 1000000, 2000000];

export function comparisonScenarioTitle(level: ComparisonEvidenceLevel, metric: ComparisonMetric) {
  if (level === "planning") return "Modeled priority after scenario";
  if (level === "measured") return "Measured change after implementation";
  if (metric === "air_temperature_c") return "Projected air-temperature change";
  return "Projected surface-temperature change";
}

export function comparisonBaselineTitle(metric: ComparisonMetric) {
  if (metric === "priority") return "Baseline evidence and priority";
  if (metric === "air_temperature_c") return "Baseline air temperature";
  return "Baseline surface temperature";
}

export function comparisonClaimBoundary(level: ComparisonEvidenceLevel) {
  if (level === "planning") {
    return "This is a modeled planning-priority comparison, not a future temperature forecast, approved project plan, or measured outcome.";
  }
  if (level === "calibrated_projection") {
    return "This is a calibrated surface-level projection with uncertainty; it is not an air-temperature, health, engineering, or funding guarantee unless separately validated.";
  }
  return "This shows measured change after implementation. Attribution requires its linked evaluation design and comparison evidence.";
}

/** Prevent a planning payload from acquiring temperature language in any UI. */
export function validateScenarioComparisonPayload(payload: ScenarioComparisonPayload) {
  if (payload.baseline.evidenceLevel !== payload.scenarioField.evidenceLevel || payload.baseline.evidenceLevel !== payload.deltaField.evidenceLevel) {
    throw new Error("Comparison fields must share one evidence level.");
  }
  if (payload.scenarioField.evidenceLevel === "planning" && payload.scenarioField.metric !== "priority") {
    throw new Error("A planning comparison may only render a priority field; temperature projection requires calibration.");
  }
  if (payload.scenarioField.evidenceLevel === "calibrated_projection" && payload.scenarioField.metric === "priority") {
    throw new Error("A calibrated projection must declare the physical metric it projects.");
  }
  return payload;
}

