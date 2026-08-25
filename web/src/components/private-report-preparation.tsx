import { useState } from "react";

import { privateReportNextStep, privateReportOptions, type PrivateReportPreparation, type ProjectInterest, type SiteControl } from "../lib/private-report";

export function PrivateReportPreparation() {
  const [input, setInput] = useState<PrivateReportPreparation>({ control: "none", projectInterest: "none" });
  const [prepared, setPrepared] = useState(false);

  return (
    <section className="private-report-preparation" aria-labelledby="private-report-title">
      <div>
        <p className="eyebrow">Phase 4 preparation · browser only</p>
        <h2 id="private-report-title">Prepare a private-report question—without sharing an address.</h2>
        <p>Address-confirmed reports are not available yet. You can still define what you control and what you want to investigate; these answers stay in this browser.</p>
      </div>
      <div className="private-report-form">
        <label><span>What control do you have?</span><select value={input.control} onChange={(event) => setInput((current) => ({ ...current, control: event.target.value as SiteControl }))}>{privateReportOptions.control.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label><span>What would you like to investigate?</span><select value={input.projectInterest} onChange={(event) => setInput((current) => ({ ...current, projectInterest: event.target.value as ProjectInterest }))}>{privateReportOptions.projectInterest.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <button className="button-link secondary" type="button" onClick={() => setPrepared(true)}>Prepare my next question</button>
      </div>
      {prepared ? <p className="private-report-next-step"><strong>Your next step:</strong> {privateReportNextStep(input)}</p> : null}
      <p className="private-report-status"><strong>Address-confirmed report: not available yet.</strong> It requires an approved geocoding provider, explicit consent, no-retention controls, and independent privacy, security, accessibility, and local-partner review.</p>
      <a className="private-report-protocol" href="https://github.com/aartisr/urban-heat-democratization/blob/main/docs/PHASE_4_PRIVATE_REPORT_READINESS.md">Read the Phase 4 privacy and provider contract <span aria-hidden="true">↗</span></a>
    </section>
  );
}
