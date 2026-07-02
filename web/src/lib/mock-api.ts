import type { CityOnboardingInput, CityProfile, RunRecord, ScenarioRecord } from "./types";
import { defaultStudyCityId } from "./study-city";

const CITIES_KEY = "urban_heat_democratization.cities";
const RUNS_KEY = "urban_heat_democratization.runs";

const seedCities: CityProfile[] = [
  {
    id: "boston",
    name: "Boston",
    region: "Northeast US",
    population: "675k",
    status: "Ready",
    baselineTempC: 33.8,
    canopyCoverage: "27%",
    planningCostMultiplier: 1.0,
    description: "Bundled demo city with baseline maps, bottlenecks, and cooling-access layers.",
  },
  {
    id: "chicago",
    name: "Chicago",
    region: "Midwest US",
    population: "2.7M",
    status: "Needs boundary",
    baselineTempC: 34.4,
    canopyCoverage: "17%",
    planningCostMultiplier: 0.98,
    description: "Needs a boundary upload before the first heat atlas can be generated.",
  },
  {
    id: "custom",
    name: "Custom City",
    region: "Any city",
    population: "User supplied",
    status: "Research",
    baselineTempC: 32.1,
    canopyCoverage: "Unknown",
    planningCostMultiplier: 1.0,
    description: "Bring your own boundary, thermal raster, or a city-wide public dataset.",
  },
];

const seedScenarios: ScenarioRecord[] = [
  {
    id: "s1",
    label: "Budget $100k",
    cityId: "boston",
    planningMode: "benchmark_share",
    budgetUsd: 100000,
    estimatedCostUsd: 96400,
    heatReductionC: 0.9,
    equityScore: 0.74,
    confidence: 0.81,
    summary: "Best small-budget mix favors street trees, shade, and one corridor repair.",
    recommendedActions: [],
    allocationSummary: {
      totalAllocatedBudgetUsd: 0,
      unallocatedBudgetUsd: 100000,
      allocationCoveragePct: 0,
      allocationMethod: "Legacy mock scenario without structured allocation coverage.",
    },
    evidenceSummary: {
      verifiedUnitCostCount: 0,
      rankingOnlyCount: 0,
      benchmarkOnlyCount: 0,
      readinessLabel: "No evidence",
      explanation: "Legacy mock scenario without structured intervention evidence.",
    },
    benchmarkSummary: {
      wholeCityBenchmarkUsd: 1000000000,
      budgetGapUsd: 999900000,
      budgetCoveragePct: 0.0001,
      benchmarkLabel: "Early-stage benchmark coverage",
      explanation: "Coverage is measured against a coarse whole-city benchmark, not a city-specific exhaustive mitigation estimate.",
    },
    exhaustiveEstimateSummary: {
      available: false,
      estimatedCostUsd: null,
      fundedCostUsd: 0,
      remainingGapUsd: null,
      coveragePct: null,
      costableActions: 0,
      methodology: "Mock scenario has no verified unit-cost rows with target quantities.",
    },
  },
  {
    id: "s2",
    label: "Budget $1M",
    cityId: "boston",
    planningMode: "benchmark_share",
    budgetUsd: 1000000,
    estimatedCostUsd: 918000,
    heatReductionC: 2.4,
    equityScore: 0.83,
    confidence: 0.79,
    summary: "A larger budget unlocks corridor continuity, cool roofs, and pocket parks.",
    recommendedActions: [],
    allocationSummary: {
      totalAllocatedBudgetUsd: 0,
      unallocatedBudgetUsd: 1000000,
      allocationCoveragePct: 0,
      allocationMethod: "Legacy mock scenario without structured allocation coverage.",
    },
    evidenceSummary: {
      verifiedUnitCostCount: 0,
      rankingOnlyCount: 0,
      benchmarkOnlyCount: 0,
      readinessLabel: "No evidence",
      explanation: "Legacy mock scenario without structured intervention evidence.",
    },
    benchmarkSummary: {
      wholeCityBenchmarkUsd: 1000000000,
      budgetGapUsd: 999000000,
      budgetCoveragePct: 0.001,
      benchmarkLabel: "Early-stage benchmark coverage",
      explanation: "Coverage is measured against a coarse whole-city benchmark, not a city-specific exhaustive mitigation estimate.",
    },
    exhaustiveEstimateSummary: {
      available: false,
      estimatedCostUsd: null,
      fundedCostUsd: 0,
      remainingGapUsd: null,
      coveragePct: null,
      costableActions: 0,
      methodology: "Mock scenario has no verified unit-cost rows with target quantities.",
    },
  },
  {
    id: "s3",
    label: "Exhaustive mitigation",
    cityId: "boston",
    planningMode: "whole_city_benchmark",
    budgetUsd: 99999999,
    estimatedCostUsd: 4275000,
    heatReductionC: 4.7,
    equityScore: 0.88,
    confidence: 0.68,
    summary: "Full mitigation estimate with conservative assumptions and maintenance allowance.",
    recommendedActions: [],
    allocationSummary: {
      totalAllocatedBudgetUsd: 0,
      unallocatedBudgetUsd: 99999999,
      allocationCoveragePct: 0,
      allocationMethod: "Legacy mock scenario without structured allocation coverage.",
    },
    evidenceSummary: {
      verifiedUnitCostCount: 0,
      rankingOnlyCount: 0,
      benchmarkOnlyCount: 0,
      readinessLabel: "No evidence",
      explanation: "Legacy mock scenario without structured intervention evidence.",
    },
    benchmarkSummary: {
      wholeCityBenchmarkUsd: 1000000000,
      budgetGapUsd: 900000001,
      budgetCoveragePct: 0.1,
      benchmarkLabel: "Partial benchmark coverage",
      explanation: "Coverage is measured against a coarse whole-city benchmark, not a city-specific exhaustive mitigation estimate.",
    },
    exhaustiveEstimateSummary: {
      available: false,
      estimatedCostUsd: null,
      fundedCostUsd: 0,
      remainingGapUsd: null,
      coveragePct: null,
      costableActions: 0,
      methodology: "Mock scenario has no verified unit-cost rows with target quantities.",
    },
  },
];

