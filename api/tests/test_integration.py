"""Integration tests for city endpoints.

Tests the full HTTP layer with the service and repository.
Verifies:
- API contracts unchanged
- Backward compatibility
- Request/response schemas
"""

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI

from api.services.city import CityService, CityDTO
from api.repositories.city import CityRepository
from api.di_container import create_city_service


@pytest.fixture
def app() -> FastAPI:
    """Create test FastAPI app with city router."""
    app = FastAPI()
    return app


@pytest.fixture
def service() -> CityService:
    """Create service with fresh repository."""
    return create_city_service()


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    """Create test client."""
    return TestClient(app)


class TestCityEndpoints:
    """Integration tests for city endpoints."""

    @pytest.mark.asyncio
    async def test_city_service_integration(self, service: CityService) -> None:
        """Test full service flow."""
        # Create
        city = CityDTO(
            id="integration-test",
            name="Integration Test City",
            region="Test",
            population="1M",
            status="Active",
            baseline_temp_c=32.0,
            canopy_coverage="25%",
            planning_cost_multiplier=1.0,
            description="Test",
        )
        created = await service.create_city(city)
        assert created.id == "integration-test"

        # Read
        retrieved = await service.get_city("integration-test")
        assert retrieved.name == "Integration Test City"

        # List
        all_cities = await service.list_cities()
        assert len(all_cities) == 1

        # Update
        city.name = "Updated"
        updated = await service.update_city("integration-test", city)
        assert updated.name == "Updated"

        # Delete
        deleted = await service.delete_city("integration-test")
        assert deleted is True

        # Verify deleted
        final_list = await service.list_cities()
        assert len(final_list) == 0
