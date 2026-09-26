import { useEffect, useMemo, useRef, useState } from "react";

import type { CityMapData, CityMapOverlay, PlanningMode, ScenarioRecord } from "../../../lib/types";
import { COMPARISON_BUDGET_PRESETS, comparisonClaimBoundary, comparisonScenarioTitle } from "../domain/evidence-policy";
import { modelPlanningPriority } from "../engine/planning-priority";

type ComparisonView = "side-by-side" | "difference";
type MobileView = "baseline" | "scenario" | "difference";
type MapCamera = { x: number; y: number; zoom: number };

const DEFAULT_CAMERA: MapCamera = { x: 0, y: 0, zoom: 1 };

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function normaliseCamera(camera: MapCamera): MapCamera {
  const zoom = clamp(camera.zoom, 1, 5);
  const span = 100 / zoom;
  return { zoom, x: clamp(camera.x, 0, 100 - span), y: clamp(camera.y, 0, 100 - span) };
}

function zoomCamera(camera: MapCamera, factor: number): MapCamera {
  const before = normaliseCamera(camera);
  const centerX = before.x + (50 / before.zoom);
  const centerY = before.y + (50 / before.zoom);
  const zoom = clamp(before.zoom * factor, 1, 5);
  return normaliseCamera({ zoom, x: centerX - (50 / zoom), y: centerY - (50 / zoom) });
}

function heatColor(value: number, max: number) {
  const t = clamp01(value / Math.max(1, max));
  if (t < 0.33) return "#dbeafe";
  if (t < 0.58) return "#fcd34d";
  if (t < 0.8) return "#fb923c";
  return "#dc2626";
}

function deltaColor(value: number, maxReduction: number) {
  const t = clamp01(Math.abs(value) / Math.max(0.001, maxReduction));
  return `rgba(13, 148, 136, ${0.18 + (t * 0.72)})`;
}

function polygonPoints(overlay: CityMapOverlay, bounds: NonNullable<CityMapData["bounds"]>) {
  const spanLng = Math.max(0.00001, bounds.maxLng - bounds.minLng);
  const spanLat = Math.max(0.00001, bounds.maxLat - bounds.minLat);
  return overlay.points.map((point) => {
    const x = ((point.x - bounds.minLng) / spanLng) * 100;
    const y = (1 - ((point.y - bounds.minLat) / spanLat)) * 100;
    return `${x.toFixed(3)},${y.toFixed(3)}`;
  }).join(" ");
}

function geographicPoints(points: CityMapData["boundary"], bounds: NonNullable<CityMapData["bounds"]>) {
  const spanLng = Math.max(0.00001, bounds.maxLng - bounds.minLng);
  const spanLat = Math.max(0.00001, bounds.maxLat - bounds.minLat);
  // The precise boundary can contain many thousands of vertices. A capped,
  // evenly sampled outline preserves its geography without rendering two
  // expensive full-resolution paths beside the scenario polygons.
  const stride = Math.max(1, Math.ceil(points.length / 1800));
  const sampled = points.filter((_, index) => index % stride === 0 || index === points.length - 1);
  return sampled.map((point) => {
    const x = ((point.x - bounds.minLng) / spanLng) * 100;
    const y = (1 - ((point.y - bounds.minLat) / spanLat)) * 100;
    return `${x.toFixed(3)},${y.toFixed(3)}`;
  }).join(" ");
}

function geometryBounds(overlays: CityMapOverlay[]): NonNullable<CityMapData["bounds"]> | null {
  const points = overlays.flatMap((overlay) => overlay.points);
  if (points.length === 0) return null;
  return {
    minLng: Math.min(...points.map((point) => point.x)),
    minLat: Math.min(...points.map((point) => point.y)),
    maxLng: Math.max(...points.map((point) => point.x)),
    maxLat: Math.max(...points.map((point) => point.y)),
  };
}

