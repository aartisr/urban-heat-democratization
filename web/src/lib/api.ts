import type { AddressAdviceContext, ArtifactRecord, AuthSession, BenchmarkSuite, BundledPackage, CityDataRegistration, CityExperience, CityLiveThermalAdapter, CityMapData, CityOnboardingInput, CityOnboardingResult, CityProfile, CitySpectral, CostSource, InterventionRecord, PackageValidation, PlannerValidation, PlanningMode, PlanningReadiness, RobustnessLab, RobustnessLabExperiment, RunDetail, RunRecord, ScenarioRecord, TrustAudit, WorkspaceMembership } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
// Keep the app responsive when a local or remote service is unavailable.
// A single, brief retry catches transient failures without trapping people on a spinner.
const API_TIMEOUT_MS = 8000;
const MAX_RETRIES = 1;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const API_KEY_STORAGE_KEY = "uhd.api-key";
const WORKSPACE_STORAGE_KEY = "uhd.workspace-id";

const runtimeGlobal = globalThis as typeof globalThis & {
  localStorage?: Storage;
  crypto?: Crypto;
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
};

export class ApiError extends Error {
  status: number;
  requestId: string | null;
  body: unknown;

  constructor(message: string, status: number, requestId: string | null, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
    this.body = body;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => runtimeGlobal.setTimeout(resolve, ms));
}

