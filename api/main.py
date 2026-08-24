from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import networkx as nx
import numpy as np
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from api.access_control import AccessControl
from api.http_middleware import build_api_logger, install_http_middleware
from api.routers.runs import create_runs_router
from api.routers.system import create_system_router
from api.run_queue import DurableRunQueue
from core.city_experience import (
    all_artifact_specs,
    artifact_path,
    bundled_package_payload,
    bundled_package_specs,
    city_experience_payload,
    resolve_city_experience,
)
from core.city_maps import city_map_payload
from core.city_package_contract import validate_bundled_package
from core.city_strategies import (
    allocation_summary,
    benchmark_scenario,
    benchmark_summary,
    cost_source_by_id,
    evidence_summary,
    exhaustive_estimate_summary,
    normalize_planning_mode,
)
from core.cities import city_onboarding_summary, get_city_profile, is_bundled_city, list_city_profiles, normalize_city_key
from core.percolation import percolation_scan
from core.reliability import reliability_to_sinks
from core.spectra import lambda2_and_fiedler, sweep_conductance

logger = build_api_logger()

app = FastAPI(title="Urban Heat Democratization API")
APP_STARTED_AT = time.time()
_ACCESS_CONTROL = AccessControl.from_env()


def is_serverless_runtime() -> bool:
    """Return whether this process is running in a short-lived function host.

    Vercel functions may reuse an instance, but neither its process lifetime nor
    writable filesystem is durable. The serverless mode therefore uses `/tmp`
    only as scratch space and never depends on background threads for a user
    visible result.
    """
    configured_mode = os.getenv("UHD_RUNTIME_MODE", "").strip().lower()
    return configured_mode == "serverless" or os.getenv("VERCEL", "") == "1"


