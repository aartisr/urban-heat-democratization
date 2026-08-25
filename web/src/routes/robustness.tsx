import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import "./robustness.css";

import { ScienceDemocratizationBanner } from "../components/science-democratization-banner";
import { WorkflowHeader } from "../components/workflow-header";
import { getRobustnessLab, runRobustnessExperiment } from "../lib/api";
import type { RobustnessLab, RobustnessLabExperiment } from "../lib/types";

const DEFAULT_EXPERIMENT: RobustnessLabExperiment = { edgeRetention: 0.7, trials: 256, redundantLinks: 1 };

function Bar({ value, color }: { value: number; color: string }) {
  return <div className="robustness-bar-row"><progress className={`robustness-progress ${color === "#1d4ed8" ? "is-baseline" : "is-intervention"}`} max={1} value={Math.max(0.02, value)} /><strong>{value.toFixed(2)}</strong></div>;
}

function NetworkSketch({ redundantLinks, edgeRetention }: Pick<RobustnessLabExperiment, "redundantLinks" | "edgeRetention">) {
  const nodes = [{ x: 57, y: 110 }, { x: 104, y: 132 }, { x: 145, y: 87 }, { x: 202, y: 98 }, { x: 246, y: 66 }, { x: 300, y: 90 }, { x: 329, y: 137 }, { x: 279, y: 166 }, { x: 87, y: 76 }];
  const links = [[0, 1], [1, 8], [8, 0], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 4]];
  const backups = [[0, 3], [1, 4], [0, 4]];
  const line = (from: number, to: number) => `M ${nodes[from].x} ${nodes[from].y} L ${nodes[to].x} ${nodes[to].y}`;
  return <figure className="robustness-network" aria-label="Irregular synthetic city district with a cooling hub, a narrow corridor, and optional redundant routes"><svg viewBox="0 0 380 215" role="img" aria-hidden="true">
    <defs><linearGradient id="district-fill" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#d9f3ee" /><stop offset="1" stopColor="#edf5ff" /></linearGradient><filter id="hub-glow"><feGaussianBlur stdDeviation="5" /></filter></defs>
    <path className="district-boundary" d="M 30 72 L 58 34 L 142 25 L 201 47 L 284 25 L 351 62 L 354 137 L 319 187 L 231 190 L 168 178 L 100 190 L 42 160 Z" />
    <path className="district-water" d="M 33 145 C 67 127 75 148 107 143 C 137 139 148 126 171 141" />
    <path className="district-corridor" d="M 115 126 L 238 72" />
    {links.map(([from, to]) => <path key={`${from}-${to}`} d={line(from, to)} className="network-link" style={{ opacity: Math.max(0.24, edgeRetention) }} />)}
    {backups.slice(0, redundantLinks).map(([from, to]) => <path key={`${from}-${to}`} d={line(from, to)} className="network-link network-link-backup" />)}
    {nodes.map((node, index) => <g key={index}><circle cx={node.x} cy={node.y} r={index === 0 ? "17" : "10"} className={index === 0 ? "network-node network-sink" : "network-node"} />{index === 0 ? <circle cx={node.x} cy={node.y} r="23" className="network-halo" /> : null}<text x={node.x} y={node.y + 4} textAnchor="middle">{index === 0 ? "C" : index}</text></g>)}
    <text className="district-label" x="156" y="164">modeled bottleneck</text>
  </svg><figcaption><span className="network-legend-sink" /> Cooling hub <span className="network-legend-corridor" /> Vulnerable corridor <span className="network-legend-backup" /> Redundant route</figcaption></figure>;
}

