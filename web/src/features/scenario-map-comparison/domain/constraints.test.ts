import { describe, expect, it } from "vitest";
import { evaluateCandidateEligibility } from "./constraints";

const area = { id: "area-1", status: "candidate" as const, allowedInterventionIds: ["trees"], capacityByIntervention: { trees: 12 }, feasibility: 0.8, source: { label: "Municipal canopy inventory" } };

describe("evaluateCandidateEligibility", () => {
  it("accepts a sourced, suitable candidate within capacity", () => {
    expect(evaluateCandidateEligibility(area, "trees", 8)).toMatchObject({ eligible: true, availableCapacity: 12, reasons: [] });
  });
  it("explains every failed constraint without inventing a placement", () => {
    const result = evaluateCandidateEligibility({ ...area, allowedInterventionIds: [], feasibility: 0, source: { label: "" } }, "trees", 20);
    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(4);
  });
});
