from __future__ import annotations

import ast
import json
import math
import struct
from pathlib import Path
from typing import Any

from .city_experience import artifact_path, resolve_city_experience
from .cities import get_city_profile, normalize_city_key

_THERMAL_GRID_BOUNDS = (-71.1912, 42.2279, -70.9860, 42.3969)
_THERMAL_CORRIDOR_QUANTILE = 0.85


def _point(x: float, y: float) -> dict[str, float]:
    return {"x": float(x), "y": float(y)}


def _load_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    with path.open() as handle:
        return json.load(handle)


def _with_stable_feature_ids(payload: dict[str, Any] | None, prefix: str) -> dict[str, Any] | None:
    if not payload:
        return None
    cloned = json.loads(json.dumps(payload))
    features = _feature_collection(cloned)
    for index, feature in enumerate(features):
        stable_id = f"{prefix}-{index}"
        feature["id"] = stable_id
        properties = feature.get("properties")
        if not isinstance(properties, dict):
            properties = {}
            feature["properties"] = properties
        properties.setdefault("cell_id", stable_id)
        properties.setdefault("id", stable_id)
    return cloned


def _normalize_spectral_properties(
    payload: dict[str, Any] | None,
    *,
    score_key: str,
    score_class_key: str,
    canonical_score_key: str,
    canonical_class_key: str,
    invert_score: bool = False,
) -> dict[str, Any] | None:
    if not payload:
        return None
    cloned = json.loads(json.dumps(payload))
    for feature in _feature_collection(cloned):
        properties = feature.get("properties")
        if not isinstance(properties, dict):
            properties = {}
            feature["properties"] = properties
        raw_score = properties.get(score_key)
        if canonical_score_key not in properties and isinstance(raw_score, (int, float)):
            properties[canonical_score_key] = 100.0 - float(raw_score) if invert_score else float(raw_score)
        raw_class = properties.get(score_class_key)
        if canonical_class_key not in properties and isinstance(raw_class, str):
            properties[canonical_class_key] = _canonical_severity_label(raw_class, invert_score=invert_score)
        canonical_class = properties.get(canonical_class_key)
        if isinstance(canonical_class, str):
            properties["severity_bucket"] = canonical_class.strip().lower()
    return cloned


def _canonical_severity_label(raw_class: str, *, invert_score: bool = False) -> str:
    normalized = raw_class.strip().lower()
    if invert_score:
        if normalized in {"very_low", "very low", "low", "poor"}:
            return "High"
        if normalized in {"moderate", "medium", "fair"}:
            return "Medium"
        return "Low"
    if normalized in {"critical", "very_high", "very high", "high"}:
        return "High"
    if normalized in {"moderate", "medium", "watch"}:
        return "Medium"
    return "Low"


def _score_status(overlays: list[dict[str, Any]]) -> dict[str, Any]:
    """Describe whether an exported numeric field supports within-layer ranking.

    A thresholded export can legitimately contain the same value for every
    included feature. That is a useful flagged condition, but it is not a
    priority scale. Keeping this decision in the API prevents clients from
    turning a uniform sentinel value into false precision.
    """
    values = [float(overlay["score"]) for overlay in overlays if isinstance(overlay.get("score"), (int, float))]
    distinct_count = len({round(value, 6) for value in values})
    if not values:
        return {
            "scoreStatus": "unavailable",
            "distinctScoreCount": 0,
            "detail": "No numeric score is available in this bundled export.",
        }
    if distinct_count < 2:
        return {
            "scoreStatus": "flagged_not_ranked",
            "distinctScoreCount": distinct_count,
            "detail": "All bundled values are identical, so this layer is shown as a flagged condition rather than a within-layer ranking.",
        }
    return {
        "scoreStatus": "ranked",
        "distinctScoreCount": distinct_count,
        "detail": "The bundled values vary and support within-layer ranking. They remain model-derived unless otherwise stated.",
    }


