import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { FilterSpecification, GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature, MapMouseEvent, Popup as MapLibrePopup } from "maplibre-gl";

import { disableCityLiveThermal, enableCityLiveThermal, refreshCityLiveThermal } from "../lib/api";
import type { CityMapData, CityMapOverlay, GeoJsonFeature, GeoJsonFeatureCollection, PlanningMode, ScenarioAction, ScenarioRecord } from "../lib/types";
import { useAppShellLayout } from "../router";

type CityHeatMapProps = {
  data: CityMapData;
  scenarios?: ScenarioRecord[];
  onMapRefresh: () => void;
};

type OverlayLayer = "heat" | "cooling";
type SeverityFilter = "all" | "high" | "medium" | "low";
type ControlDeckTab = "spectral" | "thermal" | "actions" | "context";

type OverlayEntry = {
  key: string;
  layer: OverlayLayer;
  color: string;
  layerLabel: string;
  overlay: CityMapOverlay;
};

type MapDebugState = {
  heatLayerReady: boolean;
  coolingLayerReady: boolean;
  scenarioLayerReady: boolean;
  heatVisibility: string;
  coolingVisibility: string;
  scenarioVisibility: string;
  heatRenderedCount: number;
  coolingRenderedCount: number;
  scenarioRenderedCount: number;
  severityFilter: SeverityFilter;
};

type FeatureBounds = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

function safeHasLayer(map: MapLibreMap | null, layerId: string) {
  if (!map) {
    return false;
  }
  try {
    return Boolean(map.getLayer(layerId));
  } catch {
    return false;
  }
}

function scoreLabel(value: number) {
  if (value >= 80) return "High";
  if (value >= 50) return "Medium";
  return "Low";
}

function normalizeScoreClass(value: string) {
  return value.trim().toLowerCase();
}

function overlayNarrative(entry: OverlayEntry) {
  const primaryClass = entry.layer === "heat"
    ? entry.overlay.properties?.cheeger_priority_class ?? entry.overlay.properties?.priority_class
    : entry.overlay.properties?.cooling_access_class ?? entry.overlay.properties?.access_class;
  const classLabel = typeof primaryClass === "string" && primaryClass.trim() ? primaryClass : entry.overlay.scoreClass;
  return `${entry.layerLabel} polygon with ${classLabel.toLowerCase()} severity and score ${entry.overlay.score.toFixed(1)}.`;
}

function visibleUnderFilter(overlay: CityMapOverlay, filter: SeverityFilter) {
  if (filter === "all") {
    return true;
  }
  return normalizeScoreClass(overlay.scoreClass) === filter;
}

function featureId(feature: GeoJsonFeature, index: number) {
  return String(feature.id ?? feature.properties?.cell_id ?? feature.properties?.id ?? index);
}

function featureBounds(feature: GeoJsonFeature | null | undefined): FeatureBounds | null {
  const coordinates: number[][] = [];
  const visit = (value: unknown) => {
    if (!Array.isArray(value)) {
      return;
    }
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      coordinates.push([value[0], value[1]]);
      return;
    }
    for (const child of value) {
      visit(child);
    }
  };

  visit(feature?.geometry?.coordinates);
  if (!coordinates.length) {
    return null;
  }

  let minLng = coordinates[0][0];
  let maxLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];
  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLng, minLat, maxLng, maxLat };
}

function overlayFeature(overlay: CityMapOverlay): GeoJsonFeature | null {
  if (!overlay.points.length) {
    return null;
  }
  const ring = overlay.points.map((point) => [point.x, point.y]);
  const [firstLng, firstLat] = ring[0] ?? [];
  const [lastLng, lastLat] = ring[ring.length - 1] ?? [];
  if (firstLng !== lastLng || firstLat !== lastLat) {
    ring.push([firstLng, firstLat]);
  }

  return {
    type: "Feature",
    id: overlay.id,
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
    properties: overlay.properties ?? {},
  };
}

function overlayCentroid(overlay: CityMapOverlay) {
  if (!overlay.points.length) {
    return null;
  }
  const total = overlay.points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  return {
    lng: total.x / overlay.points.length,
    lat: total.y / overlay.points.length,
  };
}

function truthLabel(status: "observed" | "derived" | "estimated" | "illustrative") {
  switch (status) {
    case "observed":
      return "Observed";
    case "derived":
      return "Derived";
    case "estimated":
      return "Estimated";
    case "illustrative":
      return "Illustrative";
  }
}

function formatLiveTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Not yet available";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function liveThermalStatusLabel(status: CityMapData["liveThermalAdapter"]["status"]) {
  switch (status) {
    case "configured":
      return "Live adapters ready";
    case "refreshing":
      return "Refreshing";
    case "backup":
      return "Cached fallback";
    case "error":
      return "Refresh issue";
    case "planned":
      return "Configured but paused";
    default:
      return "Bundled study only";
  }
}

function liveThermalStatusTone(status: CityMapData["liveThermalAdapter"]["status"]) {
  switch (status) {
    case "configured":
      return "configured";
    case "refreshing":
      return "refreshing";
    case "backup":
      return "backup";
    case "error":
      return "error";
    case "planned":
      return "planned";
    default:
      return "unavailable";
  }
}

function shortScenarioLabel(label: string) {
  const cleaned = label.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "Scenario";
  }
  if (cleaned.length <= 12) {
    return cleaned;
  }
  const words = cleaned.split(" ");
  const short = words.slice(0, 2).join(" ");
  if (short.length <= 12) {
    return short;
  }
  return `${cleaned.slice(0, 11).trimEnd()}…`;
}

function shortInterventionLabel(label: string) {
  const cleaned = label.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "Intervention";
  }
  if (cleaned.length <= 22) {
    return cleaned;
  }
  const words = cleaned.split(" ");
  const short = words.slice(0, 3).join(" ");
  if (short.length <= 22) {
    return short;
  }
  return `${cleaned.slice(0, 21).trimEnd()}…`;
}

type ScenarioInfluenceResult = {
  available: boolean;
  affectedZoneCount: number;
  averagePriorityShift: number;
  beforeAveragePriority: number;
  afterAveragePriority: number;
};

type ScenarioPlaceHint = {
  street: string;
  area: string;
  label: string;
  explanation: string;
};

type PlaceAnchor = {
  lng: number;
  lat: number;
  street: string;
  area: string;
  explanation: string;
};

// Bundled study-city place anchors. To swap in a different city's coordinates,
// replace this array and update the defaultStudyCityId in lib/study-city.ts.
const BUNDLED_CITY_PLACE_ANCHORS: PlaceAnchor[] = [
  { lng: -71.062871, lat: 42.375193, street: "Cordis Street", area: "Charlestown", explanation: "a compact residential street with limited shade continuity" },
  { lng: -71.064521, lat: 42.376851, street: "High Street", area: "Charlestown", explanation: "a hill-adjacent corridor where shade and cooling access matter" },
  { lng: -71.05132, lat: 42.333735, street: "F Street", area: "South Boston", explanation: "a dense mixed-use corridor with exposed pedestrian movement" },
  { lng: -71.04472, lat: 42.317152, street: "Mount Vernon Street", area: "Dorchester", explanation: "a neighborhood street where tree and facade interventions can compound" },
  { lng: -70.995219, lat: 42.35861, street: "Cottage Park Road", area: "East Boston", explanation: "a waterfront-facing area where exposed walking routes benefit from shade" },
  { lng: -71.057921, lat: 42.343685, street: "Foundry Street", area: "South Boston", explanation: "an industrial edge where surface cooling and shade can work together" },
];

function distanceSquared(leftLng: number, leftLat: number, rightLng: number, rightLat: number) {
  const dx = leftLng - rightLng;
  const dy = leftLat - rightLat;
  return (dx * dx) + (dy * dy);
}

function geometryCentroid(feature: GeoJsonFeature | null | undefined) {
  const coordinates: number[][] = [];
  const visit = (value: unknown) => {
    if (!Array.isArray(value)) {
      return;
    }
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      coordinates.push([value[0], value[1]]);
      return;
    }
    for (const child of value) {
      visit(child);
    }
  };

  visit(feature?.geometry?.coordinates);
  if (!coordinates.length) {
    return null;
  }

  const total = coordinates.reduce((acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }), { lng: 0, lat: 0 });
  return {
    lng: total.lng / coordinates.length,
    lat: total.lat / coordinates.length,
  };
}

function scenarioKindHeatImpact(kind: string) {
  const normalized = kind.toLowerCase();
  if (normalized.includes("tree") || normalized.includes("green_wall")) return 0.18;
  if (normalized.includes("shade")) return 0.16;
  if (normalized.includes("roof")) return 0.13;
  if (normalized.includes("reflect")) return 0.11;
  if (normalized.includes("cooling")) return 0.1;
  if (normalized.includes("permeable_paving")) return 0.09;
  if (normalized.includes("whole_city")) return 0.2;
  return 0.08;
}

function scenarioBudgetIntensity(budgetUsd: number) {
  const normalizedBudget = Math.max(0, budgetUsd || 0);
  const minBudget = 50000;
  const maxBudget = 1000000;
  const clamped = Math.max(minBudget, Math.min(maxBudget, normalizedBudget));
  const numerator = Math.log1p(clamped / minBudget);
  const denominator = Math.log1p(maxBudget / minBudget);
  return Math.max(0, Math.min(1, numerator / denominator));
}

function scenarioComparisonAmplitude(marker: ScenarioMapMarker) {
  const budgetIntensity = scenarioBudgetIntensity(marker.budgetUsd || 0);
  const budgetScale = 0.8 + (budgetIntensity * 1.95);
  const emphasisScale = marker.emphasis ? 1.08 : 0.92;
  return scenarioKindHeatImpact(marker.icon) * budgetScale * emphasisScale;
}

function scenarioInfluencePreview(
  heatGeojson: GeoJsonFeatureCollection | null | undefined,
  markers: ScenarioMapMarker[],
  bounds: CityMapData["bounds"],
): ScenarioInfluenceResult {
  if (!heatGeojson || !heatGeojson.features.length || !markers.length) {
    return {
      available: false,
      affectedZoneCount: 0,
      averagePriorityShift: 0,
      beforeAveragePriority: 0,
      afterAveragePriority: 0,
    };
  }

  const diagonal = bounds ? Math.max(0.001, Math.sqrt(((bounds.maxLng - bounds.minLng) ** 2) + ((bounds.maxLat - bounds.minLat) ** 2))) : 1;
  const totalBudgetUsd = markers.reduce((sum, marker) => sum + Math.max(0, marker.budgetUsd || 0), 0);
  const budgetIntensity = scenarioBudgetIntensity(totalBudgetUsd || 0);
  const influenceRadius = diagonal * (0.12 + (budgetIntensity * 0.14));
  const heatReductionCap = 14 + (budgetIntensity * 32);
  let beforeTotal = 0;
  let afterTotal = 0;
  let affectedZoneCount = 0;

  for (const feature of heatGeojson.features) {
    const priority = Number(feature.properties?.priority ?? feature.properties?.score ?? 0);
    beforeTotal += priority;
    const centroid = geometryCentroid(feature);
    let reduction = 0;
    if (centroid) {
      for (const marker of markers) {
        const distance = Math.sqrt(distanceSquared(centroid.lng, centroid.lat, marker.lng, marker.lat));
        const proximity = Math.exp(-Math.pow(distance / influenceRadius, 2));
        const markerBudgetBoost = 16 + (scenarioBudgetIntensity(marker.budgetUsd || 0) * 22);
        reduction += scenarioComparisonAmplitude(marker) * proximity * markerBudgetBoost;
      }
    }
    const projectedPriority = Math.max(0, Math.min(100, priority - Math.min(heatReductionCap, reduction)));
    afterTotal += projectedPriority;
    if (priority - projectedPriority >= 1) affectedZoneCount += 1;
  }

  return {
    available: affectedZoneCount > 0,
    affectedZoneCount,
    averagePriorityShift: Number(((beforeTotal - afterTotal) / Math.max(1, heatGeojson.features.length)).toFixed(1)),
    beforeAveragePriority: beforeTotal / heatGeojson.features.length,
    afterAveragePriority: afterTotal / heatGeojson.features.length,
  };
}

function scenarioPlaceHint(marker: ScenarioMapMarker): ScenarioPlaceHint | null {
  if (!BUNDLED_CITY_PLACE_ANCHORS.length) {
    return null;
  }

  let best = BUNDLED_CITY_PLACE_ANCHORS[0];
  let bestDistance = distanceSquared(marker.lng, marker.lat, best.lng, best.lat);
  for (const candidate of BUNDLED_CITY_PLACE_ANCHORS.slice(1)) {
    const candidateDistance = distanceSquared(marker.lng, marker.lat, candidate.lng, candidate.lat);
    if (candidateDistance < bestDistance) {
      best = candidate;
      bestDistance = candidateDistance;
    }
  }

  return {
    street: best.street,
    area: best.area,
    label: `${best.street}, ${best.area}`,
    explanation: best.explanation,
  };
}

function scenarioMechanismLabel(kind: string, fallbackText = "") {
  const text = `${kind} ${fallbackText}`.toLowerCase();
  if (text.includes("green_wall") || text.includes("green wall") || text.includes("vertical greening")) {
    return "Vertical greening and edge shading";
  }
  if (text.includes("permeable_paving") || text.includes("permeable paving") || text.includes("permeable pavement")) {
    return "Evaporative surface cooling and runoff relief";
  }
  if (text.includes("transit_shade") || text.includes("transit shade") || text.includes("transit stop") || text.includes("waiting area")) {
    return "Transit-stop shade for stationary exposure";
  }
  if (text.includes("tree") || text.includes("canopy") || text.includes("plant") || text.includes("green")) {
    return "Shade plus evapotranspiration";
  }
  if (text.includes("shade")) {
    return "Direct solar shade reduction";
  }
  if (text.includes("roof")) {
    return "Lower roof heat gain and re-radiation";
  }
  if (text.includes("reflect")) {
    return "Higher reflectance and lower surface absorption";
  }
  if (text.includes("cooling") || text.includes("node") || text.includes("access") || text.includes("pocket")) {
    return "Cooling access and relief distribution";
  }
  if (text.includes("water")) {
    return "Evaporative and thermal buffering";
  }
  return "Localized heat mitigation";
}

function thermalSourceTheme(sourceId: string) {
  if (sourceId === "landsat") {
    return {
      chipClass: "thermal-chip-landsat",
      rampLow: "#e0f2fe",
      rampMid: "#fde68a",
      rampHot: "#fb923c",
      rampPeak: "#be123c",
      corridor: "#f97316",
      summary: "Broad city pattern",
      story: "Landsat gives the steadier city-scale heat pattern.",
    };
  }
  if (sourceId === "ecostress") {
    return {
      chipClass: "thermal-chip-ecostress",
      rampLow: "#dbeafe",
      rampMid: "#bfdbfe",
      rampHot: "#c4b5fd",
      rampPeak: "#6d28d9",
      corridor: "#7c3aed",
      summary: "Sharper hot-spot view",
      story: "ECOSTRESS gives the sharper local hot-spot read.",
    };
  }
  return {
    chipClass: "",
    rampLow: "#e2e8f0",
    rampMid: "#cbd5e1",
    rampHot: "#94a3b8",
    rampPeak: "#475569",
    corridor: "#475569",
    summary: "Thermal study source",
    story: "This source provides bundled thermal study context.",
  };
}

function spectralAnalysisNarrative(data: CityMapData, heatVisibleCount: number, coolingVisibleCount: number, severityFilter: SeverityFilter) {
  const filterLabel = severityFilter === "all" ? "all severity bands" : `${severityFilter} severity`;
  return `The highlighted story is the spectral analysis itself: ${heatVisibleCount} Cheeger bottlenecks and ${coolingVisibleCount} low-cooling-access zones are currently visible under ${filterLabel}. The highest-value areas come from rigorous mathematical ranking of circulation failure and cooling disadvantage, while thermal sources serve as supporting evidence for why those patterns appear.`;
}