function PercolationChart({ data, activeRow }: { data: RobustnessLab; activeRow: number }) {
  const point = (value: number, index: number) => `${24 + index * (312 / Math.max(1, data.pValues.length - 1))},${150 - value * 116}`;
  const baseline = data.baselinePercolation.map(point).join(" ");
  const intervention = data.interventionPercolation.map(point).join(" ");
  const selected = data.pValues[activeRow];
  return <div className="robustness-chart" aria-label="Percolation curve: edge-retention chance on the horizontal axis and largest connected share on the vertical axis."><svg viewBox="0 0 360 196" role="img"><title>Percolation curve: largest connected share by edge-retention chance</title><line x1="24" y1="150" x2="336" y2="150" className="chart-axis" /><line x1="24" y1="34" x2="24" y2="150" className="chart-axis" /><text x="4" y="38">1.0</text><text x="4" y="154">0</text><line x1={24 + activeRow * (312 / Math.max(1, data.pValues.length - 1))} y1="28" x2={24 + activeRow * (312 / Math.max(1, data.pValues.length - 1))} y2="150" className="chart-selection" /><polyline points={baseline} className="chart-line chart-baseline" /><polyline points={intervention} className="chart-line chart-intervention" />{data.pValues.map((p, index) => <g key={p}><circle cx={24 + index * (312 / Math.max(1, data.pValues.length - 1))} cy={150 - (data.baselinePercolation[index] ?? 0) * 116} r="3" className="chart-dot chart-baseline" /><circle cx={24 + index * (312 / Math.max(1, data.pValues.length - 1))} cy={150 - (data.interventionPercolation[index] ?? 0) * 116} r="3" className="chart-dot chart-intervention" />{index % 2 === 0 ? <text x={24 + index * (312 / Math.max(1, data.pValues.length - 1))} y="169" textAnchor="middle">{p.toFixed(1)}</text> : null}</g>)}<text x="180" y="14" textAnchor="middle">Y · Largest connected share (0–1)</text><text x="180" y="188" textAnchor="middle">X · Edge-retention chance, p (0–1)</text></svg><div><span className="chart-key chart-key-baseline">Baseline</span><span className="chart-key chart-key-intervention">With routes</span><span className="chart-key-selection">Selected p = {selected?.toFixed(1)}</span><span className="chart-axis-key">X: chance each modeled link remains · Y: share of the district still connected</span></div></div>;
}

function ResultSummary({ data }: { data: RobustnessLab }) {
  const gain = data.reliabilityIntervention - data.reliabilityBaseline;
  return <div className="robustness-result-summary" aria-live="polite"><span>At this stress level</span><strong>{gain >= 0 ? "+" : ""}{(gain * 100).toFixed(1)} points</strong><p>change in the modeled share of nodes connected to the cooling point.</p></div>;
}

function ExperimentExplanation({ data, experiment }: { data: RobustnessLab; experiment: RobustnessLabExperiment }) {
  const gain = data.reliabilityIntervention - data.reliabilityBaseline;
  const routeText = experiment.redundantLinks === 0 ? "no alternate modeled routes" : `${experiment.redundantLinks} alternate modeled route${experiment.redundantLinks === 1 ? "" : "s"}`;
  return <article className="experiment-explanation" aria-live="polite"><div><span className="eyebrow">Your experiment, translated</span><h2>You tested whether a narrow modeled heat-and-cooling corridor holds together under stress.</h2></div><ol><li><strong>Starting point:</strong> an irregular nine-node scenario district with a cooling hub and a narrow central corridor—the kind of structural weak point the project’s spectral workflow seeks to flag for investigation.</li><li><strong>Your stress assumption:</strong> each modeled adjacent-cell connection had a <strong>{Math.round(experiment.edgeRetention * 100)}%</strong> chance of remaining available in each of <strong>{experiment.trials.toLocaleString()}</strong> simulated trials.</li><li><strong>Your scenario change:</strong> you added <strong>{routeText}</strong>. In a real planning conversation, that stands for examining ways to create more continuous shade, vegetation, cooler materials, or links toward verified cooling assets—not selecting a construction project automatically.</li><li><strong>What the result says:</strong> modeled sink connectivity changed from <strong>{(data.reliabilityBaseline * 100).toFixed(1)}%</strong> to <strong>{(data.reliabilityIntervention * 100).toFixed(1)}%</strong> ({gain >= 0 ? "+" : ""}{(gain * 100).toFixed(1)} percentage points) under that assumption.</li></ol><p className="experiment-explanation-caveat"><strong>Real-world meaning:</strong> this is evidence that alternate thermal-landscape connections can make the <em>model</em> less fragile. Before action, compare it with the bundled {data.reference.source} field, verify actual shade, sidewalks, accessibility, ownership, safety, and cooling-site operations with local evidence and community knowledge.</p></article>;
}

