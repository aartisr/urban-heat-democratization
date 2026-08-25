import { useState } from "react";

import { contributionDraftError, observationClaims, toContributionMarkdown, type ContributionDraft, type ObservationClaim } from "../lib/contribution-network";

const initialDraft: ContributionDraft = { claim: "shade_gap", publicPlace: "", observedAt: "", observation: "", uncertainty: "", requestedStep: "" };

export function ContributionNetwork() {
  const [draft, setDraft] = useState<ContributionDraft>(initialDraft);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const update = <K extends keyof ContributionDraft>(key: K, value: ContributionDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const markdown = toContributionMarkdown(draft);

  return (
    <section className="contribution-network" aria-labelledby="contribution-network-title">
      <div>
        <p className="eyebrow">Phase 5 preparation · no submission</p>
        <h2 id="contribution-network-title">Turn an observation into a careful request.</h2>
        <p>Build a non-identifying draft for a local steward. Nothing here is saved, published, or sent by this app.</p>
      </div>
      <form className="contribution-network-form" onSubmit={(event) => { event.preventDefault(); const nextError = contributionDraftError(draft); setError(nextError); setReady(!nextError); }}>
        <label><span>Claim to verify</span><select value={draft.claim} onChange={(event) => update("claim", event.target.value as ObservationClaim)}>{observationClaims.map((claim) => <option key={claim.value} value={claim.value}>{claim.label}</option>)}</select></label>
        <label><span>Approximate public place</span><input value={draft.publicPlace} autoComplete="off" onChange={(event) => update("publicPlace", event.target.value)} placeholder="Neighborhood, public corridor, or intersection" /></label>
        <label><span>When did you observe it?</span><input value={draft.observedAt} onChange={(event) => update("observedAt", event.target.value)} placeholder="For example: August 2026, afternoon" /></label>
        <label className="contribution-network-wide"><span>What did you observe?</span><textarea value={draft.observation} onChange={(event) => update("observation", event.target.value)} placeholder="Describe a public condition. Do not include names, home addresses, unit numbers, or medical information." rows={3} /></label>
        <label><span>What may be missing or uncertain?</span><input value={draft.uncertainty} onChange={(event) => update("uncertainty", event.target.value)} placeholder="Optional" /></label>
        <label><span>Requested next step</span><input value={draft.requestedStep} onChange={(event) => update("requestedStep", event.target.value)} placeholder="For example: a shade audit or site visit" /></label>
        <button className="button-link secondary" type="submit">Prepare a review draft</button>
      </form>
      {error ? <p className="contribution-network-error" role="alert">{error}</p> : null}
      {ready ? <div className="contribution-network-draft"><p className="eyebrow">Draft for your review</p><pre>{markdown}</pre><p>Copy this into a partner-approved channel only after removing anything identifying or sensitive.</p></div> : null}
      <a className="contribution-network-protocol" href="https://github.com/aartisr/urban-heat-democratization/blob/main/docs/PHASE_5_CONTRIBUTION_NETWORK_READINESS.md">Read the contribution-network and pilot-registry contract <span aria-hidden="true">↗</span></a>
    </section>
  );
}
