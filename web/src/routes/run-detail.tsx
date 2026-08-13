import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";

import { WorkflowHeader } from "../components/workflow-header";
import { artifactDownloadUrl, getRun, listArtifacts } from "../lib/api";

export function RunDetailPage() {
  const { runId } = useParams({ from: "/runs/$runId" });
  const runQuery = useQuery({ queryKey: ["run", runId], queryFn: () => getRun(runId) });
  const artifactsQuery = useQuery({ queryKey: ["artifacts"], queryFn: listArtifacts });
  const run = runQuery.data;
  const artifactLookup = new Map((artifactsQuery.data ?? []).map((artifact) => [artifact.id, artifact]));

  return (
    <section className="page-stack run-detail-page">
      <WorkflowHeader eyebrow="Run detail" title={run?.scenario ?? runId} description={run?.summary ?? "Run metadata, context, logs, and attached artifacts live here."} />

      <div className="panel-grid two-col premium-story-grid">
        <article className="panel-card premium-section-card">
          <h2>Metadata</h2>
          {run ? (
            <div className="metric-list">
              <div><span>Run ID</span><strong>{run.id}</strong></div>
              <div><span>City</span><strong>{run.cityName ?? run.cityId}</strong></div>
              <div><span>Queue job</span><strong>{run.queueJobId ?? "Not queued"}</strong></div>
              <div><span>Status</span><strong>{run.status}</strong></div>
              <div><span>Progress</span><strong>{run.progress}%</strong></div>
              <div><span>Created</span><strong>{run.createdAt ?? "Unknown"}</strong></div>
              <div><span>Updated</span><strong>{run.updatedAt}</strong></div>
            </div>
          ) : (
            <p className="muted">Loading run metadata...</p>
          )}
        </article>

        <article className="panel-card premium-section-card">
          <h2>Study notes</h2>
          {run?.notes?.length ? (
            <ul className="bullet-list">
              {run.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          ) : (
            <p className="muted">No study notes are attached to this run yet.</p>
          )}
          <div className="quick-links">
            <Link to="/runs" className="button-link secondary">Back to runs</Link>
            {run?.cityId ? <Link to="/cities/$cityId" params={{ cityId: run.cityId }} className="button-link">Open city</Link> : null}
          </div>
        </article>
      </div>

      <article className="panel-card premium-section-card">
        <h2>Attached artifacts</h2>
        {run?.outputArtifactIds?.length ? (
          <div className="quick-links">
            {run.outputArtifactIds.map((artifactId) => (
              <a key={artifactId} className="button-link secondary" href={artifactDownloadUrl(artifactId)}>
                Download {artifactLookup.get(artifactId)?.name ?? artifactId}
              </a>
            ))}
          </div>
        ) : (
          <p className="muted">This run has no attached repo artifacts yet.</p>
        )}
        {run?.outputArtifactIds?.length ? (
          <div className="panel-grid two-col">
            {run.outputArtifactIds.map((artifactId) => {
              const artifact = artifactLookup.get(artifactId);
              return (
                <div key={`${run.id}-${artifactId}`} className="panel-card nested-card premium-artifact-card">
                  <div className="eyebrow">{artifact?.kind ?? "artifact"}</div>
                  <h3>{artifact?.name ?? artifactId}</h3>
                  <p>{artifact?.description ?? "Artifact metadata is not available yet."}</p>
                  <p className="muted">{artifact?.preview ?? "Preview not available."}</p>
                </div>
              );
            })}
          </div>
        ) : null}
        {run?.outputs?.length ? (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Output record</th>
                </tr>
              </thead>
              <tbody>
                {run.outputs.map((output) => (
                  <tr key={output}>
                    <td>{output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </article>

      <article className="panel-card premium-section-card">
        <h2>Event log</h2>
        {run?.logs?.length ? (
          <pre className="code-block">{run.logs.join("\n")}</pre>
        ) : (
          <p className="muted">No log lines are stored for this run yet.</p>
        )}
      </article>
    </section>
  );
}
