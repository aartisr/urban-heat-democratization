import type { EvidenceState } from "./types";

export const EXPLORE_MODE_LABEL = "Explore relationships · planning model";
export function evidenceDescription(state: EvidenceState) {
  return state === "illustrative" ? "Illustrative evidence: this model teaches relationships; it does not forecast a local temperature change." : "Planning evidence: inspect the stated methods and limitations before acting.";
}
