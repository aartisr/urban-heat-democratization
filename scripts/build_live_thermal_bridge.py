#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
import urllib.request
from copy import deepcopy
from pathlib import Path
from typing import Any

from core.city_maps import city_map_payload

CMR_GRANULES_URL = "https://cmr.earthdata.nasa.gov/search/granules.json"
LANDSAT_STAC_COLLECTION_ID = "landsat-c2l2-st"
LANDSAT_STAC_BASE_URL = "https://landsatlook.usgs.gov/stac-server"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Build a city-ready live thermal adapter payload by combining the latest "
            "official provider metadata with an existing thermal surface contract."
        )
    )
    parser.add_argument("--city-id", help="City id already known to the app, for example 'boston'.")
    parser.add_argument("--source-id", required=True, help="Thermal source id, for example 'landsat' or 'ecostress'.")
    parser.add_argument("--collection-concept-id", help="Official NASA CMR collection concept id.")
    parser.add_argument("--source-name", required=True, help="Human label for the live bridge source.")
    parser.add_argument("--provider", required=True, help="Provider label shown in the atlas.")
    parser.add_argument("--sensor", required=True, help="Sensor label shown in the atlas.")
    parser.add_argument("--adapter-kind", required=True, help="Stable adapter identifier for runtime diagnostics.")
    parser.add_argument("--output", required=True, help="Path to write the city-ready JSON payload.")
    parser.add_argument("--input-json", help="Optional existing city-ready thermal JSON file to use as the base contract.")
    parser.add_argument("--bbox", help="Optional bbox as minLng,minLat,maxLng,maxLat. Defaults to the base contract bounds.")
    parser.add_argument("--time-start", help="Optional inclusive time filter, for example 2024-01-01T00:00:00Z.")
    parser.add_argument("--page-size", type=int, default=1, help="Number of granules to request from CMR. Default 1.")
    parser.add_argument("--timeout-sec", type=float, default=45.0, help="HTTP timeout in seconds. Default 45.")
    parser.add_argument("--header", action="append", default=[], help="Optional HTTP header in 'Name: Value' form.")
    parser.add_argument(
        "--source-system",
        choices=["cmr", "stac"],
        default="cmr",
        help="Which official metadata system to query. ECOSTRESS uses CMR; Landsat uses USGS STAC.",
    )
    parser.add_argument("--stac-collection-id", help="USGS STAC collection id for Landsat live queries.")
    parser.add_argument("--stac-base-url", default=LANDSAT_STAC_BASE_URL, help="Base URL for the official STAC server.")
    return parser.parse_args()


def parse_headers(header_items: list[str]) -> dict[str, str]:
    headers: dict[str, str] = {}
    for item in header_items:
        if ":" not in item:
            raise ValueError(f"Invalid header format: {item!r}")
        key, value = item.split(":", 1)
        headers[key.strip()] = value.strip()
    return headers


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")
    return payload


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")


def resolve_output_path(raw: str) -> Path:
    path = Path(raw)
    if path.is_absolute():
        return path
    return repo_root() / raw


def parse_bbox(raw: str) -> tuple[float, float, float, float]:
    parts = [part.strip() for part in raw.split(",")]
    if len(parts) != 4:
        raise ValueError("Bounding box must have four comma-separated numbers.")
    values = tuple(float(part) for part in parts)
    return values


def bbox_from_contract(payload: dict[str, Any]) -> tuple[float, float, float, float]:
    bounds = payload.get("bounds")
    if not isinstance(bounds, dict):
        raise ValueError("Base thermal contract has no bounds object.")
    return (
        float(bounds["minLng"]),
        float(bounds["minLat"]),
        float(bounds["maxLng"]),
        float(bounds["maxLat"]),
    )


def load_base_contract(city_id: str | None, source_id: str, input_json: str | None) -> dict[str, Any]:
    if input_json:
        path = resolve_output_path(input_json)
        return load_json(path)
    if not city_id:
        raise ValueError("Either --city-id or --input-json is required.")
    payload = city_map_payload(city_id)
    sources = payload.get("thermalSources")
    if not isinstance(sources, list):
        raise ValueError(f"City {city_id!r} has no thermal sources in the current app payload.")
    for source in sources:
        if isinstance(source, dict) and str(source.get("id")) == source_id:
            return deepcopy(source)
    raise ValueError(f"City {city_id!r} does not expose thermal source {source_id!r}.")