const seedRuns: RunRecord[] = [
  {
    id: "run-boston-001",
    cityId: "boston",
    scenario: "Baseline heat atlas",
    status: "succeeded",
    progress: 100,
    updatedAt: "2026-06-30T12:24:00.000Z",
    outputs: ["heat-atlas.json", "scenario-summary.csv", "provenance-manifest.json"],
    summary: "Bundled baseline study run.",
    outputArtifactIds: ["boston-study-guide", "cheeger-bottleneck", "low-cooling-access"],
    logs: ["[2026-06-30T12:24:00.000Z] Baseline study completed."],
  },
  {
    id: "run-boston-002",
    cityId: "boston",
    scenario: "Equity-first mitigation",
    status: "running",
    progress: 68,
    updatedAt: "2026-06-30T12:29:00.000Z",
    outputs: ["partial-history.json"],
    summary: "Mitigation planning run in progress.",
    outputArtifactIds: ["boston-study-guide"],
    logs: ["[2026-06-30T12:29:00.000Z] Mitigation study is running."],
  },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") {
    return fallback;
  }
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export async function listCities(): Promise<CityProfile[]> {
  const stored = readJson<CityProfile[]>(CITIES_KEY, []);
  return [...seedCities, ...stored];
}

export async function listScenarios(cityId?: string): Promise<ScenarioRecord[]> {
  if (!cityId) return seedScenarios;
  return seedScenarios.filter((scenario) => scenario.cityId === cityId);
}

export async function listRuns(): Promise<RunRecord[]> {
  const stored = readJson<RunRecord[]>(RUNS_KEY, []);
  return [...seedRuns, ...stored];
}

export async function onboardCity(input: CityOnboardingInput): Promise<CityProfile> {
  const city: CityProfile = {
    id: input.name.trim().toLowerCase().replace(/\s+/g, "-"),
    name: input.name.trim(),
    region: input.region.trim() || "Custom",
    population: input.population.trim() || "Unknown",
    status: input.boundarySource === "demo" ? "Ready" : "Needs boundary",
    baselineTempC: 32.5,
    canopyCoverage: "Unknown",
    planningCostMultiplier: 1.0,
    description: input.notes.trim() || "Onboarded through the TanStack city wizard.",
  };

  const stored = readJson<CityProfile[]>(CITIES_KEY, []);
  writeJson(CITIES_KEY, [...stored, city]);
  return city;
}