def _public_artifact_path(repo_root: Path, path: Path) -> str:
    """Keep filesystem locations out of public API responses."""
    try:
        return path.relative_to(repo_root).as_posix()
    except ValueError:
        return path.name


def _resolve_thermal_metadata_path(repo_root: Path) -> Path | None:
    local_path = repo_root / "data" / "metadata" / "thermal_sources.json"
    if local_path.exists():
        return local_path
    sibling_path = repo_root.parent / "spectral_urbanism_boston" / "data" / "metadata" / "thermal_sources.json"
    if sibling_path.exists():
        return sibling_path
    return None


def _resolve_thermal_data_path(repo_root: Path, relative_path: str) -> Path | None:
    candidates = [
        repo_root / relative_path,
        repo_root.parent / "spectral_urbanism_boston" / relative_path,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def _load_thermal_surfaces(repo_root: Path) -> list[dict[str, Any]]:
    metadata_path = _resolve_thermal_metadata_path(repo_root)
    if metadata_path is None:
        return []
    metadata = _load_json(metadata_path)
    if not isinstance(metadata, dict):
        return []

    min_lng, min_lat, max_lng, max_lat = _THERMAL_GRID_BOUNDS
    sources: list[dict[str, Any]] = []
    for source_id, raw_meta in metadata.items():
        if not isinstance(source_id, str) or not isinstance(raw_meta, dict):
            continue
        relative_file = raw_meta.get("file")
        if not isinstance(relative_file, str):
            continue
        data_path = _resolve_thermal_data_path(repo_root, relative_file)
        if data_path is None:
            continue
        surface = _load_npy_matrix(data_path)
        if surface is None:
            continue
        finite = [value for row in surface for value in row if math.isfinite(value)]
        if not finite:
            continue

        rows = len(surface)
        cols = len(surface[0]) if surface else 0
        if rows == 0 or cols == 0:
            continue
        lng_step = (max_lng - min_lng) / cols
        lat_step = (max_lat - min_lat) / rows
        threshold = float(_quantile(finite, _THERMAL_CORRIDOR_QUANTILE))
        surface_features: list[dict[str, Any]] = []
        corridor_features: list[dict[str, Any]] = []

        for row in range(rows):
            top_lat = max_lat - (row * lat_step)
            bottom_lat = top_lat - lat_step
            for col in range(cols):
                value = float(surface[row][col])
                if not math.isfinite(value):
                    continue
                left_lng = min_lng + (col * lng_step)
                right_lng = left_lng + lng_step
                cell_id = f"{source_id}-{row}-{col}"
                geometry = {
                    "type": "Polygon",
                    "coordinates": [[
                        [left_lng, top_lat],
                        [right_lng, top_lat],
                        [right_lng, bottom_lat],
                        [left_lng, bottom_lat],
                        [left_lng, top_lat],
                    ]],
                }
                properties = {
                    "cell_id": cell_id,
                    "source": source_id,
                    "temp_c": value,
                    "row": row,
                    "col": col,
                    "is_heat_corridor": value >= threshold,
                }
                feature = {
                    "type": "Feature",
                    "id": cell_id,
                    "geometry": geometry,
                    "properties": properties,
                }
                surface_features.append(feature)
                if value >= threshold:
                    corridor_features.append(feature)

        sources.append(
            {
                "id": source_id,
                "label": "Landsat thermal surface" if source_id == "landsat" else "ECOSTRESS thermal surface" if source_id == "ecostress" else f"{source_id} thermal surface",
                "sourceName": str(raw_meta.get("source", source_id)),
                "provider": str(raw_meta.get("provider", "Unknown")),
                "sensor": str(raw_meta.get("sensor", "Unknown")),
                "resolutionM": int(raw_meta.get("resolution_m", 0) or 0),
                "meanTempC": float(raw_meta.get("mean_temp_c", _mean(finite))),
                "stdTempC": float(raw_meta.get("std_temp_c", _stddev(finite))),
                "minTempC": float(min(finite)),
                "maxTempC": float(max(finite)),
                "thresholdTempC": threshold,
                "corridorQuantile": _THERMAL_CORRIDOR_QUANTILE,
                "filePath": _public_artifact_path(repo_root, data_path),
                "metadataPath": _public_artifact_path(repo_root, metadata_path),
                "bounds": {
                    "minLng": min_lng,
                    "minLat": min_lat,
                    "maxLng": max_lng,
                    "maxLat": max_lat,
                },
                "surfaceGeojson": {
                    "type": "FeatureCollection",
                    "features": surface_features,
                },
                "corridorGeojson": {
                    "type": "FeatureCollection",
                    "features": corridor_features,
                },
            }
        )
    return sources


def _live_thermal_adapter_payload(enabled: bool) -> dict[str, Any]:
    if enabled:
        return {
            "status": "planned",
            "headline": "Live-source adapter path is designed but not yet fetching heat data into this app.",
            "detail": "The app can now distinguish bundled study artifacts from live ingestion. A future adapter can target NASA, USGS, NOAA, or local station feeds without mislabeling the current Boston thermal surfaces as real-time.",
            "providerTargets": [
                "NASA ECOSTRESS",
                "USGS Landsat",
                "NOAA station or forecast feeds",
            ],
            "lastUpdated": None,
        }
    return {
        "status": "unavailable",
        "headline": "No live-source thermal adapter is configured for this city yet.",
        "detail": "This city currently uses bundled study layers only. Live ingestion has not been connected.",
        "providerTargets": [],
        "lastUpdated": None,
    }


def _mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _stddev(values: list[float]) -> float:
    if not values:
        return 0.0
    mean_value = _mean(values)
    variance = sum((value - mean_value) ** 2 for value in values) / len(values)
    return math.sqrt(variance)


def _quantile(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    position = (len(ordered) - 1) * q
    lower = int(math.floor(position))
    upper = int(math.ceil(position))
    if lower == upper:
        return ordered[lower]
    weight = position - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def _load_npy_matrix(path: Path) -> list[list[float]] | None:
    try:
        with path.open("rb") as handle:
            if handle.read(6) != b"\x93NUMPY":
                return None
            major = handle.read(1)
            minor = handle.read(1)
            if not major or not minor:
                return None
            version = (major[0], minor[0])
            if version == (1, 0):
                header_len = struct.unpack("<H", handle.read(2))[0]
            else:
                header_len = struct.unpack("<I", handle.read(4))[0]
            header = ast.literal_eval(handle.read(header_len).decode("latin1"))
            if not isinstance(header, dict):
                return None
            shape = header.get("shape")
            descr = header.get("descr")
            fortran_order = bool(header.get("fortran_order"))
            if fortran_order or not isinstance(shape, tuple) or len(shape) != 2 or not isinstance(descr, str):
                return None
            rows, cols = int(shape[0]), int(shape[1])
            if descr.endswith("f4"):
                fmt = "<f" if descr[0] in "<|" else ">f"
                item_size = 4
            elif descr.endswith("f8"):
                fmt = "<d" if descr[0] in "<|" else ">d"
                item_size = 8
            else:
                return None
            payload = handle.read(rows * cols * item_size)
            values = struct.unpack(f"{fmt[0]}{rows * cols}{fmt[1]}", payload)
            matrix: list[list[float]] = []
            for row in range(rows):
                start = row * cols
                matrix.append([float(value) for value in values[start:start + cols]])
            return matrix
    except Exception:
        return None


def _feature_collection(payload: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not payload:
        return []
    if payload.get("type") == "FeatureCollection":
        return [feature for feature in payload.get("features", []) if isinstance(feature, dict)]
    if payload.get("type") == "Feature":
        return [payload]
    return []


def _geometry_rings(geometry: dict[str, Any]) -> list[list[tuple[float, float]]]:
    geom_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if geom_type == "Polygon" and coordinates:
        return [[(float(x), float(y)) for x, y in ring] for ring in coordinates[:1]]
    if geom_type == "MultiPolygon" and coordinates:
        rings: list[list[tuple[float, float]]] = []
        for polygon in coordinates:
            if polygon:
                rings.append([(float(x), float(y)) for x, y in polygon[0]])
        return rings
    return []


def _geometry_points(geometry: dict[str, Any]) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for ring in _geometry_rings(geometry):
        points.extend(ring)
    return points


def _normalize_points(points: list[tuple[float, float]], bounds: tuple[float, float, float, float]) -> list[dict[str, float]]:
    """Return geographic points for the interactive MapLibre map.

    `CityMapPoint` uses the legacy names ``x`` and ``y``, but this endpoint is
    consumed as longitude and latitude. The former 10–90 screen-space
    normalization was appropriate for an SVG preview only; passing it to
    MapLibre made a selected Boston polygon pan to Europe or Asia.
    """
    del bounds
    geographic_points = []
    for lon, lat in points:
        geographic_points.append(_point(lon, lat))
    return geographic_points


def _feature_bounds(features: list[dict[str, Any]]) -> tuple[float, float, float, float]:
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


def _merge_bounds(*bounds_sets: tuple[float, float, float, float] | None) -> tuple[float, float, float, float] | None:
    valid = [bounds for bounds in bounds_sets if bounds is not None]
    if not valid:
        return None
    return (
        min(bounds[0] for bounds in valid),
        min(bounds[1] for bounds in valid),
        max(bounds[2] for bounds in valid),
        max(bounds[3] for bounds in valid),
    )


def _bounds_polygon(bounds: tuple[float, float, float, float]) -> dict[str, Any]:
    min_lng, min_lat, max_lng, max_lat = bounds
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": "study-area-boundary",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [min_lng, max_lat],
                        [max_lng, max_lat],
                        [max_lng, min_lat],
                        [min_lng, min_lat],
                        [min_lng, max_lat],
                    ]],
                },
                "properties": {
                    "label": "Study area boundary",
                },
            }
        ],
    }


