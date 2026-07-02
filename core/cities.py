from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass(frozen=True)
class CityProfile:
    key: str
    name: str
    region: str = "Unknown"
    population: str = "Unknown"
    baseline_temp_c: float = 32.0
    canopy_coverage: str = "Unknown"
    planning_cost_multiplier: float = 1.0
    default_crs: str = "EPSG:4326"
    boundary_candidates: tuple[str, ...] = ()
    demo_notes: str = ""
    requires_uploaded_boundary: bool = False

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


_CITY_REGISTRY: dict[str, CityProfile] = {
    "boston": CityProfile(
        key="boston",
        name="Boston",
        region="Northeast US",
        population="675k",
        baseline_temp_c=33.8,
        canopy_coverage="27%",
        planning_cost_multiplier=1.0,
        default_crs="EPSG:26986",
        boundary_candidates=(
            "data/boston_boundary_precise.geojson",
            "data/boston_boundary.geojson",
        ),
        demo_notes="Boston is the bundled demo city with boundary files already available in the repo.",
    ),
    "new-york-city": CityProfile(
        key="new-york-city",
        name="New York City",
        region="Northeast US",
        population="8.8M",
        planning_cost_multiplier=1.12,
        default_crs="EPSG:2263",
        demo_notes="Upload a boundary GeoJSON to onboard New York City.",
        requires_uploaded_boundary=True,
    ),
    "chicago": CityProfile(
        key="chicago",
        name="Chicago",
        region="Midwest US",
        population="2.7M",
        planning_cost_multiplier=0.98,
        default_crs="EPSG:26916",
        demo_notes="Upload a boundary GeoJSON to onboard Chicago.",
        requires_uploaded_boundary=True,
    ),
    "los-angeles": CityProfile(
        key="los-angeles",
        name="Los Angeles",
        region="West US",
        population="3.8M",
        planning_cost_multiplier=1.08,
        default_crs="EPSG:2229",
        demo_notes="Upload a boundary GeoJSON to onboard Los Angeles.",
        requires_uploaded_boundary=True,
    ),
    "houston": CityProfile(
        key="houston",
        name="Houston",
        region="South US",
        population="2.3M",
        planning_cost_multiplier=0.95,
        default_crs="EPSG:2278",
        demo_notes="Upload a boundary GeoJSON to onboard Houston.",
        requires_uploaded_boundary=True,
    ),
    "custom": CityProfile(
        key="custom",
        name="Custom City",
        region="Custom",
        planning_cost_multiplier=1.0,
        demo_notes="Use this when you want to upload your own city boundary and rasters.",
        requires_uploaded_boundary=True,
    ),
}


def normalize_city_key(value: str | None) -> str:
    if not value:
        return "custom"
    normalized = value.strip().lower().replace("_", "-")
    normalized = "-".join(part for part in normalized.split() if part)
    return normalized or "custom"


def list_city_profiles() -> list[CityProfile]:
    return [profile for profile in _CITY_REGISTRY.values() if profile.key != "custom"] + [_CITY_REGISTRY["custom"]]


def get_city_profile(city: str | None) -> CityProfile:
    key = normalize_city_key(city)
    return _CITY_REGISTRY.get(
        key,
        CityProfile(key=key, name=key.replace("-", " ").title(), requires_uploaded_boundary=True),
    )


def is_bundled_city(city: str | None) -> bool:
    return not get_city_profile(city).requires_uploaded_boundary


def resolve_boundary_path(
    city: str | None,
    boundary_path: str | None = None,
    *,
    repo_root: Path | None = None,
) -> Path | None:
    if boundary_path:
        candidate = Path(boundary_path).expanduser()
        if not candidate.is_absolute():
            roots = [Path.cwd()]
            if repo_root is not None:
                roots.insert(0, repo_root)
            for root in roots:
                resolved = (root / candidate).resolve()
                if resolved.exists():
                    return resolved
        if candidate.exists():
            return candidate.resolve()

    profile = get_city_profile(city)
    roots = [Path.cwd()]
    if repo_root is not None:
        roots.insert(0, repo_root)
    for candidate in profile.boundary_candidates:
        raw = Path(candidate)
        if raw.is_absolute():
            if raw.exists():
                return raw
            continue
        for root in roots:
            resolved = (root / raw).resolve()
            if resolved.exists():
                return resolved
    return None


def city_onboarding_summary(
    city: str | None,
    boundary_path: str | None = None,
    *,
    repo_root: Path | None = None,
) -> dict[str, object]:
    profile = get_city_profile(city)
    resolved_boundary = resolve_boundary_path(city, boundary_path, repo_root=repo_root)
    return {
        "city": profile.to_dict(),
        "boundary_path": str(resolved_boundary) if resolved_boundary else None,
        "boundary_available": resolved_boundary is not None,
    }
