import { describe, expect, it } from "vitest";

import { privateReportNextStep } from "./private-report";

describe("private report preparation", () => {
  it("keeps preparation questions bounded to a next step", () => {
    expect(privateReportNextStep({ control: "self", projectInterest: "roof" })).toContain("qualified assessment");
    expect(privateReportNextStep({ control: "none", projectInterest: "shade" })).toContain("public-space question");
  });
});
