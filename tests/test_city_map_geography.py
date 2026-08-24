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


def test_boston_map_exposes_independently_ranked_decision_layers(boston_payload: dict) -> None:
    """Boston exports continuous Cheeger and cooling-access decision surfaces."""
    payload = boston_payload
    provenance = {layer["id"]: layer for layer in payload["layerProvenance"]}

    assert provenance["heat-bottleneck"]["scoreStatus"] == "ranked"
    assert provenance["cooling-access"]["scoreStatus"] == "ranked"
    assert provenance["cooling-access"]["distinctScoreCount"] >= 2
    assert payload["highlights"][1]["title"] == "Top low-access zone"
    assert payload["highlights"][1]["valueLabel"] == "score"


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