def _load_boundary_bundle(path: Path) -> tuple[list[dict[str, float]] | None, tuple[float, float, float, float]]:
    payload = _load_json(path)
    features = _feature_collection(payload)
    if not features:
        return None, (-71.2, 42.2, -70.9, 42.5)
    bounds = _feature_bounds(features)
    points: list[tuple[float, float]] = []
    for feature in features:
        geometry = feature.get("geometry")
        if isinstance(geometry, dict):
            points.extend(_geometry_points(geometry))
    if not points:
        return None, bounds
    return _normalize_points(points, bounds), bounds


def _overlay_features(path: Path, score_key: str, score_label: str, bounds: tuple[float, float, float, float]) -> list[dict[str, Any]]:
    payload = _load_json(path)
    features = _feature_collection(payload)
    if not features:
        return []
    overlays = []
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
                "label": f"{score_label} {score:.1f}",
                "score": score,
                "scoreClass": str(properties.get(f"{score_key}_class", "Unknown")),
                "points": _normalize_points(points, bounds),
                "properties": properties,
            }
        )
    overlays.sort(key=lambda item: item["score"], reverse=True)
    return overlays


def _bundled_map(city_key: str, city_name: str) -> dict[str, Any]:
    repo_root = Path(__file__).resolve().parents[1]
    experience = resolve_city_experience(city_key)
    spectral_bundle = experience.spectral_bundle
    if spectral_bundle is None:
        return _generic_map(city_key, city_name)

    boundary_path = artifact_path(repo_root, spectral_bundle.boundary_artifact_id)
    bottleneck_path = artifact_path(repo_root, spectral_bundle.bottleneck_artifact_id)
    cooling_path = artifact_path(repo_root, spectral_bundle.cooling_artifact_id)
    if boundary_path is None or bottleneck_path is None or cooling_path is None:
        return _generic_map(city_key, city_name)

    boundary_payload = _with_stable_feature_ids(_load_json(boundary_path), "boundary")
    bottleneck_payload = _with_stable_feature_ids(
        _normalize_spectral_properties(
            _load_json(bottleneck_path),
            score_key=spectral_bundle.bottleneck_score_key,
            score_class_key=spectral_bundle.bottleneck_score_class_key,
            canonical_score_key="priority",
            canonical_class_key="priority_class",
        ),
        "heat",
    )
    cooling_payload = _with_stable_feature_ids(
        _normalize_spectral_properties(
            _load_json(cooling_path),
            score_key=spectral_bundle.cooling_score_key,
            score_class_key=spectral_bundle.cooling_score_class_key,
            canonical_score_key="cooling_access",
            canonical_class_key="access_class",
            invert_score=True,
        ),
        "cooling",
    )
    boundary, boundary_bounds = _load_boundary_bundle(boundary_path)
    if boundary is None:
        return _generic_map(city_key, city_name)

    heat_overlays = []
    for index, feature in enumerate(_feature_collection(bottleneck_payload)):
        geometry = feature.get("geometry")
        properties = feature.get("properties", {})
        if not isinstance(geometry, dict) or not isinstance(properties, dict):
            continue
        points = _geometry_points(geometry)
        if not points:
            continue
        score = float(properties.get("priority", properties.get(spectral_bundle.bottleneck_score_key, 0.0)) or 0.0)
        heat_overlays.append(
            {
                "id": str(feature.get("id", f"heat-{index}")),
                "label": f"Priority {score:.1f}",
                "score": score,
                "scoreClass": str(properties.get("priority_class", properties.get(spectral_bundle.bottleneck_score_class_key, "Unknown"))),
                "points": _normalize_points(points, boundary_bounds),
                "properties": properties,
            }
        )
    heat_overlays.sort(key=lambda item: item["score"], reverse=True)

    access_overlays = []
    for index, feature in enumerate(_feature_collection(cooling_payload)):
        geometry = feature.get("geometry")
        properties = feature.get("properties", {})
        if not isinstance(geometry, dict) or not isinstance(properties, dict):
            continue
        points = _geometry_points(geometry)
        if not points:
            continue
        score = float(properties.get("cooling_access", properties.get(spectral_bundle.cooling_score_key, 0.0)) or 0.0)
        access_overlays.append(
            {
                "id": str(feature.get("id", f"cooling-{index}")),
                "label": f"Low-access severity {score:.1f}",
                "score": score,
                "scoreClass": str(properties.get("access_class", properties.get(spectral_bundle.cooling_score_class_key, "Unknown"))),
                "points": _normalize_points(points, boundary_bounds),
                "properties": properties,
            }
        )
    access_overlays.sort(key=lambda item: item["score"], reverse=True)

    top_heat = heat_overlays[:3]
    heat_score_status = _score_status(heat_overlays)
    cooling_score_status = _score_status(access_overlays)
    if cooling_score_status["scoreStatus"] != "ranked":
        for overlay in access_overlays:
            overlay["label"] = "Low-access condition"
    thermal_sources = _load_thermal_surfaces(repo_root)
    heat_bounds = _feature_bounds(_feature_collection(bottleneck_payload)) if bottleneck_payload else None
    cooling_bounds = _feature_bounds(_feature_collection(cooling_payload)) if cooling_payload else None
    thermal_bounds = _merge_bounds(*[
        (
            float(source["bounds"]["minLng"]),
            float(source["bounds"]["minLat"]),
            float(source["bounds"]["maxLng"]),
            float(source["bounds"]["maxLat"]),
        )
        for source in thermal_sources
    ]) if thermal_sources else None
    display_bounds = _merge_bounds(heat_bounds, cooling_bounds, thermal_bounds) or boundary_bounds
    narrative = (
        f"{city_name}'s bundled analysis has {len(heat_overlays)} bottleneck cells, "
        f"{len(access_overlays)} low-access zones, and "
        f"{len(thermal_sources)} full thermal source surfaces available for study."
    )

    return {
        "cityId": city_key,
        "cityName": city_name,
        "viewBox": {"width": 100, "height": 100},
        "boundary": boundary,
        "heatZones": heat_overlays,
        "accessZones": access_overlays,
        "legend": [
            {"label": "Cheeger priority", "color": "#b91c1c", "description": "Actual bottleneck polygons exported by the spectral pipeline."},
            {"label": "Low cooling access", "color": "#0ea5e9", "description": "Actual weak-access polygons exported by the pipeline."},
            {"label": "Municipal boundary", "color": "#0f172a", "description": f"{city_name} boundary from the workspace GeoJSON file."},
        ],
        "highlights": [
            {
                "title": "Top bottleneck",
                "value": top_heat[0]["score"] if top_heat else 0.0,
                "description": top_heat[0]["properties"].get("priority_class", "Unknown") if top_heat else "No bottleneck features found.",
            },
            {
                "title": "Low-access zones flagged" if cooling_score_status["scoreStatus"] != "ranked" else "Top low-access zone",
                "value": len(access_overlays) if cooling_score_status["scoreStatus"] != "ranked" else (access_overlays[0]["score"] if access_overlays else 0.0),
                "valueLabel": "zones" if cooling_score_status["scoreStatus"] != "ranked" else "score",
                "description": cooling_score_status["detail"] if cooling_score_status["scoreStatus"] != "ranked" else (access_overlays[0]["properties"].get("access_class", "Unknown") if access_overlays else "No access features found."),
            },
        ],
        "artifactPaths": [
            _public_artifact_path(repo_root, boundary_path),
            _public_artifact_path(repo_root, bottleneck_path),
            _public_artifact_path(repo_root, cooling_path),
            *[source["filePath"] for source in thermal_sources],
        ],
        "bounds": {
            "minLng": display_bounds[0],
            "minLat": display_bounds[1],
            "maxLng": display_bounds[2],
            "maxLat": display_bounds[3],
        },
        "studyAreaGeojson": _bounds_polygon(display_bounds),
        "boundaryGeojson": boundary_payload,
        "heatGeojson": bottleneck_payload,
        "accessGeojson": cooling_payload,
        "thermalSources": thermal_sources,
        "liveThermalAdapter": _live_thermal_adapter_payload(enabled=True),
        "truthMode": {
            "headline": "This map now combines real Boston geometry, real bundled overlay exports, and source-switchable thermal study surfaces from Landsat and ECOSTRESS artifacts available in the workspace.",
            "interpretationStatus": "derived",
            "methodology": "Boundary geometry is read directly from the workspace GeoJSON. Bottleneck and cooling-access layers are loaded from repository GeoJSON exports generated by the spectral analysis pipeline. Landsat and ECOSTRESS thermal study arrays are loaded from bundled Boston artifacts and expanded into full grid-cell surfaces for map rendering.",
            "caution": "These thermal surfaces are source-backed study artifacts, not live streaming feeds. They should be read as the currently bundled Boston thermal observations available in this workspace, not as minute-by-minute real-time telemetry.",
            "notes": [
                "Observed geography: OpenStreetMap basemap and Boston boundary geometry.",
                "Derived overlays: Cheeger bottleneck and low cooling access polygons exported by the pipeline.",
                "Thermal study surfaces: Landsat and ECOSTRESS arrays documented in the sibling Boston research repository and rendered here as full-city cell layers.",
                "Not yet shown here: direct live NASA or USGS fetching, run-level uncertainty rasters, and the full Boston execution workbench.",
            ],
        },
        "layerProvenance": [
            {
                "id": "boundary",
                "label": "Boston municipal boundary",
                "truthStatus": "observed",
                "sourceType": "workspace_geojson",
                "filePath": _public_artifact_path(repo_root, boundary_path),
                "method": "Loaded directly from the repository boundary GeoJSON and drawn on the map without simplification beyond browser rendering.",
                "primaryFields": [],
                "limitations": [
                    "This shows geometry only; it does not by itself encode heat or mitigation performance.",
                ],
            },
            {
                "id": "heat-bottleneck",
                "label": "Cheeger bottleneck overlay",
                "truthStatus": "derived",
                "sourceType": "spectral_pipeline_geojson",
                "filePath": _public_artifact_path(repo_root, bottleneck_path),
                "method": "Loaded from bundled spectral pipeline output and colored by the exported priority field.",
                "primaryFields": ["priority", "priority_class"],
                **heat_score_status,
                "limitations": [
                    "Priority values are model-derived, not direct field observations.",
                    "This UI currently exposes a simplified subset of the full Boston research diagnostics.",
                ],
            },
            {
                "id": "cooling-access",
                "label": "Low cooling access overlay",
                "truthStatus": "derived",
                "sourceType": "spectral_pipeline_geojson",
                "filePath": _public_artifact_path(repo_root, cooling_path),
                "method": "Loaded from bundled spectral pipeline output and colored by the exported cooling-access field.",
                "primaryFields": ["cooling_access", "access_class"],
                **cooling_score_status,
                "limitations": [
                    "Cooling-access values are model-derived planning indicators, not direct sensor observations.",
                    cooling_score_status["detail"],
                    "The current interface does not yet expose the full cooling-resistance diagnostic stack from the Boston research repo.",
                ],
            },
            *[
                {
                    "id": f"thermal-{source['id']}",
                    "label": f"{source['sourceName']} thermal surface",
                    "truthStatus": "observed",
                    "sourceType": "bundled_thermal_array",
                    "filePath": source["filePath"],
                    "method": f"Loaded from the bundled {source['id']} thermal array and expanded into georeferenced grid cells using the documented Boston thermal study bounds from the source-generation script.",
                    "primaryFields": ["temp_c", "is_heat_corridor", "row", "col"],
                    "limitations": [
                        "This is a bundled thermal study artifact, not a live real-time stream.",
                        "The current app renders cell geometry from the array grid and does not yet expose the full original raster analysis tooling.",
                    ],
                }
                for source in thermal_sources
            ],
        ],
        "narrative": narrative,
    }


