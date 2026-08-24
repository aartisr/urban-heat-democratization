from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path

from .cities import get_city_profile, is_bundled_city, normalize_city_key


@dataclass(frozen=True)
class ArtifactSpec:
    id: str
    name: str
    kind: str
    description: str
    relative_path: str

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class StarterScenarioSpec:
    key: str
    label: str
    budget_usd: int
    description: str

    def to_dict(self) -> dict[str, object]:
        payload = asdict(self)
        payload["budgetUsd"] = payload.pop("budget_usd")
        return payload


@dataclass(frozen=True)
class StudyCardSpec:
    eyebrow: str
    title: str
    description: str

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class SpectralBundleSpec:
    boundary_artifact_id: str
    bottleneck_artifact_id: str
    cooling_artifact_id: str
    bottleneck_score_key: str = "priority"
    bottleneck_score_class_key: str = "priority_class"
    cooling_score_key: str = "cooling_access"
    cooling_score_class_key: str = "access_class"
    bottleneck_label: str = "Cheeger bottleneck"
    cooling_label: str = "Cooling access"


@dataclass(frozen=True)
class BundledPackageSpec:
    id: str
    city_id: str
    name: str
    audience: str
    summary: str
    artifact_ids: tuple[str, ...]
    study_guide_artifact_id: str | None = None
    boundary_artifact_id: str | None = None
    bottleneck_artifact_id: str | None = None
    cooling_artifact_id: str | None = None

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class CityExperienceSpec:
    city_id: str
    summary: str
    readiness_label: str
    default_run_scenario: str
    default_package_id: str | None = None
    export_artifact_ids: tuple[str, ...] = ()
    run_seed_artifact_ids: tuple[str, ...] = ()
    starter_scenarios: tuple[StarterScenarioSpec, ...] = ()
    study_cards: tuple[StudyCardSpec, ...] = ()
    study_guide_artifact_id: str | None = None
    spectral_bundle: SpectralBundleSpec | None = None


GLOBAL_ARTIFACTS: tuple[ArtifactSpec, ...] = (
    ArtifactSpec(
        id="verified-cost-sources",
        name="Verified cost sources",
        kind="json",
        description="Real cost-source references used by the app.",
        relative_path="data/cost_sources.json",
    ),
    ArtifactSpec(
        id="implementation-status",
        name="Implementation status",
        kind="markdown",
        description="Living log of what is done and what remains.",
        relative_path="docs/IMPLEMENTATION_STATUS.md",
    ),
    ArtifactSpec(
        id="cost-source-note",
        name="Verified cost source note",
        kind="markdown",
        description="Short note describing the benchmark cost anchors.",
        relative_path="docs/verified_cost_sources.md",
    ),
)


CITY_ARTIFACTS: dict[str, tuple[ArtifactSpec, ...]] = {
    "boston": (
        ArtifactSpec(
            id="boston-boundary-precise",
            name="Boston boundary (precise)",
            kind="geojson",
            description="Boundary used to clip Boston's real analysis layers.",
            relative_path="data/boston_boundary_precise.geojson",
        ),
        ArtifactSpec(
            id="cheeger-bottleneck",
            name="Cheeger bottleneck overlay",
            kind="geojson",
            description="Real exported Cheeger bottleneck polygons from the pipeline.",
            relative_path="data/boston_research_cheeger_bottleneck.geojson",
        ),
        ArtifactSpec(
            id="low-cooling-access",
            name="Low cooling access overlay",
            kind="geojson",
            description="Real exported low cooling access polygons from the pipeline.",
            relative_path="data/boston_research_low_cooling_access_zones.geojson",
        ),
        ArtifactSpec(
            id="boston-study-guide",
            name="Boston study guide",
            kind="markdown",
            description="Plain-language guide for studying Boston as the example city in the app.",
            relative_path="docs/BOSTON_STUDY_GUIDE.md",
        ),
        ArtifactSpec(
            id="boston-classroom-guide",
            name="Boston classroom guide",
            kind="markdown",
            description="Short classroom-first guide for teaching with Boston's real bundled heat artifacts.",
            relative_path="docs/BOSTON_CLASSROOM_GUIDE.md",
        ),
    ),
}