function readStoredValue(key: string): string | null {
  try {
    return runtimeGlobal.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string | null): void {
  try {
    if (value === null || value.trim() === "") {
      runtimeGlobal.localStorage?.removeItem(key);
      return;
    }
    runtimeGlobal.localStorage?.setItem(key, value);
  } catch {
    // Ignore storage failures to keep API requests functional in privacy-restricted contexts.
  }
}

function makeRequestId() {
  if (runtimeGlobal.crypto?.randomUUID) {
    return runtimeGlobal.crypto.randomUUID();
  }
  return `uhd-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mergeHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const apiKey = readStoredValue(API_KEY_STORAGE_KEY);
  const workspaceId = readStoredValue(WORKSPACE_STORAGE_KEY);
  if (apiKey && !headers.has("x-api-key")) {
    headers.set("x-api-key", apiKey);
  }
  if (workspaceId && !headers.has("x-workspace-id")) {
    headers.set("x-workspace-id", workspaceId);
  }
  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", makeRequestId());
  }
  return headers;
}

function shouldRetry(method: string, errorOrStatus: Error | number, attempt: number): boolean {
  if (attempt >= MAX_RETRIES) {
    return false;
  }
  const isSafe = method === "GET" || method === "HEAD";
  if (!isSafe) {
    return false;
  }
  if (typeof errorOrStatus === "number") {
    return RETRYABLE_STATUS.has(errorOrStatus);
  }
  return errorOrStatus.name === "AbortError" || errorOrStatus instanceof TypeError;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = mergeHeaders(init);
  const requestInit = { ...init, method, headers };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = runtimeGlobal.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...requestInit,
        signal: controller.signal,
      });
      runtimeGlobal.clearTimeout(timeout);

      if (!response.ok) {
        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }
        if (shouldRetry(method, response.status, attempt)) {
          await sleep(120 * (attempt + 1));
          continue;
        }
        throw new ApiError(
          `Request failed with status ${response.status}`,
          response.status,
          response.headers.get("x-request-id"),
          body,
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      runtimeGlobal.clearTimeout(timeout);
      const normalized = error instanceof Error ? error : new Error("Unknown fetch error");
      if (shouldRetry(method, normalized, attempt)) {
        lastError = normalized;
        await sleep(120 * (attempt + 1));
        continue;
      }
      throw normalized;
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}

export function configureApiAccess(input: { apiKey?: string | null; workspaceId?: string | null }) {
  if (input.apiKey !== undefined) {
    writeStoredValue(API_KEY_STORAGE_KEY, input.apiKey ?? null);
  }
  if (input.workspaceId !== undefined) {
    writeStoredValue(WORKSPACE_STORAGE_KEY, input.workspaceId ?? null);
  }
}

export function clearApiAccess() {
  writeStoredValue(API_KEY_STORAGE_KEY, null);
  writeStoredValue(WORKSPACE_STORAGE_KEY, null);
}

export function getApiAccessSnapshot(): { apiKey: string; workspaceId: string } {
  return {
    apiKey: readStoredValue(API_KEY_STORAGE_KEY) ?? "",
    workspaceId: readStoredValue(WORKSPACE_STORAGE_KEY) ?? "default",
  };
}

export async function getAuthSession(): Promise<AuthSession> {
  return fetchJson<AuthSession>("/v1/auth/session");
}

export async function listWorkspaces(): Promise<WorkspaceMembership[]> {
  return fetchJson<WorkspaceMembership[]>("/v1/workspaces");
}

export async function listCities(): Promise<CityProfile[]> {
  const payload = await fetchJson<{ cities: CityProfile[] }>("/v1/cities");
  return payload.cities;
}

export async function getCity(cityId: string): Promise<CityProfile> {
  return fetchJson<CityProfile>(`/v1/cities/${encodeURIComponent(cityId)}`);
}

export async function getAddressAdviceContext(cityId: string): Promise<AddressAdviceContext> {
  return fetchJson<AddressAdviceContext>(`/v1/address-advice/cities/${encodeURIComponent(cityId)}`);
}

export async function listCityExperiences(): Promise<CityExperience[]> {
  return fetchJson<CityExperience[]>("/v1/city-experiences");
}

export async function listBundledPackages(): Promise<BundledPackage[]> {
  return fetchJson<BundledPackage[]>("/v1/bundled-packages");
}

export async function getBundledPackage(packageId: string): Promise<BundledPackage> {
  return fetchJson<BundledPackage>(`/v1/bundled-packages/${encodeURIComponent(packageId)}`);
}

export async function validateBundledPackage(packageId: string): Promise<PackageValidation> {
  return fetchJson<PackageValidation>(`/v1/bundled-packages/${encodeURIComponent(packageId)}/validate`);
}

export async function getCityExperience(cityId: string): Promise<CityExperience> {
  return fetchJson<CityExperience>(`/v1/cities/${encodeURIComponent(cityId)}/experience`);
}

export async function getCityMap(cityId: string): Promise<CityMapData> {
  return fetchJson<CityMapData>(`/v1/cities/${encodeURIComponent(cityId)}/map`);
}

export async function getCityLiveThermal(cityId: string): Promise<CityLiveThermalAdapter> {
  return fetchJson<CityLiveThermalAdapter>(`/v1/cities/${encodeURIComponent(cityId)}/live-thermal`);
}

export async function enableCityLiveThermal(cityId: string) {
  return fetchJson(`/v1/cities/${encodeURIComponent(cityId)}/live-thermal/enable`, {
    method: "POST",
  });
}

export async function disableCityLiveThermal(cityId: string) {
  return fetchJson(`/v1/cities/${encodeURIComponent(cityId)}/live-thermal/disable`, {
    method: "POST",
  });
}

export async function refreshCityLiveThermal(cityId: string) {
  return fetchJson(`/v1/cities/${encodeURIComponent(cityId)}/live-thermal/refresh`, {
    method: "POST",
  });
}

export async function getCityReadiness(cityId: string): Promise<PlanningReadiness> {
  return fetchJson<PlanningReadiness>(`/v1/cities/${encodeURIComponent(cityId)}/readiness`);
}

export async function getCityPlannerValidation(cityId: string): Promise<PlannerValidation> {
  return fetchJson<PlannerValidation>(`/v1/cities/${encodeURIComponent(cityId)}/planner-validation`);
}

export async function getCityBenchmarkSuite(cityId: string): Promise<BenchmarkSuite> {
  return fetchJson<BenchmarkSuite>(`/v1/cities/${encodeURIComponent(cityId)}/benchmarks`);
}

export async function getCityTrustAudit(cityId: string): Promise<TrustAudit> {
  return fetchJson<TrustAudit>(`/v1/cities/${encodeURIComponent(cityId)}/trust-audit`);
}

export async function registerCityData(
  cityId: string,
  input: {
    thermalInputsRegistered: boolean;
    artifactBundleRegistered: boolean;
    bottleneckOverlayRegistered: boolean;
    coolingOverlayRegistered: boolean;
    thermalInputsPath?: string | null;
    artifactBundlePath?: string | null;
    bottleneckOverlayPath?: string | null;
    coolingOverlayPath?: string | null;
  },
): Promise<CityDataRegistration> {
  return fetchJson<CityDataRegistration>(`/v1/cities/${encodeURIComponent(cityId)}/data-registration`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCityDataRegistration(cityId: string): Promise<CityDataRegistration> {
  return fetchJson<CityDataRegistration>(`/v1/cities/${encodeURIComponent(cityId)}/data-registration`);
}

export async function getCitySpectral(cityId: string): Promise<CitySpectral> {
  return fetchJson<CitySpectral>(`/v1/cities/${encodeURIComponent(cityId)}/spectral`);
}

export async function onboardCity(input: CityOnboardingInput): Promise<CityOnboardingResult> {
  const isUpload = input.boundarySource === "upload";
  const isCatalog = input.boundarySource === "catalog";
  return fetchJson("/v1/cities/onboard", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      region: input.region,
      population: input.population,
      boundarySource: input.boundarySource,
      notes: input.notes,
      boundary_path: isCatalog ? input.boundaryPath || null : null,
      boundary_file_name: isUpload ? input.boundaryFileName : null,
      boundary_geojson_text: isUpload ? input.boundaryGeojsonText : null,
    }),
  });
}

export async function listScenarios(cityId?: string): Promise<ScenarioRecord[]> {
  const query = cityId ? `?city_id=${encodeURIComponent(cityId)}` : "";
  return fetchJson<ScenarioRecord[]>(`/v1/scenarios${query}`);
}

export async function listCostSources(): Promise<CostSource[]> {
  return fetchJson<CostSource[]>("/v1/cost-sources");
}

export async function listInterventions(): Promise<InterventionRecord[]> {
  return fetchJson<InterventionRecord[]>("/v1/interventions");
}

export async function createWhatIfScenarios(
  cityId: string,
  budgetUsd: number,
  options?: { label?: string; presetKey?: string | null; planningMode?: PlanningMode },
): Promise<ScenarioRecord> {
  return fetchJson<ScenarioRecord>("/v1/scenarios/what-if", {
    method: "POST",
    body: JSON.stringify({
      cityId,
      budgetUsd,
      label: options?.label,
      presetKey: options?.presetKey ?? null,
      planningMode: options?.planningMode ?? "best_under_budget",
    }),
  });
}

export async function resetAndGenerateScenarios(
  cityId: string,
  budgetUsd: number,
  options?: { label?: string; presetKey?: string | null; planningMode?: PlanningMode },
): Promise<{ clearedCount: number; scenario: ScenarioRecord }> {
  return fetchJson<{ clearedCount: number; scenario: ScenarioRecord }>("/v1/scenarios/reset", {
    method: "POST",
    body: JSON.stringify({
      cityId,
      budgetUsd,
      label: options?.label,
      presetKey: options?.presetKey ?? null,
      planningMode: options?.planningMode ?? "best_under_budget",
    }),
  });
}

export async function listRuns(cityId?: string): Promise<RunRecord[]> {
  const query = cityId ? `?city_id=${encodeURIComponent(cityId)}` : "";
  return fetchJson<RunRecord[]>(`/v1/runs${query}`);
}

export async function getRun(runId: string): Promise<RunDetail> {
  return fetchJson<RunDetail>(`/v1/runs/${encodeURIComponent(runId)}`);
}

export async function listArtifacts(): Promise<ArtifactRecord[]> {
  return fetchJson<ArtifactRecord[]>("/v1/artifacts");
}

export async function getRobustnessLab(): Promise<RobustnessLab> {
  return fetchJson<RobustnessLab>("/v1/robustness/lab");
}

export async function runRobustnessExperiment(experiment: RobustnessLabExperiment): Promise<RobustnessLab> {
  return fetchJson<RobustnessLab>("/v1/robustness/lab/experiment", {
    method: "POST",
    body: JSON.stringify(experiment),
  });
}

export async function queueRun(cityId: string, scenario: string): Promise<RunRecord> {
  return fetchJson<RunRecord>("/v1/runs", {
    method: "POST",
    body: JSON.stringify({ cityId, scenario }),
  });
}

export function artifactDownloadUrl(artifactId: string): string {
  return `${API_BASE_URL}/v1/artifacts/${encodeURIComponent(artifactId)}`;
}