def _generic_map(city_key: str, city_name: str) -> dict[str, Any]:
    return {
        "cityId": city_key,
        "cityName": city_name,
        "viewBox": {"width": 100, "height": 100},
        "boundary": [_point(18, 18), _point(82, 18), _point(84, 82), _point(16, 82)],
        "heatZones": [],
        "accessZones": [],
        "legend": [
            {"label": "No local analysis", "color": "#64748b", "description": "This city has not yet been backed by a local GeoJSON export."},
        ],
        "highlights": [],
        "artifactPaths": [],
        "bounds": None,
        "studyAreaGeojson": None,
        "boundaryGeojson": None,
        "heatGeojson": None,
        "accessGeojson": None,
        "thermalSources": [],
        "liveThermalAdapter": _live_thermal_adapter_payload(enabled=False),
        "truthMode": {
            "headline": "This city does not yet have a real bundled local map package in the repository.",
            "interpretationStatus": "illustrative",
            "methodology": "The app can still show a placeholder map state and onboarding workflow, but no local analysis bundle is attached.",
            "caution": "Do not interpret the generic map state as real local analysis.",
            "notes": [
                "Observed local geometry has not yet been bundled here.",
                "Any planning workflow for this city remains upload-first until real local files are registered.",
            ],
        },
        "layerProvenance": [
            {
                "id": "no-local-analysis",
                "label": "No bundled city layers",
                "truthStatus": "illustrative",
                "sourceType": "ui_placeholder",
                "filePath": None,
                "method": "Placeholder only.",
                "primaryFields": [],
                "limitations": [
                    "No local boundary or derived overlay bundle is available for this city in the repository.",
                ],
            },
        ],
        "narrative": f"{city_name} does not yet have a local GeoJSON analysis bundle in this repo.",
    }


def city_map_payload(city: str | None) -> dict[str, Any]:
    profile = get_city_profile(city)
    key = normalize_city_key(city or profile.key)
    if resolve_city_experience(key).spectral_bundle is not None:
        return _bundled_map(profile.key, profile.name)
    return _generic_map(profile.key, profile.name)