DEFAULT_STARTERS: tuple[StarterScenarioSpec, ...] = (
    StarterScenarioSpec(
        key="classroom",
        label="Classroom starter",
        budget_usd=50_000,
        description="A small, teachable scenario for explaining heat traps and budget tradeoffs in plain language.",
    ),
    StarterScenarioSpec(
        key="neighborhood-audit",
        label="Neighborhood audit",
        budget_usd=250_000,
        description="A district-scale scenario for comparing a few practical interventions under a limited budget.",
    ),
    StarterScenarioSpec(
        key="city-budget-hearing",
        label="City budget hearing",
        budget_usd=1_000_000,
        description="A city-scale starter scenario for public capital planning conversations.",
    ),
)


DEFAULT_STUDY_CARDS: tuple[StudyCardSpec, ...] = (
    StudyCardSpec(
        eyebrow="Step 1",
        title="Observe the map",
        description="Look for where heat concentrates, where cooling access is weak, and which neighborhoods deserve closer attention first.",
    ),
    StudyCardSpec(
        eyebrow="Step 2",
        title="Read the evidence",
        description="Check the source artifacts and notes so you know which layers come from real local files and which numbers are still benchmark estimates.",
    ),
    StudyCardSpec(
        eyebrow="Step 3",
        title="Test what-if budgets",
        description="Compare small, medium, and ambitious budgets to see how priorities shift when money is limited.",
    ),
    StudyCardSpec(
        eyebrow="Step 4",
        title="Keep an audit trail",
        description="Queue runs, keep the logs, and attach the supporting artifacts so decisions stay inspectable and teachable.",
    ),
)


CITY_EXPERIENCES: dict[str, CityExperienceSpec] = {
    "boston": CityExperienceSpec(
        city_id="boston",
        summary="Boston is the current real-data flagship in the repository and demonstrates the full study workflow from observed overlays to export-ready artifacts.",
        readiness_label="Bundled study city",
        default_run_scenario="Guided study run",
        default_package_id="boston-research",
        export_artifact_ids=(
            "boston-study-guide",
            "boston-boundary-precise",
            "cheeger-bottleneck",
            "low-cooling-access",
            "implementation-status",
        ),
        run_seed_artifact_ids=(
            "boston-study-guide",
            "boston-boundary-precise",
            "cheeger-bottleneck",
            "low-cooling-access",
        ),
        starter_scenarios=DEFAULT_STARTERS,
        study_cards=DEFAULT_STUDY_CARDS,
        study_guide_artifact_id="boston-study-guide",
        spectral_bundle=SpectralBundleSpec(
            boundary_artifact_id="boston-boundary-precise",
            bottleneck_artifact_id="cheeger-bottleneck",
            cooling_artifact_id="low-cooling-access",
            bottleneck_score_key="cheeger_priority",
            bottleneck_score_class_key="cheeger_priority_class",
            cooling_score_key="cooling_access_score",
            cooling_score_class_key="cooling_access_class",
        ),
    ),
}


CITY_PACKAGES: dict[str, BundledPackageSpec] = {
    "boston-research": BundledPackageSpec(
        id="boston-research",
        city_id="boston",
        name="Boston research package",
        audience="researchers, planners, advanced students",
        summary="Full bundled Boston package with the study guide, boundary, bottleneck overlay, cooling-access overlay, and implementation log.",
        artifact_ids=(
            "boston-study-guide",
            "boston-boundary-precise",
            "cheeger-bottleneck",
            "low-cooling-access",
            "implementation-status",
        ),
        study_guide_artifact_id="boston-study-guide",
        boundary_artifact_id="boston-boundary-precise",
        bottleneck_artifact_id="cheeger-bottleneck",
        cooling_artifact_id="low-cooling-access",
    ),
    "boston-classroom": BundledPackageSpec(
        id="boston-classroom",
        city_id="boston",
        name="Boston classroom package",
        audience="educators, students, community workshops",
        summary="Lightweight bundled Boston package for teaching and public explanation with a classroom guide, boundary, cooling overlays, and implementation log.",
        artifact_ids=(
            "boston-classroom-guide",
            "boston-boundary-precise",
            "cheeger-bottleneck",
            "low-cooling-access",
            "implementation-status",
        ),
        study_guide_artifact_id="boston-classroom-guide",
        boundary_artifact_id="boston-boundary-precise",
        bottleneck_artifact_id="cheeger-bottleneck",
        cooling_artifact_id="low-cooling-access",
    ),
}


