import pytest

from core.city_maps import city_map_payload


@pytest.fixture(scope="module")
def boston_payload() -> dict:
    return city_map_payload("boston")


def test_boston_research_queue_points_are_geographic_coordinates(boston_payload: dict) -> None:
    """Queue selections must stay within Boston when passed to MapLibre."""
    payload = boston_payload
    bounds = payload["bounds"]

    assert bounds is not None
    for overlay in [*payload["heatZones"], *payload["accessZones"]]:
        assert overlay["points"]
        for point in overlay["points"]:
            assert bounds["minLng"] <= point["x"] <= bounds["maxLng"]
            assert bounds["minLat"] <= point["y"] <= bounds["maxLat"]


def test_boston_map_distinguishes_ranked_and_thresholded_layers(boston_payload: dict) -> None:
    """Uniform exported values must never be advertised as a priority ranking."""
    payload = boston_payload
    provenance = {layer["id"]: layer for layer in payload["layerProvenance"]}

    assert provenance["heat-bottleneck"]["scoreStatus"] == "ranked"
    assert provenance["cooling-access"]["scoreStatus"] == "flagged_not_ranked"
    assert payload["highlights"][1]["title"] == "Low-access zones flagged"
    assert payload["highlights"][1]["valueLabel"] == "zones"


def test_boston_map_payload_does_not_expose_local_filesystem_paths(boston_payload: dict) -> None:
    payload = boston_payload
    public_paths = [
        *payload["artifactPaths"],
        *(layer["filePath"] for layer in payload["layerProvenance"] if layer["filePath"]),
        *(source["filePath"] for source in payload["thermalSources"]),
        *(source["metadataPath"] for source in payload["thermalSources"]),
    ]

    assert all(not path.startswith("/") for path in public_paths)
    assert all("/Users/" not in path for path in public_paths)