function spectralMathNarrative(heatVisibleCount: number, coolingVisibleCount: number) {
  return `This workflow does not guess. It uses graph-based spectral structure to find where urban heat movement pinches, then combines that with cooling-access scoring to rank the ${heatVisibleCount} visible bottlenecks and ${coolingVisibleCount} visible low-cooling zones by intervention value.`;
}

function plainMathExplanation(entry: OverlayEntry) {
  if (entry.layer === "heat") {
    return "In plain English: the math is looking for places where heat flow gets squeezed through a narrow urban pathway. A higher score means this spot behaves more like a choke point, so cooling action here can influence a wider surrounding area.";
  }
  return "In plain English: the math is looking for places with less access to cooling relief. A higher score means people here are more exposed to heat without enough nearby cooling benefit, so mitigation here can close a bigger gap.";
}

function interventionValueBreakdown(entry: OverlayEntry) {
  const score = Math.max(0, Math.min(100, entry.overlay.score));
  const intensity = entry.layer === "heat" ? score : Math.min(100, score * 2.5);
  const urgency = normalizeScoreClass(entry.overlay.scoreClass) === "high" ? 92 : normalizeScoreClass(entry.overlay.scoreClass) === "medium" ? 64 : 38;
  const leverage = entry.layer === "heat" ? Math.min(100, score * 0.92 + 8) : Math.min(100, score * 2 + 12);

  return [
    { label: "Priority score", value: score, tone: entry.layer },
    { label: entry.layer === "heat" ? "Bottleneck intensity" : "Cooling gap", value: intensity, tone: entry.layer },
    { label: "Intervention leverage", value: leverage, tone: "accent" as const },
    { label: "Urgency band", value: urgency, tone: "neutral" as const },
  ];
}

function mitigationSuggestions(entry: OverlayEntry) {
  if (entry.layer === "heat") {
    return [
      "Shade the choke point",
      "Cool roofs nearby",
      "Tree canopy reinforcement",
      "Reflective surface retrofit",
    ];
  }
  return [
    "Add shade access",
    "Expand cooling centers",
    "Plant canopy near homes",
    "Create pocket cooling nodes",
  ];
}

function scenarioActionTheme(action: ScenarioAction) {
  const text = `${action.category} ${action.name} ${action.allocationBasis} ${action.rationale}`.toLowerCase();
  if (text.includes("green wall") || text.includes("vertical greening")) {
    return { kind: "green_wall", color: "#15803d" };
  }
  if (text.includes("permeable paving") || text.includes("permeable pavement")) {
    return { kind: "permeable_paving", color: "#475569" };
  }
  if (text.includes("transit") || text.includes("bus stop") || text.includes("waiting area")) {
    return { kind: "transit_shade", color: "#ea580c" };
  }
  if (text.includes("tree") || text.includes("canopy") || text.includes("plant") || text.includes("green")) {
    return { kind: "tree_canopy", color: "#16a34a" };
  }
  if (text.includes("shade")) {
    return { kind: "shade_corridor", color: "#f59e0b" };
  }
  if (text.includes("roof") || text.includes("reflect") || text.includes("surface")) {
    return { kind: "cool_roof", color: "#38bdf8" };
  }
  if (text.includes("cooling") || text.includes("center") || text.includes("node") || text.includes("access")) {
    return { kind: "cooling_nodes", color: "#0ea5a4" };
  }
  if (action.costStatus === "verified_unit_cost") {
    return { kind: "verified_unit_cost", color: "#2563eb" };
  }
  if (action.costStatus === "benchmark_only") {
    return { kind: "benchmark_package", color: "#0f766e" };
  }
  return { kind: "ranking_only", color: "#7c3aed" };
}

function scenarioActionStatusLabel(costStatus: ScenarioAction["costStatus"]) {
  if (costStatus === "verified_unit_cost") {
    return "Verified";
  }
  if (costStatus === "benchmark_only") {
    return "Benchmark";
  }
  return "Ranking";
}

function scenarioActionCostLabel(action: ScenarioAction) {
  const unit = action.measurementUnit?.trim();
  const unitLabel = unit ? `/${unit}` : "";
  if (action.unitCostUsd != null && action.estimatedProgramCostUsd != null) {
    return `Seed ${action.unitCostUsd.toLocaleString()}${unitLabel} · Program ${action.estimatedProgramCostUsd.toLocaleString()}`;
  }
  if (action.estimatedProgramCostUsd != null) {
    return `Program ${action.estimatedProgramCostUsd.toLocaleString()}`;
  }
  if (action.unitCostUsd != null) {
    return `Seed ${action.unitCostUsd.toLocaleString()}${unitLabel}`;
  }
  if (action.allocatedBudgetUsd != null) {
    return `Budget ${action.allocatedBudgetUsd.toLocaleString()}`;
  }
  return "No budget";
}

function scenarioActionIconKind(kind: string, fallbackText = "") {
  const text = `${kind} ${fallbackText}`.toLowerCase();
  if (text.includes("green_wall") || text.includes("green wall") || text.includes("vertical greening")) {
    return "green_wall";
  }
  if (text.includes("permeable_paving") || text.includes("permeable paving") || text.includes("permeable pavement")) {
    return "permeable_paving";
  }
  if (text.includes("transit_shade") || text.includes("transit shade") || text.includes("transit stop") || text.includes("waiting area")) {
    return "transit_shade";
  }
  if (text.includes("tree") || text.includes("canopy") || text.includes("plant") || text.includes("green")) {
    return "tree";
  }
  if (text.includes("shade")) {
    return "shade";
  }
  if (text.includes("roof")) {
    return "roof";
  }
  if (text.includes("reflect")) {
    return "reflect";
  }
  if (text.includes("cooling") || text.includes("node") || text.includes("access") || text.includes("pocket")) {
    return "cooling";
  }
  if (text.includes("water")) {
    return "water";
  }
  if (text.includes("whole_city")) {
    return "whole_city";
  }
  if (text.includes("verified")) {
    return "verified";
  }
  if (text.includes("benchmark")) {
    return "benchmark";
  }
  return "pin";
}

function scenarioActionIconMarkup(kind: string, fallbackText = "") {
  const iconKind = scenarioActionIconKind(kind, fallbackText);
  if (iconKind === "tree") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 14V20" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
        <path d="M9.2 20H14.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
        <path d="M6.7 11.2C6.7 7.8 9.2 5.4 12 5.4C14.8 5.4 17.3 7.8 17.3 11.2C17.3 13.9 15.2 15.9 12 15.9C8.8 15.9 6.7 13.9 6.7 11.2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
        <path d="M8.3 10.2C9.1 8.7 10.5 7.8 12 7.8C13.5 7.8 14.9 8.7 15.7 10.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.84"/>
      </svg>`;
  }
  if (iconKind === "green_wall") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7.4 5.6H16.6V18.4H7.4V5.6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M10 5.6V18.4M14 5.6V18.4" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" opacity="0.76"/>
        <path d="M8.2 9.1C8.8 7.7 10 6.9 11.4 6.9C11.4 8.3 10.7 9.5 9.6 10.1C8.8 10 8.2 9.7 8.2 9.1Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M15.8 12.7C15.2 11.3 14 10.5 12.6 10.5C12.6 11.9 13.3 13.1 14.4 13.7C15.2 13.6 15.8 13.3 15.8 12.7Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M8.6 14.9C9.3 13.8 10.3 13.1 11.6 13.1C11.5 14.2 11 15.1 10.1 15.8C9.3 15.7 8.8 15.4 8.6 14.9Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" opacity="0.9"/>
      </svg>`;
  }
  if (iconKind === "shade") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 11.5C7 7.8 16.9 7.8 19 11.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M5.8 11.7H18.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/>
        <path d="M12 11.7V19.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M9.9 19.5H14.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M12 5.2V8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>
      </svg>`;
  }
  if (iconKind === "permeable_paving") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5.2 8H18.8V16H5.2V8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
        <path d="M8.2 8V16M12 8V16M15.8 8V16M5.2 12H18.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity="0.82"/>
        <path d="M7.1 10.2H7.4M10.9 10.2H11.2M14.7 10.2H15M7.1 13.8H7.4M10.9 13.8H11.2M14.7 13.8H15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M17 17.2C17 16.2 18.3 15.4 18.8 14.4C19.3 15.4 20.6 16.2 20.6 17.2C20.6 18.2 19.8 19 18.8 19C17.8 19 17 18.2 17 17.2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      </svg>`;
  }
  if (iconKind === "roof") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4.7 11.7L12 5.8L19.3 11.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.6 10.8V18.3H17.4V10.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 18.3V14.4H14V18.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.86"/>
      </svg>`;
  }
  if (iconKind === "transit_shade") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 10.8C6.7 7.8 17.3 7.8 19 10.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M6.2 10.9H17.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.84"/>
        <path d="M7.6 10.9V18.2M16.4 10.9V18.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M8.6 17.6H15.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M9 14.2H15" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.72"/>
        <path d="M11.2 6.3V8.4M12.8 6.3V8.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
      </svg>`;
  }
  if (iconKind === "reflect") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3.4" stroke="currentColor" stroke-width="1.8"/>
        <path d="M12 4.8V2.8M12 21.2V19.2M4.8 12H2.8M21.2 12H19.2M6.7 6.7L5.2 5.2M18.8 18.8L17.3 17.3M17.3 6.7L18.8 5.2M5.2 18.8L6.7 17.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M7.2 14.8C8.2 15.8 9.6 16.4 12 16.4C14.4 16.4 15.8 15.8 16.8 14.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.78"/>
      </svg>`;
  }
  if (iconKind === "cooling") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4V20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M7.8 6.8L16.2 17.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M16.2 6.8L7.8 17.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M4.4 12H19.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M12 8.5L15.7 6.4M12 8.5L8.3 6.4M12 15.5L15.7 17.6M12 15.5L8.3 17.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.82"/>
      </svg>`;
  }
  if (iconKind === "water") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4.2C12 4.2 6.8 9.3 6.8 13.2C6.8 16.1 9.1 18.4 12 18.4C14.9 18.4 17.2 16.1 17.2 13.2C17.2 9.3 12 4.2 12 4.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M10.6 14.2C10.9 15.1 11.7 15.7 12.7 15.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.72"/>
      </svg>`;
  }
  if (iconKind === "whole_city") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 6.5H19V17.5H5V6.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M9 6.5V17.5M15 6.5V17.5M5 12H19" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/>
        <path d="M7.7 9.1H9.2M14.8 9.1H16.3M7.7 14.9H9.2M14.8 14.9H16.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.72"/>
      </svg>`;
  }
  if (iconKind === "verified") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4.5L18.8 7.3V12.1C18.8 15.9 16.3 18.7 12 20.2C7.7 18.7 5.2 15.9 5.2 12.1V7.3L12 4.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M8.9 12.1L11.1 14.3L15.3 10.1" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
  }
  if (iconKind === "benchmark") {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6.8 7.2H17.2V16.8H6.8V7.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M8.8 7.2V5.4M12 7.2V4.6M15.2 7.2V5.4M8.8 16.8V18.6M12 16.8V19.4M15.2 16.8V18.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/>
        <path d="M9.2 12H14.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`;
  }
  return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4.8L19 12L12 19.2L5 12L12 4.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M12 8.2V15.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
    </svg>`;
}

type ScenarioActionIconProps = {
  kind: string;
  fallbackText?: string;
};

function ScenarioActionIcon({ kind, fallbackText = "" }: ScenarioActionIconProps) {
  const iconKind = scenarioActionIconKind(kind, fallbackText);
  return (
    <span
      className={`scenario-action-icon is-${iconKind}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: scenarioActionIconMarkup(iconKind, fallbackText) }}
    />
  );
}

function scenarioLocationPool(action: ScenarioAction, heatEntries: OverlayEntry[], coolingEntries: OverlayEntry[]) {
  const actionText = `${action.category} ${action.name} ${action.allocationBasis} ${action.rationale}`.toLowerCase();
  const preferCooling = actionText.includes("cooling") || actionText.includes("center") || actionText.includes("access") || actionText.includes("node") || actionText.includes("pocket");
  const preferHeat = actionText.includes("shade") || actionText.includes("tree") || actionText.includes("canopy") || actionText.includes("roof") || actionText.includes("reflect");
  const heatSorted = [...heatEntries].sort((left, right) => right.overlay.score - left.overlay.score);
  const coolingSorted = [...coolingEntries].sort((left, right) => right.overlay.score - left.overlay.score);
  if (preferCooling) {
    return [...coolingSorted, ...heatSorted];
  }
  if (preferHeat) {
    return [...heatSorted, ...coolingSorted];
  }
  return [...heatSorted, ...coolingSorted];
}

function fallbackScenarioCentroid(bounds: CityMapData["bounds"]) {
  if (!bounds) {
    return null;
  }
  return {
    lng: (bounds.minLng + bounds.maxLng) / 2,
    lat: (bounds.minLat + bounds.maxLat) / 2,
  };
}

type ScenarioInterventionOption = {
  kind: string;
  label: string;
  detail: string;
  color: string;
};

type ScenarioInterventionFeature = {
  lng: number;
  lat: number;
  kind: string;
  label: string;
  detail: string;
  color: string;
  budgetUsd: number;
  order: number;
};

type ScenarioMapMarker = ScenarioInterventionFeature & {
  scenarioId: string;
  scenarioLabel: string;
  icon: string;
  emphasis: boolean;
};

type ScenarioPlacementAnchor = {
  lng: number;
  lat: number;
  layer: OverlayLayer;
  score: number;
  label: string;
};