def build_query_url(collection_concept_id: str, bbox: tuple[float, float, float, float], page_size: int, time_start: str | None) -> str:
    params: list[tuple[str, str]] = [
        ("collection_concept_id", collection_concept_id),
        ("bounding_box", ",".join(str(value) for value in bbox)),
        ("page_size", str(page_size)),
        ("sort_key[]", "-start_date"),
    ]
    if time_start:
        params.append(("temporal", f"{time_start},"))
    return f"{CMR_GRANULES_URL}?{urllib.parse.urlencode(params)}"


def build_stac_query_url(base_url: str, collection_id: str, bbox: tuple[float, float, float, float], page_size: int, time_start: str | None) -> str:
    params: list[tuple[str, str]] = [
        ("bbox", ",".join(str(value) for value in bbox)),
        ("limit", str(page_size)),
    ]
    if time_start:
        params.append(("datetime", f"{time_start}/.."))
    return f"{base_url.rstrip('/')}/collections/{urllib.parse.quote(collection_id, safe='')}/items?{urllib.parse.urlencode(params)}"


def fetch_latest_granule(url: str, timeout_sec: float, headers: dict[str, str]) -> dict[str, Any]:
    request = urllib.request.Request(url)
    for key, value in headers.items():
        request.add_header(key, value)
    with urllib.request.urlopen(request, timeout=timeout_sec) as response:
        payload = json.loads(response.read().decode("utf-8"))
    feed = payload.get("feed")
    if not isinstance(feed, dict):
        raise ValueError("CMR response did not contain a feed object.")
    entries = feed.get("entry")
    if not isinstance(entries, list) or not entries:
        raise ValueError("No CMR granules matched the requested city bbox and collection.")
    granule = entries[0]
    if not isinstance(granule, dict):
        raise ValueError("CMR granule entry had an unexpected shape.")
    return granule


def fetch_latest_stac_item(url: str, timeout_sec: float, headers: dict[str, str]) -> dict[str, Any]:
    request = urllib.request.Request(url)
    for key, value in headers.items():
        request.add_header(key, value)
    with urllib.request.urlopen(request, timeout=timeout_sec) as response:
        payload = json.loads(response.read().decode("utf-8"))
    features = payload.get("features")
    if not isinstance(features, list) or not features:
        raise ValueError("No STAC items matched the requested city bbox and collection.")
    item = features[0]
    if not isinstance(item, dict):
        raise ValueError("STAC item had an unexpected shape.")
    return item


def first_link(granule: dict[str, Any], marker: str) -> str | None:
    links = granule.get("links")
    if not isinstance(links, list):
        return None
    for link in links:
        if not isinstance(link, dict):
            continue
        rel = link.get("rel")
        href = link.get("href")
        if isinstance(rel, str) and marker in rel and isinstance(href, str) and href.strip():
            return href
    return None


def first_asset_href(item: dict[str, Any], asset_key: str) -> str | None:
    assets = item.get("assets")
    if not isinstance(assets, dict):
        return None
    asset = assets.get(asset_key)
    if not isinstance(asset, dict):
        return None
    href = asset.get("href")
    if isinstance(href, str) and href.strip():
        return href
    return None


def first_stac_link(item: dict[str, Any], rel_value: str) -> str | None:
    links = item.get("links")
    if not isinstance(links, list):
        return None
    for link in links:
        if not isinstance(link, dict):
            continue
        rel = link.get("rel")
        href = link.get("href")
        if isinstance(rel, str) and rel == rel_value and isinstance(href, str) and href.strip():
            return href
    return None


