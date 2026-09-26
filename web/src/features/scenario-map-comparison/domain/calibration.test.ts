import { describe, expect, it } from "vitest";
import { temperatureProjectionGate } from "./calibration";

describe("temperatureProjectionGate", () => {
  it("rejects missing calibration rather than allowing temperature claims", () => {
    expect(temperatureProjectionGate(null)).toMatchObject({ allowed: false });
  });
  it("permits a projection only when every validation gate is documented", () => {
    expect(temperatureProjectionGate({ cityId: "example", observedBaseline: true, observedFollowUp: true, counterfactualValidated: true, uncertaintyValidated: true, governanceApproved: true, calibrationVersion: "v1" })).toEqual({ allowed: true, reasons: [] });
  });
});