function polygonCenter(overlay: CityMapOverlay, bounds: NonNullable<CityMapData["bounds"]>) {
  const points = overlay.points;
  if (points.length === 0) return null;
  const center = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
  const spanLng = Math.max(0.00001, bounds.maxLng - bounds.minLng);
  const spanLat = Math.max(0.00001, bounds.maxLat - bounds.minLat);
  return {
    x: ((center.x / points.length - bounds.minLng) / spanLng) * 100,
    y: (1 - ((center.y / points.length - bounds.minLat) / spanLat)) * 100,
  };
}

function useCompactComparison() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return compact;
}

function ComparisonNotice({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="scenario-comparison scenario-comparison-notice panel-card" aria-labelledby="scenario-comparison-notice-title">
      <span className="eyebrow">Planning comparison</span>
      <h2 id="scenario-comparison-notice-title">{title}</h2>
      <p>{detail}</p>
    </section>
  );
}

function ExactScenarioRequiredMap({ budgetUsd, onGenerate, generating }: { budgetUsd: number; onGenerate?: () => void; generating?: boolean }) {
  return (
    <section className="scenario-comparison-map scenario-comparison-required-map" aria-label={`After scenario required for $${budgetUsd.toLocaleString()}`}>
      <div className="scenario-comparison-map-head"><strong>After · exact scenario required</strong><span>No substituted result</span></div>
      <div className="scenario-comparison-required-copy">
        <span className="eyebrow">Honest comparison</span>
        <strong>Generate the ${budgetUsd.toLocaleString()} scenario to see its modeled priority field.</strong>
        <p>The baseline is available now. The after map and difference remain blank until this exact budget has a documented allocation and evidence record.</p>
        <div>{onGenerate ? <button type="button" onClick={onGenerate} disabled={generating}>{generating ? "Generating…" : `Generate $${budgetUsd.toLocaleString()} scenario`}</button> : null}<a href="#scenario-generator">Open generator</a></div>
      </div>
    </section>
  );
}

/** A non-interactive geographic reference layer; it never contributes to model values. */
type BasemapStatus = "loading" | "ready" | "unavailable";

/**
 * Optional street context. The city boundary is drawn in the SVG too, so a
 * corporate network, an ad blocker, or an unavailable tile host never turns
 * the comparison into an empty or misleading grid.
 */
function StreetMapContext({ bounds, onStatus }: { bounds: NonNullable<CityMapData["bounds"]>; onStatus: (status: BasemapStatus) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    onStatus("loading");
    let map: {
      fitBounds: (bounds: [[number, number], [number, number]], options?: { padding?: number; duration?: number }) => void;
      resize: () => void;
      remove: () => void;
      once: (event: string, listener: () => void) => void;
      on: (event: string, listener: () => void) => void;
    } | null = null;
    const resizeObserver = new ResizeObserver(() => map?.resize());
    resizeObserver.observe(container);

    void (async () => {
      const [maplibreModule] = await Promise.all([import("maplibre-gl"), import("maplibre-gl/dist/maplibre-gl.css")]);
      if (disposed || !containerRef.current) return;
      const maplibregl = ("default" in maplibreModule ? maplibreModule.default : maplibreModule) as typeof maplibreModule.default;
      map = new maplibregl.Map({
        container: containerRef.current,
        attributionControl: false,
        interactive: false,
        fadeDuration: 0,
        style: {
          version: 8,
          sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } },
          layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.72, "raster-brightness-max": 0.92 } }],
        },
        center: [(bounds.minLng + bounds.maxLng) / 2, (bounds.minLat + bounds.maxLat) / 2],
        zoom: 11,
      });
      map.once("idle", () => { if (!disposed) onStatus("ready"); });
      map.on("error", () => { if (!disposed) onStatus("unavailable"); });
      map.fitBounds([[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]], { padding: 18, duration: 0 });
    })().catch(() => { if (!disposed) onStatus("unavailable"); });

    return () => { disposed = true; resizeObserver.disconnect(); map?.remove(); };
  }, [bounds.maxLat, bounds.maxLng, bounds.minLat, bounds.minLng]);

  return <div ref={containerRef} className="scenario-comparison-basemap" aria-hidden="true" />;
}

