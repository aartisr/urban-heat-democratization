/**
 * City-generic contracts for the before/scenario/difference experience.
 * A planning field is deliberately distinct from a calibrated temperature
 * projection or a measured outcome.
 */
export type ComparisonEvidenceLevel = "planning" | "calibrated_projection" | "measured";

export type ComparisonMetric = "priority" | "land_surface_temperature_c" | "air_temperature_c";

export type SpatialStatus = "no_geometry" | "candidate_geometry" | "verified_geometry";

export type ComparisonBudgetPreset = 10000 | 50000 | 250000 | 1000000 | 2000000;

export type ComparisonField = {
  id: string;
  version: string;
  metric: ComparisonMetric;
  evidenceLevel: ComparisonEvidenceLevel;
  units: string;
  sourceLabel: string;
  capturedAt?: string;
  limitations: string[];
};

export type ComparisonAllocation = {
  interventionId: string;
  quantity: number;
  unit: string;
  capitalCostUsd: number;
  maintenanceCostUsd: number;
  evidenceStatus: "verified_unit_cost" | "ranking_only" | "benchmark_only";
  spatialStatus: SpatialStatus;
  areaIds: string[];
};

export type EligibleArea = {
  id: string;
  status: "candidate" | "verified";
  allowedInterventionIds: string[];
  capacityByIntervention: Record<string, number>;
  feasibility: number;
  equityWeight?: number;
  source: { label: string; updatedAt?: string };
};

export type CandidateEligibility = {
  areaId: string;
  interventionId: string;
  eligible: boolean;
  reasons: string[];
  availableCapacity: number;
};

export type CalibrationRecord = {
  cityId: string;
  observedBaseline: boolean;
  observedFollowUp: boolean;
  counterfactualValidated: boolean;
  uncertaintyValidated: boolean;
  governanceApproved: boolean;
  calibrationVersion?: string;
};

export type ImplementationEvaluationRecord = {
  cityId: string;
  projectId: string;
  interventionGeometryVerified: boolean;
  baselineObserved: boolean;
  followUpObserved: boolean;
  comparisonDesignValidated: boolean;
  uncertaintyReported: boolean;
  governanceApproved: boolean;
  evaluationVersion?: string;
};

export type ScenarioComparisonPayload = {
  schemaVersion: 1;
  cityId: string;
  budgetUsd: number;
  baseline: ComparisonField;
  scenarioField: ComparisonField;
  deltaField: ComparisonField;
  allocations: ComparisonAllocation[];
  model: {
    allocationVersion: string;
    effectModelVersion: string;
    inputFingerprint: string;
  };
};