def artifact_specs_for_city(city_id: str | None) -> tuple[ArtifactSpec, ...]:
    return CITY_ARTIFACTS.get(normalize_city_key(city_id), ())


def all_artifact_specs() -> list[ArtifactSpec]:
    records = list(GLOBAL_ARTIFACTS)
    for artifact_group in CITY_ARTIFACTS.values():
        records.extend(artifact_group)
    return records


def artifact_spec_by_id(artifact_id: str) -> ArtifactSpec | None:
    for spec in all_artifact_specs():
        if spec.id == artifact_id:
            return spec
    return None


def artifact_path(repo_root: Path, artifact_id: str) -> Path | None:
    spec = artifact_spec_by_id(artifact_id)
    if spec is None:
        return None
    path = (repo_root / spec.relative_path).resolve()
    return path if path.exists() else None


def resolve_city_experience(city_id: str | None) -> CityExperienceSpec:
    key = normalize_city_key(city_id)
    profile = get_city_profile(key)
    if key in CITY_EXPERIENCES:
        return CITY_EXPERIENCES[key]
    bundled = is_bundled_city(key)
    return CityExperienceSpec(
        city_id=profile.key,
        summary=(
            f"{profile.name} is bundled for immediate study in this workspace."
            if bundled
            else f"{profile.name} is configured as a plug-and-play onboarding city. Add a real boundary and local inputs to unlock deeper analysis."
        ),
        readiness_label="Bundled study city" if bundled else "Upload-first city",
        default_run_scenario="Baseline heat atlas",
        starter_scenarios=DEFAULT_STARTERS,
        study_cards=DEFAULT_STUDY_CARDS,
    )


def bundled_package_specs(city_id: str | None = None) -> dict[str, BundledPackageSpec]:
    if city_id is None:
        return dict(CITY_PACKAGES)
    key = normalize_city_key(city_id)
    return {package_id: package for package_id, package in CITY_PACKAGES.items() if package.city_id == key}


def bundled_package_payload(package_id: str) -> dict[str, object] | None:
    package = CITY_PACKAGES.get(package_id)
    if package is None:
        return None
    payload = package.to_dict()
    payload["artifactIds"] = list(payload.pop("artifact_ids"))
    payload["studyGuideArtifactId"] = payload.pop("study_guide_artifact_id")
    payload["boundaryArtifactId"] = payload.pop("boundary_artifact_id")
    payload["bottleneckArtifactId"] = payload.pop("bottleneck_artifact_id")
    payload["coolingArtifactId"] = payload.pop("cooling_artifact_id")
    return payload


def city_experience_payload(city_id: str | None) -> dict[str, object]:
    profile = get_city_profile(city_id)
    experience = resolve_city_experience(city_id)
    return {
        "cityId": profile.key,
        "cityName": profile.name,
        "bundled": is_bundled_city(profile.key),
        "summary": experience.summary,
        "readinessLabel": experience.readiness_label,
        "defaultRunScenario": experience.default_run_scenario,
        "defaultPackageId": experience.default_package_id,
        "studyGuideArtifactId": experience.study_guide_artifact_id,
        "exportArtifactIds": list(experience.export_artifact_ids),
        "runSeedArtifactIds": list(experience.run_seed_artifact_ids),
        "starterScenarios": [item.to_dict() for item in experience.starter_scenarios],
        "studyCards": [item.to_dict() for item in experience.study_cards],
        "spectralAvailable": experience.spectral_bundle is not None,
        "availablePackageIds": [package.id for package in bundled_package_specs(profile.key).values()],
    }
