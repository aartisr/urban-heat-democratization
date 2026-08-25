import asyncio
import inspect

from api.main import address_advice_context


def test_address_advice_context_returns_city_wide_evidence_without_location_input():
    payload = asyncio.run(address_advice_context("boston"))

    assert payload.cityId == "boston"
    assert payload.status == "available"
    assert payload.spectralStatus == "not_available"
    assert payload.layers
    assert all(layer.sourceName and layer.provider for layer in payload.layers)
    assert any("No address" in limit for limit in payload.limits)


def test_address_advice_endpoint_contract_has_no_place_or_coordinate_parameter():
    assert list(inspect.signature(address_advice_context).parameters) == ["city_id"]


def test_address_advice_context_declines_unregistered_city_coverage():
    payload = asyncio.run(address_advice_context("not-a-city"))

    assert payload.status == "unavailable"
    assert payload.spectralStatus == "not_available"
    assert payload.layers == []
