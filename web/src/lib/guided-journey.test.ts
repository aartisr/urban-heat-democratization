import { describe, expect, it } from "vitest";
import { journeyStepForPath, nextJourneyStep, validJourneyVisits } from "./guided-journey";

describe("guided journey navigation", () => {
  it("recognizes the city detail and planning pages as part of the same journey", () => {
    expect(journeyStepForPath("/cities/boston")).toBe("explore");
    expect(journeyStepForPath("/address-plan")).toBe("try");
    expect(journeyStepForPath("/runs")).toBeNull();
  });

  it("uses the next stop without claiming that skipped pages were visited", () => {
    expect(nextJourneyStep("/", ["choose"])?.id).toBe("explore");
    expect(nextJourneyStep("/scenarios", ["compare"])?.id).toBe("share");
    expect(nextJourneyStep("/exports", ["share"])).toBeNull();
  });

  it("ignores unknown or repeated saved visits", () => {
    expect(validJourneyVisits(["choose", "choose", "unknown", 2, "explore"])).toEqual(["choose", "explore"]);
  });
});