type ScenarioPlacementScore = {
  evidence: number;
  priority: number;
  layerFit: number;
  slotFit: number;
  separation: number;
  total: number;
  explanation: string;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function cityDiagonal(bounds: CityMapData["bounds"]) {
  if (!bounds) {
    return 1;
  }
  const lngSpan = Math.max(0.001, bounds.maxLng - bounds.minLng);
  const latSpan = Math.max(0.001, bounds.maxLat - bounds.minLat);
  return Math.max(0.001, Math.sqrt((lngSpan * lngSpan) + (latSpan * latSpan)));
}

function normalizedAnchorDistance(left: ScenarioPlacementAnchor, right: ScenarioPlacementAnchor, bounds: CityMapData["bounds"]) {
  return Math.sqrt((left.lng - right.lng) ** 2 + (left.lat - right.lat) ** 2) / cityDiagonal(bounds);
}

function scenarioPlacementTargetAnchor(index: number, cityBounds: CityMapData["bounds"]) {
  const anchors = scenarioDistributedAnchors(cityBounds);
  if (!anchors.length) {
    return null;
  }
  return anchors[index % anchors.length] ?? null;
}

function formatScenarioPlacementExplanation(score: ScenarioPlacementScore, anchor: ScenarioPlacementAnchor) {
  return `placement score ${score.total.toFixed(2)} = ${score.evidence.toFixed(2)} evidence + ${score.priority.toFixed(2)} priority + ${score.layerFit.toFixed(2)} layer fit + ${score.slotFit.toFixed(2)} slot fit + ${score.separation.toFixed(2)} separation near ${anchor.label}`;
}

function scenarioPlacementScore(
  action: ScenarioAction,
  candidate: ScenarioPlacementAnchor,
  index: number,
  cityBounds: CityMapData["bounds"],
  placedAnchors: ScenarioPlacementAnchor[],
  totalActions: number,
): ScenarioPlacementScore {
  const preferredLayers = scenarioPreferredLayers(action);
  const evidence = clamp01(candidate.score / 100);
  const priorityRank = action.priorityRank ?? totalActions;
  const priority = totalActions <= 1
    ? 1
    : clamp01(1 - ((Math.max(1, priorityRank) - 1) / Math.max(1, totalActions - 1)));
  const layerFit = candidate.layer === preferredLayers[0]
    ? 1
    : preferredLayers.includes(candidate.layer)
      ? 0.82
      : 0.55;
  const targetAnchor = scenarioPlacementTargetAnchor(index, cityBounds);
  const slotFit = targetAnchor ? clamp01(1 - normalizedAnchorDistance(candidate, targetAnchor, cityBounds)) : 0.5;
  const separation = placedAnchors.length
    ? clamp01(Math.min(...placedAnchors.map((anchor) => normalizedAnchorDistance(candidate, anchor, cityBounds))))
    : 1;
  const total = (
    (evidence * 0.30)
    + (priority * 0.22)
    + (layerFit * 0.18)
    + (slotFit * 0.15)
    + (separation * 0.15)
  );
  return {
    evidence,
    priority,
    layerFit,
    slotFit,
    separation,
    total,
    explanation: formatScenarioPlacementExplanation({ evidence, priority, layerFit, slotFit, separation, total, explanation: "" }, candidate),
  };
}

function chooseScenarioPlacementAnchor(
  action: ScenarioAction,
  index: number,
  anchors: ScenarioPlacementAnchor[],
  cityBounds: CityMapData["bounds"],
  placedAnchors: ScenarioPlacementAnchor[],
  totalActions: number,
): { anchor: ScenarioPlacementAnchor; score: ScenarioPlacementScore } | null {
  const fallbackAnchors = scenarioDistributedAnchors(cityBounds);
  const candidates = [...fallbackAnchors, ...anchors];
  if (!candidates.length) {
    return null;
  }

  const uniqueCandidates: ScenarioPlacementAnchor[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const key = anchorKey(candidate);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    uniqueCandidates.push(candidate);
  }

  let best: { anchor: ScenarioPlacementAnchor; score: ScenarioPlacementScore } | null = null;
  for (const candidate of uniqueCandidates) {
    if (placedAnchors.some((anchor) => anchorKey(anchor) === anchorKey(candidate))) {
      continue;
    }
    const score = scenarioPlacementScore(action, candidate, index, cityBounds, placedAnchors, Math.max(1, totalActions));
    if (!best || score.total > best.score.total || (score.total === best.score.total && score.separation > best.score.separation)) {
      best = { anchor: candidate, score };
    }
  }

  if (best) {
    return best;
  }

  const fallback = uniqueCandidates[index % uniqueCandidates.length] ?? null;
  if (!fallback) {
    return null;
  }
  return {
    anchor: fallback,
    score: scenarioPlacementScore(action, fallback, index, cityBounds, placedAnchors, Math.max(1, totalActions)),
  };
}

function scenarioPreferredLayers(action: ScenarioAction): OverlayLayer[] {
  const text = `${action.category} ${action.name} ${action.allocationBasis} ${action.rationale}`.toLowerCase();
  const prefersHeat = text.includes("shade") || text.includes("tree") || text.includes("canopy") || text.includes("roof") || text.includes("reflect");
  const prefersCooling = text.includes("cooling") || text.includes("center") || text.includes("access") || text.includes("node") || text.includes("pocket");
  if (prefersHeat && !prefersCooling) {
    return ["heat", "cooling"];
  }
  if (prefersCooling && !prefersHeat) {
    return ["cooling", "heat"];
  }
  return ["heat", "cooling"];
}

function anchorKey(anchor: ScenarioPlacementAnchor) {
  return `${anchor.layer}:${anchor.lng.toFixed(4)}:${anchor.lat.toFixed(4)}`;
}

function fallbackPlacementAnchors(bounds: CityMapData["bounds"]): ScenarioPlacementAnchor[] {
  if (!bounds) {
    return [];
  }

  const lngSpan = Math.max(0.001, bounds.maxLng - bounds.minLng);
  const latSpan = Math.max(0.001, bounds.maxLat - bounds.minLat);
  const insetLng = lngSpan * 0.16;
  const insetLat = latSpan * 0.16;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;

  return [
    { lng: bounds.minLng + insetLng, lat: bounds.maxLat - insetLat, layer: "heat", score: 96, label: "northwest heat edge" },
    { lng: centerLng, lat: bounds.maxLat - insetLat * 0.7, layer: "heat", score: 94, label: "north corridor" },
    { lng: bounds.maxLng - insetLng, lat: bounds.maxLat - insetLat * 0.9, layer: "heat", score: 92, label: "northeast heat edge" },
    { lng: bounds.minLng + insetLng * 0.9, lat: centerLat, layer: "cooling", score: 90, label: "west cooling gap" },
    { lng: centerLng, lat: centerLat, layer: "cooling", score: 88, label: "central cooling gap" },
    { lng: bounds.maxLng - insetLng * 0.9, lat: centerLat, layer: "cooling", score: 86, label: "east cooling gap" },
    { lng: bounds.minLng + insetLng, lat: bounds.minLat + insetLat, layer: "heat", score: 84, label: "southwest heat edge" },
    { lng: centerLng, lat: bounds.minLat + insetLat * 0.75, layer: "cooling", score: 82, label: "south cooling gap" },
    { lng: bounds.maxLng - insetLng, lat: bounds.minLat + insetLat, layer: "heat", score: 80, label: "southeast heat edge" },
  ];
}

function scenarioDistributedAnchors(bounds: CityMapData["bounds"]): ScenarioPlacementAnchor[] {
  const anchors = fallbackPlacementAnchors(bounds);
  if (!anchors.length) {
    return [];
  }

  const sequence = [
    3, // west cooling gap
    5, // east cooling gap
    1, // north corridor
    7, // south cooling gap
    0, // northwest heat edge
    2, // northeast heat edge
    6, // southwest heat edge
    8, // southeast heat edge
    4, // central cooling gap
  ];

  return sequence.map((index) => anchors[index]).filter((anchor): anchor is ScenarioPlacementAnchor => Boolean(anchor));
}

function scenarioPlacementAnchors(heatEntries: OverlayEntry[], coolingEntries: OverlayEntry[], cityBounds: CityMapData["bounds"]) {
  const ranked: ScenarioPlacementAnchor[] = [
    ...heatEntries
      .slice()
      .sort((left, right) => right.overlay.score - left.overlay.score)
      .flatMap((entry) => {
        const centroid = overlayCentroid(entry.overlay);
        if (!centroid) {
          return [];
        }
        return [{
          lng: centroid.lng,
          lat: centroid.lat,
          layer: "heat" as const,
          score: entry.overlay.score,
          label: entry.overlay.label,
        }];
      }),
    ...coolingEntries
      .slice()
      .sort((left, right) => right.overlay.score - left.overlay.score)
      .flatMap((entry) => {
        const centroid = overlayCentroid(entry.overlay);
        if (!centroid) {
          return [];
        }
        return [{
          lng: centroid.lng,
          lat: centroid.lat,
          layer: "cooling" as const,
          score: entry.overlay.score,
          label: entry.overlay.label,
        }];
      }),
  ];

  const deduped: ScenarioPlacementAnchor[] = [];
  const seen = new Set<string>();
  for (const anchor of ranked) {
    const key = anchorKey(anchor);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(anchor);
  }

  const fallbackAnchors = fallbackPlacementAnchors(cityBounds);
  for (const anchor of fallbackAnchors) {
    const key = anchorKey(anchor);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(anchor);
  }

  return deduped;
}

function scenarioOffsets(index: number, total: number, anchor: ScenarioPlacementAnchor, cityBounds: CityMapData["bounds"]) {
  const lngSpan = Math.max(0.001, cityBounds ? cityBounds.maxLng - cityBounds.minLng : 0.001);
  const latSpan = Math.max(0.001, cityBounds ? cityBounds.maxLat - cityBounds.minLat : 0.001);
  const spreadLng = Math.max(0.001, lngSpan * 0.035);
  const spreadLat = Math.max(0.001, latSpan * 0.03);
  const radiusScale = anchor.score >= 90 ? 0.7 : anchor.score >= 80 ? 0.9 : 1;
  const crowding = Math.max(0.76, 1 - Math.max(0, total - 4) * 0.06);
  const patterns = [
    [0, 0],
    [1, 0.18],
    [-0.95, 0.4],
    [0.25, -0.92],
    [0.98, -0.6],
    [-0.72, -0.8],
  ];
  const [dx, dy] = patterns[index % patterns.length] ?? [0, 0];
  const fan = 1 + Math.floor(index / patterns.length) * 0.35;
  return {
    lng: dx * spreadLng * fan * radiusScale * crowding,
    lat: dy * spreadLat * fan * radiusScale * crowding,
  };
}

function scenarioInterventionsForEntry(entry: OverlayEntry | null, budgetUsd: number, planningMode: PlanningMode): ScenarioInterventionFeature[] {
  if (!entry) {
    return [];
  }

  const scenarioPalette: Record<OverlayLayer, ScenarioInterventionOption[]> = {
    heat: [
      { kind: "shade_corridor", label: "Shade the choke point", detail: "Cuts exposed heat at the narrowest circulation seam.", color: "#f59e0b" },
      { kind: "cool_roof", label: "Cool roofs nearby", detail: "Reduces re-radiated heat from surrounding buildings.", color: "#38bdf8" },
      { kind: "tree_canopy", label: "Tree canopy reinforcement", detail: "Adds shade and longer-term surface cooling.", color: "#16a34a" },
      { kind: "reflective_surface", label: "Reflective surface retrofit", detail: "Lowers absorption on the hardest surfaces.", color: "#6366f1" },
    ],
    cooling: [
      { kind: "shade_access", label: "Add shade access", detail: "Creates relief where cooling access is weakest.", color: "#0ea5a4" },
      { kind: "cooling_nodes", label: "Expand cooling nodes", detail: "Adds small public relief points near exposed areas.", color: "#2563eb" },
      { kind: "canopy_link", label: "Plant canopy near homes", detail: "Improves nearby shade and access over time.", color: "#16a34a" },
      { kind: "pocket_cooling", label: "Create pocket cooling nodes", detail: "Combines small cool surfaces with access gains.", color: "#7c3aed" },
    ],
  };

  const modeLimit = planningMode === "whole_city_benchmark"
    ? 1
    : planningMode === "benchmark_share"
      ? 2
      : planningMode === "evidence_first"
        ? 3
        : 4;
  const modeOrder = planningMode === "evidence_first"
    ? [...scenarioPalette[entry.layer]].sort((left, right) => Number(right.kind.includes("shade") || right.kind.includes("roof")) - Number(left.kind.includes("shade") || left.kind.includes("roof")))
    : planningMode === "benchmark_share"
      ? [...scenarioPalette[entry.layer]].sort((left, right) => left.label.localeCompare(right.label))
      : scenarioPalette[entry.layer];
  const budgetTier = budgetUsd >= 500000 ? 4 : budgetUsd >= 250000 ? 3 : 2;
  if (planningMode === "whole_city_benchmark") {
    const centroid = overlayCentroid(entry.overlay);
    if (!centroid) {
      return [];
    }
    return [
      {
        lng: centroid.lng,
        lat: centroid.lat,
        kind: "whole_city_package",
        label: "Whole-city benchmark package",
        detail: "Coarse citywide benchmark anchor for the selected planning focus.",
        color: "#0f766e",
        budgetUsd,
        order: 1,
      },
    ];
  }
  const chosen = modeOrder.slice(0, Math.min(modeLimit, budgetTier));
  const centroid = overlayCentroid(entry.overlay);
  if (!centroid) {
    return [];
  }

  const offsets = [
    [0, 0],
    [0.0011, 0],
    [0, 0.0011],
    [-0.0011, 0.0008],
  ];

  return chosen.map((option, index) => {
    const [dx, dy] = offsets[index] ?? [0, 0];
    const spread = entry.layer === "heat" ? 1.0 : 0.82;
    return {
      lng: centroid.lng + (dx * spread),
      lat: centroid.lat + (dy * spread),
      kind: option.kind,
      label: option.label,
      detail: option.detail,
      color: option.color,
      budgetUsd: Math.round(budgetUsd / Math.max(1, chosen.length)),
      order: index + 1,
    };
  });
}

function scenarioInterventionsForScenarioRecord(
  scenario: ScenarioRecord,
  heatEntries: OverlayEntry[],
  coolingEntries: OverlayEntry[],
  cityBounds: CityMapData["bounds"],
): ScenarioInterventionFeature[] {
  const actions = [...scenario.recommendedActions].sort((left, right) => {
    const leftPriority = left.priorityRank ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = right.priorityRank ?? Number.MAX_SAFE_INTEGER;
    return leftPriority - rightPriority;
  });
  if (!actions.length) {
    return [];
  }

  const anchors = scenarioPlacementAnchors(heatEntries, coolingEntries, cityBounds);
  const placedAnchors: ScenarioPlacementAnchor[] = [];

  return actions.map((action, index) => {
    const theme = scenarioActionTheme(action);
    const placement = chooseScenarioPlacementAnchor(action, index, anchors, cityBounds, placedAnchors, actions.length);
    if (!placement) {
      return null;
    }
    const { anchor, score } = placement;
    placedAnchors.push(anchor);
    const { lng: offsetLng, lat: offsetLat } = scenarioOffsets(index, actions.length, anchor, cityBounds);
    const bias = 0.12;
    return {
      lng: anchor.lng + (offsetLng * bias),
      lat: anchor.lat + (offsetLat * bias),
      kind: theme.kind,
      label: action.name,
      detail: `${scenario.label} · ${action.category}. ${action.rationale} ${score.explanation}.`,
      color: theme.color,
      budgetUsd: Math.max(0, action.allocatedBudgetUsd ?? Math.round(scenario.budgetUsd / Math.max(1, actions.length))),
      order: index + 1,
    };
  }).filter((item): item is ScenarioInterventionFeature => Boolean(item));
}

function sortedScenarioActions(scenario: ScenarioRecord) {
  return [...scenario.recommendedActions].sort((left, right) => {
    const leftPriority = left.priorityRank ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = right.priorityRank ?? Number.MAX_SAFE_INTEGER;
    return leftPriority - rightPriority;
  });
}

function scenarioMarkersForScenarioRecord(
  scenario: ScenarioRecord,
  scenarioIndex: number,
  heatEntries: OverlayEntry[],
  coolingEntries: OverlayEntry[],
  cityBounds: CityMapData["bounds"],
  selected = false,
): ScenarioMapMarker[] {
  const actions = sortedScenarioActions(scenario);
  if (!actions.length) {
    return [];
  }
  const actionsToShow = selected ? actions : actions.slice(0, Math.min(3, actions.length));
  const markers: ScenarioMapMarker[] = [];
  const anchors = scenarioPlacementAnchors(heatEntries, coolingEntries, cityBounds);
  const placedAnchors: ScenarioPlacementAnchor[] = [];

  for (const [actionIndex, action] of actionsToShow.entries()) {
    const placement = chooseScenarioPlacementAnchor(action, actionIndex + scenarioIndex, anchors, cityBounds, placedAnchors, actionsToShow.length);
    if (!placement) {
      continue;
    }
    const { anchor, score } = placement;
    placedAnchors.push(anchor);
    const { lng: offsetLng, lat: offsetLat } = scenarioOffsets(actionIndex, actionsToShow.length, anchor, cityBounds);
    const theme = scenarioActionTheme(action);
    markers.push({
      lng: anchor.lng + (offsetLng * 0.12),
      lat: anchor.lat + (offsetLat * 0.12),
      kind: theme.kind,
      label: action.name,
      detail: `${scenario.label} · ${action.category}. ${action.rationale} ${score.explanation}.`,
      color: theme.color,
      budgetUsd: Math.max(0, action.allocatedBudgetUsd ?? Math.round(scenario.budgetUsd / Math.max(1, actionsToShow.length))),
      order: actionIndex + 1,
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      icon: theme.kind,
      emphasis: selected,
    });
  }

  return markers;
}

function previewMarkersForEntry(
  entry: OverlayEntry | null,
  budgetUsd: number,
  planningMode: PlanningMode,
  cityBounds: CityMapData["bounds"],
): ScenarioMapMarker[] {
  const items = scenarioInterventionsForEntry(entry, budgetUsd, planningMode);
  if (!items.length) {
    return [];
  }

  const anchors = scenarioDistributedAnchors(cityBounds);
  if (!anchors.length) {
    return items.map((item, index) => ({
      ...item,
      scenarioId: "preview",
      scenarioLabel: "Preview",
      icon: scenarioActionIconKind(item.kind, item.label),
      emphasis: true,
    }));
  }

  return items.map((item, index) => {
    const anchor = anchors[index % anchors.length] ?? anchors[0];
    const spread = scenarioOffsets(index, items.length, anchor, cityBounds);
    const scale = anchor.score >= 90 ? 0.12 : anchor.score >= 80 ? 0.14 : 0.16;
    return {
      ...item,
      lng: anchor.lng + (spread.lng * scale),
      lat: anchor.lat + (spread.lat * scale),
      scenarioId: "preview",
      scenarioLabel: "Preview",
      icon: scenarioActionIconKind(item.kind, item.label),
      emphasis: true,
    };
  });
}

function suggestedScenarioBudget(entry: OverlayEntry) {
  if (entry.overlay.score >= 80) return 500000;
  if (entry.overlay.score >= 50) return 250000;
  return 100000;
}

export function CityHeatMap({ data, scenarios, onMapRefresh }: CityHeatMapProps) {
  const mapDebugEnabled = typeof window !== "undefined" && (
    window.localStorage.getItem("uhd.map.debug") === "1"
    || new URLSearchParams(window.location.search).get("mapDebug") === "1"
  );
  const renderCountRef = useRef(0);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const maplibreRef = useRef<any>(null);
  const popupRef = useRef<MapLibrePopup | null>(null);
  const selectedPopupRef = useRef<MapLibrePopup | null>(null);
  const scenarioHoverPopupRef = useRef<MapLibrePopup | null>(null);
  const scenarioMarkerRefs = useRef<Array<{ remove: () => void }>>([]);
  const scenarioMarkerElementsRef = useRef<HTMLElement[]>([]);
  const previousSelectedKeyRef = useRef<string | null>(null);
  const previousLiveSceneCapturedAtRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showThermalSurface, setShowThermalSurface] = useState(true);
  const [showThermalCorridors, setShowThermalCorridors] = useState(true);
  const [showHeat, setShowHeat] = useState(true);
  const [showCooling, setShowCooling] = useState(true);
  const [showStudyArea, setShowStudyArea] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [activeControlTab, setActiveControlTab] = useState<ControlDeckTab>("spectral");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedThermalSourceId, setSelectedThermalSourceId] = useState<string>(data.thermalSources[0]?.id ?? "none");
  const [thermalOpacity, setThermalOpacity] = useState(0.18);
  const [heatOpacity, setHeatOpacity] = useState(0.58);
  const [coolingOpacity, setCoolingOpacity] = useState(0.42);
  const [scenarioBudget, setScenarioBudget] = useState<number>(250000);
  const [scenarioPlanningMode, setScenarioPlanningMode] = useState<PlanningMode>("best_under_budget");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [showScenarioInterventions, setShowScenarioInterventions] = useState(true);
  const [liveThermalBusy, setLiveThermalBusy] = useState<"enable" | "disable" | "refresh" | null>(null);
  const [sidebarTrayOpen, setSidebarTrayOpen] = useState(true);
  const [fullPageLayerTrayOpen, setFullPageLayerTrayOpen] = useState(false);
  const [liveScenePulse, setLiveScenePulse] = useState(false);
  const [fullPageMap, setFullPageMap] = useState(false);
  const fullPageMapRef = useRef(false);
  const { sidebarCollapsed: shellCollapsed } = useAppShellLayout();
  const [debugState, setDebugState] = useState<MapDebugState>({
    heatLayerReady: false,
    coolingLayerReady: false,
    heatVisibility: "unknown",
    coolingVisibility: "unknown",
    scenarioLayerReady: false,
    scenarioVisibility: "unknown",
    heatRenderedCount: 0,
    coolingRenderedCount: 0,
    scenarioRenderedCount: 0,
    severityFilter: "all",
  });

  useEffect(() => {
    if (!mapDebugEnabled) {
      return;
    }
    console.log("[city-heat-map] debug enabled", {
      cityId: data.cityId,
      cityName: data.cityName,
      url: window.location.href,
    });
  }, [data.cityId, data.cityName, mapDebugEnabled]);

  renderCountRef.current += 1;
  if (mapDebugEnabled) {
    console.log("[city-heat-map] render", {
      renderCount: renderCountRef.current,
      fullPageMap,
      mapReady,
      shellCollapsed,
      selectedKey,
      selectedThermalSourceId,
      containerPresent: Boolean(mapContainerRef.current),
      mapPresent: Boolean(mapRef.current),
    });
  }

  const heatEntries = useMemo<OverlayEntry[]>(
    () =>
      data.heatZones.map((overlay) => ({
        key: `heat:${overlay.id}`,
        layer: "heat",
        color: "#b91c1c",
        layerLabel: "Cheeger bottleneck",
        overlay,
      })),
    [data.heatZones],
  );

  const coolingEntries = useMemo<OverlayEntry[]>(
    () =>
      data.accessZones.map((overlay) => ({
        key: `cooling:${overlay.id}`,
        layer: "cooling",
        color: "#0ea5e9",
        layerLabel: "Low cooling access",
        overlay,
      })),
    [data.accessZones],
  );

  const visibleEntries = useMemo(() => {
    const entries = [
      ...(showCooling ? coolingEntries : []),
      ...(showHeat ? heatEntries : []),
    ];
    return entries.filter((entry) => visibleUnderFilter(entry.overlay, severityFilter));
  }, [coolingEntries, heatEntries, severityFilter, showCooling, showHeat]);

  const visibleKeys = useMemo(() => new Set(visibleEntries.map((entry) => entry.key)), [visibleEntries]);
  const selectedEntry = visibleEntries.find((entry) => entry.key === selectedKey) ?? visibleEntries[0] ?? null;
  const cityScenarios = useMemo(
    () => (scenarios ?? []).filter((scenario) => scenario.cityId === data.cityId),
    [data.cityId, scenarios],
  );
  const selectedScenario = useMemo(
    () => cityScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? cityScenarios[0] ?? null,
    [cityScenarios, selectedScenarioId],
  );
  const selectedProperties = selectedEntry
    ? Object.entries(selectedEntry.overlay.properties ?? {})
        .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
        .slice(0, 8)
    : [];
  const researchQueue = visibleEntries.slice(0, 8);
  const heatVisibleCount = visibleEntries.filter((entry) => entry.layer === "heat").length;
  const coolingVisibleCount = visibleEntries.filter((entry) => entry.layer === "cooling").length;
  const activeThermalSource = data.thermalSources.find((source) => source.id === selectedThermalSourceId) ?? data.thermalSources[0] ?? null;
  const activeThermalTheme = activeThermalSource ? thermalSourceTheme(activeThermalSource.id) : null;
  const liveRefreshIntervalSec = data.liveThermalAdapter.refreshIntervalSec ?? 900;
  const liveRefreshIntervalMinutes = Math.max(1, Math.round(liveRefreshIntervalSec / 60));
  const liveSceneWorking = data.liveThermalAdapter.autoRefreshEnabled && Boolean(data.liveThermalAdapter.latestSceneCapturedAt) && !data.liveThermalAdapter.usingBackupData;
  const liveSceneSummary = data.liveThermalAdapter.usingBackupData
    ? "Cached fallback active"
    : liveSceneWorking
      ? "Live is working"
    : data.liveThermalAdapter.autoRefreshAvailable
      ? "Auto-refresh ready"
      : "Live adapter unavailable";
  const thermalCellCount = activeThermalSource?.surfaceGeojson.features.length ?? 0;
  const thermalCorridorCount = activeThermalSource?.corridorGeojson.features.length ?? 0;
  const selectedFeature = selectedEntry ? overlayFeature(selectedEntry.overlay) : null;
  const selectedBounds = featureBounds(selectedFeature);
  const selectedBreakdown = selectedEntry ? interventionValueBreakdown(selectedEntry) : [];
  const selectedCentroid = selectedEntry ? overlayCentroid(selectedEntry.overlay) : null;
  const selectedMitigations = selectedEntry ? mitigationSuggestions(selectedEntry) : [];
  const selectedScenarioBudget = selectedEntry ? suggestedScenarioBudget(selectedEntry) : 250000;
  const scenarioInterventions = useMemo(
    () => {
      if (selectedScenario) {
        return scenarioInterventionsForScenarioRecord(selectedScenario, heatEntries, coolingEntries, data.bounds);
      }
      return scenarioInterventionsForEntry(selectedEntry, scenarioBudget, scenarioPlanningMode);
    },
    [coolingEntries, data.bounds, heatEntries, selectedEntry, scenarioBudget, scenarioPlanningMode, selectedScenario],
  );
  const scenarioMapMarkers = useMemo(() => {
    if (selectedScenario) {
      return scenarioMarkersForScenarioRecord(
        selectedScenario,
        0,
        heatEntries,
        coolingEntries,
        data.bounds,
        true,
      );
    }
    return previewMarkersForEntry(selectedEntry, scenarioBudget, scenarioPlanningMode, data.bounds);
  }, [
    coolingEntries,
    data.bounds,
    heatEntries,
    scenarioBudget,
    scenarioPlanningMode,
    selectedEntry,
    selectedScenario?.id,
  ]);
  const scenarioInfluence = useMemo(
    () => scenarioInfluencePreview(data.heatGeojson as GeoJsonFeatureCollection | null | undefined, scenarioMapMarkers, data.bounds),
    [data.bounds, data.heatGeojson, scenarioMapMarkers],
  );
  const selectedScenarioPlacementNotes = useMemo(
    () => new Map(scenarioMapMarkers.map((marker) => [marker.label, marker.detail])),
    [scenarioMapMarkers],
  );

  useEffect(() => {
    if (!cityScenarios.length) {
      if (selectedScenarioId !== null) {
        setSelectedScenarioId(null);
      }
      return;
    }
    if (!selectedScenarioId || !cityScenarios.some((scenario) => scenario.id === selectedScenarioId)) {
      setSelectedScenarioId(cityScenarios[0].id);
    }
  }, [cityScenarios, selectedScenarioId]);
  const sidebarContent = (
    <>
      <div className={`map-legend map-layer-rail${fullPageMap ? " map-layer-rail-fullpage" : ""}`}>
        <div className="map-layer-rail-header">
          <div>
            <h3 className="map-layer-rail-title">{fullPageMap ? "Choose what you see" : "Spectral analysis rail"}</h3>
            <p className="map-layer-rail-subtitle">
              {fullPageMap
                ? "Turn on the evidence you need. Start with Spectral for the prioritization result; use the other tabs when you want its thermal context, geographic context, or possible actions."
                : "Start with the derived analysis layers, which are ranked by rigorous spectral math, then use the bundled thermal studies as supporting context for why those bottlenecks and cooling gaps appear."}
            </p>
            {!fullPageMap ? (
              <p className="map-layer-summary">
                The primary claim here is the spectral interpretation and prioritization logic. Bundled thermal sources shown here are real repository artifacts, but they support the mathematics rather than replacing it.
              </p>
            ) : null}
          </div>
        </div>

        <div className="map-deck-tabs" aria-label="Atlas control deck">
          <button
            type="button"
            className={activeControlTab === "spectral" ? "active" : ""}
            onClick={() => setActiveControlTab("spectral")}
          >
            Spectral
          </button>
          <button
            type="button"
            className={activeControlTab === "thermal" ? "active" : ""}
            onClick={() => setActiveControlTab("thermal")}
          >
            Thermal
          </button>
          <button
            type="button"
            className={activeControlTab === "context" ? "active" : ""}
            onClick={() => setActiveControlTab("context")}
          >
            Context
          </button>
          <button
            type="button"
            className={activeControlTab === "actions" ? "active" : ""}
            onClick={() => setActiveControlTab("actions")}
          >
            Actions
          </button>
        </div>

        <div className="map-deck-panel">
          {activeControlTab === "spectral" ? (
            <>
              <div className="map-layer-section map-layer-section-spectral-priority">
                <div className="map-layer-section-title">Spectral analysis first</div>
                <div className="spectral-priority-card">
                  <strong>Cheeger bottlenecks and low cooling access are the headline outputs because they maximize actionable value.</strong>
                  <span>{spectralAnalysisNarrative(data, heatVisibleCount, coolingVisibleCount, severityFilter)}</span>
                </div>
              </div>

              <div className="map-layer-section">
                <div className="map-layer-section-title">Rigorous math used</div>
                <div className="map-property-list">
                  <div className="map-property-row">
                    <span>Graph lens</span>
                    <strong>Spectral connectivity over the urban surface</strong>
                  </div>
                  <div className="map-property-row">
                    <span>Bottleneck test</span>
                    <strong>Cheeger-style cut logic to expose weak heat circulation seams</strong>
                  </div>
                  <div className="map-property-row">
                    <span>Equity layer</span>
                    <strong>Cooling-access scoring to locate places with the least relief</strong>
                  </div>
                  <div className="map-property-row">
                    <span>Why it matters</span>
                    <strong>Ranks interventions by likely value instead of visual intuition alone</strong>
                  </div>
                </div>
                <p className="map-layer-summary">
                  {spectralMathNarrative(heatVisibleCount, coolingVisibleCount)}
                </p>
              </div>

              <div className="map-layer-section">
                <div className="map-layer-section-title">Derived analysis layers</div>
                <label className="map-switch">
                  <input type="checkbox" checked={showHeat} onChange={() => setShowHeat((value) => !value)} />
                  <span><span className="layer-swatch layer-swatch-cheeger" />Cheeger bottlenecks</span>
                </label>
                <div className="map-slider-control">
                  <span>Heat opacity {Math.round(heatOpacity * 100)}%</span>
                  <input type="range" min="0.1" max="0.9" step="0.02" value={heatOpacity} aria-label="Heat opacity" title="Heat opacity" onChange={(event) => setHeatOpacity(Number(event.target.value))} />
                </div>
                <label className="map-switch">
                  <input type="checkbox" checked={showCooling} onChange={() => setShowCooling((value) => !value)} />
                  <span><span className="layer-swatch layer-swatch-resistance" />Low cooling access</span>
                </label>
                <div className="map-slider-control">
                  <span>Cooling opacity {Math.round(coolingOpacity * 100)}%</span>
                  <input type="range" min="0.1" max="0.9" step="0.02" value={coolingOpacity} aria-label="Cooling opacity" title="Cooling opacity" onChange={(event) => setCoolingOpacity(Number(event.target.value))} />
                </div>
                <div className="map-layer-section-title">Severity filter</div>
                <div className="map-segmented-control">
                  {(["all", "high", "medium", "low"] as SeverityFilter[]).map((filter) => (
                    <button key={filter} type="button" className={severityFilter === filter ? "active" : ""} onClick={() => setSeverityFilter(filter)}>
                      {filter === "all" ? "All" : filter[0].toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="map-layer-summary">
                  These are the research outputs people act on: where circulation breaks down, where cooling access is weak, and where mitigation should be investigated first for the highest return on effort and budget.
                </p>
              </div>
            </>
          ) : null}

          {activeControlTab === "thermal" ? (
            <div className="map-layer-section">
              <div className="map-layer-section-title">Supporting thermal evidence</div>
              <div className="map-property-list">
                <div className="map-property-row">
                  <span>Source mode</span>
                  <strong>Bundled study artifacts</strong>
                </div>
                <div className="map-property-row">
                  <span>Live adapter</span>
                  <strong>{data.liveThermalAdapter.status}</strong>
                </div>
              </div>
              <div className="map-segmented-control">
                {data.thermalSources.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    className={selectedThermalSourceId === source.id ? "active" : ""}
                    onClick={() => setSelectedThermalSourceId(source.id)}
                  >
                    {source.id === "landsat" ? "Landsat" : source.id === "ecostress" ? "ECOSTRESS" : source.label}
                  </button>
                ))}
              </div>
              {activeThermalSource && activeThermalTheme ? (
                <div className={`thermal-source-callout ${activeThermalTheme.chipClass}`}>
                  <strong>{activeThermalSource.sourceName}</strong>
                  <span>{activeThermalTheme.summary}</span>
                </div>
              ) : null}
              <label className="map-switch">
                <input
                  type="checkbox"
                  checked={data.liveThermalAdapter.autoRefreshEnabled}
                  disabled={!data.liveThermalAdapter.autoRefreshAvailable || liveThermalBusy !== null}
                  onChange={async (event) => {
                    const nextChecked = event.target.checked;
                    setLiveThermalBusy(nextChecked ? "enable" : "disable");
                    try {
                      if (nextChecked) {
                        await enableCityLiveThermal(data.cityId);
                      } else {
                        await disableCityLiveThermal(data.cityId);
                      }
                      onMapRefresh();
                    } finally {
                      setLiveThermalBusy(null);
                    }
                  }}
                />
                <span>Auto-refresh live data when configured</span>
              </label>
              <div className="quick-links">
                <button
                  type="button"
                  className="map-toggle"
                  disabled={!data.liveThermalAdapter.autoRefreshAvailable || liveThermalBusy !== null}
                  onClick={async () => {
                    setLiveThermalBusy("refresh");
                    try {
                      await refreshCityLiveThermal(data.cityId);
                      onMapRefresh();
                    } finally {
                      setLiveThermalBusy(null);
                    }
                  }}
                >
                  {liveThermalBusy === "refresh" ? "Refreshing..." : "Refresh now"}
                </button>
              </div>
              <label className="map-switch">
                <input type="checkbox" checked={showThermalSurface} onChange={() => setShowThermalSurface((value) => !value)} />
                <span>Full-city thermal surface</span>
              </label>
              <label className="map-switch">
                <input type="checkbox" checked={showThermalCorridors} onChange={() => setShowThermalCorridors((value) => !value)} />
                <span>{activeThermalSource ? `${activeThermalSource.sourceName} heat corridors` : "Heat corridors"}</span>
              </label>
              <div className="map-slider-control">
                <span>Thermal opacity {Math.round(thermalOpacity * 100)}%</span>
                  <input type="range" min="0.05" max="0.42" step="0.01" value={thermalOpacity} aria-label="Thermal opacity" title="Thermal opacity" onChange={(event) => setThermalOpacity(Number(event.target.value))} />
              </div>
              {activeThermalSource ? (
                <p className="map-layer-summary">
                  {activeThermalSource.sourceName} by {activeThermalSource.provider}. Resolution {activeThermalSource.resolutionM}m. This source helps explain the spatial heat pattern behind the derived spectral outputs. Corridor threshold {activeThermalSource.thresholdTempC.toFixed(1)}°C at the top {Math.round((1 - activeThermalSource.corridorQuantile) * 100)}% hottest cells.
                </p>
              ) : (
                <p className="map-layer-summary">No bundled thermal source is available for this city yet.</p>
              )}
              <p className="map-layer-summary">
                {data.liveThermalAdapter.headline}
              </p>
              <p className="map-layer-summary">
                {data.liveThermalAdapter.autoRefreshAvailable
                  ? `Background refresh interval: ${liveRefreshIntervalSec}s (${liveRefreshIntervalMinutes} minute${liveRefreshIntervalMinutes === 1 ? "" : "s"}). Last attempt: ${formatLiveTimestamp(data.liveThermalAdapter.lastAttemptedAt)}. Active live surfaces: ${data.liveThermalAdapter.activeSourceCount}.`
                  : "No live adapter config is currently available for this city."}
              </p>
              <p className="map-layer-summary">
                {data.liveThermalAdapter.latestSceneCapturedAt
                  ? `${liveSceneSummary}: ${formatLiveTimestamp(data.liveThermalAdapter.latestSceneCapturedAt)}${data.liveThermalAdapter.latestSourceLabel ? ` from ${data.liveThermalAdapter.latestSourceLabel}` : ""}.`
                  : "The atlas is honest about latency: Landsat and ECOSTRESS scenes are refreshed when new mapped payloads are available, not continuously every second."}
              </p>
            </div>
          ) : null}

          {activeControlTab === "context" ? (
            <>
              <div className="map-layer-section">
                <div className="map-layer-section-title">Core geography</div>
                <label className="map-switch">
                  <input type="checkbox" checked={showStudyArea} onChange={() => setShowStudyArea((value) => !value)} />
                  <span><span className="layer-swatch layer-swatch-study-area" />Study area outline</span>
                </label>
                <label className="map-switch">
                  <input type="checkbox" checked={showBoundary} onChange={() => setShowBoundary((value) => !value)} />
                  <span>Municipal boundary</span>
                </label>
              </div>
              <div className="map-layer-section">
                <div className="map-layer-section-title">Map reading note</div>
                <p className="map-layer-summary">
                  Use this tab when you want the cleanest watch-and-control loop: toggle only the geography scaffolding, then compare it against the active spectral or thermal layer selections.
                </p>
              </div>
            </>
          ) : null}

          {activeControlTab === "actions" ? (
            <div className="map-layer-section">
              <div className="map-layer-section-title">Scenario intervention layers</div>
              <p className="map-layer-summary">
                The atlas now shows saved scenarios when they exist, so the map can tell one clean planning story per scenario instead of a crowded list of options.
              </p>
              <label className="map-switch">
                <input type="checkbox" checked={showScenarioInterventions} onChange={() => setShowScenarioInterventions((value) => !value)} />
                <span>Show intervention layers on map</span>
              </label>
              <div className="map-layer-section-title">Impact evidence</div>
              <div className="scenario-impact-evidence">
                <div className="scenario-impact-evidence-row">
                  <div><span className="truth-badge derived">Planning</span><strong>Scenario influence</strong></div>
                  <p>
                    {scenarioInfluence.available
                      ? `${scenarioInfluence.affectedZoneCount} priority zones have a modeled local influence; mean priority shift ${scenarioInfluence.averagePriorityShift.toFixed(1)} points.`
                      : "Choose a scenario with mapped actions to generate a planning influence preview."}
                  </p>
                </div>
                <div className="scenario-impact-evidence-row">
                  <div><span className="truth-badge illustrative">Measured</span><strong>Observed impact</strong></div>
                  <p>Not available yet. This requires matched field or satellite observations after implementation.</p>
                </div>
                <div className="scenario-impact-evidence-row">
                  <div><span className="truth-badge illustrative">Causal</span><strong>Attributable effect</strong></div>
                  <p>Not available yet. This requires a pre-registered comparison design, controls, and uncertainty analysis.</p>
                </div>
              </div>
              {cityScenarios.length ? (
                <>
                  <div className="map-layer-section-title">Saved scenarios</div>
                  <div className="map-segmented-control">
                    {cityScenarios.map((scenario) => (
                      <button
                        key={scenario.id}
                        type="button"
                        className={selectedScenario?.id === scenario.id ? "active" : ""}
                        onClick={() => setSelectedScenarioId(scenario.id)}
                      >
                        {scenario.label}
                      </button>
                    ))}
                  </div>
                  {selectedScenario ? (
                    <div className="map-focus-card map-focus-card-spectral">
                      <div className="scenario-showcase">
                        <div className="scenario-showcase-copy">
                          <div className="eyebrow">Saved scenario</div>
                          <h4>{selectedScenario.label}</h4>
                          <p>{selectedScenario.summary}</p>
                        </div>
                        <div className="scenario-showcase-meta">
                          <div className={`truth-badge ${selectedScenario.equityScore !== null && selectedScenario.equityScore >= 70 ? "observed" : selectedScenario.confidence !== null && selectedScenario.confidence >= 0.65 ? "derived" : "estimated"}`}>
                            {selectedScenario.planningMode.replaceAll("_", " ")}
                          </div>
                          <div className="scenario-mini-stats">
                            <span>{selectedScenario.recommendedActions.length} actions</span>
                            <span>{selectedScenario.confidence === null ? "Confidence not estimated" : `${Math.round(selectedScenario.confidence * 100)}% confidence`}</span>
                          </div>
                        </div>
                      </div>
                      <div className="scenario-metric-grid">
                        <div className="map-badge">
                          <strong>${selectedScenario.budgetUsd.toLocaleString()}</strong>
                          <p>Scenario budget</p>
                        </div>
                        <div className="map-badge">
                          <strong>{selectedScenario.estimatedCostUsd === null ? "—" : `$${selectedScenario.estimatedCostUsd.toLocaleString()}`}</strong>
                          <p>Estimated cost</p>
                        </div>
                        <div className="map-badge">
                          <strong>{selectedScenario.heatReductionC === null ? "—" : `${selectedScenario.heatReductionC.toFixed(1)}°C`}</strong>
                          <p>Planning estimate · unverified</p>
                        </div>
                        <div className="map-badge">
                          <strong>{selectedScenario.equityScore === null ? "—" : selectedScenario.equityScore.toFixed(1)}</strong>
                          <p>Equity score</p>
                        </div>
                      </div>
                      <div className="map-property-list">
                        <div className="map-property-row">
                          <span>Cost method</span>
                          <strong>{selectedScenario.allocationSummary.allocationMethod}</strong>
                        </div>
                        <div className="map-property-row">
                          <span>Evidence</span>
                          <strong>{selectedScenario.evidenceSummary.readinessLabel}</strong>
                        </div>
                        <div className="map-property-row">
                          <span>Benchmark</span>
                          <strong>{selectedScenario.benchmarkSummary.benchmarkLabel}</strong>
                        </div>
                      </div>
                      <p className="map-layer-summary">
                        Placement math: 30% overlay evidence, 22% action priority, 18% layer fit, 15% slot fit, and 15% separation from already placed interventions.
                      </p>
                      {scenarioInfluence.available ? (
                        <div className="scenario-comparison-card">
                          <div className="scenario-comparison-head">
                            <strong>Scenario influence preview</strong>
                            <span>Planning model · not a temperature forecast</span>
                          </div>
                          <p className="scenario-comparison-note">
                            {scenarioInfluence.affectedZoneCount} priority zones are within the modelled local influence of this scenario. The average priority shift is {scenarioInfluence.averagePriorityShift.toFixed(1)} points; this ranks planning attention and does not estimate degrees Celsius.
                          </p>
                        </div>
                      ) : null}
                      <div className="map-layer-section-title">Recommended actions</div>
                      <div className="map-property-list map-property-list--scenario-actions">
                        {selectedScenario.recommendedActions.map((action, index) => (
                          <div key={action.interventionId} className="map-property-row scenario-action-row">
                            <div className="scenario-action-lead">
                              <ScenarioActionIcon kind={action.category} fallbackText={`${action.name} ${action.allocationBasis} ${action.rationale}`} />
                              <span className="scenario-action-order">{index + 1}</span>
                              <div className="scenario-action-copy">
                                <strong>{action.name}</strong>
                                <span>{action.category}</span>
                                <span className="scenario-action-placement-note">{selectedScenarioPlacementNotes.get(action.name) ?? action.rationale}</span>
                              </div>
                            </div>
                            <div className="scenario-action-footer">
                              <span className={`scenario-action-chip ${action.costStatus}`}>{scenarioActionStatusLabel(action.costStatus)}</span>
                              <span className="scenario-action-cost">{scenarioActionCostLabel(action)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                    <>
                      <p className="map-layer-summary">
                        Pick a scenario mode and budget tier and the atlas will turn the currently selected bottleneck or cooling-gap polygon into a small set of visible intervention layers. This local preview remains available when no saved scenarios exist yet.
                      </p>
                      <div className="map-segmented-control">
                        {[
                          { value: "best_under_budget", label: "Best under budget" },
                          { value: "evidence_first", label: "Evidence first" },
                          { value: "benchmark_share", label: "Benchmark share" },
                          { value: "whole_city_benchmark", label: "Whole-city benchmark" },
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            className={scenarioPlanningMode === item.value ? "active" : ""}
                            onClick={() => setScenarioPlanningMode(item.value as PlanningMode)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <div className="map-segmented-control">
                        {[
                          { value: 100000, label: "$100k" },
                          { value: 250000, label: "$250k" },
                          { value: 500000, label: "$500k" },
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            className={scenarioBudget === item.value ? "active" : ""}
                            onClick={() => setScenarioBudget(item.value)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <div className="map-property-list">
                        <div className="map-property-row">
                          <span>Current scenario focus</span>
                          <strong>{selectedEntry ? selectedEntry.layerLabel : "Select a bottleneck or cooling zone"}</strong>
                        </div>
                        <div className="map-property-row">
                          <span>Planning mode</span>
                          <strong>{scenarioPlanningMode.replaceAll("_", " ")}</strong>
                        </div>
                        <div className="map-property-row">
                          <span>Preview count</span>
                          <strong>{scenarioInterventions.length}</strong>
                        </div>
                        <div className="map-property-row">
                          <span>Budget tier</span>
                          <strong>${scenarioBudget.toLocaleString()}</strong>
                        </div>
                      </div>
                      {scenarioInfluence.available ? (
                        <div className="scenario-comparison-card">
                          <div className="scenario-comparison-head">
                            <strong>Scenario influence preview</strong>
                            <span>Planning model · not a temperature forecast</span>
                          </div>
                          <p className="scenario-comparison-note">
                            {scenarioInfluence.affectedZoneCount} priority zones are within the modelled local influence of this scenario. The average priority shift is {scenarioInfluence.averagePriorityShift.toFixed(1)} points; this ranks planning attention and does not estimate degrees Celsius.
                          </p>
                        </div>
                      ) : null}
                      {scenarioInterventions.length ? (
                        <div className="map-focus-card map-focus-card-spectral">
                          <div className="map-insight-head">
                            <div className="truth-badge derived">Derived</div>
                            <strong>Scenario intervention mix</strong>
                          </div>
                          <div className="map-property-list map-property-list--scenario-actions">
                            {scenarioInterventions.map((item) => (
                              <div key={`${item.kind}-${item.order}`} className="map-property-row scenario-action-row">
                                <div className="scenario-action-lead">
                                  <ScenarioActionIcon kind={item.kind} fallbackText={item.label} />
                                  <span className="scenario-action-order">{item.order}</span>
                                  <div className="scenario-action-copy">
                                    <strong>{item.label}</strong>
                                    <span>{item.detail}</span>
                                  </div>
                                </div>
                                <div className="scenario-action-footer">
                                  <span className="scenario-action-chip derived">Preview</span>
                                  <span className="scenario-action-cost">Budget ${item.budgetUsd.toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="map-layer-summary">Select a polygon to generate intervention layers.</p>
                      )}
                    </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="map-legend">
        <h3>Spectral analysis story</h3>
        <div className="map-focus-card map-focus-card-spectral">
          <div className="map-insight-head">
            <div className="truth-badge derived">Derived</div>
            <strong>Decision-grade spectral outputs from rigorous math</strong>
          </div>
          <p>{spectralAnalysisNarrative(data, heatVisibleCount, coolingVisibleCount, severityFilter)}</p>
          <div className="map-property-list">
            <div className="map-property-row">
              <span>Primary signal</span>
              <strong>Circulation bottlenecks + cooling inequity</strong>
            </div>
            <div className="map-property-row">
              <span>Mathematical basis</span>
              <strong>Spectral ranking + Cheeger-style partition logic</strong>
            </div>
            <div className="map-property-row">
              <span>Use for</span>
              <strong>Targeting mitigation, study, and budget scenarios</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="map-legend">
        <h3>Atlas verification</h3>
        <div className="map-focus-card">
          <div className="map-insight-head">
            <div className="truth-badge observed">Verified</div>
            <strong>Rendered study checks</strong>
          </div>
          <p className="muted">
            This panel shows what the atlas is actually rendering right now, so the map stays interpretable without exposing raw debug language.
          </p>
          <div className="map-property-list">
            <div className="map-property-row">
              <span>Cheeger layer loaded</span>
              <strong>{debugState.heatLayerReady ? "yes" : "no"}</strong>
            </div>
            <div className="map-property-row">
              <span>Cheeger visibility</span>
              <strong>{debugState.heatVisibility}</strong>
            </div>
            <div className="map-property-row">
              <span>Cheeger polygons in viewport</span>
              <strong>{debugState.heatRenderedCount}</strong>
            </div>
            <div className="map-property-row">
              <span>Cooling layer loaded</span>
              <strong>{debugState.coolingLayerReady ? "yes" : "no"}</strong>
            </div>
            <div className="map-property-row">
              <span>Cooling visibility</span>
              <strong>{debugState.coolingVisibility}</strong>
            </div>
            <div className="map-property-row">
              <span>Cooling polygons in viewport</span>
              <strong>{debugState.coolingRenderedCount}</strong>
            </div>
            <div className="map-property-row">
              <span>Scenario layer loaded</span>
              <strong>{debugState.scenarioLayerReady ? "yes" : "no"}</strong>
            </div>
            <div className="map-property-row">
              <span>Scenario visibility</span>
              <strong>{debugState.scenarioVisibility}</strong>
            </div>
            <div className="map-property-row">
              <span>Scenario markers in viewport</span>
              <strong>{debugState.scenarioRenderedCount}</strong>
            </div>
            <div className="map-property-row">
              <span>Active severity band</span>
              <strong>{debugState.severityFilter}</strong>
            </div>
            <div className="map-property-row">
              <span>Total Cheeger features</span>
              <strong>{data.heatZones.length}</strong>
            </div>
            <div className="map-property-row">
              <span>Total cooling features</span>
              <strong>{data.accessZones.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="map-legend">
        <h3>Study area</h3>
        <div className="map-focus-card">
          <div className="map-insight-head">
            <div className="truth-badge observed">Observed</div>
            <strong>{data.cityName} study footprint</strong>
          </div>
          <p>
            The subtle amber outline shows the extent of the current study outputs loaded for Cheeger bottlenecks and low cooling access in this city package.
          </p>
          <div className="map-property-list">
            <div className="map-property-row">
              <span>Why this matters</span>
              <strong>The overlays are only claimed inside this study area.</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="map-legend">
        <h3>Supporting thermal source</h3>
        {activeThermalSource ? (
          <div className="map-focus-card">
            <div className="map-insight-head">
              <div className="truth-badge observed">Observed</div>
              <strong>{activeThermalSource.sourceName}</strong>
            </div>
            <p>{activeThermalSource.provider} via {activeThermalSource.sensor}</p>
            {activeThermalTheme ? (
              <div className={`thermal-source-callout ${activeThermalTheme.chipClass}`}>
                <strong>{activeThermalTheme.story}</strong>
                <span>{activeThermalTheme.summary}</span>
              </div>
            ) : null}
            <div className="map-property-list">
              <div className="map-property-row">
                <span>Resolution</span>
                <strong>{activeThermalSource.resolutionM} m</strong>
              </div>
              <div className="map-property-row">
                <span>Mean temperature</span>
                <strong>{activeThermalSource.meanTempC.toFixed(1)}°C</strong>
              </div>
              <div className="map-property-row">
                <span>Range</span>
                <strong>{activeThermalSource.minTempC.toFixed(1)}°C to {activeThermalSource.maxTempC.toFixed(1)}°C</strong>
              </div>
              <div className="map-property-row">
                <span>Heat-corridor threshold</span>
                <strong>{activeThermalSource.thresholdTempC.toFixed(1)}°C</strong>
              </div>
            </div>
          </div>
        ) : (
          <p className="muted">No thermal source metadata is currently available.</p>
        )}
      </div>

      <div className="map-legend">
        <h3>Live heat path</h3>
        <div className="map-focus-card">
          <div className="map-insight-head">
            <div className={`truth-badge ${data.liveThermalAdapter.status === "configured" ? "observed" : data.liveThermalAdapter.status === "backup" || data.liveThermalAdapter.status === "planned" ? "estimated" : "illustrative"}`}>
              {data.liveThermalAdapter.status}
            </div>
            <strong>{data.liveThermalAdapter.headline}</strong>
          </div>
          <p>{data.liveThermalAdapter.detail}</p>
          <div className="map-property-list">
            <div className="map-property-row">
              <span>Live status</span>
              <strong>{liveSceneSummary}</strong>
            </div>
            <div className="map-property-row">
              <span>Source mode</span>
              <strong>{data.liveThermalAdapter.usingBackupData ? "cached fallback" : data.liveThermalAdapter.autoRefreshEnabled ? "live" : "bundled"}</strong>
            </div>
            <div className="map-property-row">
              <span>Backup data</span>
              <strong>{data.liveThermalAdapter.backupAvailable ? (data.liveThermalAdapter.usingBackupData ? "active" : "available") : "not configured"}</strong>
            </div>
            <div className="map-property-row">
              <span>Targets</span>
              <strong>{data.liveThermalAdapter.providerTargets.length ? data.liveThermalAdapter.providerTargets.join(", ") : "None configured"}</strong>
            </div>
            <div className="map-property-row">
              <span>Refresh cadence</span>
              <strong>{liveRefreshIntervalSec}s ({liveRefreshIntervalMinutes} min)</strong>
            </div>
            <div className="map-property-row">
              <span>Last live refresh</span>
              <strong>{data.liveThermalAdapter.lastUpdated ?? "No live refresh yet"}</strong>
            </div>
            <div className="map-property-row">
              <span>Last refresh attempt</span>
              <strong>{data.liveThermalAdapter.lastAttemptedAt ?? "No attempt yet"}</strong>
            </div>
            <div className="map-property-row">
              <span>Auto-refresh</span>
              <strong>{data.liveThermalAdapter.autoRefreshEnabled ? "enabled" : data.liveThermalAdapter.autoRefreshAvailable ? "available" : "not configured"}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="map-legend">
        <h3>Truth mode</h3>
        <div className="map-focus-card">
          <div className={`truth-badge ${data.truthMode.interpretationStatus}`}>
            {truthLabel(data.truthMode.interpretationStatus)}
          </div>
          <p>{data.truthMode.methodology}</p>
          <div className="map-property-list">
            {data.truthMode.notes.map((note) => (
              <div key={note} className="map-property-row map-property-row-note">
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="map-legend">
        <h3>Legend</h3>
        {data.legend.map((item) => (
          <div key={item.label} className="legend-item">
            <svg className="legend-chip legend-chip-svg" viewBox="0 0 14 14" aria-hidden="true">
              <rect x="0" y="0" width="14" height="14" rx="7" fill={item.color} />
            </svg>
            <div>
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="map-legend">
        <h3>Layer provenance</h3>
        {data.layerProvenance.map((layer) => (
          <div key={layer.id} className="map-focus-card">
            <div className="map-insight-head">
              <div className={`truth-badge ${layer.truthStatus}`}>{truthLabel(layer.truthStatus)}</div>
              <strong>{layer.label}</strong>
            </div>
            <p>{layer.method}</p>
            <div className="map-property-list">
              <div className="map-property-row">
                <span>Source type</span>
                <strong>{layer.sourceType}</strong>
              </div>
              <div className="map-property-row">
                <span>Source file</span>
                <strong>{layer.filePath ?? "None"}</strong>
              </div>
              <div className="map-property-row">
                <span>Primary fields</span>
                <strong>{layer.primaryFields.length ? layer.primaryFields.join(", ") : "None exposed"}</strong>
              </div>
            </div>
            {layer.limitations.length ? (
              <div className="map-property-list">
                {layer.limitations.map((item) => (
                  <div key={item} className="map-property-row map-property-row-note">
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

    </>
  );

  useEffect(() => {
    if (!data.thermalSources.some((source) => source.id === selectedThermalSourceId) && data.thermalSources[0]?.id) {
      setSelectedThermalSourceId(data.thermalSources[0].id);
    }
  }, [data.thermalSources, selectedThermalSourceId]);

  useEffect(() => {
    if (!shellCollapsed) {
      setSidebarTrayOpen(true);
    }
  }, [shellCollapsed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && fullPageMapRef.current) {
        if (fullPageLayerTrayOpen) {
          setFullPageLayerTrayOpen(false);
          return;
        }
        setFullPageMap(false);
        fullPageMapRef.current = false;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullPageLayerTrayOpen]);

  useEffect(() => {
    const enteringFullPageMap = fullPageMap && !fullPageMapRef.current;
    fullPageMapRef.current = fullPageMap;
    document.body.classList.toggle("map-fullpage-lock", fullPageMap);
    if (enteringFullPageMap) {
      setFullPageLayerTrayOpen(false);
    }
    if (mapDebugEnabled) {
      const container = mapContainerRef.current;
      console.log("[city-heat-map] fullscreen state changed", {
        fullPageMap,
        containerWidth: container?.offsetWidth ?? null,
        containerHeight: container?.offsetHeight ?? null,
        mapReady,
        mapPresent: Boolean(mapRef.current),
      });
    }
    return () => {
      if (fullPageMap) {
        document.body.classList.remove("map-fullpage-lock");
      }
    };
  }, [fullPageMap, mapDebugEnabled, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    // Safari changes its visual viewport when its browser controls appear or
    // disappear. A few settled resizes keep MapLibre visible on iPhone.
    const resize = () => {
      try {
        map.resize();
      } catch {
        // Ignore transient resize failures during layout changes.
      }
    };
    const timeoutIds: number[] = [];
    const frameId = window.requestAnimationFrame(() => {
      resize();
      timeoutIds.push(window.setTimeout(resize, 120), window.setTimeout(resize, 320));
    });
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    return () => {
      window.cancelAnimationFrame(frameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, [fullPageMap, mapReady]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !data.bounds) {
      return;
    }

    let disposed = false;
    const bounds = data.bounds;

    void (async () => {
      const [maplibreModule] = await Promise.all([
        import("maplibre-gl"),
        import("maplibre-gl/dist/maplibre-gl.css"),
      ]);
      const maplibregl = ("default" in maplibreModule ? maplibreModule.default : maplibreModule) as typeof maplibreModule.default;
      maplibreRef.current = maplibregl;

      if (disposed || !mapContainerRef.current || mapRef.current) {
        return;
      }

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center: [(bounds.minLng + bounds.maxLng) / 2, (bounds.minLat + bounds.maxLat) / 2],
        zoom: 11,
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      map.on("load", () => {
      if (data.boundaryGeojson) {
        map.addSource("boundary", { type: "geojson", data: data.boundaryGeojson as GeoJSON.FeatureCollection });
        map.addLayer({
          id: "boundary-line",
          type: "line",
          source: "boundary",
          paint: {
            "line-color": "#0f172a",
            "line-width": 2,
          },
        });
      }

      if (data.studyAreaGeojson) {
        map.addSource("study-area", { type: "geojson", data: data.studyAreaGeojson as GeoJSON.FeatureCollection });
        map.addLayer({
          id: "study-area-line",
          type: "line",
          source: "study-area",
          paint: {
            "line-color": "#92400e",
            "line-opacity": 0.82,
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              8, 1.5,
              11, 2.2,
              14, 3,
            ],
          },
        });
      }

      for (const thermalSource of data.thermalSources) {
        const theme = thermalSourceTheme(thermalSource.id);
        const fillSourceId = `thermal-source-${thermalSource.id}`;
        const corridorSourceId = `thermal-corridor-source-${thermalSource.id}`;
        map.addSource(fillSourceId, {
          type: "geojson",
          data: thermalSource.surfaceGeojson as GeoJSON.FeatureCollection,
        });
        map.addLayer({
          id: `thermal-fill-${thermalSource.id}`,
          type: "fill",
          source: fillSourceId,
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["to-number", ["get", "temp_c"]],
              thermalSource.minTempC, theme.rampLow,
              thermalSource.meanTempC, theme.rampMid,
              thermalSource.thresholdTempC, theme.rampHot,
              thermalSource.maxTempC, theme.rampPeak,
            ],
            "fill-opacity": 0.13,
          },
        });
        map.addLayer({
          id: `thermal-line-${thermalSource.id}`,
          type: "line",
          source: fillSourceId,
          paint: {
            "line-color": "rgba(255,255,255,0.28)",
            "line-width": 0.45,
            "line-opacity": 0.72,
          },
        });
        map.addSource(corridorSourceId, {
          type: "geojson",
          data: thermalSource.corridorGeojson as GeoJSON.FeatureCollection,
        });
        map.addLayer({
          id: `thermal-corridor-fill-${thermalSource.id}`,
          type: "fill",
          source: corridorSourceId,
          paint: {
            "fill-color": theme.corridor,
            "fill-opacity": 0.18,
          },
        });
        map.addLayer({
          id: `thermal-corridor-line-${thermalSource.id}`,
          type: "line",
          source: corridorSourceId,
          paint: {
            "line-color": theme.corridor,
            "line-width": 0.9,
          },
        });
      }

      if (data.heatGeojson) {
        map.addSource("heat", { type: "geojson", data: data.heatGeojson as GeoJSON.FeatureCollection });
        map.addLayer({
          id: "heat-fill",
          type: "fill",
          source: "heat",
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["coalesce", ["to-number", ["get", "priority"]], 0],
              0, "#fee2e2",
              25, "#fca5a5",
              50, "#ef4444",
              75, "#b91c1c",
              100, "#7f1d1d",
            ],
            "fill-opacity": 0.58,
          },
        });
        map.addLayer({
          id: "heat-line",
          type: "line",
          source: "heat",
          paint: {
            "line-color": "#7f1d1d",
            "line-width": 1,
          },
        });
      }
      if (data.accessGeojson) {
        map.addSource("cooling", { type: "geojson", data: data.accessGeojson as GeoJSON.FeatureCollection });
        map.addLayer({
          id: "cooling-fill",
          type: "fill",
          source: "cooling",
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["coalesce", ["to-number", ["get", "cooling_access"]], 0],
              0, "#dbeafe",
              5, "#7dd3fc",
              10, "#38bdf8",
              20, "#0ea5e9",
              35, "#075985",
            ],
            "fill-opacity": 0.42,
          },
        });
        map.addLayer({
          id: "cooling-line",
          type: "line",
          source: "cooling",
          paint: {
            "line-color": "#0369a1",
            "line-width": 0.8,
          },
        });
      }

      map.addSource("selection", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        } as GeoJSON.FeatureCollection,
      });
      map.addLayer({
        id: "selection-fill",
        type: "fill",
        source: "selection",
        paint: {
          "fill-color": "#f8fafc",
          "fill-opacity": 0.1,
        },
      });
      map.addLayer({
        id: "selection-line",
        type: "line",
        source: "selection",
        paint: {
          "line-color": "#f59e0b",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9, 2,
            12, 3,
            15, 4.5,
          ],
          "line-opacity": 0.95,
        },
      });

      map.addSource("scenario-interventions", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        } as GeoJSON.FeatureCollection,
      });
      map.addLayer({
        id: "scenario-interventions-circle",
        type: "circle",
        source: "scenario-interventions",
        layout: {
          visibility: "none",
        },
        paint: {
          "circle-color": ["coalesce", ["get", "color"], "#0f766e"],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["coalesce", ["to-number", ["get", "budgetUsd"]], 0],
            100000, 8,
            250000, 10,
            500000, 13,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.88,
        },
      });
      map.addLayer({
        id: "scenario-interventions-label",
        type: "symbol",
        source: "scenario-interventions",
        layout: {
          visibility: "none",
          "text-field": ["get", "label"],
          "text-size": 11,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#102033",
          "text-halo-color": "rgba(255,255,255,0.96)",
          "text-halo-width": 1.2,
        },
      });

      map.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        { padding: 36, duration: 0 },
      );
      setMapReady(true);
      });

      mapRef.current = map;
      popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
      selectedPopupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 18 });
      scenarioHoverPopupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 16 });
    })();

    return () => {
      disposed = true;
      setMapReady(false);
      popupRef.current?.remove();
      popupRef.current = null;
      selectedPopupRef.current?.remove();
      selectedPopupRef.current = null;
      scenarioHoverPopupRef.current?.remove();
      scenarioHoverPopupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [data.accessGeojson, data.boundaryGeojson, data.bounds, data.heatGeojson, data.studyAreaGeojson, data.thermalSources]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const updateLayerVisibility = (layerId: string, visible: boolean) => {
      if (safeHasLayer(map, layerId)) {
        map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
      }
    };

    for (const thermalSource of data.thermalSources) {
      const isActive = thermalSource.id === selectedThermalSourceId;
      updateLayerVisibility(`thermal-fill-${thermalSource.id}`, showThermalSurface && isActive);
      updateLayerVisibility(`thermal-line-${thermalSource.id}`, showThermalSurface && isActive);
      updateLayerVisibility(`thermal-corridor-fill-${thermalSource.id}`, showThermalCorridors && isActive);
      updateLayerVisibility(`thermal-corridor-line-${thermalSource.id}`, showThermalCorridors && isActive);
    }
    updateLayerVisibility("study-area-line", showStudyArea);
    updateLayerVisibility("boundary-line", showBoundary);
    updateLayerVisibility("heat-fill", showHeat);
    updateLayerVisibility("heat-line", showHeat);
    updateLayerVisibility("cooling-fill", showCooling);
    updateLayerVisibility("cooling-line", showCooling);
    updateLayerVisibility("scenario-interventions-circle", showScenarioInterventions && scenarioInterventions.length > 0);
  }, [
    data.thermalSources,
    mapReady,
    scenarioInterventions.length,
    selectedThermalSourceId,
    showBoundary,
    showCooling,
    showHeat,
    showStudyArea,
    showThermalCorridors,
    showThermalSurface,
    showScenarioInterventions,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !safeHasLayer(map, "scenario-interventions-circle")) {
      return;
    }

    const source = map.getSource("scenario-interventions") as GeoJSONSource | undefined;
    if (!source) {
      return;
    }

    source.setData({
      type: "FeatureCollection",
      features: scenarioInterventions.map((item) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [item.lng, item.lat],
        },
        properties: {
          kind: item.kind,
          label: item.label,
          detail: item.detail,
          budgetUsd: item.budgetUsd,
          order: item.order,
          color: item.color,
        },
      })),
    });
  }, [mapReady, scenarioInterventions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }
    for (const thermalSource of data.thermalSources) {
      if (safeHasLayer(map, `thermal-fill-${thermalSource.id}`)) {
        map.setPaintProperty(`thermal-fill-${thermalSource.id}`, "fill-opacity", thermalOpacity);
      }
    }
    if (safeHasLayer(map, "heat-fill")) {
      map.setPaintProperty("heat-fill", "fill-opacity", heatOpacity);
    }
    if (safeHasLayer(map, "cooling-fill")) {
      map.setPaintProperty("cooling-fill", "fill-opacity", coolingOpacity);
    }
  }, [coolingOpacity, data.thermalSources, heatOpacity, mapReady, thermalOpacity]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    const scenarioPopup = scenarioHoverPopupRef.current;
    if (!map || !mapReady || !maplibregl) {
      return;
    }

    const scaleMarkers = () => {
      const zoom = map.getZoom();
      const scale = Math.max(0.75, Math.min(1.4, 0.78 + (zoom - 9) * 0.08));
      for (const el of scenarioMarkerElementsRef.current) {
        el.style.setProperty("--scenario-scale", scale.toFixed(2));
      }
    };

    for (const marker of scenarioMarkerRefs.current) {
      marker.remove();
    }
    scenarioMarkerRefs.current = [];
    scenarioMarkerElementsRef.current = [];

    const markersToRender = showScenarioInterventions ? scenarioMapMarkers : [];
    markersToRender.forEach((markerData, index) => {
      const el = document.createElement("div");
      el.className = `scenario-marker ${markerData.emphasis ? "is-selected" : ""} is-${markerData.icon}`;
      el.style.setProperty("--scenario-color", markerData.color);
      el.style.setProperty("--scenario-scale", "1");
      el.style.setProperty("--scenario-delay", `${(index % 6) * 0.18}s`);
      el.setAttribute("role", "img");
      el.tabIndex = 0;
      el.setAttribute("aria-label", `${markerData.scenarioLabel} ${markerData.label}`);

      const icon = document.createElement("span");
      icon.className = `scenario-marker-icon is-${markerData.icon}`;
      icon.style.color = "#ffffff";
      icon.innerHTML = scenarioActionIconMarkup(markerData.icon, markerData.label);
      el.appendChild(icon);

      const connector = document.createElement("span");
      connector.className = "scenario-marker-connector";
      el.appendChild(connector);

      const hotspot = document.createElement("span");
      hotspot.className = "scenario-marker-hotspot";
      hotspot.setAttribute("aria-hidden", "true");
      el.appendChild(hotspot);

      const showScenarioPopup = () => {
        if (!scenarioPopup) {
          return;
        }
        const placeHint = scenarioPlaceHint(markerData);
        const mechanismLabel = scenarioMechanismLabel(markerData.icon, markerData.label);
        const popupContent = document.createElement("div");
        popupContent.className = "scenario-marker-popup";

        const header = document.createElement("div");
        header.className = "scenario-marker-popup-header";

        const headerLabel = document.createElement("div");
        headerLabel.className = "scenario-marker-popup-scenario";
        headerLabel.textContent = shortScenarioLabel(markerData.scenarioLabel);
        header.appendChild(headerLabel);

        const title = document.createElement("div");
        title.className = "scenario-marker-popup-title";
        title.textContent = shortInterventionLabel(markerData.label);
        header.appendChild(title);

        popupContent.appendChild(header);

        const details = document.createElement("div");
        details.className = "scenario-marker-popup-details";

        const whereRow = document.createElement("div");
        whereRow.className = "scenario-marker-popup-row";
        const whereLabel = document.createElement("span");
        whereLabel.className = "scenario-marker-popup-key";
        whereLabel.textContent = "Where";
        whereRow.appendChild(whereLabel);
        const whereValue = document.createElement("span");
        whereValue.className = "scenario-marker-popup-value";
        whereValue.textContent = placeHint ? placeHint.label : "Selected area";
        whereRow.appendChild(whereValue);
        details.appendChild(whereRow);

        if (placeHint) {
          const areaRow = document.createElement("div");
          areaRow.className = "scenario-marker-popup-row";
          const areaLabel = document.createElement("span");
          areaLabel.className = "scenario-marker-popup-key";
          areaLabel.textContent = "Why here";
          areaRow.appendChild(areaLabel);
          const areaValue = document.createElement("span");
          areaValue.className = "scenario-marker-popup-value";
          areaValue.textContent = placeHint.explanation;
          areaRow.appendChild(areaValue);
          details.appendChild(areaRow);
        }

        const mechanismRow = document.createElement("div");
        mechanismRow.className = "scenario-marker-popup-row";
        const mechanismLabelNode = document.createElement("span");
        mechanismLabelNode.className = "scenario-marker-popup-key";
        mechanismLabelNode.textContent = "Mechanism";
        mechanismRow.appendChild(mechanismLabelNode);
        const mechanismValue = document.createElement("span");
        mechanismValue.className = "scenario-marker-popup-value";
        mechanismValue.textContent = mechanismLabel;
        mechanismRow.appendChild(mechanismValue);
        details.appendChild(mechanismRow);

        popupContent.appendChild(details);

        const body = document.createElement("div");
        body.className = "scenario-marker-popup-body";
        body.textContent = markerData.detail;
        popupContent.appendChild(body);

        const meta = document.createElement("div");
        meta.className = "scenario-marker-popup-meta";
        meta.textContent = markerData.emphasis ? "Active scenario" : "Scenario intervention";
        popupContent.appendChild(meta);

        scenarioPopup
          .setLngLat([markerData.lng, markerData.lat])
          .setDOMContent(popupContent)
          .addTo(map);
      };

      const hideScenarioPopup = () => {
        scenarioPopup?.remove();
      };

      el.addEventListener("mouseenter", showScenarioPopup);
      el.addEventListener("mouseleave", hideScenarioPopup);
      el.addEventListener("focus", showScenarioPopup);
      el.addEventListener("blur", hideScenarioPopup);

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([markerData.lng, markerData.lat])
        .addTo(map);
      scenarioMarkerRefs.current.push(marker);
      scenarioMarkerElementsRef.current.push(el);
    });

    scaleMarkers();
    map.on("zoom", scaleMarkers);
    map.on("move", scaleMarkers);

    return () => {
      map.off("zoom", scaleMarkers);
      map.off("move", scaleMarkers);
      scenarioPopup?.remove();
      for (const marker of scenarioMarkerRefs.current) {
        marker.remove();
      }
      scenarioMarkerRefs.current = [];
      scenarioMarkerElementsRef.current = [];
    };
  }, [mapReady, scenarioMapMarkers, showScenarioInterventions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !safeHasLayer(map, "selection-line")) {
      return;
    }

    const selectionSource = map.getSource("selection") as GeoJSONSource | undefined;
    if (selectionSource) {
      selectionSource.setData({
        type: "FeatureCollection",
        features: selectedFeature ? [selectedFeature as GeoJSON.Feature] : [],
      });
    }

    if (selectedKey && selectedBounds && previousSelectedKeyRef.current !== selectedKey) {
      map.fitBounds(
        [
          [selectedBounds.minLng, selectedBounds.minLat],
          [selectedBounds.maxLng, selectedBounds.maxLat],
        ],
        { padding: 64, duration: 700, maxZoom: 14.5 },
      );
    }

    previousSelectedKeyRef.current = selectedKey;
  }, [mapReady, selectedBounds, selectedFeature, selectedKey]);

  useEffect(() => {
    const map = mapRef.current;
    const popup = selectedPopupRef.current;
    if (!map || !mapReady || !popup) {
      return;
    }
    if (!selectedEntry || !selectedCentroid) {
      popup.remove();
      return;
    }

    popup
      .setLngLat([selectedCentroid.lng, selectedCentroid.lat])
      .setHTML(
        `<strong>${selectedEntry.layerLabel}</strong><br/>${selectedEntry.overlay.scoreClass} priority<br/>Score ${selectedEntry.overlay.score.toFixed(1)}`,
      )
      .addTo(map);
  }, [mapReady, selectedCentroid, selectedEntry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const applySelectionPaint = () => {
      if (safeHasLayer(map, "heat-line")) {
        map.setPaintProperty("heat-line", "line-width", [
          "case",
          ["==", ["concat", "heat:", ["to-string", ["coalesce", ["id"], ["get", "cell_id"], ["get", "id"]]]], selectedKey ?? ""],
          2.4,
          1,
        ]);
      }
      if (safeHasLayer(map, "cooling-line")) {
        map.setPaintProperty("cooling-line", "line-width", [
          "case",
          ["==", ["concat", "cooling:", ["to-string", ["coalesce", ["id"], ["get", "cell_id"], ["get", "id"]]]], selectedKey ?? ""],
          2.2,
          0.8,
        ]);
      }
    };

    const popup = popupRef.current;

    const onHeatMove = (event: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      const feature = event.features?.[0];
      if (!feature || !popup) {
        return;
      }
      const priority = Number(feature.properties?.priority ?? 0).toFixed(1);
      popup
        .setLngLat(event.lngLat)
        .setHTML(`<strong>Heat bottleneck</strong><br/>Priority ${priority}<br/>${String(feature.properties?.priority_class ?? "Unknown")}`)
        .addTo(map);
      map.getCanvas().style.cursor = "pointer";
    };

    const onCoolingMove = (event: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      const feature = event.features?.[0];
      if (!feature || !popup) {
        return;
      }
      const access = Number(feature.properties?.cooling_access ?? 0).toFixed(1);
      popup
        .setLngLat(event.lngLat)
        .setHTML(`<strong>Low cooling access</strong><br/>Access ${access}<br/>${String(feature.properties?.access_class ?? "Unknown")}`)
        .addTo(map);
      map.getCanvas().style.cursor = "pointer";
    };

    const onLeave = () => {
      popup?.remove();
      map.getCanvas().style.cursor = "";
    };

    const makeThermalMove = (sourceName: string, provider: string) =>
      (event: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
        const feature = event.features?.[0];
        if (!feature || !popup) {
          return;
        }
        const tempC = Number(feature.properties?.temp_c ?? 0).toFixed(1);
        popup
          .setLngLat(event.lngLat)
          .setHTML(`<strong>${sourceName}</strong><br/>Observed surface temperature ${tempC}°C<br/>Provider ${provider}`)
          .addTo(map);
        map.getCanvas().style.cursor = "pointer";
      };

    const onHeatClick = (event: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const key = `heat:${String(feature.id ?? feature.properties?.cell_id ?? feature.properties?.id ?? "")}`;
      if (visibleKeys.has(key)) {
        setSelectedKey(key);
      }
    };

    const onCoolingClick = (event: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const key = `cooling:${String(feature.id ?? feature.properties?.cell_id ?? feature.properties?.id ?? "")}`;
      if (visibleKeys.has(key)) {
        setSelectedKey(key);
      }
    };

    const syncSourceFilter = (sourceLayer: "heat" | "cooling", entries: OverlayEntry[]) => {
      const layerId = sourceLayer === "heat" ? "heat-fill" : "cooling-fill";
      const lineId = sourceLayer === "heat" ? "heat-line" : "cooling-line";
      if (!safeHasLayer(map, layerId)) {
        return;
      }
      const filter = severityFilter === "all"
        ? null
        : ["==", ["downcase", ["to-string", ["get", "severity_bucket"]]], severityFilter];
      map.setFilter(layerId, filter as unknown as FilterSpecification | null);
      if (safeHasLayer(map, lineId)) {
        map.setFilter(lineId, filter as unknown as FilterSpecification | null);
      }
    };

    syncSourceFilter("heat", visibleEntries.filter((entry) => entry.layer === "heat"));
    syncSourceFilter("cooling", visibleEntries.filter((entry) => entry.layer === "cooling"));
    applySelectionPaint();

    if (safeHasLayer(map, "heat-fill")) {
      map.on("mousemove", "heat-fill", onHeatMove);
      map.on("mouseleave", "heat-fill", onLeave);
      map.on("click", "heat-fill", onHeatClick);
    }
    if (safeHasLayer(map, "cooling-fill")) {
      map.on("mousemove", "cooling-fill", onCoolingMove);
      map.on("mouseleave", "cooling-fill", onLeave);
      map.on("click", "cooling-fill", onCoolingClick);
    }
    const thermalHandlers = data.thermalSources.map((thermalSource) => ({
      source: thermalSource,
      move: makeThermalMove(thermalSource.sourceName, thermalSource.provider),
    }));
    for (const handler of thermalHandlers) {
      if (safeHasLayer(map, `thermal-fill-${handler.source.id}`)) {
        map.on("mousemove", `thermal-fill-${handler.source.id}`, handler.move);
        map.on("mouseleave", `thermal-fill-${handler.source.id}`, onLeave);
      }
    }

    return () => {
      if (safeHasLayer(map, "heat-fill")) {
        map.off("mousemove", "heat-fill", onHeatMove);
        map.off("mouseleave", "heat-fill", onLeave);
        map.off("click", "heat-fill", onHeatClick);
      }
      if (safeHasLayer(map, "cooling-fill")) {
        map.off("mousemove", "cooling-fill", onCoolingMove);
        map.off("mouseleave", "cooling-fill", onLeave);
        map.off("click", "cooling-fill", onCoolingClick);
      }
      for (const handler of thermalHandlers) {
        if (safeHasLayer(map, `thermal-fill-${handler.source.id}`)) {
          map.off("mousemove", `thermal-fill-${handler.source.id}`, handler.move);
          map.off("mouseleave", `thermal-fill-${handler.source.id}`, onLeave);
        }
      }
    };
  }, [data.thermalSources, mapReady, selectedKey, showCooling, showHeat, visibleEntries, visibleKeys]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !mapDebugEnabled) {
      return;
    }

    const heatLayerReady = safeHasLayer(map, "heat-fill");
    const coolingLayerReady = safeHasLayer(map, "cooling-fill");
    const scenarioLayerReady = scenarioMarkerRefs.current.length > 0;
    setDebugState((prev) => {
      const next: MapDebugState = {
        heatLayerReady,
        coolingLayerReady,
        scenarioLayerReady,
        heatVisibility: heatLayerReady ? String(map.getLayoutProperty("heat-fill", "visibility") ?? "visible") : "missing",
        coolingVisibility: coolingLayerReady ? String(map.getLayoutProperty("cooling-fill", "visibility") ?? "visible") : "missing",
        scenarioVisibility: scenarioLayerReady ? String(map.getLayoutProperty("scenario-interventions-circle", "visibility") ?? "visible") : "missing",
        heatRenderedCount: showHeat ? visibleEntries.filter((entry) => entry.layer === "heat").length : 0,
        coolingRenderedCount: showCooling ? visibleEntries.filter((entry) => entry.layer === "cooling").length : 0,
        scenarioRenderedCount: showScenarioInterventions ? scenarioMarkerRefs.current.length : 0,
        severityFilter,
      };
      const unchanged =
        prev.heatLayerReady === next.heatLayerReady
        && prev.coolingLayerReady === next.coolingLayerReady
        && prev.scenarioLayerReady === next.scenarioLayerReady
        && prev.heatVisibility === next.heatVisibility
        && prev.coolingVisibility === next.coolingVisibility
        && prev.scenarioVisibility === next.scenarioVisibility
        && prev.heatRenderedCount === next.heatRenderedCount
        && prev.coolingRenderedCount === next.coolingRenderedCount
        && prev.scenarioRenderedCount === next.scenarioRenderedCount
        && prev.severityFilter === next.severityFilter;
      return unchanged ? prev : next;
    });
  }, [
    mapDebugEnabled,
    mapReady,
    scenarioInterventions,
    severityFilter,
    showCooling,
    showHeat,
    showScenarioInterventions,
    visibleEntries,
  ]);

  useEffect(() => {
    const latestSceneCapturedAt = data.liveThermalAdapter.latestSceneCapturedAt ?? null;
    const previousSceneCapturedAt = previousLiveSceneCapturedAtRef.current;
    previousLiveSceneCapturedAtRef.current = latestSceneCapturedAt;

    if (!previousSceneCapturedAt || previousSceneCapturedAt === latestSceneCapturedAt) {
      return;
    }

    setLiveScenePulse(true);
    const timeout = window.setTimeout(() => setLiveScenePulse(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [data.liveThermalAdapter.latestSceneCapturedAt]);

  return (
    <article className={`panel-card map-card map-card-geographic${fullPageMap ? " map-card-fullpage" : ""}`}>
      {fullPageMap ? (
        <div className="map-fullpage-header">
          <div className="map-fullpage-header-content">
            <h2>{data.cityName} spectral atlas</h2>
            <span className="map-fullpage-hint">The map stays clear by default. Press Esc to close controls, then again to exit.</span>
          </div>
          <div className="map-fullpage-header-actions">
            <button
              type="button"
              className="map-fullpage-layers"
              onClick={() => setFullPageLayerTrayOpen((open) => !open)}
              aria-expanded={fullPageLayerTrayOpen}
              aria-controls="fullpage-map-layers-and-evidence"
            >
              {fullPageLayerTrayOpen ? "Close layers" : "Map layers"}
            </button>
            <button
              type="button"
              className="map-fullpage-exit"
              onClick={() => {
                setFullPageMap(false);
              }}
              aria-label="Exit full page map"
            >
              ← Back
            </button>
          </div>
        </div>
      ) : null}
      {fullPageMap && fullPageLayerTrayOpen ? (
        <aside
          id="fullpage-map-layers-and-evidence"
          className="map-sidebar map-sidebar-fullpage-tray"
          aria-label="Layers and evidence"
        >
          <div className="map-sidebar-fullpage-tray-header">
            <div>
              <p className="map-sidebar-fullpage-kicker">Map controls</p>
              <h3>Map layers</h3>
              <p>Turn on only the evidence you need. The short labels below are designed for a clear demo and a clear map.</p>
            </div>
            <button type="button" onClick={() => setFullPageLayerTrayOpen(false)} aria-label="Close layers and evidence">
              Close
            </button>
          </div>
          <div className="map-fullpage-layer-quick-controls" role="group" aria-label="Quick map layer controls">
            <label className="map-fullpage-layer-switch">
              <input type="checkbox" checked={showHeat} onChange={() => setShowHeat((value) => !value)} />
              <span><i className="layer-swatch layer-swatch-cheeger" />Heat priority <small>derived</small></span>
            </label>
            <label className="map-fullpage-layer-switch">
              <input type="checkbox" checked={showCooling} onChange={() => setShowCooling((value) => !value)} />
              <span><i className="layer-swatch layer-swatch-resistance" />Cooling gaps <small>derived</small></span>
            </label>
            <label className="map-fullpage-layer-switch">
              <input type="checkbox" checked={showThermalSurface} onChange={() => setShowThermalSurface((value) => !value)} />
              <span><i className="layer-swatch layer-swatch-thermal" />Surface heat <small>observed</small></span>
            </label>
            <label className="map-fullpage-layer-switch">
              <input type="checkbox" checked={showThermalCorridors} onChange={() => setShowThermalCorridors((value) => !value)} />
              <span><i className="layer-swatch layer-swatch-corridor" />Heat corridors <small>observed</small></span>
            </label>
            <label className="map-fullpage-layer-switch">
              <input type="checkbox" checked={showScenarioInterventions} onChange={() => setShowScenarioInterventions((value) => !value)} />
              <span><i className="layer-swatch layer-swatch-intervention" />Actions <small>scenario</small></span>
            </label>
            <label className="map-fullpage-layer-switch">
              <input type="checkbox" checked={showStudyArea} onChange={() => setShowStudyArea((value) => !value)} />
              <span><i className="layer-swatch layer-swatch-study-area" />Study edge <small>scope</small></span>
            </label>
          </div>
          <details className="map-fullpage-research-details">
            <summary>Research details &amp; sources</summary>
            <div className="map-fullpage-research-content">{sidebarContent}</div>
          </details>
        </aside>
      ) : null}
      <div className="map-header">
        <div>
          <h2>{data.cityName} spectral atlas</h2>
          <p>{data.narrative}</p>
        </div>
        <div className="map-pill-cluster">
          <div className="map-pill">{data.artifactPaths.length} real artifacts</div>
          <div className={`map-pill live-thermal-pill ${liveThermalStatusTone(data.liveThermalAdapter.status)} ${liveScenePulse ? "is-live" : ""}`}>
            <strong>{`${liveThermalStatusLabel(data.liveThermalAdapter.status)}${liveSceneWorking ? " · Live is working" : data.liveThermalAdapter.usingBackupData ? " · Cached fallback" : ""}`}</strong>
            <span>
              {data.liveThermalAdapter.latestSceneCapturedAt
                ? `${data.liveThermalAdapter.latestSourceLabel ?? "Latest scene"} observed ${formatLiveTimestamp(data.liveThermalAdapter.latestSceneCapturedAt)}`
                : data.liveThermalAdapter.lastUpdated
                  ? `Last adapter refresh ${formatLiveTimestamp(data.liveThermalAdapter.lastUpdated)}`
                  : "Showing bundled study layers until a live adapter is configured"}
            </span>
          </div>
          {showScenarioInterventions && scenarioMapMarkers.length ? (
            <div className="map-live-placement-note">
              <span className="map-live-placement-dot" aria-hidden="true" />
              <span>Blinking markers show recommended intervention placement.</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="truth-banner">
        <div className={`truth-badge ${data.truthMode.interpretationStatus}`}>
          {truthLabel(data.truthMode.interpretationStatus)}
        </div>
        <div className="truth-copy">
          <strong>{data.truthMode.headline} The emphasis is on rigorous spectral mathematics, not just sensor imagery.</strong>
          <p>{data.truthMode.caution}</p>
        </div>
      </div>

      <div className={`map-layout ${shellCollapsed ? "map-layout-shell-collapsed" : ""}${fullPageMap ? " map-layout-fullpage" : ""}`}>
        <div className={`map-main-column ${shellCollapsed ? "map-main-column-shell-collapsed" : ""}${fullPageMap ? " map-main-column-fullpage" : ""}`}>
          <div className="map-inline-controls">
            <div className="map-toolbar map-toolbar-inline">
              <div className="map-control-group">
                <button
                  type="button"
                  className="map-toggle active"
                  onClick={() => {
                    const map = mapRef.current;
                    if (!map || !data.bounds) return;
                    map.fitBounds(
                      [
                        [data.bounds.minLng, data.bounds.minLat],
                        [data.bounds.maxLng, data.bounds.maxLat],
                      ],
                      { padding: 36, duration: 500 },
                    );
                  }}
                >
                  Reset extent
                </button>
                <button type="button" className="map-toggle" onClick={() => setSelectedKey(null)}>
                  Clear selection
                </button>
                <button
                  type="button"
                  className={`map-toggle${fullPageMap ? " active" : ""}`}
                  onClick={() => {
                    const next = !fullPageMap;
                    if (mapDebugEnabled) {
                      const container = mapContainerRef.current;
                      console.log("[city-heat-map] fullscreen toggle clicked", {
                        currentFullPageMap: fullPageMap,
                        nextFullPageMap: next,
                        mapReady,
                        containerWidth: container?.offsetWidth ?? null,
                        containerHeight: container?.offsetHeight ?? null,
                        mapPresent: Boolean(mapRef.current),
                      });
                    }
                    setFullPageMap(next);
                  }}
                  aria-label={fullPageMap ? "Exit full page map" : "Open full page map"}
                >
                  {fullPageMap ? "Back to page" : "Full page map"}
                </button>
              </div>
            </div>

            <div className="district-grid district-grid-inline">
              <div className="map-badge">
                <strong>{thermalCellCount}</strong>
                <p>thermal study cells</p>
              </div>
              <div className="map-badge">
                <strong>{thermalCorridorCount}</strong>
                <p>heat-corridor cells</p>
              </div>
              <div className="map-badge">
                <strong>{heatVisibleCount}</strong>
                <p>visible heat traps</p>
              </div>
              <div className="map-badge">
                <strong>{coolingVisibleCount}</strong>
                <p>visible cooling gaps</p>
              </div>
              <div className="map-badge">
                <strong>{selectedEntry ? selectedEntry.overlay.score.toFixed(1) : "-"}</strong>
                <p>selected score</p>
              </div>
              <div className="map-badge">
                <strong>{severityFilter === "all" ? "All" : severityFilter}</strong>
                <p>active filter</p>
              </div>
            </div>
          </div>

          <div className={`map-stage map-stage-geographic ${liveScenePulse ? "live-update-flash" : ""}${fullPageMap ? " map-stage-fullpage" : ""}`}>
            <div ref={mapContainerRef} className={`maplibre-stage${fullPageMap ? " maplibre-stage-fullpage" : ""}`} />
          </div>

          <div className="map-analysis-dock">
            <div className="map-legend">
              <h3>Selected polygon</h3>
              {selectedEntry ? (
                <div className="map-focus-card">
                  <div className="eyebrow">{selectedEntry.layerLabel}</div>
                  <strong>{selectedEntry.overlay.label}</strong>
                  <p>{overlayNarrative(selectedEntry)}</p>
                  <div className="metric-list compact">
                    <div><span>Score</span><strong>{selectedEntry.overlay.score.toFixed(1)}</strong></div>
                    <div><span>Class</span><strong>{selectedEntry.overlay.scoreClass}</strong></div>
                  </div>
                  <div className="value-bars">
                    {selectedBreakdown.map((item) => (
                      <div key={item.label} className="value-bar-row">
                        <div className="value-bar-label">
                          <span>{item.label}</span>
                          <strong>{item.value.toFixed(0)}</strong>
                        </div>
                        <div className="value-bar-track">
                          <progress className={`value-bar-meter ${item.tone}`} max={100} value={Math.max(8, Math.min(100, item.value))} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="math-explainer-card">
                    <strong>Why this area matters</strong>
                    <p>{plainMathExplanation(selectedEntry)}</p>
                  </div>
                  <div className="mitigation-strip">
                    {selectedMitigations.map((item) => (
                      <Link
                        key={item}
                        to="/scenarios"
                        search={{
                          cityId: data.cityId,
                          budgetUsd: selectedScenarioBudget,
                          focus: item,
                          sourceLayer: selectedEntry.layerLabel,
                          selectedLabel: selectedEntry.overlay.label,
                        }}
                        className="mitigation-chip"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                  {selectedProperties.length ? (
                    <div className="map-property-list">
                      {selectedProperties.map(([key, value]) => (
                        <div key={key} className="map-property-row">
                          <span>{key}</span>
                          <strong>{String(value)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="muted">Turn on at least one layer to inspect polygons.</p>
              )}
            </div>

            <div className="map-legend">
              <h3>Research queue</h3>
              {researchQueue.length ? researchQueue.map((entry, index) => (
                <button
                  key={entry.key}
                  type="button"
                  className={`map-insight-card ${selectedEntry?.key === entry.key ? "active" : ""}`}
                  onClick={() => setSelectedKey(entry.key)}
                >
                  <div className="map-insight-head">
                    <span className={`legend-chip map-chip-inline ${entry.layer === "heat" ? "heat" : "cooling"}`} />
                    <strong>{index + 1}. {entry.layerLabel}</strong>
                  </div>
                  <p>{overlayNarrative(entry)}</p>
                  <p>Class: {entry.overlay.scoreClass} | Score: {entry.overlay.score.toFixed(1)}</p>
                </button>
              )) : (
                <p className="muted">No polygons match the current layer and severity filters.</p>
              )}
            </div>

            <div className="map-legend">
              <h3>Intervention highlights</h3>
              {data.highlights.map((item) => (
                <div key={item.title} className="plan-card-mini">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <p>Value: {item.value.toFixed(1)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!shellCollapsed && !fullPageMap ? (
          <aside className="map-sidebar">
            {sidebarContent}
          </aside>
        ) : null}
      </div>

      {shellCollapsed && !fullPageMap ? (
        <details
          className="map-sidebar map-sidebar-collapsed-drawer"
          open={sidebarTrayOpen}
          onToggle={(event) => setSidebarTrayOpen(event.currentTarget.open)}
        >
          <summary className="map-sidebar-tray-summary">
            <div className="map-sidebar-tray-copy">
              <strong>Atlas control tray</strong>
              <span>
                {activeControlTab[0].toUpperCase() + activeControlTab.slice(1)} controls, live heat status, provenance, and verification
              </span>
            </div>
            <span className="map-sidebar-tray-pill">{sidebarTrayOpen ? "Hide" : "Show"}</span>
          </summary>
          {sidebarContent}
        </details>
      ) : null}
    </article>
  );
}