function RealityAnchor({ data }: { data: RobustnessLab }) {
  const reference = data.reference;
  return <article className="robustness-reality-anchor" aria-label="How this lab connects to the project data"><div><span className="eyebrow">Project reality anchor</span><h2>The method is real. The interactive district is a scenario.</h2><p>{reference.scope}</p></div><div className="reality-anchor-metrics"><div><strong>{reference.rasterShape.join(" × ") || "—"}</strong><span>raster cells</span></div><div><strong>{reference.graphNodes.toLocaleString()}</strong><span>graph nodes</span></div><div><strong>{reference.graphEdges.toLocaleString()}</strong><span>adjacent links</span></div><div><strong>{reference.inferredCoolingSinks.toLocaleString()}</strong><span>inferred sinks</span></div></div><div className="reality-anchor-source"><strong>{reference.label}</strong><span>{reference.source} · {reference.provider} · {reference.resolutionM > 0 ? `${reference.resolutionM} m` : "scale unavailable"}</span><small>{reference.limitations}</small></div></article>;
}

function CorridorExplanation() {
  return <details className="corridor-explanation"><summary>Why is the highlighted corridor a modeled bottleneck?</summary><div><p><strong>In this scenario:</strong> two denser node clusters are joined through only three central links. Removing one of those links has a much larger effect than removing an edge inside either cluster, because there are fewer ways around it.</p><p><strong>What qualifies it mathematically:</strong> the project’s spectral sweep looks for a partition with a small weighted boundary relative to the connected volume on either side (conductance, <em>φ</em>). A small boundary is a bottleneck signal; a low second Laplacian eigenvalue (<em>λ₂</em>) is another sign that the graph is weakly stitched together.</p><p><strong>What it means for heat:</strong> it is a possible break in modeled thermal-landscape continuity—not proof that the corridor is hottest. In a real study, local thermal gradients, vegetation when available, and the actual raster topology determine the signal. Field evidence must then establish what, if anything, is physically vulnerable.</p></div></details>;
}

function ComparisonReadout({ data }: { data: RobustnessLab }) {
  const items = [
    { label: "Modeled sink connection", before: data.reliabilityBaseline, after: data.reliabilityIntervention, suffix: "%", scale: 100, higherIsBetter: true },
    { label: "Network stitching (λ₂)", before: data.lambda2Baseline, after: data.lambda2Intervention, suffix: "", scale: 1, higherIsBetter: true },
    { label: "Bottleneck signal (φ)", before: data.phiBaseline, after: data.phiIntervention, suffix: "", scale: 1, higherIsBetter: false },
  ];
  return <div className="robustness-comparison-readout">{items.map((item) => { const change = item.after - item.before; const favorable = item.higherIsBetter ? change >= 0 : change <= 0; const format = (value: number) => item.suffix ? `${(value * item.scale).toFixed(1)}${item.suffix}` : value.toFixed(3); return <div key={item.label}><span>{item.label}</span><strong>{format(item.before)} <i>→</i> {format(item.after)}</strong><small className={favorable ? "is-favorable" : ""}>{change === 0 ? "No modeled change" : `${favorable ? "Improves" : "Decreases"} by ${format(Math.abs(change))}`}</small></div>; })}</div>;
}

