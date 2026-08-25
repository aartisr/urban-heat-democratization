export type SiteControl = "self" | "shared" | "none";
export type ProjectInterest = "shade" | "roof" | "route" | "none";

export type PrivateReportPreparation = {
  control: SiteControl;
  projectInterest: ProjectInterest;
};

export const privateReportOptions = {
  control: [
    { value: "self", label: "I can make or request a change on this site" },
    { value: "shared", label: "I need a landlord, association, or organization" },
    { value: "none", label: "I do not control the site" },
  ] as const,
  projectInterest: [
    { value: "shade", label: "Shade, trees, or outdoor comfort" },
    { value: "roof", label: "Roof, insulation, or building-envelope questions" },
    { value: "route", label: "A walking route, stop, or public space" },
    { value: "none", label: "I am exploring options" },
  ] as const,
};

export function privateReportNextStep(input: PrivateReportPreparation): string {
  if (input.control === "none" || input.projectInterest === "route") {
    return "Frame one public-space question and bring it to the responsible local steward for a site visit or shade-access review.";
  }
  if (input.control === "shared") {
    return "Prepare one specific request for the person or organization with authority, then ask what evidence or approval is needed.";
  }
  if (input.projectInterest === "roof") {
    return "Before any work, seek a qualified assessment of roof condition, insulation, code, incentives, and seasonal tradeoffs.";
  }
  if (input.projectInterest === "shade") {
    return "Investigate existing shade protection or a feasible planting / shade option with ownership, utility, drainage, and maintenance checks.";
  }
  return "Choose one observed concern, one question to verify, and one accountable person or organization to contact.";
}