def merge_granule_metadata(base_contract: dict[str, Any], granule: dict[str, Any], args: argparse.Namespace, query_url: str) -> dict[str, Any]:
    merged = deepcopy(base_contract)
    merged["id"] = args.source_id
    merged["label"] = base_contract.get("label") or f"{args.sensor} live thermal surface"
    merged["sourceName"] = args.source_name
    merged["provider"] = args.provider
    merged["sensor"] = args.sensor
    merged["adapterKind"] = args.adapter_kind
    merged["granuleConceptId"] = granule.get("id") if isinstance(granule.get("id"), str) else None
    merged["sceneId"] = (
        granule.get("producer_granule_id")
        if isinstance(granule.get("producer_granule_id"), str)
        else granule.get("title")
        if isinstance(granule.get("title"), str)
        else granule.get("id")
    )
    merged["capturedAt"] = granule.get("time_start") if isinstance(granule.get("time_start"), str) else None
    merged["publishedAt"] = granule.get("updated") if isinstance(granule.get("updated"), str) else None
    merged["sceneBrowseUrl"] = first_link(granule, "/browse#")
    merged["sceneDataUrl"] = first_link(granule, "/data#")
    merged["sceneMetadataUrl"] = first_link(granule, "/metadata#")
    merged["metadataPath"] = merged["sceneMetadataUrl"] or query_url
    merged.setdefault("properties", {})
    return merged


def merge_stac_metadata(base_contract: dict[str, Any], item: dict[str, Any], args: argparse.Namespace, query_url: str) -> dict[str, Any]:
    merged = deepcopy(base_contract)
    merged["id"] = args.source_id
    merged["label"] = base_contract.get("label") or f"{args.sensor} live thermal surface"
    merged["sourceName"] = args.source_name
    merged["provider"] = args.provider
    merged["sensor"] = args.sensor
    merged["adapterKind"] = args.adapter_kind
    merged["granuleConceptId"] = item.get("id") if isinstance(item.get("id"), str) else None
    properties = item.get("properties") if isinstance(item.get("properties"), dict) else {}
    scene_id = properties.get("landsat:scene_id") if isinstance(properties, dict) else None
    merged["sceneId"] = scene_id if isinstance(scene_id, str) and scene_id.strip() else item.get("id")
    merged["capturedAt"] = properties.get("datetime") if isinstance(properties.get("datetime"), str) else None
    merged["publishedAt"] = properties.get("updated") if isinstance(properties.get("updated"), str) else None
    merged["sceneBrowseUrl"] = first_asset_href(item, "thumbnail") or first_asset_href(item, "reduced_resolution_browse")
    merged["sceneDataUrl"] = first_asset_href(item, "lwir11") or first_asset_href(item, "TRAD") or first_asset_href(item, "coastal")
    merged["sceneMetadataUrl"] = first_asset_href(item, "MTL.json") or first_stac_link(item, "self")
    merged["metadataPath"] = merged["sceneMetadataUrl"] or query_url
    merged.setdefault("properties", {})
    return merged


def main() -> int:
    args = parse_args()
    try:
        headers = parse_headers(args.header)
        base_contract = load_base_contract(args.city_id, args.source_id, args.input_json)
        bbox = parse_bbox(args.bbox) if args.bbox else bbox_from_contract(base_contract)
        if args.source_system == "stac":
            collection_id = args.stac_collection_id or LANDSAT_STAC_COLLECTION_ID
            query_url = build_stac_query_url(args.stac_base_url, collection_id, bbox, args.page_size, args.time_start)
            item = fetch_latest_stac_item(query_url, args.timeout_sec, headers)
            payload = merge_stac_metadata(base_contract, item, args, query_url)
        else:
            if not args.collection_concept_id:
                raise ValueError("A CMR collection concept id is required when using the CMR source system.")
            query_url = build_query_url(args.collection_concept_id, bbox, args.page_size, args.time_start)
            granule = fetch_latest_granule(query_url, args.timeout_sec, headers)
            payload = merge_granule_metadata(base_contract, granule, args, query_url)
        output_path = resolve_output_path(args.output)
        write_json(output_path, payload)
        print(f"Wrote {output_path}")
        if payload.get("sceneId"):
            print(f"Scene: {payload['sceneId']}")
        if payload.get("capturedAt"):
            print(f"Captured: {payload['capturedAt']}")
        return 0
    except Exception as exc:  # pragma: no cover - CLI guard
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
