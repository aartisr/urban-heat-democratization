import type { ReactNode } from "react";

import type { SectionCard } from "../components/city-detail-section-grid";
import type { CityIntelligenceOverviewProps, HeroAction } from "../components/city-intelligence-overview";
import type { CityDataRegistration, CityExperience, CityLiveThermalAdapter, CityMapData, CityProfile, CitySpectral, PlanningReadiness, RobustnessLab, RunRecord, ScenarioRecord, TrustAudit } from "./types";

type CityDetailConfigInput = {
  cityId: string;
  cityName: string;
  cityProfile: CityProfile | undefined;
  cityExperience: CityExperience | undefined;
  cityMap: CityMapData | undefined;
  liveThermalAdapter: CityLiveThermalAdapter | undefined;
  citySpectral: CitySpectral | undefined;
  cityReadiness: PlanningReadiness | undefined;
  robustness: RobustnessLab | undefined;
  trustAudit: TrustAudit | undefined;
  scenarios: ScenarioRecord[] | undefined;
  runs: RunRecord[] | undefined;
  mapStats: {
    heatZones: number;
    accessZones: number;
    highHeatZones: number;
    highAccessZones: number;
  } | null;
  studyGuideAction?: ReactNode;
};

function recommendedBudget(highPriorityCount: number) {
  if (highPriorityCount >= 20) return 500000;
  if (highPriorityCount >= 8) return 250000;
  return 100000;
}

