import { describe, expect, it } from "vitest";
import { measuredOutcomeGate } from "./evaluation";

describe("measuredOutcomeGate", () => {
  it("rejects a claim without an implementation evaluation", () => {
    expect(measuredOutcomeGate(null)).toMatchObject({ allowed: false });
  });
  it("requires a fully documented evaluation", () => {
    expect(measuredOutcomeGate({ cityId: "example", projectId: "project-1", interventionGeometryVerified: true, baselineObserved: true, followUpObserved: true, comparisonDesignValidated: true, uncertaintyReported: true, governanceApproved: true, evaluationVersion: "v1" })).toEqual({ allowed: true, reasons: [] });
  });
});
