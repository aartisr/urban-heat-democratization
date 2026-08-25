export type ObservationClaim = "shade_gap" | "hot_waiting_area" | "cooling_access" | "tree_maintenance" | "missing_context";

export type ContributionDraft = {
  claim: ObservationClaim;
  publicPlace: string;
  observedAt: string;
  observation: string;
  uncertainty: string;
  requestedStep: string;
};

export const observationClaims: Array<{ value: ObservationClaim; label: string }> = [
  { value: "shade_gap", label: "Possible public shade gap" },
  { value: "hot_waiting_area", label: "Potentially hot waiting or walking area" },
  { value: "cooling_access", label: "Possible cooling-access barrier" },
  { value: "tree_maintenance", label: "Tree or shade-maintenance concern" },
  { value: "missing_context", label: "Important local context missing from the map" },
];

export function contributionDraftError(input: ContributionDraft): string | null {
  if (!input.publicPlace.trim()) return "Add an approximate public place, such as a neighborhood or intersection.";
  if (/^\s*\d{1,6}\s+.+\b(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|place|pl|way)\.?\s*$/i.test(input.publicPlace)) {
    return "Remove the street address. Use a neighborhood, corridor, or intersection instead.";
  }
  if (!input.observation.trim()) return "Describe what you observed in plain language.";
  return null;
}

export function toContributionMarkdown(input: ContributionDraft): string {
  const claim = observationClaims.find((item) => item.value === input.claim)?.label ?? "Local observation";
  return `## Community evidence request\n\n- **Claim to verify:** ${claim}\n- **Approximate public place:** ${input.publicPlace.trim()}\n- **Observed:** ${input.observedAt || "Not supplied"}\n- **What I observed:** ${input.observation.trim()}\n- **What may be missing or uncertain:** ${input.uncertainty.trim() || "Not supplied"}\n- **Requested next step:** ${input.requestedStep.trim() || "A bounded local review"}\n\nThis is a request to investigate, not a conclusion about a person, property, or neighborhood.`;
}
