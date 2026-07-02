export type PlanningMode = "best_under_budget" | "evidence_first" | "benchmark_share" | "whole_city_benchmark";

export type CityProfile = {
  id: string;
  name: string;
  region: string;
  population: string;
  status: "Ready" | "Needs boundary" | "Research";
  baselineTempC: number;
  canopyCoverage: string;
  planningCostMultiplier: number;
  description: string;
};

export type ScenarioRecord = {
  id: string;
  label: string;
  cityId: string;
  planningMode: PlanningMode;
  budgetUsd: number;
  estimatedCostUsd: number | null;
  heatReductionC: number | null;
  equityScore: number | null;
  confidence: number | null;
  summary: string;
  recommendedActions: ScenarioAction[];
  allocationSummary: ScenarioAllocationSummary;
  evidenceSummary: ScenarioEvidenceSummary;
  benchmarkSummary: ScenarioBenchmarkSummary;
  exhaustiveEstimateSummary: ScenarioExhaustiveEstimateSummary;
};

export type ScenarioAction = {
  interventionId: string;
  name: string;
  category: string;
  measurementUnit?: string | null;
  costStatus: "verified_unit_cost" | "ranking_only" | "benchmark_only";
  priorityRank: number | null;
  targetQuantity?: number | null;
  unitCostUsd?: number | null;
  estimatedProgramCostUsd?: number | null;
  allocatedBudgetUsd: number | null;
  allocationBasis: string;
  rationale: string;
};

export type ScenarioAllocationSummary = {
  totalAllocatedBudgetUsd: number;
  unallocatedBudgetUsd: number;
  allocationCoveragePct: number;
  allocationMethod: string;
};

export type ScenarioEvidenceSummary = {
  verifiedUnitCostCount: number;
  rankingOnlyCount: number;
  benchmarkOnlyCount: number;
  readinessLabel: string;
  explanation: string;
};

export type ScenarioBenchmarkSummary = {
  wholeCityBenchmarkUsd: number | null;
  budgetGapUsd: number | null;
  budgetCoveragePct: number | null;
  benchmarkLabel: string;
  explanation: string;
};

export type ScenarioExhaustiveEstimateSummary = {
  available: boolean;
  estimatedCostUsd: number | null;
  fundedCostUsd: number;
  remainingGapUsd: number | null;
  coveragePct: number | null;
  costableActions: number;
  methodology: string;
};

export type CostSource = {
  id: string;
  name: string;
  category: string;
  estimatedCostUsd: number | null;
  summary: string;
  evidenceUrl: string;
  sourceNote: string;
};

export type InterventionRecord = {
  id: string;
  name: string;
  category: string;
  measurementUnit: string;
  unitCostUsd: number | null;
  targetQuantity?: number | null;
  costStatus: "verified_unit_cost" | "ranking_only" | "benchmark_only";
  priorityRank: number | null;
  summary: string;
  evidenceUrl: string;
  sourceNote: string;
};

export type RunRecord = {
  id: string;
  cityId: string;
  scenario: string;
  queueJobId?: string | null;
  status: "queued" | "running" | "succeeded" | "failed";
  progress: number;
  updatedAt: string;
  outputs: string[];
  summary: string;
  outputArtifactIds: string[];
  logs: string[];
};

export type RunDetail = RunRecord & {
  cityName: string | null;
  createdAt: string | null;
  notes: string[];
};

export type WorkspaceMembership = {
  id: string;
  role: "viewer" | "editor" | "admin";
};

export type AuthSession = {
  userId: string;
  displayName: string;
  authEnforced: boolean;
  activeWorkspaceId: string;
  memberships: WorkspaceMembership[];
};

export type PlanningReadinessCheck = {
  id: string;
  label: string;
  status: "ready" | "partial" | "missing";
  detail: string;
};

export type PlanningReadiness = {
  cityId: string;
  cityName: string;
  bundled: boolean;
  readinessLabel: string;
  narrative: string;
  checks: PlanningReadinessCheck[];
};

export type PlannerValidation = {
  cityId: string;
  cityName: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: PlanningReadinessCheck[];
};

export type TrustProtocolStep = {
  id: string;
  title: string;
  status: "ready" | "partial" | "missing";
  detail: string;
};

export type TrustManifestEntry = {
  label: string;
  path: string;
  exists: boolean;
  sha256: string | null;
  sizeBytes: number | null;
  note: string;
};

export type TrustAudit = {
  cityId: string;
  cityName: string;
  generatedAt: string;
  summary: string;
  benchmarkProtocol: TrustProtocolStep[];
  reproducibilityManifest: TrustManifestEntry[];
  provenanceAudit: TrustProtocolStep[];
  notes: string[];
};

export type BenchmarkSuiteCase = {
  id: string;
  label: string;
  budgetUsd: number;
  planningMode: PlanningMode;
  actionCount: number;
  confidence: number | null;
  allocationCoveragePct: number;
  benchmarkLabel: string;
  exhaustiveAvailable: boolean;
  summary: string;
  sourceNote: string;
};

export type BenchmarkSuite = {
  cityId: string;
  cityName: string;
  generatedAt: string;
  headline: string;
  cases: BenchmarkSuiteCase[];
  notes: string[];
};

export type CityDataRegistration = {
  cityId: string;
  thermalInputsRegistered: boolean;
  artifactBundleRegistered: boolean;
  bottleneckOverlayRegistered: boolean;
  coolingOverlayRegistered: boolean;
  thermalInputsPath: string | null;
  artifactBundlePath: string | null;
  bottleneckOverlayPath: string | null;
  coolingOverlayPath: string | null;
  verifiedPaths: Record<string, boolean>;
  contentValid: Record<string, boolean>;
  contentLabels: Record<string, string>;
};

