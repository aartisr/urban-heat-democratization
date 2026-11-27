"""The HTTP adapters must recognize errors raised by the domain services."""

import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock

from api.repositories.city import CityRepository
from api.repositories.run import RunRepository
from api.routers.cities import create_cities_router
from api.routers.runs_refactored import create_runs_router
from api.services.city import CityService
from api.services.run import RunService


def endpoint(router, path: str, method: str):
    return next(route.endpoint for route in router.routes if route.path == path and method in route.methods)


@pytest.mark.asyncio
async def test_city_router_preserves_not_found_and_validation_statuses():
    router = create_cities_router(CityService(CityRepository()))

    with pytest.raises(HTTPException) as missing:
        await endpoint(router, "/api/v1/cities/{city_id}", "GET")("missing")
    assert missing.value.status_code == 404

    with pytest.raises(HTTPException) as invalid:
        await endpoint(router, "/api/v1/cities", "POST")({"id": "", "name": "Boston"})
    assert invalid.value.status_code == 422


@pytest.mark.asyncio
async def test_run_router_preserves_not_found_and_validation_statuses():
    router = create_runs_router(RunService(RunRepository()))

    with pytest.raises(HTTPException) as missing:
        await endpoint(router, "/api/v1/runs/{run_id}", "GET")("missing")
    assert missing.value.status_code == 404

    with pytest.raises(HTTPException) as invalid:
        await endpoint(router, "/api/v1/runs", "POST")({"id": "", "cityId": "boston", "scenario": "baseline"})
    assert invalid.value.status_code == 422


@pytest.mark.asyncio
async def test_internal_failures_do_not_expose_storage_details():
    service = CityService(CityRepository())
    service.list_cities = AsyncMock(side_effect=RuntimeError("private storage connection"))
    router = create_cities_router(service)

    with pytest.raises(HTTPException) as failure:
        await endpoint(router, "/api/v1/cities", "GET")()
    assert failure.value.status_code == 500
    assert failure.value.detail == "Could not list cities"
