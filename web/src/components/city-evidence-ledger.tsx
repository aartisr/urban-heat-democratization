import type { CityMapData, TruthStatus } from "../lib/types";

type CityEvidenceLedgerProps = {
  cityName: string;
  data: CityMapData | undefined;
  loading: boolean;
};

const evidenceLabels: Record<TruthStatus, string> = {
  observed: "Observed input",
  derived: "Derived analysis",
  estimated: "Estimated input",
  illustrative: "Illustrative planning input",
};

export function CityEvidenceLedger({ cityName, data, loading }: CityEvidenceLedgerProps) {
  if (loading) {
    return <article className="panel-card city-evidence-ledger" aria-live="polite"><p className="muted">Loading the evidence ledger…</p></article>;
  }

  if (!data) {
    return (
      <article className="panel-card city-evidence-ledger">
        <h2>Evidence ledger</h2>
        <p className="muted">A city-specific evidence ledger is not available yet. Audit will show readiness and the conditions required before local findings are presented.</p>
      </article>
    );
  }

  return (
    <article className="panel-card city-evidence-ledger" aria-labelledby="city-evidence-ledger-title">
      <div className="city-evidence-ledger-heading">
        <div>
          <div className="eyebrow">Evidence ledger</div>
          <h2 id="city-evidence-ledger-title">What supports the {cityName} story?</h2>
          <p className="muted">Each row identifies whether the material was observed, derived, estimated, or illustrative, along with its method and stated limit.</p>
        </div>
        <span className={`truth-badge ${data.truthMode.interpretationStatus}`}>{evidenceLabels[data.truthMode.interpretationStatus]}</span>
      </div>

      <div className="city-evidence-ledger-summary">
        <strong>{data.truthMode.headline}</strong>
        <p>{data.truthMode.caution}</p>
      </div>

      {data.layerProvenance.length ? (
        <div className="city-evidence-ledger-table-shell" tabIndex={0} aria-label="Evidence ledger table">
          <table className="city-evidence-ledger-table">
            <caption className="sr-only">Evidence ledger for {cityName}</caption>
            <thead>
              <tr>
                <th scope="col">Layer</th>
                <th scope="col">Evidence state</th>
                <th scope="col">Method</th>
                <th scope="col">Important limit</th>
              </tr>
            </thead>
            <tbody>
              {data.layerProvenance.map((layer) => (
                <tr key={layer.id}>
                  <th scope="row" data-label="Layer">
                    <strong>{layer.label}</strong>
                    <span>{layer.sourceType}</span>
                  </th>
                  <td data-label="Evidence state"><span className={`truth-badge ${layer.truthStatus}`}>{evidenceLabels[layer.truthStatus]}</span></td>
                  <td data-label="Method">{layer.method}</td>
                  <td data-label="Important limit">{layer.limitations.length ? layer.limitations.join(" ") : layer.detail ?? "No additional limitation was supplied for this layer."}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">This city does not yet expose layer-level provenance rows. The study-level method and limitations remain available below.</p>
      )}

      <details className="city-evidence-ledger-method">
        <summary>Read the study-level method and notes</summary>
        <p>{data.truthMode.methodology}</p>
        {data.truthMode.notes.length ? <ul>{data.truthMode.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
      </details>
    </article>
  );
}
