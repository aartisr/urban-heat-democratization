import { useCallback, useEffect, useRef, useState } from "react";
import type { MitigationLabGraphBaseline } from "../../../lib/types";
import type { InterventionDefinition, LabBaseline, LabResult, PlacedIntervention } from "../domain/types";
import { QuickInterventionPalette } from "./QuickInterventionPalette";
import { QuickScenarioControls } from "./QuickScenarioControls";

type Zone = { x: number; y: number; label: string };
const zones: Zone[] = [
  { x:.12,y:.28,label:"West shade gap" }, { x:.2,y:.51,label:"West corridor" }, { x:.32,y:.68,label:"South crossing" },
  { x:.37,y:.43,label:"Central shade gap" }, { x:.48,y:.25,label:"North exposure" }, { x:.53,y:.55,label:"Central bottleneck" },
  { x:.61,y:.74,label:"South access gap" }, { x:.7,y:.42,label:"Vulnerable heat-pressure zone" }, { x:.77,y:.18,label:"North exposure" },
  { x:.84,y:.62,label:"East route gap" }, { x:.9,y:.38,label:"East edge" },
];
const links = [[0,1],[1,2],[1,3],[3,4],[3,5],[2,5],[2,6],[4,7],[5,7],[6,9],[7,8],[7,9],[8,10],[9,10]];
function priorityColor(value: number) { if (value < .34) return "#e8eff8"; if (value < .55) return "#a8c7e4"; if (value < .72) return "#f6c76a"; return "#db684a"; }
function distance(a: {x:number;y:number}, b: {x:number;y:number}) { return Math.hypot(a.x-b.x,a.y-b.y); }
function wrapCanvasText(context: CanvasRenderingContext2D, text: string, width: number) {
  const words = text.split(" "); const lines: string[] = []; let line = "";
  words.forEach((word) => { const next = line ? `${line} ${word}` : word; if (line && context.measureText(next).width > width) { lines.push(line); line = word; } else line = next; });
  if (line) lines.push(line); return lines;
}
function drawZoneTooltip(context: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, zone: Zone, message: string) {
  const maxWidth = Math.min(216, canvasWidth - 20); context.font = "700 12px system-ui"; const title = wrapCanvasText(context, zone.label, maxWidth - 20); context.font = "500 11px system-ui"; const detail = wrapCanvasText(context, message, maxWidth - 20); const tooltipHeight = 18 + title.length * 15 + detail.length * 14;
  const x = Math.max(10, Math.min(canvasWidth - maxWidth - 10, zone.x * canvasWidth + 24)); const y = Math.max(10, Math.min(canvasHeight - tooltipHeight - 10, zone.y * canvasHeight - 32));
  context.fillStyle = "rgba(255,255,255,.97)"; context.fillRect(x, y, maxWidth, tooltipHeight); context.strokeStyle = "#8baeba"; context.lineWidth = 1; context.strokeRect(x, y, maxWidth, tooltipHeight); context.fillStyle = "#173f70"; context.font = "700 12px system-ui"; context.textAlign = "left"; title.forEach((line, index) => context.fillText(line, x + 10, y + 17 + index * 15)); context.fillStyle = "#45646b"; context.font = "500 11px system-ui"; detail.forEach((line, index) => context.fillText(line, x + 10, y + 17 + title.length * 15 + index * 14));
}