function formatCadence(refreshIntervalSec: number | null | undefined) {
  const seconds = refreshIntervalSec ?? 900;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${seconds}s (${minutes} minute${minutes === 1 ? "" : "s"})`;
}

function formatOverviewTimestamp(value: string | null | undefined) {
  if (!value) {
    return "not yet available";
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

export function buildScenarioSearch(cityId: string, budgetUsd: number) {
  return {
    cityId,
    budgetUsd,
    focus: undefined,
    sourceLayer: undefined,
    selectedLabel: undefined,
  };
}

export function buildCityDetailViewConfig(input: CityDetailConfigInput) {
  const {
    cityId,
    cityName,
    cityProfile,
    cityExperience,
    cityMap,
    liveThermalAdapter,
    citySpectral,
    cityReadiness,
    robustness,
    trustAudit,
    scenarios,
    runs,
    mapStats,
  } = input;

  const thermalSourceNames = cityMap?.thermalSources.map((source) => source.id.toUpperCase()).join(" and ");
  // Cooling-access constraint is a separate decision lens, not a comparable Cheeger score.
  const highPriorityCount = mapStats?.highHeatZones ?? 0;
  const suggestedBudget = recommendedBudget(highPriorityCount);
  const scenarioSearch = buildScenarioSearch(cityId, suggestedBudget);
  const liveAdapter = cityMap?.liveThermalAdapter ?? liveThermalAdapter;
  const liveCue = liveAdapter?.autoRefreshAvailable
    ? {
        tone: liveAdapter.usingBackupData ? "backup" as const : liveAdapter.autoRefreshEnabled && liveAdapter.latestSceneCapturedAt ? "live" as const : "ready" as const,
        badge: liveAdapter.usingBackupData
          ? "LIVE: CACHED FALLBACK"
          : liveAdapter.autoRefreshEnabled && liveAdapter.latestSceneCapturedAt
            ? "LIVE: ON"
            : "LIVE: READY",
        summary: liveAdapter.usingBackupData
          ? "Cached fallback active"
          : liveAdapter.autoRefreshEnabled && liveAdapter.latestSceneCapturedAt
            ? "Live is working"
            : "Live refresh ready",
        detail: liveAdapter.usingBackupData
          ? "The atlas is serving cached city-ready thermal data until live refresh becomes reachable again."
          : liveAdapter.latestSceneCapturedAt
            ? `${liveAdapter.latestSourceLabel ?? "Latest scene"} observed ${formatOverviewTimestamp(liveAdapter.latestSceneCapturedAt)}.`
            : "The live bridge is configured and waiting for the next mapped scene.",
        refreshed: liveAdapter.lastUpdated
          ? `Last refreshed ${formatOverviewTimestamp(liveAdapter.lastUpdated)}`
          : "Last refreshed not yet available",
        cadence: `Refresh cadence: ${formatCadence(liveAdapter.refreshIntervalSec)}`,
      }
    : null;
  const pageNarrative = cityMap?.thermalSources.length
    ? `${cityMap.narrative} Compare ${thermalSourceNames} to see how observed thermal evidence supports the derived spectral story before moving into scenarios.`
    : citySpectral?.summary ?? cityMap?.narrative ?? "Use this page to read the city, understand the evidence, and move naturally into planning.";

  const storyJourney = {
    title: "City decision storyline",
    subtitle: cityExperience?.bundled
      ? "Keep the city page reusable: evidence, readiness, scenarios, and execution stay in one consistent flow."
      : "Keep the city page reusable: boundary registration, evidence, readiness, and execution stay in one consistent flow.",
    items: [
      { label: "Observe", detail: "Inspect heat, cooling, and bottleneck structure in the city atlas." },
      { label: "Assess", detail: "Review readiness, trust audit, and robustness for evidence integrity." },
      { label: "Plan", detail: "Bridge into scenarios with city-aware defaults and transparent assumptions." },
      { label: "Operationalize", detail: "Queue runs and export artifacts while retaining a traceable record." },
    ],
  };

  const journeyCards: CityIntelligenceOverviewProps["journeyCards"] = [
    {
      eyebrow: "1. Observe",
      title: "Start with the map",
      description: cityMap
        ? "Use the map first to see where spectral bottlenecks and cooling gaps cluster."
        : "Start with the city summary and readiness checks while map artifacts load or are prepared.",
    },
    {
      eyebrow: "2. Understand",
      title: "Read the evidence in plain language",
      description: "Keep observed, derived, and estimated layers close to the visuals so people can trust what they are seeing.",
    },
    {
      eyebrow: "3. Act",
      title: "Move into scenarios naturally",
      description: `Use the carried-over city context to test a realistic starting budget of about $${suggestedBudget.toLocaleString()}.`,
    },
  ];

  const heroActions: HeroAction[] = [
    { label: cityExperience?.bundled ? "Try a budget scenario" : "Finish readiness registration", to: "/scenarios", search: scenarioSearch, className: "button-link secondary" },
  ];

  const overview: CityIntelligenceOverviewProps = {
    eyebrow: cityExperience?.bundled ? "Bundled city intelligence page" : "City intelligence page",
    title: `${cityName}: heat evidence you can use`,
    narrative: pageNarrative,
    heroActions,
    heroMetrics: [
      { value: String(cityExperience?.availablePackageIds.length ?? 0), label: "study packages" },
      { value: String(citySpectral?.cheegerFeatureCount ?? 0), label: "priority heat areas" },
      { value: String(citySpectral?.coolingZoneCount ?? 0), label: "cooling-access gaps" },
      { value: String((scenarios?.length ?? 0) + (runs?.length ?? 0)), label: "saved planning records" },
    ],
    liveCue,
    journeyCards,
    whyTitle: "Why this page matters",
    whyBody: cityExperience?.bundled
      ? `${cityName} is ready for immediate study in this workspace, so people can move from map interpretation to planning without a separate onboarding step.`
      : `${cityName} already has a city profile and onboarding path, so this page can still guide people before full local overlays are registered.`,
    whyCards: [
      {
        title: "What people should do first",
        body: "Start with the map, then move to the guided study flow and scenarios once the hot spots make sense.",
      },
      {
        title: "What this page should answer",
        body: "Where the city is stressed, what evidence backs that claim, and what the next planning move should be.",
      },
    ],
    nextTitle: "Natural next step",
    nextBody: cityExperience?.bundled
      ? "The natural next step is to convert the mapped hot spots into a budget test and compare which interventions the current evidence can support."
      : "The natural next step is to complete local data registration so the page can evolve into a full local analysis workspace.",
    nextCards: [
      {
        title: "Suggested starting budget",
        body: `$${suggestedBudget.toLocaleString()}`,
      },
      {
        title: "Reason",
        body: "The current overlay counts suggest a scale that is meaningful enough to compare options without overwhelming first-time users.",
      },
    ],
    nextAction: { label: "Test the city in scenarios", to: "/scenarios", search: scenarioSearch, className: "button-link" },
  };

  const evidenceCards: SectionCard[] = cityMap ? [
    {
      title: "Truth mode summary",
      tone: cityMap.truthMode.interpretationStatus,
      body: cityMap.truthMode.headline,
      children: <p className="muted">{cityMap.truthMode.methodology}</p>,
    },
    {
      eyebrow: "Do not overclaim",
      title: "Current limitations",
      body: cityMap.truthMode.caution,
      children: (
        <>
          {cityMap.truthMode.notes.map((note) => (
            <p key={note} className="muted">{note}</p>
          ))}
        </>
      ),
    },
  ] : [];

  const snapshotCards: SectionCard[] = [
    {
      title: "City snapshot",
      body: cityProfile?.description ?? "City metadata not found.",
      children: (
        <div className="metric-list">
          <div><span>Population</span><strong>{cityProfile?.population ?? "-"}</strong></div>
          <div><span>Baseline heat</span><strong>{cityProfile ? `${cityProfile.baselineTempC.toFixed(1)}°C` : "-"}</strong></div>
          <div><span>Canopy coverage</span><strong>{cityProfile?.canopyCoverage ?? "-"}</strong></div>
          <div><span>Bundled packages</span><strong>{cityExperience?.availablePackageIds.length ?? 0}</strong></div>
          <div><span>Bottleneck cells</span><strong>{citySpectral?.cheegerFeatureCount ?? 0}</strong></div>
          <div><span>Low-access zones</span><strong>{citySpectral?.coolingZoneCount ?? 0}</strong></div>
          <div><span>Reliability demo</span><strong>{robustness ? robustness.reliabilityIntervention.toFixed(2) : "-"}</strong></div>
        </div>
      ),
    },
    {
      title: "Available actions",
      body: `Scenarios: ${scenarios?.length ?? 0}, Runs: ${runs?.length ?? 0}`,
    },
  ];

  const readinessCards: SectionCard[] = cityReadiness?.checks.map((check) => ({
    eyebrow: check.status,
    title: check.label,
    body: check.detail,
  })) ?? [{ title: "Loading readiness checks...", body: "The current city readiness checks are still loading." }];

  const workflowCards: SectionCard[] = [
    ...(cityExperience?.spectralAvailable
      ? [{
          eyebrow: "Overlay dashboard",
          title: "Loaded overlay counts",
          body: mapStats
            ? `${mapStats.heatZones} bottleneck polygons and ${mapStats.accessZones} cooling-access cells are loaded from the workspace data. ${mapStats.highHeatZones} bottlenecks have high derived priority; cooling-access constraints are independently ranked and never silently combined with Cheeger priority.`
            : "Loading overlay counts...",
        }]
      : []),
    ...((cityExperience?.studyCards ?? []).map((card) => ({
      eyebrow: card.eyebrow,
      title: card.title,
      body: card.description,
    }))),
  ];

  const robustnessCards: SectionCard[] = [
    {
      title: "Lambda2 improvement",
      body: robustness ? (robustness.lambda2Intervention - robustness.lambda2Baseline).toFixed(3) : "-",
    },
    {
      title: "Reliability improvement",
      body: robustness ? (robustness.reliabilityIntervention - robustness.reliabilityBaseline).toFixed(3) : "-",
    },
    {
      title: "Conductance improvement",
      body: robustness ? (robustness.phiBaseline - robustness.phiIntervention).toFixed(3) : "-",
    },
  ];

  const trustCards: SectionCard[] = trustAudit ? [
    {
      eyebrow: "Protocol",
      title: "Benchmark protocol",
      body: trustAudit.summary,
      children: (
        <>
          {trustAudit.benchmarkProtocol.map((step) => (
            <p key={step.id} className="muted">
              <strong>{step.title}:</strong> {step.detail}
            </p>
          ))}
        </>
      ),
    },
    {
      eyebrow: "Manifest",
      title: "Reproducibility manifest",
      body: `Generated ${formatOverviewTimestamp(trustAudit.generatedAt)}. ${trustAudit.reproducibilityManifest.length} file(s) are listed for reproducibility review.`,
      children: (
        <>
          {trustAudit.reproducibilityManifest.slice(0, 6).map((entry) => (
            <p key={`${entry.label}-${entry.path}`} className="muted">
              <strong>{entry.label}:</strong> {entry.exists ? "present" : "missing"} {entry.sizeBytes != null ? `(${entry.sizeBytes.toLocaleString()} bytes)` : ""} {entry.sha256 ? `sha256 ${entry.sha256.slice(0, 12)}…` : ""}
            </p>
          ))}
        </>
      ),
    },
    {
      eyebrow: "Provenance",
      title: "Data provenance audit",
      body: "This section keeps observed, derived, and still-partial layers separate so the recommendation trail stays defensible.",
      children: (
        <>
          {trustAudit.provenanceAudit.map((step) => (
            <p key={step.id} className="muted">
              <strong>{step.title}:</strong> {step.detail}
            </p>
          ))}
          {trustAudit.notes.map((note) => (
            <p key={note} className="muted">{note}</p>
          ))}
        </>
      ),
    },
  ] : [];

  return {
    suggestedBudget,
    scenarioSearch,
    overview,
    storyJourney,
    sections: {
      evidenceCards,
      snapshotCards,
      readinessCards,
      workflowCards,
      robustnessCards,
      trustCards,
    },
  };
}

export function buildRegistrationStatusCards(registration: CityDataRegistration | undefined): SectionCard[] {
  if (!registration) {
    return [];
  }

  return [
    {
      eyebrow: "Verified paths",
      title: "Registered path checks",
      children: (
        <>
          {Object.entries(registration.verifiedPaths).map(([key, verified]) => (
            <p key={key} className="muted">{key}: {verified ? "verified" : "not found"}</p>
          ))}
        </>
      ),
    },
    {
      eyebrow: "Local artifact area",
      title: "Registered local data",
      children: (
        <>
          {registration.thermalInputsPath ? <p className="muted">Thermal inputs: {registration.thermalInputsPath}</p> : null}
          {registration.artifactBundlePath ? <p className="muted">Artifact bundle: {registration.artifactBundlePath}</p> : null}
          {registration.bottleneckOverlayPath ? <p className="muted">Bottleneck overlay: {registration.bottleneckOverlayPath}</p> : null}
          {registration.coolingOverlayPath ? <p className="muted">Cooling overlay: {registration.coolingOverlayPath}</p> : null}
          {!registration.thermalInputsPath && !registration.artifactBundlePath && !registration.bottleneckOverlayPath && !registration.coolingOverlayPath ? (
            <p className="muted">No local data paths have been registered yet.</p>
          ) : null}
        </>
      ),
    },
  ];
}
