from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

from .city_experience import artifact_spec_by_id, bundled_package_specs


@dataclass(frozen=True)
class PackageCheck:
    id: str
    label: str
    status: str
    detail: str

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def _geojson_has_features(path: Path) -> bool:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return False
    if not isinstance(payload, dict):
        return False
    if payload.get("type") == "FeatureCollection":
        features = payload.get("features", [])
        return isinstance(features, list) and len(features) > 0
    return payload.get("type") == "Feature"


def validate_bundled_package(repo_root: Path, package_id: str) -> dict[str, object]:
    package = bundled_package_specs().get(package_id)
    if package is None:
        return {
            "packageId": package_id,
            "cityId": None,
            "valid": False,
            "errors": [f"Package {package_id} is not registered."],
            "warnings": [],
            "checks": [],
        }

    checks: list[PackageCheck] = []
    errors: list[str] = []
    warnings: list[str] = []

    checks.append(
        PackageCheck(
            id="artifact-count",
            label="Artifact bundle declared",
            status="ready" if len(package.artifact_ids) > 0 else "missing",
            detail=f"Package declares {len(package.artifact_ids)} artifact id(s).",
        )
    )
    if len(package.artifact_ids) == 0:
        errors.append("Package declares no artifacts.")

    for artifact_id in package.artifact_ids:
        spec = artifact_spec_by_id(artifact_id)
        if spec is None:
            checks.append(
                PackageCheck(
                    id=f"artifact-{artifact_id}",
                    label=f"Artifact {artifact_id}",
                    status="missing",
                    detail="Artifact id is referenced by the package but not registered in the artifact catalog.",
                )
            )
            errors.append(f"Artifact {artifact_id} is not registered.")
            continue
        path = (repo_root / spec.relative_path).resolve()
        if not path.exists():
            checks.append(
                PackageCheck(
                    id=f"artifact-{artifact_id}",
                    label=f"Artifact {artifact_id}",
                    status="missing",
                    detail=f"Artifact path does not exist: {path}",
                )
            )
            errors.append(f"Artifact {artifact_id} is missing on disk.")
            continue
        artifact_status = "ready"
        artifact_detail = f"Artifact exists at {path.name}."
        if spec.kind == "geojson" and not _geojson_has_features(path):
            artifact_status = "partial"
            artifact_detail = "GeoJSON exists but does not contain valid features."
            warnings.append(f"Artifact {artifact_id} exists but may not contain valid GeoJSON features.")
        checks.append(
            PackageCheck(
                id=f"artifact-{artifact_id}",
                label=f"Artifact {artifact_id}",
                status=artifact_status,
                detail=artifact_detail,
            )
        )

    guide_registered = package.study_guide_artifact_id in package.artifact_ids if package.study_guide_artifact_id else False
    checks.append(
        PackageCheck(
            id="study-guide",
            label="Study guide attachment",
            status="ready" if guide_registered else ("partial" if package.study_guide_artifact_id else "missing"),
            detail=(
                "Study guide artifact is explicitly part of the package."
                if guide_registered
                else "Package declares a study guide id, but it is not included in the artifact bundle."
                if package.study_guide_artifact_id
                else "Package does not declare a study guide artifact."
            ),
        )
    )
    if package.study_guide_artifact_id and not guide_registered:
        errors.append("Study guide artifact id is not included in the package artifact list.")

    spectral_ids = [package.boundary_artifact_id, package.bottleneck_artifact_id, package.cooling_artifact_id]
    spectral_registered = all(artifact_id in package.artifact_ids for artifact_id in spectral_ids if artifact_id is not None)
    checks.append(
        PackageCheck(
            id="spectral-triad",
            label="Spectral artifact triad",
            status="ready" if spectral_registered else "partial",
            detail=(
                "Boundary, bottleneck, and cooling overlay artifacts are all attached."
                if spectral_registered
                else "Package does not attach the full spectral boundary/bottleneck/cooling artifact triad."
            ),
        )
    )
    if not spectral_registered:
        warnings.append("Package does not include a full spectral triad.")

    return {
        "packageId": package.id,
        "cityId": package.city_id,
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "checks": [check.to_dict() for check in checks],
    }