export function InterventionCanvas({ baseline, result, selected, interventions, graphBaseline, quickInterventions, onSelectIntervention, canUndo, onUndo, onReset, onCopy, onExport, onPlace, onMove, onRemove }: { baseline: LabBaseline; result: LabResult; selected: InterventionDefinition | null; interventions: PlacedIntervention[]; graphBaseline?: MitigationLabGraphBaseline; quickInterventions: InterventionDefinition[]; onSelectIntervention: (definition: InterventionDefinition) => void; canUndo: boolean; onUndo: () => void; onReset: () => void; onCopy: () => void; onExport: () => void; onPlace: (x:number,y:number)=>void; onMove:(id:string,x:number,y:number)=>void; onRemove:(id:string)=>void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<"zone"|"network">("zone");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [focusedZone, setFocusedZone] = useState<number | null>(null);
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);
  const graphZones: Zone[] = graphBaseline?.nodes.map(({ x, y, label }) => ({ x, y, label })) ?? zones;
  const graphLinks = graphBaseline?.edges.map(({ source, target }) => [source, target] as const) ?? links;
  const priorityAt = useCallback((zone: Zone) => result.priority[Math.min(result.priority.length - 1, Math.floor(zone.y * baseline.height) * baseline.width + Math.floor(zone.x * baseline.width))], [baseline, result]);
  const isMitigated = useCallback((zone: Zone) => interventions.some((item) => distance(zone, item.geometry.points[0]) < (item.parameters.radius ?? .1)), [interventions]);
  const render = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    if (view === "zone") {
      const raster = document.createElement("canvas"); raster.width = baseline.width; raster.height = baseline.height;
      const rasterContext = raster.getContext("2d"); if (!rasterContext) return;
      for (let y = 0; y < baseline.height; y += 1) for (let x = 0; x < baseline.width; x += 1) { rasterContext.fillStyle = priorityColor(result.priority[y * baseline.width + x]); rasterContext.fillRect(x, y, 1, 1); }
      ctx.imageSmoothingEnabled = true; ctx.drawImage(raster, 0, 0, width, height);
      ctx.fillStyle = "#51271d"; ctx.font = "700 14px system-ui"; ctx.textAlign = "center"; ctx.fillText("Vulnerable heat-pressure zone", width * .72, height * .24); ctx.font = "500 12px system-ui"; ctx.fillText("Higher modeled priority for closer investigation", width * .72, height * .29);
    } else {
      ctx.fillStyle = "#eef5fc"; ctx.fillRect(0, 0, width, height);
      const raster = document.createElement("canvas"); raster.width = baseline.width; raster.height = baseline.height;
      const rasterContext = raster.getContext("2d"); if (!rasterContext) return;
      for (let y = 0; y < baseline.height; y += 1) for (let x = 0; x < baseline.width; x += 1) { rasterContext.fillStyle = priorityColor(result.priority[y * baseline.width + x]); rasterContext.fillRect(x, y, 1, 1); }
      ctx.save(); ctx.globalAlpha = .18; ctx.imageSmoothingEnabled = true; ctx.drawImage(raster, 0, 0, width, height); ctx.restore();
      graphLinks.forEach(([from, to]) => { const start = graphZones[from], end = graphZones[to]; if (!start || !end) return; const changed = isMitigated(start) || isMitigated(end); ctx.beginPath(); ctx.moveTo(start.x * width, start.y * height); ctx.lineTo(end.x * width, end.y * height); ctx.strokeStyle = changed ? "#087a6b" : "#91b5da"; ctx.lineWidth = changed ? 8 : 5; ctx.stroke(); });
      graphZones.forEach((zone, index) => { const changed = isMitigated(zone); ctx.beginPath(); ctx.arc(zone.x * width, zone.y * height, changed ? 23 : 19, 0, Math.PI * 2); ctx.fillStyle = changed ? "#9be0ca" : priorityColor(priorityAt(zone)); ctx.fill(); ctx.strokeStyle = index === focusedZone ? "#172554" : changed ? "#087a6b" : "#315f8b"; ctx.lineWidth = index === focusedZone ? 5 : 2; ctx.stroke(); ctx.fillStyle = "#173f70"; ctx.font = "700 12px system-ui"; ctx.textAlign = "center"; ctx.fillText(String(index + 1), zone.x * width, zone.y * height + 4); });
      const activeIndex = hoveredZone ?? focusedZone;
      if (activeIndex !== null) { const zone = graphZones[activeIndex]; if (zone) { const value = priorityAt(zone), changed = isMitigated(zone); const message = changed ? "Changed by your intervention" : value >= .72 ? "Higher heat-pressure; fewer modeled alternatives" : value >= .55 ? "Moderate priority; check shade and route continuity" : "Lower modeled priority; check local access"; drawZoneTooltip(ctx, width, height, zone, message); } }
      ctx.fillStyle = "#35576f"; ctx.font = "600 12px system-ui"; ctx.textAlign = "center"; ctx.fillText("Same zone locations as the vulnerable-zone view · teal means changed by your intervention", width / 2, 28);
    }
    interventions.forEach((item, index) => { const p = item.geometry.points[0], radius = Math.max(30, (item.parameters.radius ?? .1) * Math.min(width, height)); ctx.beginPath(); ctx.arc(p.x * width, p.y * height, radius, 0, Math.PI * 2); ctx.fillStyle = "rgba(8,142,122,.24)"; ctx.fill(); ctx.setLineDash([6,5]); ctx.strokeStyle = "#087a6b"; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(p.x * width, p.y * height, 14, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#075985"; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = "#075985"; ctx.font = "700 12px system-ui"; ctx.textAlign = "center"; ctx.fillText(String(index + 1), p.x * width, p.y * height + 4); if (index === 0 && view === "zone") { ctx.fillStyle = "#075e54"; ctx.fillText("Modeled mitigation extent", p.x * width, p.y * height - radius - 12); } });
  }, [baseline, focusedZone, graphLinks, graphZones, hoveredZone, interventions, isMitigated, priorityAt, result, view]);
  const paint = useCallback(() => { const canvas = canvasRef.current; if (!canvas) return; const rect = canvas.getBoundingClientRect(); canvas.width = Math.round(rect.width * devicePixelRatio); canvas.height = Math.round(rect.height * devicePixelRatio); const ctx = canvas.getContext("2d"); if (!ctx) return; ctx.scale(devicePixelRatio, devicePixelRatio); render(ctx, rect.width, rect.height); }, [render]);
  useEffect(() => { const frame = requestAnimationFrame(paint); return () => cancelAnimationFrame(frame); }, [paint]);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) }; };
  const focused = focusedZone === null ? null : graphZones[focusedZone]; const focusedPriority = focused ? priorityAt(focused) : 0;
  return <section className="mitigation-canvas-shell"><div className="mitigation-canvas-heading"><div><span className="eyebrow">{baseline.name}</span><h2>{view === "zone" ? "See the vulnerable zone. Test one mitigating action." : "See which zones need stronger cooling continuity."}</h2><p>{selected ? <><strong>{selected.name} is ready.</strong> Place it in the amber/red zone.</> : interventions.length ? "Teal halo = bounded modeled mitigation extent. Drag the marker to test another placement." : "Amber/red = vulnerable heat-pressure zone. Choose one intervention, then place it there."}</p></div><span className="mitigation-scale">Study scale · not an address</span></div><div className="mitigation-view-switch" role="tablist"><button type="button" role="tab" aria-selected={view === "zone"} onClick={() => { setView("zone"); setFocusedZone(null); }}>1 · Vulnerable zone</button><button type="button" role="tab" aria-selected={view === "network"} onClick={() => setView("network")}>2 · Cooling network</button></div>{view === "network" ? <div className="mitigation-node-explainer" aria-live="polite">{focused ? <><strong>{focused.label}</strong><span>{focusedPriority >= .72 ? "Higher modeled heat-pressure priority with fewer modeled alternatives nearby." : focusedPriority >= .55 ? "Moderate modeled heat-pressure priority; investigate shade and route continuity." : "Lower modeled priority in this scenario; still check access and maintenance conditions."}</span></> : "Select a numbered zone to learn why it is a modeled priority."}</div> : null}<QuickInterventionPalette definitions={quickInterventions} selectedId={selected?.id ?? null} onSelect={onSelectIntervention} /><QuickScenarioControls canUndo={canUndo} hasInterventions={interventions.length > 0} onUndo={onUndo} onReset={onReset} onCopy={onCopy} onExport={onExport} /><canvas ref={canvasRef} className={selected || interventions.length ? "is-placement-ready" : ""} onPointerDown={(event) => { const p = point(event); const item = interventions.find((entry) => distance(entry.geometry.points[0], p) < .05); if (item) { setDraggingId(item.id); event.currentTarget.setPointerCapture(event.pointerId); } else if (view === "network" && !selected) { const index = graphZones.findIndex((zone) => distance(zone, p) < .055); setFocusedZone(index < 0 ? null : index); } else if (selected) onPlace(p.x, p.y); }} onPointerMove={(event) => { if (draggingId) { const p = point(event); onMove(draggingId, p.x, p.y); } }} onPointerUp={() => setDraggingId(null)} onPointerCancel={() => setDraggingId(null)} tabIndex={0} aria-label={view === "zone" ? "Vulnerable heat-pressure zone. Amber and red mean higher modeled priority. Teal halos show modeled mitigation extent." : "Modeled cooling network. Select a zone to learn why it is prioritized."} onKeyDown={(event) => { const item = interventions.at(-1); if (item && ["Delete","Backspace"].includes(event.key)) { event.preventDefault(); onRemove(item.id); } }} /><div className="mitigation-legend"><span><i className="priority-low"/>Lower modeled priority</span><span><i className="priority-high"/>Vulnerable heat-pressure zone</span><span><i className="placement-dot"/>Modeled mitigation extent</span></div></section>;
}
