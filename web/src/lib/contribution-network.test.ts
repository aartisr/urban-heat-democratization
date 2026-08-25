import { describe, expect, it } from "vitest";

import { contributionDraftError, toContributionMarkdown } from "./contribution-network";

describe("contribution network", () => {
  const input = { claim: "shade_gap" as const, publicPlace: "Main & First", observedAt: "August afternoon", observation: "The public bus stop has no shade.", uncertainty: "Tree coverage may change seasonally.", requestedStep: "A shade audit" };

  it("rejects a residential street address from an observation draft", () => {
    expect(contributionDraftError({ ...input, publicPlace: "123 Example Street" })).toContain("street address");
  });

  it("creates a bounded request rather than a conclusion", () => {
    expect(contributionDraftError(input)).toBeNull();
    expect(toContributionMarkdown(input)).toContain("request to investigate");
  });
});
