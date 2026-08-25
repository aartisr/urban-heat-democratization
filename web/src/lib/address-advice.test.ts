import { describe, expect, it } from "vitest";

import { approximatePlaceError, buildAddressAdvicePlan, displayPlace, phaseTwoComprehensionChecks } from "./address-advice";

describe("address advice plan", () => {
  it("keeps location labels presentation-only and produces role-matched prompts", () => {
    const input = { placeLabel: "02128", cityId: "boston", placeMode: "label" as const, coarseAreaId: "central", role: "renter" as const };
    const plan = buildAddressAdvicePlan(input);

    expect(displayPlace(input)).toBe("02128");
    expect(plan).toHaveLength(3);
    expect(plan[1]?.actions.join(" ")).toContain("landlord");
  });

  it("uses a privacy-safe fallback label when a place is not supplied", () => {
    expect(displayPlace({ placeLabel: "   ", cityId: "boston", placeMode: "label", coarseAreaId: "central", role: "owner" })).toBe("your selected area");
  });

  it("rejects street addresses and retains only approximate-place modes", () => {
    expect(approximatePlaceError("123 Example Street")).toContain("not a street address");
    expect(approximatePlaceError("02128")).toBeNull();
    expect(phaseTwoComprehensionChecks).toHaveLength(3);
  });
});