export type StarterScenario = {
  key: string;
  label: string;
  budgetUsd: number;
  description: string;
};

export type StudyCard = {
  eyebrow: string;
  title: string;
  description: string;
};

export type CityExperience = {
  cityId: string;
  cityName: string;
  bundled: boolean;
  summary: string;
  readinessLabel: string;
  defaultRunScenario: string;
  defaultPackageId: string | null;
  studyGuideArtifactId: string | null;
  exportArtifactIds: string[];
  runSeedArtifactIds: string[];
  starterScenarios: StarterScenario[];
  studyCards: StudyCard[];
  spectralAvailable: boolean;
  availablePackageIds: string[];
};

export type BundledPackage = {
  id: string;
  city_id: string;
  name: string;
  audience: string;
  summary: string;
  artifactIds: string[];
  studyGuideArtifactId: string | null;
  boundaryArtifactId: string | null;
  bottleneckArtifactId: string | null;
  coolingArtifactId: string | null;
};

export type PackageValidation = {
  packageId: string;
  cityId: string | null;
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: PlanningReadinessCheck[];
};

export type ArtifactRecord = {
  id: string;
  name: string;
  kind: string;
  description: string;
  downloadUrl: string;
  preview: string;
  previewGeometry: Point[][];
};

export type RobustnessLab = {
  title: string;
  summary: string;
  pValues: number[];
  baselinePercolation: number[];
  interventionPercolation: number[];
  lambda2Baseline: number;
  lambda2Intervention: number;
  phiBaseline: number;
  phiIntervention: number;
  reliabilityBaseline: number;
  reliabilityIntervention: number;
  notes: string[];
};

export type CityOnboardingInput = {
  name: string;
  region: string;
  population: string;
  boundarySource: "demo" | "upload" | "catalog";
  boundaryPath: string;
  boundaryFileName: string | null;
  boundaryGeojsonText: string | null;
  notes: string;
};

export type CityOnboardingResult = {
  city: CityProfile;
  boundary_path: string | null;
  boundary_available: boolean;
};

export type Point = {
  x: number;
  y: number;
};

export type CityMapLegendItem = {
  label: string;
  color: string;
  description: string;
};

export type CityMapDistrict = {
  id: string;
  name: string;
  description: string;
  score: number;
  scoreClass: string;
  points: Point[];
};

export type CityMapOverlay = {
  id: string;
  label: string;
  score: number;
  scoreClass: string;
  points: Point[];
  properties?: Record<string, unknown>;
};

export type GeoJsonGeometry = {
  type: string;
  coordinates?: unknown;
};

export type GeoJsonFeature = {
  type: "Feature";
  id?: string | number;
  geometry: GeoJsonGeometry | null;
  properties?: Record<string, unknown> | null;
};

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

export type CityMapBounds = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export type CityThermalSource = {
  id: string;
  label: string;
  sourceName: string;
  provider: string;
  sensor: string;
  resolutionM: number;
  meanTempC: number;
  stdTempC: number;
  minTempC: number;
  maxTempC: number;
  thresholdTempC: number;
  corridorQuantile: number;
  filePath: string;
  metadataPath: string;
  sceneId: string | null;
  capturedAt: string | null;
  publishedAt: string | null;
  adapterKind: string | null;
  granuleConceptId: string | null;
  sceneBrowseUrl: string | null;
  sceneDataUrl: string | null;
  sceneMetadataUrl: string | null;
  bounds: CityMapBounds;
  surfaceGeojson: GeoJsonFeatureCollection;
  corridorGeojson: GeoJsonFeatureCollection;
};

export type CityLiveThermalAdapter = {
  status: "unavailable" | "planned" | "configured" | "refreshing" | "backup" | "error";
  headline: string;
  detail: string;
  providerTargets: string[];
  lastUpdated: string | null;
  lastAttemptedAt: string | null;
  latestSceneCapturedAt: string | null;
  latestSourceLabel: string | null;
  activeSourceCount: number;
  autoRefreshEnabled: boolean;
  autoRefreshAvailable: boolean;
  refreshIntervalSec: number | null;
  usingBackupData: boolean;
  backupAvailable: boolean;
};

export type TruthStatus = "observed" | "derived" | "estimated" | "illustrative";

export type CityMapLayerProvenance = {
  id: string;
  label: string;
  truthStatus: TruthStatus;
  sourceType: string;
  filePath: string | null;
  method: string;
  primaryFields: string[];
  limitations: string[];
};

export type CityMapTruthMode = {
  headline: string;
  interpretationStatus: TruthStatus;
  methodology: string;
  caution: string;
  notes: string[];
};

export type CityMapData = {
  cityId: string;
  cityName: string;
  viewBox: { width: number; height: number };
  boundary: Point[];
  heatZones: CityMapOverlay[];
  accessZones: CityMapOverlay[];
  legend: CityMapLegendItem[];
  highlights: Array<{ title: string; value: number; description: string }>;
  artifactPaths: string[];
  bounds: CityMapBounds | null;
  studyAreaGeojson: GeoJsonFeatureCollection | null;
  boundaryGeojson: GeoJsonFeatureCollection | null;
  heatGeojson: GeoJsonFeatureCollection | null;
  accessGeojson: GeoJsonFeatureCollection | null;
  thermalSources: CityThermalSource[];
  liveThermalAdapter: CityLiveThermalAdapter;
  truthMode: CityMapTruthMode;
  layerProvenance: CityMapLayerProvenance[];
  narrative: string;
};

export type CitySpectral = {
  cityId: string;
  summary: string;
  cheegerFeatureCount: number;
  coolingZoneCount: number;
  cheegerHighlights: Array<{ label: string; value: number; description: string }>;
  coolingHighlights: Array<{ label: string; value: number; description: string }>;
  artifactPaths: string[];
};