export async function createWhatIfScenarios(
  cityId: string,
  budgetUsd: number,
  options?: { label?: string; presetKey?: string | null; planningMode?: ScenarioRecord["planningMode"] },
): Promise<ScenarioRecord> {
  const scenario = {
    id: `what-if-${cityId}-${budgetUsd}`,
    label: options?.label ?? `What-if $${budgetUsd.toLocaleString()}`,
    cityId,
    planningMode: options?.planningMode ?? "best_under_budget",
    budgetUsd,
    estimatedCostUsd: Math.round(budgetUsd * 0.94),
    heatReductionC: Number((Math.min(4.2, budgetUsd / 400000)).toFixed(1)),
    equityScore: Number((0.7 + Math.min(0.18, budgetUsd / 7000000)).toFixed(2)),
    confidence: 0.76,
    summary: options?.presetKey
      ? `Generated locally by the TanStack-first scenario engine placeholder for preset ${options.presetKey}.`
      : "Generated locally by the TanStack-first scenario engine placeholder.",
    recommendedActions: [
      {
        interventionId: "light-surfaces",
        name: "Light surfaces",
        category: "surface cooling",
        costStatus: "ranking_only",
        priorityRank: 1,
        targetQuantity: null,
        allocatedBudgetUsd: Math.round(budgetUsd * 0.48),
        allocationBasis: "Mock inverse-rank benchmark-share allocation.",
        rationale: "Placeholder recommendation from the mock scenario generator.",
      },
      {
        interventionId: "cool-roofs",
        name: "Cool roofs",
        category: "building cooling",
        costStatus: "ranking_only",
        priorityRank: 2,
        targetQuantity: null,
        allocatedBudgetUsd: Math.round(budgetUsd * 0.24),
        allocationBasis: "Mock inverse-rank benchmark-share allocation.",
        rationale: "Placeholder recommendation from the mock scenario generator.",
      },
    ],
    allocationSummary: {
      totalAllocatedBudgetUsd: Math.round(budgetUsd * 0.72),
      unallocatedBudgetUsd: budgetUsd - Math.round(budgetUsd * 0.72),
      allocationCoveragePct: 0.72,
      allocationMethod: "Mock inverse-rank benchmark-share allocation.",
    },
    evidenceSummary: {
      verifiedUnitCostCount: 0,
      rankingOnlyCount: 2,
      benchmarkOnlyCount: 0,
      readinessLabel: "Benchmark only",
      explanation: "This mock scenario is driven by comparative ranking evidence rather than verified unit-cost rows.",
    },
    benchmarkSummary: {
      wholeCityBenchmarkUsd: 1000000000,
      budgetGapUsd: 1000000000 - budgetUsd,
      budgetCoveragePct: budgetUsd / 1000000000,
      benchmarkLabel: budgetUsd / 1000000000 >= 0.1 ? "Partial benchmark coverage" : "Early-stage benchmark coverage",
      explanation: "Coverage is measured against a coarse whole-city benchmark, not a city-specific exhaustive mitigation estimate.",
    },
    exhaustiveEstimateSummary: {
      available: false,
      estimatedCostUsd: null,
      fundedCostUsd: 0,
      remainingGapUsd: null,
      coveragePct: null,
      costableActions: 0,
      methodology: "Mock scenario has no verified unit-cost rows with target quantities.",
    },
  } satisfies ScenarioRecord;

  return scenario;
}

export async function queueRun(cityId: string, scenario: string): Promise<RunRecord> {
  const now = new Date().toISOString();
  const run: RunRecord = {
    id: `run-${cityId}-${Date.now()}`,
    cityId,
    scenario,
    status: "queued",
    progress: 0,
    updatedAt: now,
    outputs: [],
    summary: `${cityId} run queued in the mock registry.`,
    outputArtifactIds: cityId === defaultStudyCityId ? ["boston-study-guide"] : [],
    logs: [`[${now}] Mock run created for ${cityId}.`],
  };
  const stored = readJson<RunRecord[]>(RUNS_KEY, []);
  writeJson(RUNS_KEY, [run, ...stored]);
  return run;
}

export async function getRun(runId: string) {
  const runs = await listRuns();
  const match = runs.find((run) => run.id === runId);
  if (!match) {
    throw new Error("Run not found");
  }
  return {
    ...match,
    cityName: match.cityId,
    createdAt: match.updatedAt,
    notes: match.cityId === defaultStudyCityId
      ? ["Bundled city mock run includes the study guide artifact for parity with the main app flow."]
      : ["Mock run record."],
  };
}