function MiniMap({
  label, cityName, boundary, overlays, contextOverlays, values, maxValue, selectedId, onSelect, kind, bounds, camera, onCameraChange,
}: {
  label: string;
  cityName: string;
  boundary: CityMapData["boundary"];
  overlays: CityMapOverlay[];
  contextOverlays: CityMapOverlay[];
  values: Map<string, number>;
  maxValue: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  kind: "priority" | "difference";
  bounds: NonNullable<CityMapData["bounds"]>;
  camera: MapCamera;
  onCameraChange: (next: MapCamera) => void;
}) {
  const dragRef = useRef<{ clientX: number; clientY: number; camera: MapCamera } | null>(null);
  const [basemapStatus, setBasemapStatus] = useState<BasemapStatus>("loading");
  const safeCamera = normaliseCamera(camera);
  const span = 100 / safeCamera.zoom;
  const endDrag = () => { dragRef.current = null; };

  return (
    <section className="scenario-comparison-map" aria-label={label}>
      <div className="scenario-comparison-map-head"><strong>{label}</strong><span>{kind === "priority" ? "Shared priority scale" : "Lower modeled priority"}</span></div>
      <StreetMapContext bounds={bounds} onStatus={setBasemapStatus} />
      <svg
        viewBox={`${safeCamera.x} ${safeCamera.y} ${span} ${span}`}
        role="img"
        aria-label={`${label}. Select a polygon to compare its planning value. Drag or use the shared zoom controls to explore both maps together.`}
        onWheel={(event) => { event.preventDefault(); onCameraChange(zoomCamera(safeCamera, event.deltaY < 0 ? 1.2 : 1 / 1.2)); }}
        onPointerDown={(event) => { dragRef.current = { clientX: event.clientX, clientY: event.clientY, camera: safeCamera }; }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const dx = ((event.clientX - drag.clientX) / Math.max(1, rect.width)) * span;
          const dy = ((event.clientY - drag.clientY) / Math.max(1, rect.height)) * span;
          onCameraChange(normaliseCamera({ ...drag.camera, x: drag.camera.x - dx, y: drag.camera.y - dy }));
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <rect x="0" y="0" width="100" height="100" fill="rgba(248, 250, 252, 0.13)" />
        {boundary.length > 1 ? <polygon className="scenario-comparison-boundary-line" points={geographicPoints(boundary, bounds)} /> : null}
        <text className="scenario-comparison-city-label" x="50" y="11" textAnchor="middle">{cityName}</text>
        {contextOverlays.map((overlay) => (
          <polygon key={`context-${overlay.id}`} points={polygonPoints(overlay, bounds)} fill="rgba(219, 234, 254, 0.06)" stroke="rgba(71, 85, 105, 0.13)" strokeWidth={0.24} pointerEvents="none" />
        ))}
        {overlays.map((overlay) => {
          const value = values.get(overlay.id) ?? overlay.score;
          const selected = selectedId === overlay.id;
          const center = kind === "difference" ? polygonCenter(overlay, bounds) : null;
          return (
            <g key={overlay.id}>
              <polygon points={polygonPoints(overlay, bounds)} fill={kind === "priority" ? heatColor(value, maxValue) : deltaColor(value, maxValue)} stroke={selected ? "#082f49" : "rgba(15, 23, 42, 0.48)"} strokeWidth={selected ? 1.8 : 0.55} tabIndex={0} role="button" aria-label={`${overlay.label}; ${kind === "priority" ? `priority ${value.toFixed(1)}` : `modeled priority change ${value.toFixed(1)}`}`} onClick={(event) => { event.stopPropagation(); onSelect(overlay.id); }} onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(overlay.id); }
              }} />
              {center ? <text className="scenario-comparison-delta-label" x={center.x} y={center.y} textAnchor="middle" dominantBaseline="central">−{Math.abs(value).toFixed(0)}</text> : null}
            </g>
          );
        })}
      </svg>
      <span className="scenario-comparison-map-attribution">{basemapStatus === "ready" ? <><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Street context © OpenStreetMap contributors</a> · bundled boundary</> : "Bundled municipal boundary · street tiles unavailable"}</span>
    </section>
  );
}

