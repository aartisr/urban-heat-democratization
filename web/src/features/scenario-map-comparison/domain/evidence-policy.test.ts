import { describe, expect, it } from "vitest";

import { comparisonScenarioTitle, validateScenarioComparisonPayload } from "./evidence-policy";
import type { ScenarioComparisonPayload } from "./types";

function payload(metric: ScenarioComparisonPayload["scenarioField"]["metric"]): ScenarioComparisonPayload {
  const field = {
    id: "field", version: "v1", metric, evidenceLevel: "planning" as const,
    units: "priority", sourceLabel: "fixture", limitations: ["fixture"],
  };
  return {
    schemaVersion: 1, cityId: "fixture", budgetUsd: 10000,
    baseline: field, scenarioField: field, deltaField: field,
    allocations: [], model: { allocationVersion: "v1", effectModelVersion: "v1", inputFingerprint: "fixture" },
  };
}

describe("scenario comparison evidence policy", () => {
  it("keeps planning results out of temperature language", () => {
    expect(comparisonScenarioTitle("planning", "priority")).toBe("Modeled priority after scenario");
    expect(() => validateScenarioComparisonPayload(payload("land_surface_temperature_c"))).toThrow(/planning comparison/i);
  });

  it("accepts a planning priority field", () => {
    expect(validateScenarioComparisonPayload(payload("priority"))).toMatchObject({ cityId: "fixture" });
  });
});

