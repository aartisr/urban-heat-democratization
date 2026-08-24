from core.city_maps import city_map_payload


def test_boston_research_queue_points_are_geographic_coordinates() -> None:
    """Queue selections must stay within Boston when passed to MapLibre."""
    payload = city_map_payload("boston")
    bounds = payload["bounds"]

    assert bounds is not None
    for overlay in [*payload["heatZones"], *payload["accessZones"]]:
        assert overlay["points"]
        for point in overlay["points"]:
            assert bounds["minLng"] <= point["x"] <= bounds["maxLng"]
            assert bounds["minLat"] <= point["y"] <= bounds["maxLat"]
