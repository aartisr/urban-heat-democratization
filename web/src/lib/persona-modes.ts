import type { PlanningMode } from "./types";
import { defaultStudyCityId } from "./study-city";

export type PersonaModeId = "educator" | "student" | "planner" | "researcher" | "community-advocate";

export type AppFlowRoute = "/" | "/cities" | "/scenarios" | "/exports" | "/runs" | "/modes";

export type PersonaModeProfile = {
  id: PersonaModeId;
  label: string;
  title: string;
  valuePromise: string;
  keyQuestion: string;
  scienceAnchor: string;
  evidenceThreshold: {
    minVerifiedUnitCostActions: number;
    maxBenchmarkOnlyActions: number;
    requireReadinessKeyword?: string;
  };
  flow: AppFlowRoute[];
};

export type PersonaScenarioPreset = {
  cityId: string;
  budgetUsd: number;
  planningMode: PlanningMode;
  evidenceGoal: string;
};

export const scenarioSearchBase = {
  cityId: undefined,
  budgetUsd: undefined,
  focus: undefined,
  sourceLayer: undefined,
  selectedLabel: undefined,
};

export const personaModeProfiles: Record<PersonaModeId, PersonaModeProfile> = {
  educator: {
    id: "educator",
    label: "Educator",
    title: "Teach with a map-to-story arc",
    valuePromise: "Guide learners from observed heat patterns to exportable discussion artifacts.",
    keyQuestion: "Can a student explain why one block is hotter than another and what to do first?",
    scienceAnchor: "Convert spectral bottlenecks and cooling-access gradients into explainable lessons about modelled relationships and assumptions.",
    evidenceThreshold: {
      minVerifiedUnitCostActions: 0,
      maxBenchmarkOnlyActions: 3,
      requireReadinessKeyword: "ready",
    },
    flow: ["/", "/cities", "/exports"],
  },
  student: {
    id: "student",
    label: "Student",
    title: "Learn by testing hypotheses",
    valuePromise: "Move from city evidence into what-if scenarios without jargon overload.",
    keyQuestion: "What intervention mix changes outcomes the most under a small budget?",
    scienceAnchor: "Experiment with weighted intervention evidence to learn how math changes planning outcomes.",
    evidenceThreshold: {
      minVerifiedUnitCostActions: 0,
      maxBenchmarkOnlyActions: 4,
    },
    flow: ["/", "/cities", "/scenarios"],
  },
  planner: {
    id: "planner",
    label: "Planner",
    title: "Defend first-pass plans",
    valuePromise: "Translate budget constraints into transparent action bundles and benchmark gaps.",
    keyQuestion: "Which package is strongest under budget while preserving evidence honesty?",
    scienceAnchor: "Use graph-derived bottleneck and benchmark-share mathematics to justify first-pass allocation packages.",
    evidenceThreshold: {
      minVerifiedUnitCostActions: 1,
      maxBenchmarkOnlyActions: 2,
      requireReadinessKeyword: "ready",
    },
    flow: ["/scenarios", "/cities", "/exports"],
  },
  researcher: {
    id: "researcher",
    label: "Researcher",
    title: "Audit methods and assumptions",
    valuePromise: "Start from runtime traces and provenance before presenting conclusions.",
    keyQuestion: "What is observed vs derived vs estimated in this recommendation?",
    scienceAnchor: "Inspect Laplacian/robustness-derived proxy formulas and provenance records before making claims.",
    evidenceThreshold: {
      minVerifiedUnitCostActions: 0,
      maxBenchmarkOnlyActions: 6,
    },
    flow: ["/runs", "/exports", "/scenarios"],
  },
  "community-advocate": {
    id: "community-advocate",
    label: "Community advocate",
    title: "Make neighborhood stories actionable",
    valuePromise: "Use map evidence and plain language to build meeting-ready community briefs.",
    keyQuestion: "How do we explain impact and uncertainty clearly in public-facing conversations?",
    scienceAnchor: "Translate uncertainty bands and evidence-readiness labels into trustworthy public explanations.",
    evidenceThreshold: {
      minVerifiedUnitCostActions: 0,
      maxBenchmarkOnlyActions: 3,
    },
    flow: ["/cities", "/scenarios", "/exports"],
  },
};

export const personaScenarioPresets: Record<PersonaModeId, PersonaScenarioPreset> = {
  educator: {
    cityId: defaultStudyCityId,
    budgetUsd: 120000,
    planningMode: "benchmark_share",
    evidenceGoal: "Prioritize clear, source-backed actions suitable for classroom discussion.",
  },
  student: {
    cityId: defaultStudyCityId,
    budgetUsd: 80000,
    planningMode: "best_under_budget",
    evidenceGoal: "Maximize learnable tradeoffs while keeping assumptions visible.",
  },
  planner: {
    cityId: defaultStudyCityId,
    budgetUsd: 350000,
    planningMode: "best_under_budget",
    evidenceGoal: "Favor interventions with stronger evidence-readiness and defensible benchmark coverage.",
  },
  researcher: {
    cityId: defaultStudyCityId,
    budgetUsd: 500000,
    planningMode: "evidence_first",
    evidenceGoal: "Stress-test model sensitivity using higher budgets and evidence-first ranking behavior.",
  },
  "community-advocate": {
    cityId: defaultStudyCityId,
    budgetUsd: 200000,
    planningMode: "benchmark_share",
    evidenceGoal: "Keep impact/uncertainty communication simple for neighborhood-facing narratives.",
  },
};

export const defaultPersonaMode: PersonaModeId = "planner";

export function normalizePersonaModeId(value: string | null | undefined): PersonaModeId {
  if (value === "educator" || value === "student" || value === "planner" || value === "researcher" || value === "community-advocate") {
    return value;
  }
  return defaultPersonaMode;
}

export function modeProgress(modeId: PersonaModeId, currentRoute: AppFlowRoute): {
  orderedRoutes: AppFlowRoute[];
  completed: AppFlowRoute[];
  active: AppFlowRoute;
  next: AppFlowRoute | null;
} {
  const orderedRoutes = personaModeProfiles[modeId].flow;
  const index = Math.max(0, orderedRoutes.indexOf(currentRoute));
  const active = orderedRoutes[index] ?? orderedRoutes[0];
  const completed = orderedRoutes.slice(0, index);
  const next = orderedRoutes[index + 1] ?? null;
  return { orderedRoutes, completed, active, next };
}