export function ScenarioMapComparison({ cityMap, scenario, budgetUsd, planningMode, onBudgetChange, onGenerateExactScenario, generatingExactScenario = false }: {
  cityMap: CityMapData;
  scenario: ScenarioRecord | null;
  budgetUsd: number;
  planningMode: PlanningMode;
  onBudgetChange: (budgetUsd: number) => void;
  onGenerateExactScenario?: () => void;
  generatingExactScenario?: boolean;
}) {
  const [view, setView] = useState<ComparisonView>("side-by-side");
  const [mobileView, setMobileView] = useState<MobileView>("baseline");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [camera, setCamera] = useState<MapCamera>(DEFAULT_CAMERA);
  const [showCoolingContext, setShowCoolingContext] = useState(false);
  const compact = useCompactComparison();
  const overlays = cityMap.heatZones;
  const isExactBudgetScenario = scenario?.budgetUsd === budgetUsd && scenario.planningMode === planningMode;
  const comparisonScenario = isExactBudgetScenario ? scenario : null;
  const comparison = useMemo(() => comparisonScenario ? modelPlanningPriority(overlays.map((overlay) => ({ id: overlay.id, baseline: overlay.score })), comparisonScenario) : null, [comparisonScenario, overlays]);
  const baselineById = useMemo(() => new Map(overlays.map((overlay) => [overlay.id, overlay.score])), [overlays]);
  const scenarioById = useMemo(() => new Map(comparison?.cells.map((cell) => [cell.id, cell.scenario]) ?? []), [comparison]);
  const deltaById = useMemo(() => new Map(comparison?.cells.map((cell) => [cell.id, cell.delta]) ?? []), [comparison]);
  const maxPriority = Math.max(1, ...overlays.map((overlay) => overlay.score));
  const maxReduction = Math.max(0.001, ...[...deltaById.values()].map((value) => Math.abs(value)));
  const selected = overlays.find((overlay) => overlay.id === selectedId) ?? null;
  const selectedScenario = selected ? scenarioById.get(selected.id) : null;
  const selectedDelta = selected ? deltaById.get(selected.id) : null;
  const comparisonBounds = useMemo(() => geometryBounds([...overlays, ...cityMap.accessZones]) ?? cityMap.bounds, [cityMap.accessZones, cityMap.bounds, overlays]);
  const differenceMetrics = useMemo(() => {
    const reductions = comparison?.cells.map((cell) => Math.max(0, -cell.delta)) ?? [];
    const total = reductions.reduce((sum, reduction) => sum + reduction, 0);
    return { total, average: reductions.length ? total / reductions.length : 0, changed: reductions.filter((reduction) => reduction > 0.01).length };
  }, [comparison]);

  if (!cityMap.bounds || overlays.length === 0) {
    return <ComparisonNotice title="This city does not yet have comparison-ready map polygons" detail="The city needs geographic bounds and heat-priority polygons before the before/after comparison can be drawn. The scenario itself remains available below while map evidence is prepared." />;
  }

  const drawableBounds = comparisonBounds ?? cityMap.bounds;
  const mapProps = { cityName: cityMap.cityName, boundary: cityMap.boundary, overlays, contextOverlays: showCoolingContext ? cityMap.accessZones : [], selectedId, onSelect: setSelectedId, bounds: drawableBounds, camera, onCameraChange: setCamera };
  const baselineMap = <MiniMap label="Before · baseline evidence and priority" values={baselineById} maxValue={maxPriority} kind="priority" {...mapProps} />;
  const scenarioMap = <MiniMap label={`After · ${comparisonScenarioTitle("planning", "priority")}`} values={scenarioById} maxValue={maxPriority} kind="priority" {...mapProps} />;
  const differenceMap = <MiniMap label="Difference · modeled priority reduction" values={deltaById} maxValue={maxReduction} kind="difference" {...mapProps} />;
  const requiredMap = <ExactScenarioRequiredMap budgetUsd={budgetUsd} onGenerate={onGenerateExactScenario} generating={generatingExactScenario} />;
  const showingDifference = compact ? mobileView === "difference" : view === "difference";

  return (
    <section className="scenario-comparison panel-card" aria-labelledby="scenario-comparison-title">
      <div className="scenario-comparison-head"><div><span className="eyebrow">Planning comparison</span><h2 id="scenario-comparison-title">Compare a cooling investment</h2><p>See the same evidence polygons before and after a documented planning scenario. The right view is a modeled priority field, not a temperature forecast.</p></div><span className="truth-badge derived">Planning model</span></div>
      <div className="scenario-comparison-controls" aria-label="Comparison budget"><span>Investment</span><div role="group" aria-label="Choose investment size">{COMPARISON_BUDGET_PRESETS.map((preset) => <button key={preset} type="button" className={budgetUsd === preset ? "active" : ""} onClick={() => onBudgetChange(preset)}>${preset >= 1000000 ? `${preset / 1000000}m` : `${preset / 1000}k`}</button>)}</div>{!compact ? <div className="scenario-comparison-view-control" role="group" aria-label="Comparison display"><button type="button" className={view === "side-by-side" ? "active" : ""} onClick={() => setView("side-by-side")}>Before / scenario</button><button type="button" className={view === "difference" ? "active" : ""} onClick={() => setView("difference")}>Difference</button></div> : null}</div>
      {!isExactBudgetScenario ? <p className="scenario-comparison-scenario-note" role="status">No exact ${budgetUsd.toLocaleString()} scenario is loaded. The after map and difference are intentionally withheld rather than borrowing another budget’s result.</p> : null}
      <div className="scenario-comparison-navigation" aria-label="Linked map navigation"><span>Maps move together</span><button type="button" onClick={() => setCamera((current) => zoomCamera(current, 1.25))}>Zoom in</button><button type="button" onClick={() => setCamera((current) => zoomCamera(current, 1 / 1.25))}>Zoom out</button><button type="button" onClick={() => setCamera(DEFAULT_CAMERA)}>Reset map view</button>{cityMap.accessZones.length > 0 ? <button type="button" aria-pressed={showCoolingContext} onClick={() => setShowCoolingContext((current) => !current)}>Cooling-access context: {showCoolingContext ? "On" : "Off"}</button> : null}</div>
      <div className="scenario-comparison-legend" aria-label="Priority interpretation">{showCoolingContext ? <span><i className="is-context" />Cooling-access context</span> : null}<span><i className="is-low" />Lower priority</span><span><i className="is-medium" />Moderate priority</span><span><i className="is-high" />Higher priority</span><span>Same scale before and after</span></div>
      {cityMap.accessZones.length > 0 ? <p className="scenario-comparison-context-note">{showCoolingContext ? "The pale grid is a separate, derived cooling-access layer. It is context only: colored polygons remain the only Cheeger-priority scores in this comparison." : "Showing only scored Cheeger-priority polygons. Turn on Cooling-access context to inspect the separate, derived study grid without mixing its values into this scale."}</p> : null}
      {compact ? <><div className="scenario-comparison-mobile-tabs" role="tablist" aria-label="Mobile comparison view">{(["baseline", "scenario", "difference"] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={mobileView === tab} className={mobileView === tab ? "active" : ""} onClick={() => setMobileView(tab)}>{tab === "baseline" ? "Before" : tab === "scenario" ? "Scenario" : "Difference"}</button>)}</div>{mobileView === "baseline" ? baselineMap : comparison ? mobileView === "scenario" ? scenarioMap : differenceMap : requiredMap}</> : view === "side-by-side" ? <div className="scenario-comparison-maps">{baselineMap}{comparison ? scenarioMap : requiredMap}</div> : comparison ? <div className="scenario-comparison-difference">{differenceMap}<div className="scenario-comparison-difference-copy"><strong>{Math.round((comparison.changedHighPriorityShare || 0) * 100)}% of high-priority cells change in this planning model.</strong><p>The displayed difference is a bounded allocation-and-evidence-weighted priority change. It does not predict degrees Celsius, project approval, or an observed outcome.</p></div></div> : requiredMap}
      {showingDifference && comparison && comparisonScenario ? <section className="scenario-comparison-value" aria-labelledby="comparison-value-title"><div><span className="eyebrow">Decision value</span><h3 id="comparison-value-title">From a static heat signal to an auditable investment question.</h3><p>Every displayed change comes from the same scored geography, the selected ${comparisonScenario.budgetUsd.toLocaleString()} scenario, and its recorded evidence mix. The number inside each teal cell is the modeled reduction in planning-priority points.</p></div><dl><div><dt>Priority shift</dt><dd>−{differenceMetrics.average.toFixed(1)}</dd><small>average points per scored cell</small></div><div><dt>Cells affected</dt><dd>{differenceMetrics.changed}/{overlays.length}</dd><small>same cells, same comparison scale</small></div><div><dt>Evidence basis</dt><dd>{comparisonScenario.evidenceSummary.verifiedUnitCostCount}</dd><small>verified unit-cost inputs</small></div><div><dt>Budget coverage</dt><dd>{Math.round(comparisonScenario.allocationSummary.allocationCoveragePct * 100)}%</dd><small>of the documented scenario package</small></div></dl><p className="scenario-comparison-value-boundary">This is the project’s planning value: it makes assumptions, evidence quality, budget scale, and spatial consequences inspectable together. It does not claim that these point changes are degrees of temperature reduction or completed projects.</p></section> : null}
      <div className="scenario-comparison-summary" aria-live="polite">{selected && selectedScenario != null && selectedDelta != null ? <><strong>{selected.label}</strong><span>Baseline priority {selected.score.toFixed(1)} → modeled priority {selectedScenario.toFixed(1)} ({selectedDelta.toFixed(1)})</span></> : <><strong>Choose a polygon to inspect its change.</strong><span>Shared scale: lighter colors indicate lower modeled investigation priority.</span></>}</div>
      {selected && selectedScenario != null && selectedDelta != null ? <aside className="scenario-comparison-drawer" aria-labelledby="comparison-drawer-title"><div><span className="eyebrow">Selected evidence area</span><h3 id="comparison-drawer-title">{selected.label}</h3></div><button type="button" onClick={() => setSelectedId(null)} aria-label="Close selected area details">Close</button><dl><div><dt>Before</dt><dd>{selected.score.toFixed(1)} priority</dd></div><div><dt>Scenario</dt><dd>{selectedScenario.toFixed(1)} priority</dd></div><div><dt>Change</dt><dd>{selectedDelta.toFixed(1)} points</dd></div></dl><p><strong>Assumption:</strong> the change is a bounded planning-priority transformation based on budget, allocation coverage, and evidence quality—not a physical temperature effect.</p><p><strong>Next:</strong> review the funded portfolio below, or generate an exact ${budgetUsd.toLocaleString()} scenario before using this area in a planning conversation.</p></aside> : null}
      <p className="scenario-comparison-boundary">{comparisonClaimBoundary("planning")} This comparison is an estimate based on the available evidence polygons and budget record. Governed city candidate or verified geometry—with provenance, eligibility, capacity, and approvals—is required before the product can recommend or display a project site.</p>
    </section>
  );
}
