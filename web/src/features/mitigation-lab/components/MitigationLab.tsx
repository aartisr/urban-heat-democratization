import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkflowHeader } from "../../../components/workflow-header";
import { getBostonMitigationLabBaseline, getMitigationLabGraphBaseline, getMitigationLabGraphDelta } from "../../../lib/api";
import { interventionById, interventionDefinitions } from "../domain/intervention-registry";
import { EXPLORE_MODE_LABEL, evidenceDescription } from "../domain/evidence-policy";
import { decodeShareScenario, encodeShareScenario } from "../domain/share-scenario";
import type { InterventionDefinition, PlacedIntervention } from "../domain/types";
import { adaptBostonStudyBaseline, createSyntheticBaseline } from "../fixtures/synthetic-neighborhood";
import { useLabWorker } from "../hooks/useLabWorker";
import { useMitigationScenario } from "../hooks/useMitigationScenario";
import { ImpactReadout } from "./ImpactReadout";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { InterventionCanvas } from "./InterventionCanvas";
import { InterventionTray } from "./InterventionTray";

const syntheticBaseline = createSyntheticBaseline();
function downloadScenario(payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "heat-mitigation-planning-hypothesis.json"; link.click(); URL.revokeObjectURL(url);
}

export function MitigationLab() {
  const restoredScenario = useMemo(() => typeof window === "undefined" ? null : decodeShareScenario(new URLSearchParams(window.location.hash.slice(1)).get("scenario") ?? ""), []);
  const { scenario, act, undo, reset, canUndo } = useMitigationScenario(restoredScenario);
  const [selected, setSelected] = useState<InterventionDefinition | null>(null);
  const [compareScenario, setCompareScenario] = useState<typeof scenario | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [baselineMode, setBaselineMode] = useState<"synthetic" | "boston">("synthetic");
  const bostonBaselineQuery = useQuery({ queryKey: ["mitigation-lab-boston-baseline"], queryFn: getBostonMitigationLabBaseline, enabled: baselineMode === "boston", retry: false });
  const graphBaselineQuery = useQuery({ queryKey: ["mitigation-lab-graph-baseline"], queryFn: getMitigationLabGraphBaseline, retry: false });
  const redundantLinks = scenario.interventions.filter((item) => item.definitionId === "cooling-access-node").length;
  const graphDeltaQuery = useQuery({ queryKey: ["mitigation-lab-graph-delta", Math.min(3, redundantLinks)], queryFn: () => getMitigationLabGraphDelta(Math.min(3, redundantLinks)), enabled: Boolean(graphBaselineQuery.data), retry: false });
  const baseline = useMemo(
    () => baselineMode === "boston" && bostonBaselineQuery.data ? adaptBostonStudyBaseline(bostonBaselineQuery.data) : syntheticBaseline,
    [baselineMode, bostonBaselineQuery.data],
  );
  useEffect(() => { if (scenario.baselineId !== baseline.id) act({ type: "replace", scenario: { ...scenario, baselineId: baseline.id } }); }, [act, baseline.id, scenario]);
  const { result, isCalculating } = useLabWorker(baseline, scenario);
  const placed = useMemo(() => scenario.interventions.map((item) => ({ item, definition: interventionById(item.definitionId) })).filter((entry): entry is { item: PlacedIntervention; definition: InterventionDefinition } => Boolean(entry.definition)), [scenario.interventions]);
  const place = (x: number, y: number) => {
    if (!selected) return;
    const id = `${selected.id}-${scenario.interventions.length + 1}`;
    act({ type: "add", intervention: { id, definitionId: selected.id, definitionVersion: selected.version, geometry: { kind: selected.geometry[0], points: [{ x, y }] }, parameters: { ...selected.defaultParameters } } });
    setSelected(null);
  };
  const copyShareLink = async () => {
    try {
      const encoded = encodeShareScenario(scenario);
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#scenario=${encoded}`);
      setShareMessage("Share link copied. It contains only this synthetic scenario sketch.");
    } catch (error) { setShareMessage(error instanceof Error ? error.message : "Could not create a share link."); }
  };
  const exportScenario = () => downloadScenario({ scenario, baseline: { id: baseline.id, version: baseline.version }, result: { changedCells: result.changedCells, averagePriorityShift: result.averagePriorityShift, connectedShare: result.connectedShare }, limitations: baseline.limitations, statement: "Planning exploration; not a measured or guaranteed temperature outcome." });
  return <section className="page-stack mitigation-page">
    <WorkflowHeader wide eyebrow="Interactive heat-mitigation lab" title="Test a planning idea—without mistaking it for a forecast." description="Arrange one intervention at a time in a fictional neighborhood, then read the modeled priority and route pattern alongside its limits." />
    <aside className="mitigation-honesty" aria-label="Evidence boundary"><strong>{EXPLORE_MODE_LABEL}</strong><span>{evidenceDescription("illustrative")}</span></aside>
    <section className="mitigation-baseline-choice" aria-label="Study context"><div><span className="eyebrow">Choose study context</span><h2>Start with a safe scale</h2><p>{baselineMode === "boston" ? "Boston is shown as an aggregated study-scale priority field from bundled overlays—not a temperature map or precise location layer." : "Use the fictional neighborhood to learn the interaction before working with a study-scale context."}</p></div><div className="mitigation-choice-buttons"><button type="button" className={baselineMode === "synthetic" ? "is-selected" : ""} onClick={() => setBaselineMode("synthetic")}>Fictional learning grid</button><button type="button" className={baselineMode === "boston" ? "is-selected" : ""} onClick={() => setBaselineMode("boston")}>Boston study aggregate</button></div>{baselineMode === "boston" && bostonBaselineQuery.isError ? <p className="form-error">Boston study context is unavailable; the fictional learning grid remains available.</p> : null}</section>
    <section className="mitigation-workbench panel-card">
      <div className="mitigation-question"><span className="eyebrow">One question</span><h2>Where might shade and surface changes deserve closer investigation?</h2><p>You are working at study scale. Exact addresses are not accepted here.</p></div>
      <InterventionTray selectedId={selected?.id ?? null} onSelect={setSelected} />
      <InterventionCanvas baseline={baseline} result={result} selected={selected} interventions={scenario.interventions} graphBaseline={graphBaselineQuery.data} quickInterventions={interventionDefinitions} onSelectIntervention={setSelected} canUndo={canUndo} onUndo={undo} onReset={reset} onCopy={copyShareLink} onExport={exportScenario} onPlace={place} onMove={(id, x, y) => { const intervention = scenario.interventions.find((item) => item.id === id); if (intervention) act({ type: "update", intervention: { ...intervention, geometry: { ...intervention.geometry, points: [{ x, y }] } } }); }} onRemove={(id) => act({ type: "remove", id })} />
      <section className="mitigation-list-editor" aria-label="Placed interventions"><div><span className="eyebrow">Your sketch</span><h2>Placed interventions</h2></div>{placed.length ? <ul>{placed.map(({ item, definition }) => <li key={item.id}><span className="mitigation-icon" aria-hidden="true">{definition.accessibility.icon}</span><div><strong>{definition.name}</strong><small>{definition.limitation}</small></div><label>Strength<input aria-label={`${definition.name} strength`} type="range" min={definition.parameterSchema[0].min} max={definition.parameterSchema[0].max} step={definition.parameterSchema[0].step} value={item.parameters.strength} onChange={(event) => act({ type: "update", intervention: { ...item, parameters: { ...item.parameters, strength: Number(event.target.value) } } })} /></label><button type="button" className="text-button" onClick={() => act({ type: "remove", id: item.id })}>Remove</button></li>)}</ul> : <p className="mitigation-empty">Nothing placed yet. Pick one intervention above, then click the synthetic grid.</p>}</section>
      <EvidenceDrawer definitions={placed.map(({ definition }) => definition)} />
      <div className="mitigation-actions"><button type="button" className="button-link" onClick={() => setCompareScenario(scenario)} disabled={!scenario.interventions.length}>Compare this sketch</button>{shareMessage ? <span className="mitigation-share-message" role="status">{shareMessage}</span> : null}</div>
    </section>
    <ImpactReadout baseline={baseline} result={result} interventionCount={scenario.interventions.length} isCalculating={isCalculating} graphBaseline={graphBaselineQuery.data} graphDelta={graphDeltaQuery.data} graphError={graphBaselineQuery.isError || graphDeltaQuery.isError} />
    {compareScenario ? <section className="mitigation-compare panel-card" aria-live="polite"><div><span className="eyebrow">Compare designs</span><h2>Saved reference: {compareScenario.interventions.length} intervention{compareScenario.interventions.length === 1 ? "" : "s"}</h2><p>Your current sketch has {scenario.interventions.length} intervention{scenario.interventions.length === 1 ? "" : "s"}. The JSON export preserves both inputs and the model boundary for review.</p></div><button type="button" className="button-link secondary" onClick={() => setCompareScenario(null)}>Close comparison</button></section> : null}
  </section>;
}