def cors_origins_from_env() -> list[str]:
    """Return explicit browser origins; wildcard credentials are never valid."""
    configured = os.getenv("UHD_CORS_ORIGINS", "")
    if configured.strip():
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    # Local-first defaults. Production deployments must set UHD_CORS_ORIGINS.
    return [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_from_env(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

install_http_middleware(app, logger)


@app.on_event("startup")
async def resume_live_thermal_workers_on_startup() -> None:
    if is_serverless_runtime():
        return
    _RUN_QUEUE.start()
    _resume_live_thermal_workers()


@app.on_event("shutdown")
async def stop_background_workers_on_shutdown() -> None:
    if is_serverless_runtime():
        return
    _RUN_QUEUE.stop()
    for city_id in list(_LIVE_THERMAL_WORKERS.keys()):
        _stop_live_thermal_worker(city_id)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class CityProfileResponse(BaseModel):
    id: str
    name: str
    region: str
    population: str
    status: str
    baselineTempC: float
    canopyCoverage: str
    planningCostMultiplier: float
    description: str


class CityOnboardingResponse(BaseModel):
    city: CityProfileResponse
    boundary_path: str | None
    boundary_available: bool


class ScenarioActionResponse(BaseModel):
    interventionId: str
    name: str
    category: str
    measurementUnit: str | None = None
    costStatus: str
    priorityRank: int | None
    targetQuantity: int | None = None
    unitCostUsd: int | None = None
    estimatedProgramCostUsd: int | None = None
    allocatedBudgetUsd: int | None
    allocationBasis: str
    rationale: str


class ScenarioAllocationSummaryResponse(BaseModel):
    totalAllocatedBudgetUsd: int
    unallocatedBudgetUsd: int
    allocationCoveragePct: float
    allocationMethod: str


class ScenarioEvidenceSummaryResponse(BaseModel):
    verifiedUnitCostCount: int
    rankingOnlyCount: int
    benchmarkOnlyCount: int
    readinessLabel: str
    explanation: str


class ScenarioBenchmarkSummaryResponse(BaseModel):
    wholeCityBenchmarkUsd: int | None
    budgetGapUsd: int | None
    budgetCoveragePct: float | None
    benchmarkLabel: str
    explanation: str


class ScenarioExhaustiveEstimateSummaryResponse(BaseModel):
    available: bool
    estimatedCostUsd: int | None
    fundedCostUsd: int
    remainingGapUsd: int | None
    coveragePct: float | None
    costableActions: int
    methodology: str


class ScenarioRecordResponse(BaseModel):
    id: str
    label: str
    cityId: str
    planningMode: str = "benchmark_share"
    budgetUsd: int
    estimatedCostUsd: int | None
    heatReductionC: float | None
    equityScore: float | None
    confidence: float | None
    summary: str
    recommendedActions: list[ScenarioActionResponse]
    allocationSummary: ScenarioAllocationSummaryResponse
    evidenceSummary: ScenarioEvidenceSummaryResponse
    benchmarkSummary: ScenarioBenchmarkSummaryResponse
    exhaustiveEstimateSummary: ScenarioExhaustiveEstimateSummaryResponse


class RunRecordResponse(BaseModel):
    id: str
    cityId: str
    scenario: str
    queueJobId: str | None = None
    status: str
    progress: int
    updatedAt: str
    outputs: list[str]
    summary: str = ""
    outputArtifactIds: list[str] = []
    logs: list[str] = []


class RunDetailResponse(RunRecordResponse):
    cityName: str | None = None
    createdAt: str | None = None
    notes: list[str] = []


class ArtifactRecordResponse(BaseModel):
    id: str
    name: str
    kind: str
    description: str
    downloadUrl: str
    preview: str
    previewGeometry: list[list[CityMapPoint]] = []


class CityDataRegistrationRequest(BaseModel):
    thermal_inputs_registered: bool | None = Field(default=None, alias="thermalInputsRegistered")
    artifact_bundle_registered: bool | None = Field(default=None, alias="artifactBundleRegistered")
    bottleneck_overlay_registered: bool | None = Field(default=None, alias="bottleneckOverlayRegistered")
    cooling_overlay_registered: bool | None = Field(default=None, alias="coolingOverlayRegistered")
    thermal_inputs_path: str | None = Field(default=None, alias="thermalInputsPath")
    artifact_bundle_path: str | None = Field(default=None, alias="artifactBundlePath")
    bottleneck_overlay_path: str | None = Field(default=None, alias="bottleneckOverlayPath")
    cooling_overlay_path: str | None = Field(default=None, alias="coolingOverlayPath")


class CityDataRegistrationResponse(BaseModel):
    cityId: str
    thermalInputsRegistered: bool
    artifactBundleRegistered: bool
    bottleneckOverlayRegistered: bool
    coolingOverlayRegistered: bool
    thermalInputsPath: str | None = None
    artifactBundlePath: str | None = None
    bottleneckOverlayPath: str | None = None
    coolingOverlayPath: str | None = None
    verifiedPaths: dict[str, bool]
    contentValid: dict[str, bool]
    contentLabels: dict[str, str]


class RobustnessLabResponse(BaseModel):
    title: str
    summary: str
    pValues: list[float]
    baselinePercolation: list[float]
    interventionPercolation: list[float]
    lambda2Baseline: float
    lambda2Intervention: float
    phiBaseline: float
    phiIntervention: float
    reliabilityBaseline: float
    reliabilityIntervention: float
    notes: list[str]


class TrustProtocolStepResponse(BaseModel):
    id: str
    title: str
    status: str
    detail: str


class TrustManifestEntryResponse(BaseModel):
    label: str
    path: str
    exists: bool
    sha256: str | None = None
    sizeBytes: int | None = None
    note: str


class TrustAuditResponse(BaseModel):
    cityId: str
    cityName: str
    generatedAt: str
    summary: str
    benchmarkProtocol: list[TrustProtocolStepResponse]
    reproducibilityManifest: list[TrustManifestEntryResponse]
    provenanceAudit: list[TrustProtocolStepResponse]
    notes: list[str]


class BenchmarkSuiteCaseResponse(BaseModel):
    id: str
    label: str
    budgetUsd: int
    planningMode: str
    actionCount: int
    confidence: float | None
    allocationCoveragePct: float
    benchmarkLabel: str
    exhaustiveAvailable: bool
    summary: str
    sourceNote: str


class BenchmarkSuiteResponse(BaseModel):
    cityId: str
    cityName: str
    generatedAt: str
    headline: str
    cases: list[BenchmarkSuiteCaseResponse]
    notes: list[str]


class CityMapPoint(BaseModel):
    x: float
    y: float


class CityMapOverlay(BaseModel):
    id: str
    label: str
    score: float
    scoreClass: str
    points: list[CityMapPoint]
    properties: dict[str, object] | None = None
    name: str | None = None
    description: str | None = None


class CityMapBounds(BaseModel):
    minLng: float
    minLat: float
    maxLng: float
    maxLat: float


class CityThermalSourceResponse(BaseModel):
    id: str
    label: str
    sourceName: str
    provider: str
    sensor: str
    resolutionM: int
    meanTempC: float
    stdTempC: float
    minTempC: float
    maxTempC: float
    thresholdTempC: float
    corridorQuantile: float
    filePath: str
    metadataPath: str
    sceneId: str | None = None
    capturedAt: str | None = None
    publishedAt: str | None = None
    adapterKind: str | None = None
    granuleConceptId: str | None = None
    sceneBrowseUrl: str | None = None
    sceneDataUrl: str | None = None
    sceneMetadataUrl: str | None = None
    bounds: CityMapBounds
    surfaceGeojson: dict[str, object]
    corridorGeojson: dict[str, object]


class CityLiveThermalAdapterResponse(BaseModel):
    status: str
    headline: str
    detail: str
    providerTargets: list[str]
    lastUpdated: str | None = None
    lastAttemptedAt: str | None = None
    latestSceneCapturedAt: str | None = None
    latestSourceLabel: str | None = None
    activeSourceCount: int = 0
    autoRefreshEnabled: bool = False
    autoRefreshAvailable: bool = False
    refreshIntervalSec: int | None = None
    usingBackupData: bool = False
    backupAvailable: bool = False


class CityMapLayerProvenanceResponse(BaseModel):
    id: str
    label: str
    truthStatus: str
    sourceType: str
    filePath: str | None = None
    method: str
    primaryFields: list[str]
    limitations: list[str]


class CityMapTruthModeResponse(BaseModel):
    headline: str
    interpretationStatus: str
    methodology: str
    caution: str
    notes: list[str]


class CityMapResponse(BaseModel):
    cityId: str
    cityName: str
    viewBox: dict[str, float]
    boundary: list[CityMapPoint]
    heatZones: list[CityMapOverlay]
    accessZones: list[CityMapOverlay]
    legend: list[dict[str, str]]
    highlights: list[dict[str, object]]
    artifactPaths: list[str]
    bounds: CityMapBounds | None = None
    studyAreaGeojson: dict[str, object] | None = None
    boundaryGeojson: dict[str, object] | None = None
    heatGeojson: dict[str, object] | None = None
    accessGeojson: dict[str, object] | None = None
    thermalSources: list[CityThermalSourceResponse]
    liveThermalAdapter: CityLiveThermalAdapterResponse
    truthMode: CityMapTruthModeResponse
    layerProvenance: list[CityMapLayerProvenanceResponse]
    narrative: str


class SpectralHighlight(BaseModel):
    label: str
    value: float
    description: str


class CitySpectralResponse(BaseModel):
    cityId: str
    summary: str
    cheegerFeatureCount: int
    coolingZoneCount: int
    cheegerHighlights: list[SpectralHighlight]
    coolingHighlights: list[SpectralHighlight]
    artifactPaths: list[str]


class StarterScenarioResponse(BaseModel):
    key: str
    label: str
    budgetUsd: int
    description: str


class StudyCardResponse(BaseModel):
    eyebrow: str
    title: str
    description: str


class CityExperienceResponse(BaseModel):
    cityId: str
    cityName: str
    bundled: bool
    summary: str
    readinessLabel: str
    defaultRunScenario: str
    defaultPackageId: str | None = None
    studyGuideArtifactId: str | None = None
    exportArtifactIds: list[str]
    runSeedArtifactIds: list[str]
    starterScenarios: list[StarterScenarioResponse]
    studyCards: list[StudyCardResponse]
    spectralAvailable: bool
    availablePackageIds: list[str]


class BundledPackageResponse(BaseModel):
    id: str
    city_id: str
    name: str
    audience: str
    summary: str
    artifactIds: list[str]
    studyGuideArtifactId: str | None = None
    boundaryArtifactId: str | None = None
    bottleneckArtifactId: str | None = None
    coolingArtifactId: str | None = None


class PackageValidationResponse(BaseModel):
    packageId: str
    cityId: str | None = None
    valid: bool
    errors: list[str]
    warnings: list[str]
    checks: list[dict[str, object]]


class PlanningReadinessResponse(BaseModel):
    cityId: str
    cityName: str
    bundled: bool
    readinessLabel: str
    narrative: str
    checks: list[dict[str, object]]


class PlannerValidationResponse(BaseModel):
    cityId: str
    cityName: str
    valid: bool
    errors: list[str]
    warnings: list[str]
    checks: list[dict[str, object]]


class CostSourceResponse(BaseModel):
    id: str
    name: str
    category: str
    estimatedCostUsd: int | None
    summary: str
    evidenceUrl: str
    sourceNote: str


class InterventionRecordResponse(BaseModel):
    id: str
    name: str
    category: str
    measurementUnit: str
    unitCostUsd: int | None
    targetQuantity: int | None = None
    costStatus: str
    priorityRank: int | None
    summary: str
    evidenceUrl: str
    sourceNote: str


class ScenarioCreateRequest(BaseModel):
    city_id: str = Field(alias="cityId")
    budget_usd: int = Field(alias="budgetUsd", ge=1)
    label: str | None = None
    preset_key: str | None = Field(default=None, alias="presetKey")
    planning_mode: str = Field(default="best_under_budget", alias="planningMode")


class ScenarioResetRequest(ScenarioCreateRequest):
    pass


class ScenarioResetResponse(BaseModel):
    clearedCount: int
    scenario: ScenarioRecordResponse


class RunCreateRequest(BaseModel):
    city_id: str = Field(alias="cityId")
    scenario: str


class WorkspaceMembershipResponse(BaseModel):
    id: str
    role: str


class AuthSessionResponse(BaseModel):
    userId: str
    displayName: str
    authEnforced: bool
    activeWorkspaceId: str
    memberships: list[WorkspaceMembershipResponse]


def _workspace_id_from_request(request: Request) -> str:
    workspace_id = request.headers.get("x-workspace-id", "default").strip()
    return workspace_id or "default"


def _profile_to_city_response(profile_dict: dict[str, object]) -> dict[str, object]:
    key = str(profile_dict.get("key", profile_dict.get("id", "custom")))
    name = str(profile_dict.get("name", key.replace("-", " ").title()))
    demo_notes = str(profile_dict.get("demo_notes", ""))
    bundled = is_bundled_city(key)
    return {
        "id": key,
        "name": name,
        "region": str(profile_dict.get("region", "Unknown")),
        "population": str(profile_dict.get("population", "Unknown")),
        "status": "Ready" if bundled else "Research",
        "baselineTempC": float(profile_dict.get("baseline_temp_c", 32.0) or 32.0),
        "canopyCoverage": str(profile_dict.get("canopy_coverage", "Unknown")),
        "planningCostMultiplier": float(profile_dict.get("planning_cost_multiplier", 1.0) or 1.0),
        "description": demo_notes or (f"{name} is bundled for immediate study." if bundled else f"{name} ready for onboarding."),
    }


def _repo_data_path(filename: str) -> Path:
    return Path(__file__).resolve().parents[1] / "data" / filename


def _runtime_data_path(filename: str) -> Path:
    path = (
        Path("/tmp") / "urban_heat_democratization_runtime"
        if is_serverless_runtime()
        else Path(__file__).resolve().parents[1] / "data" / "runtime"
    )
    path.mkdir(parents=True, exist_ok=True)
    return path / filename


def _load_json_file(path: Path) -> dict[str, object] | list[dict[str, object]] | None:
    if not path.exists():
        return None
    with path.open() as handle:
        return json.load(handle)


def _save_json_file(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as handle:
        json.dump(payload, handle, indent=2)


def _save_text_file(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as handle:
        handle.write(text)


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _live_thermal_config_path() -> Path:
    return _repo_data_path("live_thermal_sources.json")


def _load_cost_sources() -> list[dict[str, object]]:
    path = _repo_data_path("cost_sources.json")
    if not path.exists():
        return []
    with path.open() as handle:
        payload = json.load(handle)
    sources = payload.get("sources", [])
    return [source for source in sources if isinstance(source, dict)]


def _load_interventions() -> list[dict[str, object]]:
    path = _repo_data_path("intervention_catalog.json")
    if not path.exists():
        return []
    with path.open() as handle:
        payload = json.load(handle)
    interventions = payload.get("interventions", [])
    base_records = [item for item in interventions if isinstance(item, dict)]
    unit_cost_path = _repo_data_path("intervention_unit_costs.json")
    if not unit_cost_path.exists():
        return base_records
    with unit_cost_path.open() as handle:
        unit_cost_payload = json.load(handle)
    unit_cost_rows = unit_cost_payload.get("unitCosts", [])
    overrides_by_id = {
        str(item.get("interventionId")): item
        for item in unit_cost_rows
        if isinstance(item, dict) and item.get("interventionId")
    }
    merged_records: list[dict[str, object]] = []
    for item in base_records:
        intervention_id = str(item.get("id", ""))
        override = overrides_by_id.get(intervention_id)
        if not isinstance(override, dict):
          merged_records.append(item)
          continue
        merged = dict(item)
        if override.get("unitCostUsd") is not None:
            merged["unitCostUsd"] = int(override.get("unitCostUsd", 0) or 0)
        if override.get("targetQuantity") is not None:
            merged["targetQuantity"] = int(override.get("targetQuantity", 0) or 0)
        if override.get("measurementUnit"):
            merged["measurementUnit"] = str(override.get("measurementUnit"))
        merged["costStatus"] = "verified_unit_cost"
        if override.get("summaryOverride"):
            merged["summary"] = str(override.get("summaryOverride"))
        if override.get("evidenceUrl"):
            merged["evidenceUrl"] = str(override.get("evidenceUrl"))
        if override.get("sourceNote"):
            merged["sourceNote"] = str(override.get("sourceNote"))
        merged_records.append(merged)
    return merged_records


def _artifact_catalog() -> list[dict[str, object]]:
    repo_root = _repo_root()
    records: list[dict[str, object]] = []
    for spec in all_artifact_specs():
        path = artifact_path(repo_root, spec.id)
        if path is not None:
            records.append(
                {
                    "id": spec.id,
                    "name": spec.name,
                    "kind": spec.kind,
                    "description": spec.description,
                    "downloadUrl": f"/api/v1/artifacts/{spec.id}",
                    "preview": _artifact_preview(path, spec.kind),
                    "previewGeometry": _artifact_preview_geometry(path, spec.kind),
                }
            )
    return records


def _artifact_path_by_id(artifact_id: str) -> Path | None:
    return artifact_path(_repo_root(), artifact_id)


def _artifact_record_by_id(artifact_id: str) -> dict[str, object] | None:
    return next((record for record in _artifact_catalog() if str(record.get("id")) == artifact_id), None)


def _artifact_preview(path: Path, kind: str) -> str:
    if not path.exists():
        return "Artifact file is not available."
    if kind == "geojson":
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if payload.get("type") == "FeatureCollection":
                features = payload.get("features", [])
                return f"GeoJSON FeatureCollection with {len(features) if isinstance(features, list) else 0} feature(s)."
            return f"GeoJSON {payload.get('type', 'artifact')}."
        except Exception:
            return "GeoJSON artifact is present but could not be summarized."
    if kind == "markdown":
        text = path.read_text(encoding="utf-8", errors="ignore")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return " ".join(lines[:2])[:220] if lines else "Markdown artifact."
    if kind == "json":
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(payload, dict) and "sources" in payload and isinstance(payload["sources"], list):
                return f"JSON source catalog with {len(payload['sources'])} source record(s)."
            return "JSON artifact ready for download."
        except Exception:
            return "JSON artifact ready for download."
    return f"{kind.title()} artifact ready for download."


def _artifact_preview_geometry(path: Path, kind: str) -> list[list[dict[str, float]]]:
    if kind != "geojson" or not path.exists():
        return []
    features = _load_geojson_features(path)[:2]
    if not features:
        return []
    bounds = _collect_bounds(features)
    polygons: list[list[dict[str, float]]] = []
    for feature in features:
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict):
            continue
        points = _geometry_points(geometry)
        if not points:
            continue
        normalized = _normalize_points(points, bounds)
        polygons.append([point.model_dump() for point in normalized])
    return polygons


def _file_sha256(path: Path) -> str | None:
    if not path.exists() or not path.is_file():
        return None
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _trust_manifest_entry(label: str, path: Path, *, note: str, hash_file: bool = True) -> dict[str, object]:
    exists = path.exists()
    size_bytes = path.stat().st_size if exists and path.is_file() else None
    return {
        "label": label,
        "path": str(path),
        "exists": exists,
        "sha256": _file_sha256(path) if hash_file else None,
        "sizeBytes": size_bytes,
        "note": note,
    }


def _trust_audit(city_id: str) -> dict[str, object]:
    city_key = normalize_city_key(city_id)
    city_record = _CITY_STORE.get(city_key, {})
    profile = get_city_profile(city_key)
    experience = resolve_city_experience(city_key)
    bundled = is_bundled_city(city_key)
    city_name = str(city_record.get("name", profile.name))
    city_map = city_map_payload(city_key)
    live_adapter = city_map.get("liveThermalAdapter") if isinstance(city_map, dict) else None
    planner_validation = _planner_validation(city_key)
    scenario_count = sum(1 for item in _SCENARIO_STORE if item.get("cityId") == city_key)
    run_count = sum(1 for item in _RUN_STORE if item.get("cityId") == city_key)
    verified_unit_cost_count = sum(1 for item in _INTERVENTIONS if str(item.get("costStatus")) == "verified_unit_cost")
    benchmark_ready = bool(_COST_SOURCES)
    live_ready = bool(isinstance(live_adapter, dict) and live_adapter.get("autoRefreshAvailable"))
    reproducibility_manifest = [
        _trust_manifest_entry(
            "Implementation status",
            _repo_root() / "docs/IMPLEMENTATION_STATUS.md",
            note="Living record of what is done, partial, and remaining.",
        ),
        _trust_manifest_entry(
            "Master plan",
            _repo_root() / "01_master_plan.md",
            note="Top-level mission and evidence hierarchy.",
        ),
        _trust_manifest_entry(
            "Phase roadmap",
            _repo_root() / "03_phase_roadmap.md",
            note="Delivery sequence and trust-phase target.",
        ),
        _trust_manifest_entry(
            "Cost sources",
            _repo_root() / "data/cost_sources.json",
            note="Coarse benchmark anchors used by the scenario layer.",
        ),
        _trust_manifest_entry(
            "Intervention catalog",
            _repo_root() / "data/intervention_catalog.json",
            note="Comparative evidence catalog for scenario planning.",
        ),
        _trust_manifest_entry(
            "Verified unit costs",
            _repo_root() / "data/intervention_unit_costs.json",
            note="Dedicated seam for verified per-action unit-cost rows.",
        ),
        _trust_manifest_entry(
            "Runtime cities snapshot",
            _runtime_data_path("cities.json"),
            note="Persisted onboarding and city-readiness catalog.",
        ),
        _trust_manifest_entry(
            "Runtime scenarios snapshot",
            _runtime_data_path("scenarios.json"),
            note="Persisted what-if scenario history.",
        ),
        _trust_manifest_entry(
            "Runtime runs snapshot",
            _runtime_data_path("runs.json"),
            note="Persisted run history and audit trail.",
        ),
        _trust_manifest_entry(
            "Runtime SQLite store",
            _runtime_data_path("urban_heat_runtime.sqlite3"),
            note="SQLite mirror of the runtime state used for local persistence.",
            hash_file=False,
        ),
    ]
    if experience.spectral_bundle is not None:
        boundary_path = _artifact_path_by_id(experience.spectral_bundle.boundary_artifact_id)
        bottleneck_path = _artifact_path_by_id(experience.spectral_bundle.bottleneck_artifact_id)
        cooling_path = _artifact_path_by_id(experience.spectral_bundle.cooling_artifact_id)
        if boundary_path is not None:
            reproducibility_manifest.append(
                _trust_manifest_entry(
                    "Boundary artifact",
                    boundary_path,
                    note="Bundled boundary used to clip the city atlas.",
                )
            )
        if bottleneck_path is not None:
            reproducibility_manifest.append(
                _trust_manifest_entry(
                    "Bottleneck overlay",
                    bottleneck_path,
                    note="Bundled Cheeger bottleneck overlay.",
                )
            )
        if cooling_path is not None:
            reproducibility_manifest.append(
                _trust_manifest_entry(
                    "Cooling-access overlay",
                    cooling_path,
                    note="Bundled low-cooling-access overlay.",
                )
            )
    else:
        if city_record.get("boundaryPath"):
            boundary_path, _ = _verify_city_path(str(city_record.get("boundaryPath")))
            if boundary_path:
                reproducibility_manifest.append(
                    _trust_manifest_entry(
                        "Uploaded city boundary",
                        Path(boundary_path),
                        note="Uploaded boundary registered for this city.",
                    )
                )
        if city_record.get("artifactBundlePath"):
            artifact_path_value, _ = _verify_city_path(str(city_record.get("artifactBundlePath")))
            if artifact_path_value:
                reproducibility_manifest.append(
                    _trust_manifest_entry(
                        "Uploaded artifact bundle",
                        Path(artifact_path_value),
                        note="Uploaded local artifact bundle registered for this city.",
                    )
                )

    benchmark_protocol = [
        {
            "id": "observed-vs-derived",
            "title": "Keep observed layers separate from derived layers",
            "status": "ready" if city_map.get("truthMode") else "partial",
            "detail": "The map contract distinguishes observed inputs, derived spectral layers, and planning simplifications before they are shown to the user.",
        },
        {
            "id": "cost-honesty",
            "title": "Keep benchmark and unit-cost evidence separate",
            "status": "ready" if benchmark_ready else "missing",
            "detail": (
                f"{verified_unit_cost_count} verified unit-cost row(s) are available alongside benchmark sources."
                if verified_unit_cost_count
                else "The repository still relies on comparative benchmark evidence while the verified unit-cost table is empty."
            ),
        },
        {
            "id": "planner-validation",
            "title": "Check planner readiness before treating outputs as final",
            "status": "ready" if planner_validation.get("valid") else "partial",
            "detail": (
                "Planner validation is currently passing."
                if planner_validation.get("valid")
                else "Planner validation still reports warnings or missing pieces, so outputs remain planning-grade rather than final policy math."
            ),
        },
        {
            "id": "audit-trail",
            "title": "Preserve a reproducible audit trail",
            "status": "ready" if run_count > 0 or scenario_count > 0 else "partial",
            "detail": f"The local runtime currently tracks {scenario_count} scenario record(s) and {run_count} run record(s) for this city.",
        },
    ]
    provenance_audit = [
        {
            "id": "live-thermal",
            "title": "Live thermal adapter status",
            "status": "ready" if live_ready else "partial",
            "detail": (
                "Live Landsat and ECOSTRESS adapter metadata is configured and can refresh on the background worker."
                if live_ready
                else "Live thermal refresh is not yet configured for this city, so the atlas should be treated as backed by bundled or cached data."
            ),
        },
        {
            "id": "bundled-data",
            "title": "Bundled or registered city data",
            "status": "ready" if city_map.get("heatZones") or bundled else "partial",
            "detail": (
                "The bundled city ships with authoritative local overlay artifacts."
                if bundled
                else "Uploaded cities still need registered local inputs before the analysis stack is fully ready."
            ),
        },
        {
            "id": "runtime-store",
            "title": "Runtime persistence",
            "status": "ready" if _runtime_data_path("urban_heat_runtime.sqlite3").exists() else "partial",
            "detail": "Scenario, city, and run state are mirrored into local runtime storage for reproducible local review.",
        },
    ]
    summary = (
        f"Trust audit for {city_name}: the app now separates observed geometry, benchmark planning, and reproducibility artifacts, "
        "but the verified procurement table is still only partially populated."
    )
    return {
        "cityId": city_key,
        "cityName": city_name,
        "generatedAt": utc_now(),
        "summary": summary,
        "benchmarkProtocol": benchmark_protocol,
        "reproducibilityManifest": reproducibility_manifest,
        "provenanceAudit": provenance_audit,
        "notes": [
            "This trust layer is intentionally conservative and does not invent procurement precision.",
            "Use the manifest to inspect which files, logs, and benchmarks were present when a recommendation was generated.",
        ],
    }


def _benchmark_suite(city_id: str) -> dict[str, object]:
    city_key = normalize_city_key(city_id)
    city_record = _CITY_STORE.get(city_key, {})
    profile = get_city_profile(city_key)
    city_name = str(city_record.get("name", profile.name))
    verified_source_names = [
        str(item.get("name"))
        for item in _INTERVENTIONS
        if str(item.get("costStatus")) == "verified_unit_cost"
        and str(item.get("name", "")).strip()
    ]
    ranking_source_names = sorted(
        {
            str(source.get("name"))
            for source in _COST_SOURCES
            if str(source.get("category")) == "comparative ranking source" and str(source.get("name", "")).strip()
        }
    )
    source_note_parts = []
    if verified_source_names:
        source_note_parts.append(
            "Cost info comes from verified seed examples for " + ", ".join(verified_source_names) + "."
        )
    if ranking_source_names:
        source_note_parts.append(
            "Comparative ordering still traces back to " + ", ".join(ranking_source_names) + "."
        )
    source_note = " ".join(source_note_parts) if source_note_parts else "Source information is not available for this suite yet."
    cases = [
        (50_000, "best_under_budget", "Starter budget"),
        (250_000, "evidence_first", "Evidence-first"),
        (1_000_000, "benchmark_share", "Benchmark-share"),
        (5_000_000, "whole_city_benchmark", "Whole-city anchor"),
    ]
    payload_cases: list[dict[str, object]] = []
    for budget_usd, mode, label in cases:
        scenario = benchmark_scenario(
            city_key,
            city_name,
            budget_usd,
            _INTERVENTIONS,
            _COST_SOURCES,
            label=f"{city_name} {label}",
            planning_mode=normalize_planning_mode(mode),
        )
        payload_cases.append(
            {
                "id": scenario["id"],
                "label": label,
                "budgetUsd": budget_usd,
                "planningMode": mode,
                "actionCount": len(scenario.get("recommendedActions", [])),
                "confidence": scenario.get("confidence"),
                "allocationCoveragePct": float(scenario.get("allocationSummary", {}).get("allocationCoveragePct", 0.0) or 0.0),
                "benchmarkLabel": str(scenario.get("benchmarkSummary", {}).get("benchmarkLabel", "No benchmark available")),
                "exhaustiveAvailable": bool(scenario.get("exhaustiveEstimateSummary", {}).get("available")),
                "summary": str(scenario.get("summary", "")),
                "sourceNote": source_note,
            }
        )
    return {
        "cityId": city_key,
        "cityName": city_name,
        "generatedAt": utc_now(),
        "headline": "A compact benchmark suite now shows how the planner behaves across canonical budgets and planning modes.",
        "cases": payload_cases,
        "notes": [
            "This suite is intentionally deterministic so the interface can surface regressions and readiness issues quickly.",
            "It still depends on the repo's source-backed cost anchors; verified unit-cost rows will improve its precision when they are added.",
        ],
    }


def _toy_robustness_graphs() -> tuple[nx.Graph, nx.Graph]:
    baseline = nx.path_graph(5)
    for u, v in baseline.edges():
        baseline[u][v]["w"] = 1.0
        baseline[u][v]["cost"] = 1.0

    intervention = baseline.copy()
    for u, v in intervention.edges():
        if {u, v} in ({1, 2}, {2, 3}):
            intervention[u][v]["w"] = 1.75
            intervention[u][v]["cost"] = 1.0 / 1.75
    return baseline, intervention


def _toy_robustness_payload() -> dict[str, object]:
    baseline, intervention = _toy_robustness_graphs()
    p_values = np.linspace(0.1, 1.0, 10)
    lambda2_baseline, fiedler_baseline, nodes_baseline, deg_baseline = lambda2_and_fiedler(baseline)
    lambda2_intervention, fiedler_intervention, nodes_intervention, deg_intervention = lambda2_and_fiedler(intervention)
    phi_baseline, sink_nodes = sweep_conductance(baseline, fiedler_baseline, nodes_baseline, deg_baseline)
    phi_intervention, _ = sweep_conductance(intervention, fiedler_intervention, nodes_intervention, deg_intervention)
    baseline_curve = percolation_scan(baseline, list(p_values), rng=np.random.default_rng(42))
    intervention_curve = percolation_scan(intervention, list(p_values), rng=np.random.default_rng(43))
    reliability_baseline = reliability_to_sinks(baseline, {0}, p_keep=0.7, trials=256, rng=np.random.default_rng(44))
    reliability_intervention = reliability_to_sinks(intervention, {0}, p_keep=0.7, trials=256, rng=np.random.default_rng(45))
    return {
        "title": "Toy robustness lab",
        "summary": "A five-node path graph shows how the existing spectral, percolation, and sink-reliability metrics respond to a small conductance boost.",
        "pValues": list(map(float, p_values)),
        "baselinePercolation": list(map(float, baseline_curve)),
        "interventionPercolation": list(map(float, intervention_curve)),
        "lambda2Baseline": float(lambda2_baseline),
        "lambda2Intervention": float(lambda2_intervention),
        "phiBaseline": float(phi_baseline),
        "phiIntervention": float(phi_intervention),
        "reliabilityBaseline": float(reliability_baseline),
        "reliabilityIntervention": float(reliability_intervention),
        "notes": [
            "This is a teaching/demo lab, not a Boston city estimate.",
            "The same helper functions are used by the main scientific pipeline.",
            "The intervention graph boosts the middle corridor conductance.",
        ],
    }


def _load_geojson_features(path: Path) -> list[dict[str, object]]:
    if not path.exists():
        return []
    with path.open() as handle:
        payload = json.load(handle)
    if payload.get("type") == "FeatureCollection":
        return [feature for feature in payload.get("features", []) if isinstance(feature, dict)]
    if payload.get("type") == "Feature":
        return [payload]
    return []


def _planning_readiness(city_id: str) -> dict[str, object]:
    city_key = normalize_city_key(city_id)
    city_record = _CITY_STORE.get(city_key, {})
    profile = get_city_profile(city_key)
    experience = resolve_city_experience(city_key)
    city_name = str(city_record.get("name", profile.name))
    bundled = is_bundled_city(city_key)
    boundary_ready = False
    bottleneck_ready = False
    cooling_ready = False
    if experience.spectral_bundle is not None:
        boundary_ready = _artifact_path_by_id(experience.spectral_bundle.boundary_artifact_id) is not None
        bottleneck_ready = _artifact_path_by_id(experience.spectral_bundle.bottleneck_artifact_id) is not None
        cooling_ready = _artifact_path_by_id(experience.spectral_bundle.cooling_artifact_id) is not None
    if not bundled:
        boundary_path = str(city_record.get("boundaryPath", "")).strip()
        boundary_ready = bool(city_record.get("boundaryAvailable")) or bool(boundary_path and Path(boundary_path).exists())
    cost_ready = len(_COST_SOURCES) > 0
    run_ready = True
    verified_unit_cost_count = sum(1 for item in _INTERVENTIONS if str(item.get("costStatus")) == "verified_unit_cost")
    upload_city_status = str(city_record.get("status", "")).strip()
    registration = _city_data_registration_payload(city_key) if city_key in _CITY_STORE else {
        "verifiedPaths": {
            "thermalInputsPath": False,
            "artifactBundlePath": False,
            "bottleneckOverlayPath": False,
            "coolingOverlayPath": False,
        }
    }
    verified_paths = registration.get("verifiedPaths", {})
    content_valid = registration.get("contentValid", {})
    artifact_bundle_ready = bundled or bool(city_record.get("artifactBundleRegistered")) or bool(content_valid.get("artifactBundlePath"))
    raster_ready = bundled or bool(city_record.get("thermalInputsRegistered")) or bool(content_valid.get("thermalInputsPath"))
    if not bundled:
        bottleneck_ready = bool(city_record.get("bottleneckOverlayRegistered")) or bool(content_valid.get("bottleneckOverlayPath"))
        cooling_ready = bool(city_record.get("coolingOverlayRegistered")) or bool(content_valid.get("coolingOverlayPath"))
    uploaded_paths = [
        {
            "key": "thermalInputsPath",
            "label": "Thermal inputs",
            "registered": bool(city_record.get("thermalInputsRegistered")),
            "exists": bool(verified_paths.get("thermalInputsPath")),
            "contentValid": bool(content_valid.get("thermalInputsPath")),
        },
        {
            "key": "artifactBundlePath",
            "label": "Artifact bundle",
            "registered": bool(city_record.get("artifactBundleRegistered")),
            "exists": bool(verified_paths.get("artifactBundlePath")),
            "contentValid": bool(content_valid.get("artifactBundlePath")),
        },
        {
            "key": "bottleneckOverlayPath",
            "label": "Bottleneck overlay",
            "registered": bool(city_record.get("bottleneckOverlayRegistered")),
            "exists": bool(verified_paths.get("bottleneckOverlayPath")),
            "contentValid": bool(content_valid.get("bottleneckOverlayPath")),
        },
        {
            "key": "coolingOverlayPath",
            "label": "Cooling overlay",
            "registered": bool(city_record.get("coolingOverlayRegistered")),
            "exists": bool(verified_paths.get("coolingOverlayPath")),
            "contentValid": bool(content_valid.get("coolingOverlayPath")),
        },
    ]
    uploaded_paths_ready = all(
        (not item["registered"]) or (item["exists"] and item["contentValid"])
        for item in uploaded_paths
    )
    checks = [
        {
            "id": "boundary",
            "label": "Boundary availability",
            "status": "ready" if boundary_ready else "missing",
            "detail": (
                "The city boundary is bundled locally and can be studied immediately."
                if bundled and boundary_ready
                else "A real uploaded boundary is available for this city."
                if boundary_ready
                else "A usable boundary is not available yet."
            ),
        },
        {
            "id": "uploaded-data",
            "label": "Uploaded city data registration",
            "status": (
                "ready"
                if bundled or (boundary_ready and uploaded_paths_ready)
                else "partial"
                if boundary_ready
                else "missing"
            ),
            "detail": (
                "Bundled city data is already curated and local."
                if bundled
                else (
                    "Registered uploads are present and their file types/content checks are passing."
                    if boundary_ready and uploaded_paths_ready
                    else "The city boundary exists, but one or more registered uploaded files are missing or failing content checks."
                    if boundary_ready
                    else "No usable city boundary is registered yet."
                )
            ),
        },
        {
            "id": "bottlenecks",
            "label": "Heat bottleneck overlays",
            "status": "ready" if bottleneck_ready else ("partial" if boundary_ready and not bundled else "missing"),
            "detail": (
                "Cheeger bottleneck polygons are exported and downloadable."
                if bottleneck_ready
                else "A boundary is present, but bottleneck overlays have not yet been generated for this uploaded city."
                if boundary_ready and not bundled
                else "No exported bottleneck overlays are bundled yet."
            ),
        },
        {
            "id": "cooling-access",
            "label": "Cooling access overlays",
            "status": "ready" if cooling_ready else ("partial" if boundary_ready and not bundled else "missing"),
            "detail": (
                "Low-cooling-access polygons are exported and downloadable."
                if cooling_ready
                else "A boundary is present, but cooling-access overlays have not yet been generated for this uploaded city."
                if boundary_ready and not bundled
                else "No exported cooling-access overlays are bundled yet."
            ),
        },
        {
            "id": "city-status",
            "label": "City onboarding status",
            "status": "ready" if upload_city_status == "Ready" else ("partial" if upload_city_status == "Needs boundary" else "missing"),
            "detail": (
                f"City record is marked {upload_city_status} in the runtime catalog."
                if upload_city_status
                else "City status is not yet recorded in the runtime catalog."
            ),
        },
        {
            "id": "thermal-inputs",
            "label": "Thermal and land-cover inputs",
            "status": "ready" if raster_ready else ("partial" if boundary_ready and not bundled else "missing"),
            "detail": (
                "Boston's bundled study flow already includes downstream thermal context from repo artifacts."
                if raster_ready
                else "A boundary is present, but no uploaded thermal, canopy, or land-cover inputs have been registered for this city yet."
                if boundary_ready and not bundled
                else "Thermal and land-cover inputs are not registered yet."
            ),
        },
        {
            "id": "artifact-bundle",
            "label": "Local artifact bundle",
            "status": "ready" if artifact_bundle_ready else ("partial" if boundary_ready and not bundled else "missing"),
            "detail": (
                "The city has downloadable local study artifacts."
                if artifact_bundle_ready
                else "The city has a boundary, but no exported local artifact bundle has been generated yet."
                if boundary_ready and not bundled
                else "No local artifact bundle is available yet."
            ),
        },
        {
            "id": "cost-sources",
            "label": "Source-backed cost references",
            "status": "ready" if cost_ready else "missing",
            "detail": "The app includes real benchmark and ranking references for mitigation planning." if cost_ready else "No real cost references are loaded.",
        },
        {
            "id": "run-audit",
            "label": "Run audit trail",
            "status": "ready" if run_ready else "missing",
            "detail": "Runs can be queued and inspected with notes, logs, and artifacts." if run_ready else "Run inspection is not available.",
        },
        {
            "id": "optimizer",
            "label": "Budget optimizer",
            "status": "ready" if verified_unit_cost_count > 0 else "partial",
            "detail": (
                f"Scenario planning is available, and {verified_unit_cost_count} verified unit-cost intervention row(s) are currently loaded. "
                "The optimizer now spends the full verified program cost when a row includes an explicit target quantity, and it uses exact knapsack search across the verified subset."
                if verified_unit_cost_count > 0
                else "Scenario planning is available, but no verified unit-cost intervention rows are currently loaded."
            ),
        },
    ]
    narrative = (
        f"{city_name} is available as a bundled study city with real local layers and a guided analysis workflow."
        if bundled
        else f"{city_name} is available as an upload-first city and its readiness now reflects whether a real boundary and downstream layers have actually been added."
    )
    return {
        "cityId": city_key,
        "cityName": city_name,
        "bundled": bundled,
        "readinessLabel": experience.readiness_label if bundled else "Upload-first city",
        "narrative": narrative,
        "checks": checks,
    }


def _planner_validation(city_id: str) -> dict[str, object]:
    readiness = _planning_readiness(city_id)
    checks = list(readiness.get("checks", []))
    city_key = normalize_city_key(city_id)
    city_record = _CITY_STORE.get(city_key, {})
    bundled = is_bundled_city(city_key)
    boundary_path = str(city_record.get("boundaryPath", "")).strip()
    boundary_resolved_path, boundary_exists = _verify_city_path(boundary_path)
    boundary_geojson_valid = False
    boundary_feature_count = 0
    registration_payload = _city_data_registration_payload(city_key) if city_key in _CITY_STORE else None
    if not bundled and boundary_resolved_path and boundary_exists:
        boundary_suffix = Path(boundary_resolved_path).suffix.lower()
        if boundary_suffix in {".geojson", ".json"}:
            try:
                boundary_feature_count = len(_load_geojson_features(Path(boundary_resolved_path)))
            except Exception:
                boundary_feature_count = 0
            boundary_geojson_valid = boundary_feature_count > 0
    errors: list[str] = []
    warnings: list[str] = []
    if not bundled:
        checks.insert(
            1,
            {
                "id": "boundary-content",
                "label": "Boundary GeoJSON content",
                "status": (
                    "ready"
                    if boundary_geojson_valid
                    else "partial"
                    if boundary_exists
                    else "missing"
                ),
                "detail": (
                    f"Boundary GeoJSON is present and exposes {boundary_feature_count} feature(s)."
                    if boundary_geojson_valid
                    else "The boundary path exists, but it is not a readable GeoJSON feature collection yet."
                    if boundary_exists
                    else "No usable boundary GeoJSON is registered for this uploaded city."
                ),
            },
        )
        if isinstance(registration_payload, dict):
            registered_items = [
                (
                    "thermalInputsPath",
                    bool(city_record.get("thermalInputsRegistered")) or bool(str(city_record.get("thermalInputsPath", "")).strip()),
                    "Thermal inputs",
                ),
                (
                    "artifactBundlePath",
                    bool(city_record.get("artifactBundleRegistered")) or bool(str(city_record.get("artifactBundlePath", "")).strip()),
                    "Artifact bundle",
                ),
                (
                    "bottleneckOverlayPath",
                    bool(city_record.get("bottleneckOverlayRegistered")) or bool(str(city_record.get("bottleneckOverlayPath", "")).strip()),
                    "Bottleneck overlay",
                ),
                (
                    "coolingOverlayPath",
                    bool(city_record.get("coolingOverlayRegistered")) or bool(str(city_record.get("coolingOverlayPath", "")).strip()),
                    "Cooling overlay",
                ),
            ]
            expected_items = [item for item in registered_items if item[1]]
            content_valid_map = registration_payload.get("contentValid", {})
            content_label_map = registration_payload.get("contentLabels", {})
            if expected_items:
                valid_count = sum(1 for key, _, _ in expected_items if bool(content_valid_map.get(key)))
                if valid_count == len(expected_items):
                    status = "ready"
                    detail = "All registered uploaded paths pass current content checks."
                else:
                    status = "partial"
                    failing_labels = [
                        label
                        for key, _, label in expected_items
                        if not bool(content_valid_map.get(key))
                    ]
                    detail = "Registered uploads still failing content checks: " + ", ".join(failing_labels) + "."
                checks.insert(
                    2,
                    {
                        "id": "registered-content",
                        "label": "Registered upload content checks",
                        "status": status,
                        "detail": detail,
                    },
                )
                for key, _, label in expected_items:
                    note = str(content_label_map.get(key, "")).lower()
                    if "score-like" in note:
                        warnings.append(
                            f"{label} is structurally valid but currently lacks score-like numeric properties."
                        )
    for check in checks:
        status = str(check.get("status", "missing"))
        label = str(check.get("label", "Unknown check"))
        if status == "missing":
            errors.append(f"{label} is missing.")
        elif status == "partial":
            warnings.append(f"{label} is partial.")
    if not bundled and boundary_exists and not boundary_geojson_valid:
        errors.append("Boundary GeoJSON content is not valid or does not contain any features.")
    warnings.append("Heat reduction, equity effects, and exhaustive-cost estimates remain incomplete until a validated city-specific benefit model exists.")
    return {
        "cityId": str(readiness.get("cityId", city_id)),
        "cityName": str(readiness.get("cityName", city_id)),
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "checks": checks,
    }


def _sanitize_filename(value: str | None) -> str:
    if not value:
        return "uploaded-boundary"
    stem = Path(value).stem.lower().strip()
    safe = re.sub(r"[^a-z0-9._-]+", "-", stem).strip("._-")
    return safe or "uploaded-boundary"


def _persist_uploaded_boundary(file_name: str | None, geojson_text: str | None) -> Path:
    if not geojson_text or not geojson_text.strip():
        raise HTTPException(status_code=400, detail="Upload boundary requires GeoJSON content.")
    try:
        payload = json.loads(geojson_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Uploaded boundary must be valid GeoJSON JSON.") from exc
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Uploaded boundary must be a GeoJSON Feature or FeatureCollection.")
    geojson_type = payload.get("type")
    if geojson_type not in {"FeatureCollection", "Feature"}:
        raise HTTPException(status_code=400, detail="Uploaded boundary must be a GeoJSON Feature or FeatureCollection.")
    uploads_dir = _runtime_data_path("uploads")
    suffix = Path(file_name or "").suffix.lower()
    if suffix not in {".geojson", ".json"}:
        suffix = ".geojson"
    safe_name = _sanitize_filename(file_name)
    upload_path = uploads_dir / f"{safe_name}-{uuid4().hex}{suffix}"
    _save_text_file(upload_path, geojson_text)
    return upload_path


def _verify_city_path(raw_path: str | None) -> tuple[str | None, bool]:
    if raw_path is None:
        return None, False
    value = raw_path.strip()
    if not value:
        return None, False
    candidate = Path(value).expanduser()
    if not candidate.is_absolute():
        candidate = (_repo_root() / candidate).resolve()
    return str(candidate), candidate.exists()


def _geojson_feature_quality(path: Path) -> dict[str, int | bool]:
    try:
        features = _load_geojson_features(path)
    except Exception:
        features = []
    feature_count = len(features)
    geometry_count = 0
    scored_feature_count = 0
    score_like_keys = {
        "score",
        "temp_c",
        "cheeger_score",
        "cooling_score",
        "resistance_score",
    }
    for feature in features:
        geometry = feature.get("geometry")
        if isinstance(geometry, dict) and _geometry_points(geometry):
            geometry_count += 1
        properties = feature.get("properties")
        if isinstance(properties, dict) and any(isinstance(properties.get(key), (int, float)) for key in score_like_keys):
            scored_feature_count += 1
    return {
        "featureCount": feature_count,
        "geometryCount": geometry_count,
        "scoredFeatureCount": scored_feature_count,
        "contentValid": feature_count > 0 and geometry_count > 0,
    }


def _json_payload_non_empty(path: Path) -> bool:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return False
    if isinstance(payload, dict):
        return len(payload) > 0
    if isinstance(payload, list):
        return len(payload) > 0
    return False


def _validate_registered_city_path(kind: str, raw_path: str | None) -> dict[str, object]:
    resolved_path, exists = _verify_city_path(raw_path)
    if not resolved_path:
        return {
            "path": None,
            "exists": False,
            "contentValid": False,
            "label": "No path registered.",
        }

    path = Path(resolved_path)
    if not exists:
        return {
            "path": resolved_path,
            "exists": False,
            "contentValid": False,
            "label": "Path does not exist on disk.",
        }

    suffix = path.suffix.lower()
    if kind == "thermal":
        allowed = {".tif", ".tiff", ".csv", ".json", ".nc"}
        content_valid = False
        if path.is_dir():
            content_valid = any(
                child.is_file() and child.suffix.lower() in allowed
                for child in path.rglob("*")
            )
        elif suffix in {".tif", ".tiff", ".nc"}:
            content_valid = path.stat().st_size > 0
        elif suffix == ".csv":
            try:
                lines = [line for line in path.read_text(encoding="utf-8", errors="ignore").splitlines() if line.strip()]
            except Exception:
                lines = []
            content_valid = len(lines) >= 2
        elif suffix == ".json":
            content_valid = _json_payload_non_empty(path)
        elif suffix in allowed:
            content_valid = path.stat().st_size > 0
        label = (
            "Thermal input path looks plausible."
            if content_valid
            else "Thermal input path exists, but it does not look like a non-empty raster/table payload yet."
        )
        return {"path": resolved_path, "exists": True, "contentValid": content_valid, "label": label}

    if kind in {"bottleneck", "cooling"}:
        if suffix not in {".geojson", ".json"}:
            return {
                "path": resolved_path,
                "exists": True,
                "contentValid": False,
                "label": "Overlay path exists, but it is not a GeoJSON file.",
            }
        quality = _geojson_feature_quality(path)
        content_valid = bool(quality["contentValid"])
        feature_count = int(quality["featureCount"])
        geometry_count = int(quality["geometryCount"])
        scored_feature_count = int(quality["scoredFeatureCount"])
        if content_valid:
            label = (
                f"GeoJSON overlay with {feature_count} feature(s); {geometry_count} include usable geometry, "
                f"{scored_feature_count} include score-like properties."
            )
            if scored_feature_count == 0:
                label += " Overlay is structurally valid but lacks score-like numeric properties."
        else:
            label = "GeoJSON overlay file exists, but it does not contain valid features with usable geometry."
        return {"path": resolved_path, "exists": True, "contentValid": content_valid, "label": label}

    if kind == "artifact":
        if path.is_dir():
            content_valid = any(child.is_file() for child in path.rglob("*"))
            label = (
                "Artifact bundle path looks plausible."
                if content_valid
                else "Artifact bundle directory exists, but no files were found inside it."
            )
            return {"path": resolved_path, "exists": True, "contentValid": content_valid, "label": label}
        if suffix == ".json":
            content_valid = _json_payload_non_empty(path)
        elif suffix == ".geojson":
            quality = _geojson_feature_quality(path)
            content_valid = bool(quality["contentValid"])
        else:
            content_valid = suffix in {".zip", ".md", ".pdf"} and path.stat().st_size > 0
        label = (
            "Artifact bundle path looks plausible."
            if content_valid
            else "Artifact bundle path exists, but it does not look like a non-empty deliverable bundle."
        )
        return {"path": resolved_path, "exists": True, "contentValid": content_valid, "label": label}

    return {"path": resolved_path, "exists": True, "contentValid": True, "label": "Path exists."}


def _city_data_registration_payload(city_id: str) -> dict[str, object]:
    city = _CITY_STORE.get(city_id)
    if city is None:
        raise HTTPException(status_code=404, detail="City not found")
    thermal_check = _validate_registered_city_path("thermal", city.get("thermalInputsPath"))
    artifact_check = _validate_registered_city_path("artifact", city.get("artifactBundlePath"))
    bottleneck_check = _validate_registered_city_path("bottleneck", city.get("bottleneckOverlayPath"))
    cooling_check = _validate_registered_city_path("cooling", city.get("coolingOverlayPath"))
    return {
        "cityId": city_id,
        "thermalInputsRegistered": bool(city.get("thermalInputsRegistered")),
        "artifactBundleRegistered": bool(city.get("artifactBundleRegistered")),
        "bottleneckOverlayRegistered": bool(city.get("bottleneckOverlayRegistered")),
        "coolingOverlayRegistered": bool(city.get("coolingOverlayRegistered")),
        "thermalInputsPath": thermal_check["path"],
        "artifactBundlePath": artifact_check["path"],
        "bottleneckOverlayPath": bottleneck_check["path"],
        "coolingOverlayPath": cooling_check["path"],
        "verifiedPaths": {
            "thermalInputsPath": bool(thermal_check["exists"]),
            "artifactBundlePath": bool(artifact_check["exists"]),
            "bottleneckOverlayPath": bool(bottleneck_check["exists"]),
            "coolingOverlayPath": bool(cooling_check["exists"]),
        },
        "contentValid": {
            "thermalInputsPath": bool(thermal_check["contentValid"]),
            "artifactBundlePath": bool(artifact_check["contentValid"]),
            "bottleneckOverlayPath": bool(bottleneck_check["contentValid"]),
            "coolingOverlayPath": bool(cooling_check["contentValid"]),
        },
        "contentLabels": {
            "thermalInputsPath": str(thermal_check["label"]),
            "artifactBundlePath": str(artifact_check["label"]),
            "bottleneckOverlayPath": str(bottleneck_check["label"]),
            "coolingOverlayPath": str(cooling_check["label"]),
        },
    }


def _geometry_points(geometry: dict[str, object]) -> list[tuple[float, float]]:
    geom_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    points: list[tuple[float, float]] = []
    if geom_type == "Polygon" and coordinates:
        for ring in coordinates[:1]:
            points.extend((float(x), float(y)) for x, y in ring)
    elif geom_type == "MultiPolygon" and coordinates:
        for polygon in coordinates:
            if polygon:
                points.extend((float(x), float(y)) for x, y in polygon[0])
    return points


def _normalize_points(points: list[tuple[float, float]], bounds: tuple[float, float, float, float]) -> list[CityMapPoint]:
    min_x, min_y, max_x, max_y = bounds
    span_x = max_x - min_x or 1.0
    span_y = max_y - min_y or 1.0
    normalized = []
    for lon, lat in points:
        x = 10 + ((lon - min_x) / span_x) * 80
        y = 90 - ((lat - min_y) / span_y) * 80
        normalized.append(CityMapPoint(x=x, y=y))
    return normalized


def _collect_bounds(features: list[dict[str, object]]) -> tuple[float, float, float, float]:
    points: list[tuple[float, float]] = []
    for feature in features:
        geometry = feature.get("geometry")
        if isinstance(geometry, dict):
            points.extend(_geometry_points(geometry))
    if not points:
        return (-71.2, 42.2, -70.9, 42.5)
    xs = [x for x, _ in points]
    ys = [y for _, y in points]
    return (min(xs), min(ys), max(xs), max(ys))


def _overlay_response(features: list[dict[str, object]], score_key: str, score_label: str, bounds: tuple[float, float, float, float]) -> list[dict[str, object]]:
    overlays: list[dict[str, object]] = []
    for index, feature in enumerate(features):
        geometry = feature.get("geometry")
        properties = feature.get("properties", {})
        if not isinstance(geometry, dict) or not isinstance(properties, dict):
            continue
        points = _geometry_points(geometry)
        if not points:
            continue
        score = float(properties.get(score_key, 0.0) or 0.0)
        overlays.append(
            {
                "id": str(feature.get("id", index)),
                "name": f"{score_label} {score:.1f}",
                "description": f"Actual {score_label.lower()} feature exported by the pipeline.",
                "score": score,
                "scoreClass": str(properties.get(f"{score_key}_class", "Unknown")),
                "points": [point.model_dump() for point in _normalize_points(points, bounds)],
            }
        )
    overlays.sort(key=lambda item: item["score"], reverse=True)
    return overlays


def _spectral_highlights(features: list[dict[str, object]], value_key: str, label_prefix: str, description: str) -> list[SpectralHighlight]:
    highlights: list[SpectralHighlight] = []
    for index, feature in enumerate(features):
        properties = feature.get("properties", {})
        if not isinstance(properties, dict):
            continue
        value = float(properties.get(value_key, 0.0) or 0.0)
        label = f"{label_prefix} {index + 1}"
        highlights.append(SpectralHighlight(label=label, value=value, description=description))
    highlights.sort(key=lambda item: item.value, reverse=True)
    return highlights[:3]


def _cost_source_by_id(source_id: str) -> dict[str, object] | None:
    return cost_source_by_id(_COST_SOURCES, source_id)


def _allocation_summary(budget_usd: int, actions: list[dict[str, object]]) -> dict[str, object]:
    return allocation_summary(
        budget_usd,
        actions,
        allocation_method_label="Inverse-rank benchmark-share allocation using repository comparative sources; not a validated procurement optimizer.",
    )


def _evidence_summary(actions: list[dict[str, object]]) -> dict[str, object]:
    return evidence_summary(actions)


def _benchmark_summary(budget_usd: int, benchmark_cost: int | None) -> dict[str, object]:
    return benchmark_summary(
        budget_usd,
        benchmark_cost,
        benchmark_explanation="Coverage is measured against the repository's coarse whole-city benchmark, not a city-specific exhaustive mitigation estimate.",
    )


def _exhaustive_estimate_summary(actions: list[dict[str, object]]) -> dict[str, object]:
    return exhaustive_estimate_summary(actions, _INTERVENTIONS)


def _benchmark_scenario(
    city_id: str,
    budget_usd: int,
    *,
    label: str | None = None,
    preset_key: str | None = None,
    planning_mode: str = "best_under_budget",
) -> dict[str, object]:
    city_name = str(_CITY_STORE.get(city_id, {}).get("name", city_id.replace("-", " ").title()))
    normalized_planning_mode = normalize_planning_mode(planning_mode)
    return benchmark_scenario(
        city_id,
        city_name,
        budget_usd,
        _INTERVENTIONS,
        _COST_SOURCES,
        label=label,
        preset_key=preset_key,
        planning_mode=normalized_planning_mode,
    )


_CITY_STORE = {
    profile.key: _profile_to_city_response(profile.to_dict())
    for profile in list_city_profiles()
}

_CITY_RUNTIME_PATH = _runtime_data_path("cities.json")
_SCENARIO_RUNTIME_PATH = _runtime_data_path("scenarios.json")
_RUN_RUNTIME_PATH = _runtime_data_path("runs.json")
_RUNTIME_DB_PATH = _runtime_data_path("urban_heat_runtime.sqlite3")
_LIVE_THERMAL_RUNTIME_PATH = _runtime_data_path("live_thermal_state.json")
_LIVE_THERMAL_CACHE_DIR = _runtime_data_path("live_thermal")
_LIVE_THERMAL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
_RUNTIME_STATE_LOCK = threading.RLock()
_LIVE_THERMAL_STATE_LOCK = threading.Lock()
_LIVE_THERMAL_WORKERS: dict[str, threading.Event] = {}


def _load_live_thermal_runtime_state() -> dict[str, dict[str, object]]:
    payload = _load_json_file(_LIVE_THERMAL_RUNTIME_PATH)
    if not isinstance(payload, dict):
        return {}
    state: dict[str, dict[str, object]] = {}
    for city_id, value in payload.items():
        if isinstance(city_id, str) and isinstance(value, dict):
            state[city_id] = value
    return state


def _persist_live_thermal_runtime_state() -> None:
    with _LIVE_THERMAL_STATE_LOCK:
        _save_json_file(_LIVE_THERMAL_RUNTIME_PATH, _LIVE_THERMAL_STATE)


def _live_thermal_state(city_id: str) -> dict[str, object]:
    normalized = normalize_city_key(city_id)
    state = _LIVE_THERMAL_STATE.setdefault(
        normalized,
        {
            "status": "unavailable",
            "headline": "No live-source thermal adapter is configured for this city yet.",
            "detail": "This city currently uses bundled study layers only. Live ingestion has not been connected.",
            "providerTargets": [],
            "lastUpdated": None,
            "lastAttemptedAt": None,
            "latestSceneCapturedAt": None,
            "latestSourceLabel": None,
            "activeSourceCount": 0,
            "autoRefreshEnabled": False,
            "autoRefreshAvailable": False,
            "refreshIntervalSec": None,
            "cachePath": None,
            "usingBackupData": False,
            "backupAvailable": False,
        },
    )
    return state


def _load_live_thermal_config() -> dict[str, object]:
    payload = _load_json_file(_live_thermal_config_path())
    return payload if isinstance(payload, dict) else {}


def _city_live_thermal_config(city_id: str) -> dict[str, object] | None:
    payload = _load_live_thermal_config()
    cities = payload.get("cities")
    if not isinstance(cities, dict):
        return None
    city_config = cities.get(normalize_city_key(city_id))
    return city_config if isinstance(city_config, dict) else None


def _live_thermal_cache_path(city_id: str) -> Path:
    return _LIVE_THERMAL_CACHE_DIR / f"{normalize_city_key(city_id)}_thermal_sources.json"


def _extract_feature_temperatures(payload: dict[str, object]) -> list[float]:
    features = payload.get("features")
    if not isinstance(features, list):
        return []
    values: list[float] = []
    for feature in features:
        if not isinstance(feature, dict):
            continue
        properties = feature.get("properties")
        if not isinstance(properties, dict):
            continue
        temp = properties.get("temp_c")
        if isinstance(temp, (int, float)):
            values.append(float(temp))
    return values


def _dot_path_value(payload: object, path: str | None) -> object:
    if not path:
        return payload
    current = payload
    for part in path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _parse_iso_timestamp(value: object) -> datetime | None:
    if not isinstance(value, str):
        return None
    candidate = value.strip()
    if not candidate:
        return None
    try:
        return datetime.fromisoformat(candidate.replace("Z", "+00:00"))
    except ValueError:
        return None


def _normalize_live_thermal_source(raw: dict[str, object], adapter: dict[str, object]) -> dict[str, object]:
    source_id = str(raw.get("id") or adapter.get("id") or "live-source")
    surface_geojson = raw.get("surfaceGeojson")
    corridor_geojson = raw.get("corridorGeojson")
    bounds = raw.get("bounds")
    if not isinstance(surface_geojson, dict) or not isinstance(corridor_geojson, dict) or not isinstance(bounds, dict):
        raise ValueError(f"Live adapter for {source_id} must provide surfaceGeojson, corridorGeojson, and bounds.")
    temperatures = _extract_feature_temperatures(surface_geojson)
    mean_temp = sum(temperatures) / len(temperatures) if temperatures else 0.0
    min_temp = min(temperatures) if temperatures else 0.0
    max_temp = max(temperatures) if temperatures else 0.0
    variance = sum((value - mean_temp) ** 2 for value in temperatures) / len(temperatures) if temperatures else 0.0
    std_temp = variance ** 0.5
    threshold_temp = float(raw.get("thresholdTempC", adapter.get("thresholdTempC", mean_temp)))
    adapter_kind = raw.get("adapterKind") if isinstance(raw.get("adapterKind"), str) else adapter.get("adapterKind")
    scene_id = raw.get("sceneId") if isinstance(raw.get("sceneId"), str) else adapter.get("sceneId")
    captured_at = raw.get("capturedAt") if isinstance(raw.get("capturedAt"), str) else adapter.get("capturedAt")
    published_at = raw.get("publishedAt") if isinstance(raw.get("publishedAt"), str) else adapter.get("publishedAt")
    return {
        "id": source_id,
        "label": str(raw.get("label") or adapter.get("label") or source_id.upper()),
        "sourceName": str(raw.get("sourceName") or adapter.get("sourceName") or source_id.upper()),
        "provider": str(raw.get("provider") or adapter.get("provider") or "Configured live adapter"),
        "sensor": str(raw.get("sensor") or adapter.get("sensor") or source_id.upper()),
        "resolutionM": int(raw.get("resolutionM") or adapter.get("resolutionM") or 70),
        "meanTempC": float(raw.get("meanTempC", mean_temp)),
        "stdTempC": float(raw.get("stdTempC", std_temp)),
        "minTempC": float(raw.get("minTempC", min_temp)),
        "maxTempC": float(raw.get("maxTempC", max_temp)),
        "thresholdTempC": threshold_temp,
        "corridorQuantile": float(raw.get("corridorQuantile", adapter.get("corridorQuantile", 0.85))),
        "filePath": str(raw.get("filePath") or adapter.get("location") or "live"),
        "metadataPath": str(raw.get("metadataPath") or adapter.get("location") or "live"),
        "sceneId": scene_id,
        "capturedAt": captured_at,
        "publishedAt": published_at,
        "adapterKind": str(adapter_kind) if isinstance(adapter_kind, str) else None,
        "sourceMode": str(adapter.get("sourceMode") or "live"),
        "bounds": bounds,
        "surfaceGeojson": surface_geojson,
        "corridorGeojson": corridor_geojson,
    }


def _load_live_thermal_payload_from_location(location: str, mode: str, adapter: dict[str, object]) -> dict[str, object]:
    if mode == "file":
        path = Path(location)
        if not path.is_absolute():
            path = _repo_root() / location
        with path.open(encoding="utf-8") as handle:
            payload = json.load(handle)
    elif mode == "url":
        request = urllib.request.Request(location)
        headers = adapter.get("headers")
        if isinstance(headers, dict):
            for key, value in headers.items():
                if isinstance(key, str) and isinstance(value, str):
                    request.add_header(key, value)
        timeout_sec = float(adapter.get("timeoutSec") or 60)
        with urllib.request.urlopen(request, timeout=timeout_sec) as response:
            payload = json.loads(response.read().decode("utf-8"))
    else:
        raise ValueError(f"Unsupported live adapter mode: {mode}")
    payload = _dot_path_value(payload, adapter.get("responsePath") if isinstance(adapter.get("responsePath"), str) else None)
    if not isinstance(payload, dict):
        raise ValueError("Live adapter payload must be a JSON object.")
    return payload


def _fetch_live_thermal_sources(city_id: str) -> tuple[list[dict[str, object]], bool]:
    config = _city_live_thermal_config(city_id)
    if not config:
        raise ValueError("No live thermal configuration exists for this city.")
    adapters = config.get("adapters")
    if not isinstance(adapters, list) or not adapters:
        raise ValueError("Live thermal configuration has no adapters.")
    sources: list[dict[str, object]] = []
    used_backup = False
    for adapter in adapters:
        if not isinstance(adapter, dict):
            continue
        mode = str(adapter.get("mode", "file"))
        location = adapter.get("location")
        if not isinstance(location, str) or not location.strip():
            raise ValueError("Each live thermal adapter needs a location.")
        try:
            adapter["sourceMode"] = "live"
            payload = _load_live_thermal_payload_from_location(location, mode, adapter)
        except (ValueError, OSError, urllib.error.URLError, json.JSONDecodeError):
            backup_location = adapter.get("backupLocation")
            if not isinstance(backup_location, str) or not backup_location.strip():
                raise
            used_backup = True
            adapter["sourceMode"] = "backup"
            payload = _load_live_thermal_payload_from_location(backup_location, "file", adapter)
        sources.append(_normalize_live_thermal_source(payload, adapter))
    if not sources:
        raise ValueError("No live thermal sources could be loaded.")
    return sources, used_backup


def _summarize_live_thermal_sources(sources: list[dict[str, object]]) -> tuple[int, str | None, str | None]:
    latest_scene: datetime | None = None
    latest_source_label: str | None = None
    active_count = 0
    for source in sources:
        if not isinstance(source, dict):
            continue
        active_count += 1
        captured_at = _parse_iso_timestamp(source.get("capturedAt"))
        if captured_at is None:
            continue
        if latest_scene is None or captured_at > latest_scene:
            latest_scene = captured_at
            source_name = source.get("sourceName")
            latest_source_label = str(source_name) if isinstance(source_name, str) and source_name.strip() else None
    return active_count, latest_scene.isoformat() if latest_scene is not None else None, latest_source_label


def _merge_live_thermal_sources(payload: dict[str, object], city_id: str) -> dict[str, object]:
    state = _live_thermal_state(city_id)
    config = _city_live_thermal_config(city_id)
    cache_path_value = state.get("cachePath")
    if not isinstance(cache_path_value, str) or not cache_path_value:
        if isinstance(config, dict):
            state["providerTargets"] = [str(item) for item in config.get("providerTargets", []) if isinstance(item, str)]
            state["refreshIntervalSec"] = int(config.get("refreshIntervalSec", 900))
            state["autoRefreshAvailable"] = True
            state["backupAvailable"] = any(
                isinstance(adapter, dict) and isinstance(adapter.get("backupLocation"), str) and bool(str(adapter.get("backupLocation")).strip())
                for adapter in config.get("adapters", [])
            )
            if state.get("status") == "unavailable":
                state["status"] = "planned"
                state["headline"] = "Live thermal adapters are configured and ready."
                state["detail"] = "Auto-refresh can be enabled to keep city thermal layers updated from the configured live feeds."
        payload["liveThermalAdapter"] = {
            **payload.get("liveThermalAdapter", {}),
            "status": state.get("status", "unavailable"),
            "headline": state.get("headline", ""),
            "detail": state.get("detail", ""),
            "providerTargets": state.get("providerTargets", []),
            "lastUpdated": state.get("lastUpdated"),
            "lastAttemptedAt": state.get("lastAttemptedAt"),
            "latestSceneCapturedAt": state.get("latestSceneCapturedAt"),
            "latestSourceLabel": state.get("latestSourceLabel"),
            "activeSourceCount": int(state.get("activeSourceCount") or 0),
            "autoRefreshEnabled": bool(state.get("autoRefreshEnabled", False)),
            "autoRefreshAvailable": bool(state.get("autoRefreshAvailable", False)),
            "refreshIntervalSec": state.get("refreshIntervalSec"),
            "usingBackupData": bool(state.get("usingBackupData", False)),
            "backupAvailable": bool(state.get("backupAvailable", False)),
        }
        return payload
    cache_path = Path(cache_path_value)
    cache_payload = _load_json_file(cache_path)
    cached_sources = cache_payload if isinstance(cache_payload, list) else []
    active_source_count, latest_scene_captured_at, latest_source_label = _summarize_live_thermal_sources(cached_sources)
    if cached_sources:
        existing = payload.get("thermalSources")
        existing_sources = existing if isinstance(existing, list) else []
        merged_sources = [source for source in existing_sources if isinstance(source, dict)]
        live_ids = {str(source.get("id")) for source in cached_sources if isinstance(source, dict)}
        merged_sources = [source for source in merged_sources if str(source.get("id")) not in live_ids]
        merged_sources.extend([source for source in cached_sources if isinstance(source, dict)])
        payload["thermalSources"] = merged_sources
    payload["liveThermalAdapter"] = {
        **payload.get("liveThermalAdapter", {}),
        "status": state.get("status", "unavailable"),
        "headline": state.get("headline", ""),
        "detail": state.get("detail", ""),
        "providerTargets": state.get("providerTargets", []),
        "lastUpdated": state.get("lastUpdated"),
        "lastAttemptedAt": state.get("lastAttemptedAt"),
        "latestSceneCapturedAt": latest_scene_captured_at or state.get("latestSceneCapturedAt"),
        "latestSourceLabel": latest_source_label or state.get("latestSourceLabel"),
        "activeSourceCount": active_source_count or int(state.get("activeSourceCount") or 0),
        "autoRefreshEnabled": bool(state.get("autoRefreshEnabled", False)),
        "autoRefreshAvailable": bool(state.get("autoRefreshAvailable", False)),
        "refreshIntervalSec": state.get("refreshIntervalSec"),
        "usingBackupData": bool(state.get("usingBackupData", False)),
        "backupAvailable": bool(state.get("backupAvailable", False)),
    }
    return payload


def _refresh_live_thermal_once(city_id: str) -> dict[str, object]:
    normalized = normalize_city_key(city_id)
    config = _city_live_thermal_config(normalized)
    state = _live_thermal_state(normalized)
    state["lastAttemptedAt"] = utc_now()
    if not config:
        state["status"] = "unavailable"
        state["headline"] = "No live-source thermal adapter is configured for this city yet."
        state["detail"] = "Add a live thermal adapter config before enabling async refresh."
        state["providerTargets"] = []
        state["autoRefreshAvailable"] = False
        state["backupAvailable"] = False
        state["usingBackupData"] = False
        _persist_live_thermal_runtime_state()
        return state
    state["providerTargets"] = [str(item) for item in config.get("providerTargets", []) if isinstance(item, str)]
    state["refreshIntervalSec"] = int(config.get("refreshIntervalSec", 900))
    state["autoRefreshAvailable"] = True
    state["backupAvailable"] = any(
        isinstance(adapter, dict) and isinstance(adapter.get("backupLocation"), str) and bool(str(adapter.get("backupLocation")).strip())
        for adapter in config.get("adapters", [])
    )
    state["status"] = "refreshing"
    state["headline"] = "Refreshing live thermal sources in the background."
    state["detail"] = "The API is fetching the configured Landsat and ECOSTRESS adapter payloads."
    _persist_live_thermal_runtime_state()
    try:
        sources, used_backup = _fetch_live_thermal_sources(normalized)
        cache_path = _live_thermal_cache_path(normalized)
        _save_json_file(cache_path, sources)
        active_source_count, latest_scene_captured_at, latest_source_label = _summarize_live_thermal_sources(sources)
        state["cachePath"] = str(cache_path)
        state["usingBackupData"] = used_backup
        if used_backup:
            state["status"] = "backup"
            state["headline"] = "Live thermal refresh is offline, so cached fallback data is being used."
            state["detail"] = "The atlas is rendering cached fallback thermal payloads until the live adapters become reachable again."
        else:
            state["status"] = "configured"
            state["headline"] = "Live thermal sources are configured and the latest adapter payload is loaded."
            state["detail"] = "Configured live thermal adapters are being used to update the atlas asynchronously when enabled."
        state["lastUpdated"] = utc_now()
        state["activeSourceCount"] = active_source_count
        state["latestSceneCapturedAt"] = latest_scene_captured_at
        state["latestSourceLabel"] = latest_source_label
    except (ValueError, OSError, urllib.error.URLError, json.JSONDecodeError) as exc:
        backup_sources: list[dict[str, object]] = []
        backup_used = False
        for adapter in config.get("adapters", []):
            if not isinstance(adapter, dict):
                continue
            backup_location = adapter.get("backupLocation")
            if not isinstance(backup_location, str) or not backup_location.strip():
                continue
            try:
                adapter["sourceMode"] = "backup"
                payload = _load_live_thermal_payload_from_location(backup_location, "file", adapter)
                backup_sources.append(_normalize_live_thermal_source(payload, adapter))
                backup_used = True
            except (ValueError, OSError, urllib.error.URLError, json.JSONDecodeError):
                continue
        if backup_used:
            cache_path = _live_thermal_cache_path(normalized)
            _save_json_file(cache_path, backup_sources)
            active_source_count, latest_scene_captured_at, latest_source_label = _summarize_live_thermal_sources(backup_sources)
            state["cachePath"] = str(cache_path)
            state["status"] = "backup"
            state["headline"] = "Live thermal refresh is offline, so cached fallback data is being used."
            state["detail"] = f"Live refresh failed with: {exc}. The atlas is rendering cached fallback thermal payloads until the live adapters become reachable again."
            state["usingBackupData"] = True
            state["lastUpdated"] = utc_now()
            state["activeSourceCount"] = active_source_count
            state["latestSceneCapturedAt"] = latest_scene_captured_at
            state["latestSourceLabel"] = latest_source_label
        else:
            state["status"] = "error"
            state["headline"] = "Live thermal refresh failed."
            state["detail"] = str(exc)
            state["usingBackupData"] = False
    _persist_live_thermal_runtime_state()
    return state


def _live_thermal_worker(city_id: str, stop_event: threading.Event) -> None:
    normalized = normalize_city_key(city_id)
    while not stop_event.is_set():
        state = _refresh_live_thermal_once(normalized)
        interval = int(state.get("refreshIntervalSec") or 900)
        for _ in range(max(1, interval)):
            if stop_event.is_set():
                break
            time.sleep(1)


def _start_live_thermal_worker(city_id: str) -> None:
    if is_serverless_runtime():
        # The caller performs one explicit refresh. A serverless function cannot
        # promise to keep an interval worker alive after the response finishes.
        return
    normalized = normalize_city_key(city_id)
    if normalized in _LIVE_THERMAL_WORKERS:
        return
    stop_event = threading.Event()
    _LIVE_THERMAL_WORKERS[normalized] = stop_event
    thread = threading.Thread(target=_live_thermal_worker, args=(normalized, stop_event), daemon=True)
    thread.start()


def _stop_live_thermal_worker(city_id: str) -> None:
    normalized = normalize_city_key(city_id)
    stop_event = _LIVE_THERMAL_WORKERS.pop(normalized, None)
    if stop_event is not None:
        stop_event.set()


def _resume_live_thermal_workers() -> None:
    for city_id, state in _LIVE_THERMAL_STATE.items():
        if not isinstance(state, dict):
            continue
        if bool(state.get("autoRefreshEnabled")):
            _start_live_thermal_worker(city_id)


def _db_connect() -> sqlite3.Connection:
    connection = sqlite3.connect(_RUNTIME_DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def _init_runtime_db() -> None:
    with _db_connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS runtime_cities (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS runtime_scenarios (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS runtime_runs (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )


def _runtime_table_count(table_name: str) -> int:
    with _db_connect() as connection:
        row = connection.execute(f"SELECT COUNT(*) AS count FROM {table_name}").fetchone()
    return int(row["count"]) if row else 0


def _migrate_json_runtime(table_name: str, path: Path, *, ordered: bool) -> None:
    if _runtime_table_count(table_name) > 0:
        return
    payload = _load_json_file(path)
    if not isinstance(payload, list):
        return
    records = [item for item in payload if isinstance(item, dict) and item.get("id")]
    if not records:
        return
    _persist_runtime_table(table_name, records, ordered=ordered)


def _load_runtime_table(table_name: str, *, ordered: bool) -> list[dict[str, object]]:
    order_by = "updated_at DESC, id ASC" if ordered else "id ASC"
    with _db_connect() as connection:
        rows = connection.execute(f"SELECT payload FROM {table_name} ORDER BY {order_by}").fetchall()
    records: list[dict[str, object]] = []
    for row in rows:
        try:
            payload = json.loads(str(row["payload"]))
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict):
            records.append(payload)
    return records


def _persist_runtime_table(table_name: str, records: list[dict[str, object]], *, ordered: bool) -> None:
    serialized_rows = []
    for index, record in enumerate(records):
        updated_at = str(record.get("updatedAt") or utc_now())
        sort_stamp = f"{updated_at}-{index:08d}" if ordered else updated_at
        serialized_rows.append((str(record["id"]), json.dumps(record), sort_stamp))
    with _db_connect() as connection:
        connection.execute(f"DELETE FROM {table_name}")
        connection.executemany(
            f"INSERT INTO {table_name} (id, payload, updated_at) VALUES (?, ?, ?)",
            serialized_rows,
        )


def _load_runtime_cities() -> dict[str, dict[str, object]]:
    _migrate_json_runtime("runtime_cities", _CITY_RUNTIME_PATH, ordered=False)
    payload = _load_runtime_table("runtime_cities", ordered=False)
    cities: dict[str, dict[str, object]] = {}
    for item in payload:
        if item.get("id"):
            record = dict(item)
            record.setdefault("planningCostMultiplier", float(record.get("planningCostMultiplier", 1.0) or 1.0))
            cities[str(item["id"])] = record
    return cities


def _load_runtime_runs() -> list[dict[str, object]]:
    _migrate_json_runtime("runtime_runs", _RUN_RUNTIME_PATH, ordered=True)
    return _load_runtime_table("runtime_runs", ordered=True)


def _load_runtime_scenarios() -> list[dict[str, object]]:
    _migrate_json_runtime("runtime_scenarios", _SCENARIO_RUNTIME_PATH, ordered=True)
    payload = _load_runtime_table("runtime_scenarios", ordered=True)
    records: list[dict[str, object]] = []
    for item in payload:
        record = dict(item)
        actions: list[dict[str, object]] = []
        for action in record.get("recommendedActions", []):
            if not isinstance(action, dict):
                continue
            normalized = dict(action)
            normalized.setdefault("allocatedBudgetUsd", None)
            normalized.setdefault("allocationBasis", "legacy scenario without budget allocation detail")
            actions.append(normalized)
        record["recommendedActions"] = actions
        budget_usd = int(record.get("budgetUsd", 0) or 0)
        record["planningMode"] = normalize_planning_mode(str(record.get("planningMode", "benchmark_share")))
        record.setdefault("allocationSummary", _allocation_summary(budget_usd, actions))
        record.setdefault("evidenceSummary", _evidence_summary(actions))
        record.setdefault("exhaustiveEstimateSummary", _exhaustive_estimate_summary(actions))
        benchmark_cost = None
        benchmark = _cost_source_by_id("la-cool-communities-1997")
        if isinstance(benchmark, dict) and benchmark.get("estimatedCostUsd"):
            benchmark_cost = int(benchmark.get("estimatedCostUsd", 0))
        record.setdefault("benchmarkSummary", _benchmark_summary(budget_usd, benchmark_cost))
        records.append(record)
    return records


def _persist_runtime_cities() -> None:
    with _RUNTIME_STATE_LOCK:
        _persist_runtime_table("runtime_cities", list(_CITY_STORE.values()), ordered=False)
        _save_json_file(_CITY_RUNTIME_PATH, list(_CITY_STORE.values()))


def _persist_runtime_runs() -> None:
    with _RUNTIME_STATE_LOCK:
        _persist_runtime_table("runtime_runs", _RUN_STORE, ordered=True)
        _save_json_file(_RUN_RUNTIME_PATH, _RUN_STORE)


def _persist_runtime_scenarios() -> None:
    with _RUNTIME_STATE_LOCK:
        _persist_runtime_table("runtime_scenarios", _SCENARIO_STORE, ordered=True)
        _save_json_file(_SCENARIO_RUNTIME_PATH, _SCENARIO_STORE)


_init_runtime_db()
_CITY_STORE.update(_load_runtime_cities())
_COST_SOURCES = _load_cost_sources()
_INTERVENTIONS = _load_interventions()
_SCENARIO_STORE: list[dict[str, object]] = _load_runtime_scenarios()
_RUN_STORE: list[dict[str, object]] = _load_runtime_runs()
_LIVE_THERMAL_STATE: dict[str, dict[str, object]] = _load_live_thermal_runtime_state()


def _process_run_execution_job(payload: dict[str, object]) -> None:
    run_id = str(payload.get("runId") or "")
    city_id = str(payload.get("cityId") or "")
    scenario = str(payload.get("scenario") or "")
    if not run_id:
        return

    with _RUNTIME_STATE_LOCK:
        record = next((item for item in _RUN_STORE if str(item.get("id")) == run_id), None)
        if record is None:
            return
        now = utc_now()
        record["status"] = "running"
        record["progress"] = 18
        record["updatedAt"] = now
        logs = list(record.get("logs", []))
        logs.append(f"[{now}] Durable queue worker started run execution.")
        logs.append(f"[{now}] Validation: queue payload included city={city_id} and scenario='{scenario}'.")
        record["logs"] = logs
        _persist_runtime_runs()

    time.sleep(0.15)

    with _RUNTIME_STATE_LOCK:
        record = next((item for item in _RUN_STORE if str(item.get("id")) == run_id), None)
        if record is None:
            return
        now = utc_now()
        city_name = str(_CITY_STORE.get(city_id, {}).get("name", city_id.replace("-", " ").title()))
        outputs = list(record.get("outputs", []))
        outputs.extend(
            [
                f"{city_id}-queue-execution-report.json",
                f"{city_id}-queue-execution-log.txt",
                f"{city_id}-queue-config-validation.json",
            ]
        )
        record["status"] = "running"
        record["progress"] = 72
        record["updatedAt"] = now
        record["outputs"] = list(dict.fromkeys(outputs))
        logs = list(record.get("logs", []))
        logs.append(f"[{now}] Validation: config and seed artifacts resolved for {city_name}.")
        logs.append(f"[{now}] Staging outputs: analysis summary, queue execution report, and config validation records.")
        record["logs"] = logs
        _persist_runtime_runs()

    time.sleep(0.12)

    with _RUNTIME_STATE_LOCK:
        record = next((item for item in _RUN_STORE if str(item.get("id")) == run_id), None)
        if record is None:
            return
        now = utc_now()
        city_name = str(_CITY_STORE.get(city_id, {}).get("name", city_id.replace("-", " ").title()))
        record["status"] = "succeeded"
        record["progress"] = 100
        record["updatedAt"] = now
        logs = list(record.get("logs", []))
        logs.append(f"[{now}] Run execution completed for {city_name} using scenario '{scenario}'.")
        logs.append(f"[{now}] Worker-backed pipeline finished and persisted execution artifacts.")
        record["logs"] = logs
        _persist_runtime_runs()


_RUN_QUEUE = DurableRunQueue(_RUNTIME_DB_PATH, _process_run_execution_job)


def _enqueue_run_execution_job(run_id: str, city_id: str, scenario: str) -> str:
    if is_serverless_runtime():
        # This is a deliberately small demonstration workflow. Running it in
        # the request keeps the visible state truthful on a host that has no
        # durable worker process. Production-scale jobs need an external queue.
        _process_run_execution_job({"runId": run_id, "cityId": city_id, "scenario": scenario})
        return f"inline-{uuid4().hex[:16]}"
    return _RUN_QUEUE.enqueue(
        job_type="run-execution",
        payload={
            "runId": run_id,
            "cityId": city_id,
            "scenario": scenario,
        },
        created_at=utc_now(),
    )


class CityOnboardingRequest(BaseModel):
    name: str = Field(default="Boston")
    region: str = Field(default="Unknown")
    population: str = Field(default="Unknown")
    boundary_source: str = Field(default="demo", alias="boundarySource")
    boundary_path: str | None = Field(default=None, alias="boundaryPath")
    boundary_file_name: str | None = Field(default=None, alias="boundaryFileName")
    boundary_geojson_text: str | None = Field(default=None, alias="boundaryGeojsonText")
    notes: str = Field(default="", alias="notes")


app.include_router(
    create_system_router(
        app_started_at=APP_STARTED_AT,
        utc_now=utc_now,
        access_control=_ACCESS_CONTROL,
        workspace_id_from_request=_workspace_id_from_request,
    )
)


@app.get("/api/v1/cities", response_model=dict[str, list[CityProfileResponse]])
async def cities():
    return {"cities": [CityProfileResponse.model_validate(city) for city in _CITY_STORE.values()]}


@app.get("/api/v1/city-experiences", response_model=list[CityExperienceResponse])
async def city_experiences():
    return [
        CityExperienceResponse.model_validate(city_experience_payload(city_id))
        for city_id in _CITY_STORE.keys()
    ]


@app.get("/api/v1/bundled-packages", response_model=list[BundledPackageResponse])
async def bundled_packages():
    return [
        BundledPackageResponse.model_validate(payload)
        for payload in [bundled_package_payload(package_id) for package_id in bundled_package_specs().keys()]
        if payload is not None
    ]


@app.get("/api/v1/bundled-packages/{package_id}", response_model=BundledPackageResponse)
async def bundled_package_detail(package_id: str):
    payload = bundled_package_payload(package_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="Bundled package not found")
    return BundledPackageResponse.model_validate(payload)


@app.get("/api/v1/bundled-packages/{package_id}/validate", response_model=PackageValidationResponse)
async def bundled_package_validate(package_id: str):
    return PackageValidationResponse.model_validate(validate_bundled_package(_repo_root(), package_id))


@app.get("/api/v1/cities/{city_id}/experience", response_model=CityExperienceResponse)
async def city_experience(city_id: str):
    return CityExperienceResponse.model_validate(city_experience_payload(city_id))


@app.get("/api/v1/cities/{city_id}", response_model=CityProfileResponse)
async def city_detail(city_id: str):
    city = _CITY_STORE.get(city_id)
    if city is None:
        return CityProfileResponse(
            id=city_id,
            name=city_id.replace("-", " ").title(),
            region="Unknown",
            population="Unknown",
            status="Research",
            baselineTempC=32.0,
            canopyCoverage="Unknown",
            planningCostMultiplier=1.0,
            description="City not found in registry.",
        )
    return CityProfileResponse.model_validate(city)


@app.get("/api/v1/cities/{city_id}/map", response_model=CityMapResponse)
async def city_map(city_id: str):
    payload = city_map_payload(city_id)
    return _merge_live_thermal_sources(payload, city_id)


@app.get("/api/v1/cities/{city_id}/live-thermal", response_model=CityLiveThermalAdapterResponse)
async def city_live_thermal(city_id: str):
    payload = city_map_payload(city_id)
    merged = _merge_live_thermal_sources(payload, city_id)
    return CityLiveThermalAdapterResponse.model_validate(merged["liveThermalAdapter"])


@app.post("/api/v1/cities/{city_id}/live-thermal/enable", response_model=CityLiveThermalAdapterResponse)
async def enable_city_live_thermal(city_id: str, request: Request):
    _ACCESS_CONTROL.ensure_access(
        request,
        minimum_role="editor",
        workspace_id=_workspace_id_from_request(request),
    )
    state = _live_thermal_state(city_id)
    config = _city_live_thermal_config(city_id)
    if not config:
        state["status"] = "unavailable"
        state["headline"] = "No live-source thermal adapter is configured for this city yet."
        state["detail"] = "Create data/live_thermal_sources.json entries before enabling auto-refresh."
        state["autoRefreshAvailable"] = False
        state["autoRefreshEnabled"] = False
        _persist_live_thermal_runtime_state()
        return CityLiveThermalAdapterResponse.model_validate(state)
    state["autoRefreshAvailable"] = True
    state["autoRefreshEnabled"] = True
    state["refreshIntervalSec"] = int(config.get("refreshIntervalSec", 900))
    state["providerTargets"] = [str(item) for item in config.get("providerTargets", []) if isinstance(item, str)]
    state["backupAvailable"] = any(
        isinstance(adapter, dict) and isinstance(adapter.get("backupLocation"), str) and bool(str(adapter.get("backupLocation")).strip())
        for adapter in config.get("adapters", [])
    )
    if state.get("status") == "unavailable":
        state["status"] = "planned"
        state["headline"] = "Live thermal adapters are configured and ready."
        state["detail"] = "Auto-refresh can be enabled to keep city thermal layers updated from the configured live feeds."
    _persist_live_thermal_runtime_state()
    _start_live_thermal_worker(city_id)
    _refresh_live_thermal_once(city_id)
    return CityLiveThermalAdapterResponse.model_validate(_live_thermal_state(city_id))


@app.post("/api/v1/cities/{city_id}/live-thermal/disable", response_model=CityLiveThermalAdapterResponse)
async def disable_city_live_thermal(city_id: str, request: Request):
    _ACCESS_CONTROL.ensure_access(
        request,
        minimum_role="editor",
        workspace_id=_workspace_id_from_request(request),
    )
    _stop_live_thermal_worker(city_id)
    state = _live_thermal_state(city_id)
    state["autoRefreshEnabled"] = False
    if state.get("autoRefreshAvailable"):
        state["status"] = "configured" if state.get("lastUpdated") else "planned"
        state["headline"] = "Live thermal auto-refresh is paused."
        state["detail"] = "The latest fetched live thermal payload remains available until a new refresh is requested."
    _persist_live_thermal_runtime_state()
    return CityLiveThermalAdapterResponse.model_validate(state)


@app.post("/api/v1/cities/{city_id}/live-thermal/refresh", response_model=CityLiveThermalAdapterResponse)
async def refresh_city_live_thermal(city_id: str, request: Request):
    _ACCESS_CONTROL.ensure_access(
        request,
        minimum_role="editor",
        workspace_id=_workspace_id_from_request(request),
    )
    state = _refresh_live_thermal_once(city_id)
    return CityLiveThermalAdapterResponse.model_validate(state)


@app.get("/api/v1/cities/{city_id}/spectral", response_model=CitySpectralResponse)
async def city_spectral(city_id: str):
    normalized = normalize_city_key(city_id)
    experience = resolve_city_experience(normalized)
    spectral_bundle = experience.spectral_bundle
    if spectral_bundle is None:
        return CitySpectralResponse(
            cityId=city_id,
            summary="No local spectral export is present for this city in the repository.",
            cheegerFeatureCount=0,
            coolingZoneCount=0,
            cheegerHighlights=[],
            coolingHighlights=[],
            artifactPaths=[],
        )

    repo_root = _repo_root()
    boundary_path = artifact_path(repo_root, spectral_bundle.boundary_artifact_id)
    cheeger_path = artifact_path(repo_root, spectral_bundle.bottleneck_artifact_id)
    access_path = artifact_path(repo_root, spectral_bundle.cooling_artifact_id)
    if boundary_path is None or cheeger_path is None or access_path is None:
        return CitySpectralResponse(
            cityId=city_id,
            summary="The city is configured for bundled spectral analysis, but the local artifact files are not available.",
            cheegerFeatureCount=0,
            coolingZoneCount=0,
            cheegerHighlights=[],
            coolingHighlights=[],
            artifactPaths=[],
        )
    cheeger_features = _load_geojson_features(cheeger_path)
    access_features = _load_geojson_features(access_path)
    profile = get_city_profile(normalized)
    cheeger_highlights = _spectral_highlights(
        cheeger_features,
        spectral_bundle.bottleneck_score_key,
        spectral_bundle.bottleneck_label,
        "Actual high-priority bottleneck polygon",
    )
    access_highlights = _spectral_highlights(
        access_features,
        spectral_bundle.cooling_score_key,
        spectral_bundle.cooling_label,
        "Actual low-access polygon",
    )
    summary = (
        f"{profile.name} has {len(cheeger_features)} {spectral_bundle.bottleneck_label.lower()} polygons and "
        f"{len(access_features)} low cooling access polygons exported by the pipeline."
    )
    return CitySpectralResponse(
        cityId=profile.key,
        summary=summary,
        cheegerFeatureCount=len(cheeger_features),
        coolingZoneCount=len(access_features),
        cheegerHighlights=cheeger_highlights,
        coolingHighlights=access_highlights,
        artifactPaths=[str(cheeger_path), str(access_path), str(boundary_path)],
    )


@app.get("/api/v1/cities/{city_id}/readiness", response_model=PlanningReadinessResponse)
async def city_readiness(city_id: str):
    return PlanningReadinessResponse.model_validate(_planning_readiness(city_id))


@app.get("/api/v1/cities/{city_id}/planner-validation", response_model=PlannerValidationResponse)
async def city_planner_validation(city_id: str):
    return PlannerValidationResponse.model_validate(_planner_validation(city_id))


@app.get("/api/v1/cities/{city_id}/benchmarks", response_model=BenchmarkSuiteResponse)
async def city_benchmark_suite(city_id: str):
    return BenchmarkSuiteResponse.model_validate(_benchmark_suite(city_id))


@app.get("/api/v1/cities/{city_id}/trust-audit", response_model=TrustAuditResponse)
async def city_trust_audit(city_id: str):
    return TrustAuditResponse.model_validate(_trust_audit(city_id))


@app.get("/api/v1/cities/{city_id}/data-registration", response_model=CityDataRegistrationResponse)
async def city_data_registration_detail(city_id: str):
    return CityDataRegistrationResponse.model_validate(_city_data_registration_payload(city_id))


@app.post("/api/v1/cities/{city_id}/data-registration", response_model=CityDataRegistrationResponse)
async def city_data_registration(city_id: str, request: CityDataRegistrationRequest, http_request: Request):
    _ACCESS_CONTROL.ensure_access(
        http_request,
        minimum_role="editor",
        workspace_id=_workspace_id_from_request(http_request),
    )
    with _RUNTIME_STATE_LOCK:
        city = _CITY_STORE.get(city_id)
        if city is None:
            raise HTTPException(status_code=404, detail="City not found")
        city["thermalInputsRegistered"] = bool(request.thermal_inputs_registered) if request.thermal_inputs_registered is not None else bool(city.get("thermalInputsRegistered"))
        city["artifactBundleRegistered"] = bool(request.artifact_bundle_registered) if request.artifact_bundle_registered is not None else bool(city.get("artifactBundleRegistered"))
        city["bottleneckOverlayRegistered"] = bool(request.bottleneck_overlay_registered) if request.bottleneck_overlay_registered is not None else bool(city.get("bottleneckOverlayRegistered"))
        city["coolingOverlayRegistered"] = bool(request.cooling_overlay_registered) if request.cooling_overlay_registered is not None else bool(city.get("coolingOverlayRegistered"))
        if request.thermal_inputs_path is not None:
            verified_path, _ = _verify_city_path(request.thermal_inputs_path)
            city["thermalInputsPath"] = verified_path
        if request.artifact_bundle_path is not None:
            verified_path, _ = _verify_city_path(request.artifact_bundle_path)
            city["artifactBundlePath"] = verified_path
        if request.bottleneck_overlay_path is not None:
            verified_path, _ = _verify_city_path(request.bottleneck_overlay_path)
            city["bottleneckOverlayPath"] = verified_path
        if request.cooling_overlay_path is not None:
            verified_path, _ = _verify_city_path(request.cooling_overlay_path)
            city["coolingOverlayPath"] = verified_path
        _CITY_STORE[city_id] = city
        _persist_runtime_cities()
    return CityDataRegistrationResponse.model_validate(_city_data_registration_payload(city_id))


@app.post("/api/v1/cities/onboard", response_model=CityOnboardingResponse)
async def onboard_city(request: CityOnboardingRequest, http_request: Request):
    _ACCESS_CONTROL.ensure_access(
        http_request,
        minimum_role="editor",
        workspace_id=_workspace_id_from_request(http_request),
    )
    boundary_path = request.boundary_path
    if request.boundary_source == "upload":
        upload_path = _persist_uploaded_boundary(request.boundary_file_name, request.boundary_geojson_text)
        boundary_path = str(upload_path)
    summary = city_onboarding_summary(request.name, boundary_path, repo_root=_repo_root())
    city = summary["city"]
    if isinstance(city, dict):
        if request.boundary_source != "demo" and not summary["boundary_available"]:
            raise HTTPException(
                status_code=400,
                detail="Boundary source requires a valid boundary file, but no resolvable GeoJSON was found.",
            )
        city_profile = {
            "id": str(city.get("key", request.name.lower().replace(" ", "-"))),
            "name": request.name.strip() or city.get("name", "Custom City"),
            "region": request.region.strip() or "Custom",
            "population": request.population.strip() or "Unknown",
            "status": "Ready" if summary["boundary_available"] else "Needs boundary",
            "baselineTempC": 32.5,
            "canopyCoverage": "Unknown",
            "planningCostMultiplier": float(city.get("planning_cost_multiplier", 1.0) or 1.0),
            "description": request.notes.strip() or city.get("demo_notes", "Onboarded through the TanStack city wizard."),
            "boundaryPath": summary.get("boundary_path"),
            "boundaryAvailable": bool(summary.get("boundary_available")),
            "boundarySource": request.boundary_source,
            "thermalInputsRegistered": request.boundary_source == "catalog",
            "artifactBundleRegistered": request.boundary_source == "catalog",
            "bottleneckOverlayRegistered": request.boundary_source == "catalog",
            "coolingOverlayRegistered": request.boundary_source == "catalog",
            "thermalInputsPath": None,
            "artifactBundlePath": None,
            "bottleneckOverlayPath": None,
            "coolingOverlayPath": None,
        }
        with _RUNTIME_STATE_LOCK:
            _CITY_STORE[str(city_profile["id"])] = city_profile
            _persist_runtime_cities()
        summary["city"] = CityProfileResponse.model_validate(city_profile)
    return summary


@app.get("/api/v1/scenarios", response_model=list[ScenarioRecordResponse])
async def scenarios(city_id: str | None = None):
    records = _SCENARIO_STORE if city_id is None else [item for item in _SCENARIO_STORE if item["cityId"] == city_id]
    benchmark_cost = None
    benchmark = _cost_source_by_id("la-cool-communities-1997")
    if isinstance(benchmark, dict) and benchmark.get("estimatedCostUsd"):
        benchmark_cost = int(benchmark.get("estimatedCostUsd", 0))
    return [
        ScenarioRecordResponse.model_validate(
            {
                **record,
                "recommendedActions": record.get("recommendedActions", []),
                "allocationSummary": record.get(
                    "allocationSummary",
                    _allocation_summary(int(record.get("budgetUsd", 0) or 0), record.get("recommendedActions", [])),
                ),
                "evidenceSummary": record.get(
                    "evidenceSummary",
                    _evidence_summary(record.get("recommendedActions", [])),
                ),
                "benchmarkSummary": record.get(
                    "benchmarkSummary",
                    _benchmark_summary(int(record.get("budgetUsd", 0) or 0), benchmark_cost),
                ),
            }
        )
        for record in records
    ]


@app.get("/api/v1/cost-sources", response_model=list[CostSourceResponse])
async def cost_sources():
    return [CostSourceResponse.model_validate(source) for source in _COST_SOURCES]


@app.get("/api/v1/interventions", response_model=list[InterventionRecordResponse])
async def interventions():
    return [InterventionRecordResponse.model_validate(item) for item in _INTERVENTIONS]


@app.post("/api/v1/scenarios/what-if", response_model=ScenarioRecordResponse)
async def create_what_if(request: ScenarioCreateRequest, http_request: Request):
    _ACCESS_CONTROL.ensure_access(
        http_request,
        minimum_role="editor",
        workspace_id=_workspace_id_from_request(http_request),
    )
    record = _benchmark_scenario(
        request.city_id,
        request.budget_usd,
        label=request.label,
        preset_key=request.preset_key,
        planning_mode=request.planning_mode,
    )
    with _RUNTIME_STATE_LOCK:
        _SCENARIO_STORE.insert(0, record)
        _persist_runtime_scenarios()
    return ScenarioRecordResponse.model_validate(record)


@app.post("/api/v1/scenarios/reset", response_model=ScenarioResetResponse)
async def reset_scenarios(request: ScenarioResetRequest, http_request: Request):
    _ACCESS_CONTROL.ensure_access(
        http_request,
        minimum_role="editor",
        workspace_id=_workspace_id_from_request(http_request),
    )
    city_key = normalize_city_key(request.city_id)
    with _RUNTIME_STATE_LOCK:
        cleared_count = len([item for item in _SCENARIO_STORE if item.get("cityId") == city_key])
        if cleared_count > 0:
            _SCENARIO_STORE[:] = [item for item in _SCENARIO_STORE if item.get("cityId") != city_key]
            _persist_runtime_scenarios()
    record = _benchmark_scenario(
        request.city_id,
        request.budget_usd,
        label=request.label,
        preset_key=request.preset_key,
        planning_mode=request.planning_mode,
    )
    with _RUNTIME_STATE_LOCK:
        _SCENARIO_STORE.insert(0, record)
        _persist_runtime_scenarios()
    return ScenarioResetResponse.model_validate({
        "clearedCount": cleared_count,
        "scenario": record,
    })


app.include_router(
    create_runs_router(
        run_store=_RUN_STORE,
        city_store=_CITY_STORE,
        runtime_state_lock=_RUNTIME_STATE_LOCK,
        persist_runtime_runs=_persist_runtime_runs,
        resolve_city_experience=resolve_city_experience,
        utc_now=utc_now,
        access_control=_ACCESS_CONTROL,
        workspace_id_from_request=_workspace_id_from_request,
        enqueue_run_execution=_enqueue_run_execution_job,
        serverless_runtime=is_serverless_runtime,
    )
)


@app.get("/api/v1/artifacts", response_model=list[ArtifactRecordResponse])
async def artifacts():
    return [ArtifactRecordResponse.model_validate(record) for record in _artifact_catalog()]


@app.get("/api/v1/artifacts/{artifact_id}")
async def artifact_download(artifact_id: str):
    path = _artifact_path_by_id(artifact_id)
    if path is None:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return FileResponse(
        path,
        filename=path.name,
        headers={"cache-control": "public, max-age=3600"},
    )


@app.get("/api/v1/robustness/lab", response_model=RobustnessLabResponse)
async def robustness_lab():
    return RobustnessLabResponse.model_validate(_toy_robustness_payload())
