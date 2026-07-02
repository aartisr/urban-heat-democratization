import { useQuery } from "@tanstack/react-query";

import { ScienceDemocratizationBanner } from "../components/science-democratization-banner";
import { StoryJourneyStrip } from "../components/story-journey-strip";
import { getRobustnessLab } from "../lib/api";

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="robustness-bar-row">
      <progress className={`robustness-progress ${color === "#1d4ed8" ? "is-baseline" : "is-intervention"}`} max={1} value={Math.max(0.02, value)} />
      <strong>{value.toFixed(2)}</strong>
    </div>
  );
}

export function RobustnessPage() {
  const robustnessQuery = useQuery({ queryKey: ["robustness-lab"], queryFn: getRobustnessLab });
  const data = robustnessQuery.data;

  return (
    <section className="page-stack">
      <header className="section-heading">
        <div>
          <div className="eyebrow">Robustness lab</div>
          <h1>See the percolation and reliability math in a real demo.</h1>
        </div>
        <p>{data?.summary ?? "This page will show the toy robustness lab once the API loads."}</p>
      </header>

      <StoryJourneyStrip
        title="Robustness proof narrative"
        subtitle="This lab explains why interventions are considered structurally meaningful by tracing graph metrics and percolation response."
        items={[
          { label: "Baseline", detail: "Establish pre-intervention lambda2, conductance, and reliability values." },
          { label: "Intervene", detail: "Measure post-intervention shifts under the same synthetic network conditions." },
          { label: "Stress", detail: "Run percolation scans to evaluate degradation resilience." },
          { label: "Interpret", detail: "Translate metric movement into planning-relevant robustness insights." },
        ]}
      />

      <ScienceDemocratizationBanner />

      {data ? (
        <>
          <div className="panel-grid two-col">
            <article className="panel-card">
              <h2>Spectral metrics</h2>
              <div className="metric-list">
                <div><span>Lambda2 baseline</span><strong>{data.lambda2Baseline.toFixed(3)}</strong></div>
                <div><span>Lambda2 intervention</span><strong>{data.lambda2Intervention.toFixed(3)}</strong></div>
                <div><span>Phi baseline</span><strong>{data.phiBaseline.toFixed(3)}</strong></div>
                <div><span>Phi intervention</span><strong>{data.phiIntervention.toFixed(3)}</strong></div>
                <div><span>Reliability baseline</span><strong>{data.reliabilityBaseline.toFixed(3)}</strong></div>
                <div><span>Reliability intervention</span><strong>{data.reliabilityIntervention.toFixed(3)}</strong></div>
              </div>
            </article>
            <article className="panel-card">
              <h2>What this means</h2>
              <ul className="bullet-list">
                {data.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </article>
          </div>

          <article className="panel-card">
            <h2>Percolation scan</h2>
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>p</th>
                    <th>Baseline</th>
                    <th>Intervention</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pValues.map((p, index) => (
                    <tr key={p}>
                      <td>{p.toFixed(1)}</td>
                      <td><Bar value={data.baselinePercolation[index] ?? 0} color="#1d4ed8" /></td>
                      <td><Bar value={data.interventionPercolation[index] ?? 0} color="#f97316" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : null}
    </section>
  );
}
