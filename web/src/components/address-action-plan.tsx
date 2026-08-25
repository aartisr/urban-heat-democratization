import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { getAddressAdviceContext } from "../lib/api";
import { addressAdviceLimits, addressAdviceRoles, addressAdviceSources, addressAdviceStudyCities, approximatePlaceError, buildAddressAdvicePlan, displayPlace, type AddressAdviceInput, type AddressAdviceRole } from "../lib/address-advice";
import { BostonPilotReadiness } from "./boston-pilot-readiness";
import { PrivateReportPreparation } from "./private-report-preparation";
import { ContributionNetwork } from "./contribution-network";

const initialInput: AddressAdviceInput = {
  placeLabel: "",
  cityId: "boston",
  placeMode: "label",
  coarseAreaId: "central",
  role: "renter",
};

export function AddressActionPlan() {
  const [input, setInput] = useState<AddressAdviceInput>(initialInput);
  const [started, setStarted] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const plan = buildAddressAdvicePlan(input);
  const selectedCity = addressAdviceStudyCities.find((city) => city.id === input.cityId) ?? addressAdviceStudyCities[0];
  const contextQuery = useQuery({
    queryKey: ["address-advice-context", input.cityId],
    queryFn: () => getAddressAdviceContext(input.cityId),
    enabled: started,
    staleTime: 5 * 60 * 1000,
  });

  const update = <K extends keyof AddressAdviceInput>(key: K, value: AddressAdviceInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="page-stack address-plan-page">
      <header className="address-plan-hero">
        <div>
          <p className="eyebrow">Personal starting point · privacy first</p>
          <h1>Your cooling action plan.</h1>
          <p className="address-plan-lede">Start with a place and your role. Get practical next questions without turning an address into a risk score.</p>
          <div className="address-plan-trust-row" aria-label="Plan safeguards">
            <span>Private by default</span><span>Neighborhood-scale only</span><span>Not medical advice</span>
          </div>
        </div>
        <aside className="address-plan-safety-card">
          <p className="eyebrow">First, today’s heat</p>
          <h2>Need immediate heat guidance?</h2>
          <p>Use official local health information for current conditions, cooling locations, and urgent symptoms.</p>
          <a className="button-link" href={addressAdviceSources.cdc.url}>Open CDC heat guidance <span aria-hidden="true">↗</span></a>
        </aside>
      </header>

      <section className="address-plan-workspace" aria-labelledby="address-plan-start-title">
        <div className="address-plan-form-copy">
          <p className="eyebrow">01 · Set your context</p>
          <h2 id="address-plan-start-title">One short prompt. A useful next step.</h2>
          <p>Use a neighborhood, ZIP code, intersection, or an exact address. This starter keeps what you type in this browser only; it does not geocode, save, or transmit the location. <a href={addressAdviceSources.uswds.url}>Read the USWDS address guidance <span aria-hidden="true">↗</span></a>.</p>
        </div>
        <form className="address-plan-form" onSubmit={(event) => {
          event.preventDefault();
          const error = input.placeMode === "label" ? approximatePlaceError(input.placeLabel) : null;
          setPlaceError(error);
          if (!error) setStarted(true);
        }}>
          <fieldset>
            <legend>Choose an approximate place</legend>
            <div className="address-plan-choice-row">
              <label><input type="radio" name="place-mode" checked={input.placeMode === "label"} onChange={() => update("placeMode", "label")} /> Neighborhood, ZIP, or intersection</label>
              <label><input type="radio" name="place-mode" checked={input.placeMode === "study_area"} onChange={() => update("placeMode", "study_area")} /> Rough study area</label>
            </div>
          </fieldset>
          {input.placeMode === "label" ? (
            <label className="address-plan-field">
              <span>Neighborhood, ZIP code, or intersection</span>
              <input value={input.placeLabel} autoComplete="off" aria-describedby="approximate-place-help" aria-invalid={Boolean(placeError)} onChange={(event) => { update("placeLabel", event.target.value); setPlaceError(approximatePlaceError(event.target.value)); }} placeholder="For example: East Boston, 02128, or Main &amp; First" />
              <small id="approximate-place-help">Street addresses are not accepted. This label stays in this browser and is never sent to the evidence service.</small>
              {placeError ? <small className="address-plan-field-error" role="alert">{placeError}</small> : null}
            </label>
          ) : (
            <label className="address-plan-field">
              <span>Rough Boston study area</span>
              <select value={input.coarseAreaId} onChange={(event) => update("coarseAreaId", event.target.value)}>
                {selectedCity.coarseAreas.map((area) => <option key={area.id} value={area.id}>{area.label}</option>)}
              </select>
            </label>
          )}
          <label className="address-plan-field">
            <span>What is your role?</span>
            <select value={input.role} onChange={(event) => update("role", event.target.value as AddressAdviceRole)}>
              {addressAdviceRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
          </label>
          <label className="address-plan-field">
            <span>Which study city should provide context?</span>
            <select value={input.cityId} onChange={(event) => update("cityId", event.target.value)}>
              {addressAdviceStudyCities.map((city) => <option key={city.id} value={city.id}>{city.label}</option>)}
            </select>
          </label>
          <button className="button-link" type="submit">Create my starting plan <span aria-hidden="true">→</span></button>
          {started ? <button className="address-plan-clear" type="button" onClick={() => { setInput(initialInput); setStarted(false); setPlaceError(null); }}>Clear this plan</button> : null}
        </form>
      </section>

      {started ? (
        <section className="address-plan-results" aria-live="polite" aria-labelledby="address-plan-results-title">
          <div className="address-plan-results-heading">
            <div>
              <p className="eyebrow">02 · Your next steps</p>
              <h2 id="address-plan-results-title">A practical plan for {displayPlace(input)}.</h2>
            </div>
            <span className="address-plan-browser-note">Approximate place · only in this browser</span>
          </div>
          <p className="address-plan-result-intro">This is an action menu, not a diagnosis. Start with one item you can do now, then bring one well-framed question to the people who can help change the place.</p>
          <div className="address-plan-action-grid">
            {plan.map((group) => (
              <article className="address-plan-action-card" key={group.title}>
                <p className="eyebrow">{group.eyebrow}</p>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
                <ol>{group.actions.map((action) => <li key={action}>{action}</li>)}</ol>
                <p className="address-plan-source-line">Guidance basis: {group.sources.map((sourceId, index) => {
                  const source = addressAdviceSources[sourceId];
                  return <span key={sourceId}>{index ? ", " : ""}<a href={source.url}>{source.label} <span aria-hidden="true">↗</span></a></span>;
                })}</p>
              </article>
            ))}
          </div>
          <article className="address-plan-context-card" aria-live="polite">
            <div>
              <p className="eyebrow">Neighborhood evidence · {contextQuery.data?.cityName ?? "Loading study context"}</p>
              <h3>{contextQuery.data?.analysisScale ?? "Checking the study scale…"}</h3>
              <p>{contextQuery.data?.coverage ?? "This check never receives the location label you entered."} <a href={addressAdviceSources.epa.url}>Read EPA EnviroAtlas data-scale guidance <span aria-hidden="true">↗</span></a>.</p>
            </div>
            {contextQuery.isError ? <p className="address-plan-context-error">Study context is temporarily unavailable. Your safety and action plan remains available.</p> : null}
            {contextQuery.data ? (
              <>
                <ul className="address-plan-layer-list">
                  {contextQuery.data.layers.map((layer) => <li key={layer.label}>
                    <strong>{layer.label}</strong>
                    <span>{layer.detail}</span>
                    <small>Source: {layer.artifactUrl ? <a href={layer.artifactUrl}>{layer.sourceName}</a> : layer.sourceName} · {layer.provider}{layer.resolutionM ? ` · ${layer.resolutionM} m` : ""}</small>
                  </li>)}
                </ul>
                <p className="address-plan-spectral-state"><strong>Spectral result: not shown.</strong> {contextQuery.data.spectralDetail}</p>
              </>
            ) : null}
          </article>
          <article className="address-plan-evidence-gate">
            <div>
              <p className="eyebrow">Evidence gate</p>
              <h3>Neighborhood evidence comes before a spectral lens.</h3>
              <p>Boston is the current bundled study. Address-level spectral interpretation will appear only when location coverage, layer quality, resolution, graph connectivity, and sensitivity checks pass.</p>
            </div>
            <Link className="button-link secondary" to="/cities/$cityId" params={{ cityId: input.cityId }}>Inspect city evidence</Link>
          </article>
          {input.cityId === "boston" ? <BostonPilotReadiness /> : null}
          <PrivateReportPreparation />
          <ContributionNetwork />
        </section>
      ) : null}

      <section className="address-plan-boundary" aria-labelledby="address-plan-boundary-title">
        <div>
          <p className="eyebrow">Always visible</p>
          <h2 id="address-plan-boundary-title">What this plan will not tell you.</h2>
        </div>
        <ul>{addressAdviceLimits.map((limit) => <li key={limit}>{limit}</li>)}</ul>
      </section>

      <details className="address-plan-method">
        <summary>How the address-level service will earn a spectral result</summary>
        <p>Before a spectral interpretation is shown, the service must use supported city coverage, dated public layers at an appropriate neighborhood scale, documented quality checks, a connected analysis graph, and a sensitivity check. Read the complete <a href="https://github.com/aartisr/urban-heat-democratization/blob/main/docs/ADDRESS_LEVEL_SPECTRAL_URBANISM_ADVICE.md">address-level evidence contract</a>.</p>
        <p className="address-plan-reference-list">External guidance used here: <a href={addressAdviceSources.cdc.url}>CDC heat guidance</a> · <a href={addressAdviceSources.uswds.url}>USWDS address guidance</a> · <a href={addressAdviceSources.epa.url}>EPA EnviroAtlas data scale</a>.</p>
      </details>
    </section>
  );
}