export function RobustnessPage() {
  const robustnessQuery = useQuery({ queryKey: ["robustness-lab"], queryFn: getRobustnessLab });
  const [experiment, setExperiment] = useState(DEFAULT_EXPERIMENT);
  const experimentMutation = useMutation({ mutationFn: runRobustnessExperiment });
  const [showExplanation, setShowExplanation] = useState(false);
  const data = experimentMutation.data ?? robustnessQuery.data;
  const resultExperiment = experimentMutation.variables ?? DEFAULT_EXPERIMENT;
  const hasUnrunChanges = Object.keys(experiment).some((key) => experiment[key as keyof RobustnessLabExperiment] !== resultExperiment[key as keyof RobustnessLabExperiment]);
  const displayedExperiment = hasUnrunChanges ? resultExperiment : experiment;
  const activeRow = data ? data.pValues.reduce((closest, p, index) => Math.abs(p - displayedExperiment.edgeRetention) < Math.abs(data.pValues[closest] - displayedExperiment.edgeRetention) ? index : closest, 0) : 0;
  const reset = () => { setExperiment(DEFAULT_EXPERIMENT); experimentMutation.reset(); setShowExplanation(false); };

  return <section className="page-stack robustness-page">
    <WorkflowHeader eyebrow="Interactive robustness lab" title="Change the assumptions. Watch the modeled network respond." description={data?.summary ?? "This laboratory uses a synthetic network to explain the project’s model mechanics. It is not a measured city outcome, a forecast, or an intervention guarantee."} />
    <aside className="honesty-callout" aria-label="How to read this laboratory"><strong>A short, controlled learning experiment</strong><span>Choose a stress level and backup routes, then run the model. The district is synthetic; the graph method and bundled thermal reference are real project inputs.</span></aside>

    {data ? <details className="lab-context"><summary>About this model, the real project data, and what “connected” means</summary><RealityAnchor data={data} /><aside className="robustness-connection-meaning" aria-label="What connection means in this model"><div><div><strong>In the graph</strong><p>Adjacent study cells form a modeled connection. A chain of cells creates a modelled route.</p></div><div><strong>In the real world</strong><p>It signals possible thermal and landscape continuity worth checking on the ground.</p></div><div><strong>It does not mean</strong><p>It does not prove walkability, public access, safety, or a person’s ability to reach cooling.</p></div></div></aside></details> : null}

    <article className="robustness-playground panel-card">
      <div className="robustness-playground-heading"><div><span className="eyebrow">Your controlled experiment</span><h2>Build a resilience hypothesis</h2><p>One input at a time, with a repeatable random seed so comparisons stay fair.</p></div><NetworkSketch redundantLinks={experiment.redundantLinks} edgeRetention={experiment.edgeRetention} /></div><CorridorExplanation />
      <div className="robustness-controls">
        <label><span>Retention chance <strong>{Math.round(experiment.edgeRetention * 100)}%</strong></span><input type="range" min="10" max="100" step="5" value={Math.round(experiment.edgeRetention * 100)} onChange={(event) => setExperiment((current) => ({ ...current, edgeRetention: Number(event.target.value) / 100 }))} /><small><strong>{Math.round(experiment.edgeRetention * 100)}%</strong> means each modeled connection has a {Math.round(experiment.edgeRetention * 100)}-in-100 chance of staying available in one simulated stress test. The other {100 - Math.round(experiment.edgeRetention * 100)} chances represent a removed connection.</small></label>
        <label><span>Monte Carlo trials <strong>{experiment.trials.toLocaleString()}</strong></span><select value={experiment.trials} onChange={(event) => setExperiment((current) => ({ ...current, trials: Number(event.target.value) }))}>{[64, 128, 256, 512, 1024].map((trials) => <option key={trials} value={trials}>{trials.toLocaleString()} trials</option>)}</select><small>More trials make the average steadier; they do not make it a city forecast.</small></label>
        <fieldset><legend>Redundant routes</legend><div className="robustness-choice-group">{[0, 1, 2, 3].map((links) => <button type="button" className={experiment.redundantLinks === links ? "is-selected" : ""} onClick={() => setExperiment((current) => ({ ...current, redundantLinks: links }))} key={links}>{links === 0 ? "None" : `${links} route${links === 1 ? "" : "s"}`}</button>)}</div><small><strong>Redundant</strong> means an alternate modeled connection around the narrow corridor. If one connection is removed in a stress test, another route may still keep areas linked to the cooling hub. In practice, it is a prompt to investigate continuity of shade, vegetation, cooler materials, or verified cooling access—not a proposed road or automatic project.</small></fieldset>
      </div>
      <div className="robustness-actions"><button className="button-link" type="button" onClick={() => { setShowExplanation(false); experimentMutation.mutate(experiment); }} disabled={experimentMutation.isPending}>{experimentMutation.isPending ? "Running experiment…" : hasUnrunChanges ? "Run updated experiment" : "Run this experiment"}</button><button className="button-link secondary" type="button" onClick={reset}>Reset</button>{data && !hasUnrunChanges ? <button className="button-link secondary" type="button" onClick={() => setShowExplanation((shown) => !shown)} aria-expanded={showExplanation}>{showExplanation ? "Hide run explanation" : "Explain this run"}</button> : null}{experimentMutation.isError ? <span className="form-error">The experiment could not run. Please try again.</span> : null}{hasUnrunChanges ? <span className="robustness-pending">Settings changed—run the experiment to update the readout.</span> : null}{data && !hasUnrunChanges ? <ResultSummary data={data} /> : null}</div>
      {data && !hasUnrunChanges && showExplanation ? <ExperimentExplanation data={data} experiment={resultExperiment} /> : null}
    </article>

    {data ? <><article className="panel-card robustness-results"><div><span className="eyebrow">Your result</span><h2>Did backup routes make this model less fragile?</h2><p>Read the change first; open the detail only if you need it.</p></div><ComparisonReadout data={data} /><details className="lab-detail"><summary>See the assumptions and metric notes</summary><ul className="bullet-list">{data.notes.map((note) => <li key={note}>{note}</li>)}</ul></details></article>
      <article className="panel-card"><div className="robustness-table-heading"><div><h2>Percolation curve</h2><p>How much of the modeled district remains connected as stress increases.</p></div><span>Largest connected share</span></div><PercolationChart data={data} activeRow={activeRow} /><details className="lab-detail"><summary>How to read this curve and see the data table</summary><div className="percolation-explainer"><div><span className="eyebrow">What it is</span><h3>A controlled “what stays connected?” test.</h3><p>For each retention chance <strong>p</strong>, the model independently keeps or removes every network connection.</p></div><div><span className="eyebrow">Backup routes</span><h3>They create another option.</h3><p>If a corridor link disappears, a backup may keep modeled thermal-landscape continuity to the hub.</p></div><div><span className="eyebrow">Use it safely</span><h3>It is not a failure forecast.</h3><p>Use it to ask where local evidence should be gathered next.</p></div></div><div className="table-shell"><table><thead><tr><th>Retention chance</th><th>Baseline district</th><th>With redundant routes</th></tr></thead><tbody>{data.pValues.map((p, index) => <tr key={p} className={index === activeRow ? "is-active" : undefined}><td>{p.toFixed(1)}{index === activeRow ? " · your setting" : ""}</td><td><Bar value={data.baselinePercolation[index] ?? 0} color="#1d4ed8" /></td><td><Bar value={data.interventionPercolation[index] ?? 0} color="#f97316" /></td></tr>)}</tbody></table></div></details></article>
      <details className="lab-context"><summary>See the formulas behind the lab</summary><ScienceDemocratizationBanner /></details></> : null}
  </section>;
}
