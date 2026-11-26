"""Tests for city service layer.

Comprehensive test suite covering:
- CityService business logic
- Error handling and validation
- Repository integration
- Type safety
"""

import pytest
from api.services.city import CityService, CityDTO
from api.services.base import NotFoundError, ValidationError
from api.repositories.city import CityRepository


@pytest.fixture
def sample_city() -> CityDTO:
    """Create a sample city for testing."""
    return CityDTO(
        id="test-city",
        name="Test City",
        region="Test Region",
        population="1M",
        status="Active",
        baseline_temp_c=32.0,
        canopy_coverage="25%",
        planning_cost_multiplier=1.0,
        description="Test city",
    )


@pytest.fixture
def boston_city() -> CityDTO:
    """Create Boston city for testing."""
    return CityDTO(
        id="boston",
        name="Boston",
        region="Northeast US",
        population="675k",
        status="Active",
        baseline_temp_c=33.8,
        canopy_coverage="27%",
        planning_cost_multiplier=1.0,
        description="Boston test city",
    )


@pytest.fixture
def service() -> CityService:
    """Create service with fresh repository for each test."""
    repository = CityRepository()
    return CityService(repository=repository)


class TestCityServiceGet:
    """Tests for getting cities."""

    @pytest.mark.asyncio
    async def test_get_existing_city(self, service: CityService, sample_city: CityDTO) -> None:
        """Get existing city returns correct data."""
        # Arrange
        await service.create_city(sample_city)

        # Act
        result = await service.get_city("test-city")

        # Assert
        assert result.id == "test-city"
        assert result.name == "Test City"
        assert result.planning_cost_multiplier == 1.0

    @pytest.mark.asyncio
    async def test_get_nonexistent_city_raises_error(self, service: CityService) -> None:
        """Get non-existent city raises NotFoundError."""
        # Act & Assert
        with pytest.raises(NotFoundError, match="not found"):
            await service.get_city("nonexistent")


class TestCityServiceList:
    """Tests for listing cities."""

    @pytest.mark.asyncio
    async def test_list_empty(self, service: CityService) -> None:
        """List cities from empty service returns empty list."""
        # Act
        cities_list, total_count = await service.list_cities()

        # Assert
        assert cities_list == []
        assert total_count == 0

    @pytest.mark.asyncio
    async def test_list_multiple(self, service: CityService, sample_city: CityDTO, boston_city: CityDTO) -> None:
        """List cities returns all cities."""
        # Arrange
        await service.create_city(sample_city)
        await service.create_city(boston_city)

        # Act
        cities_list, total_count = await service.list_cities()

        # Assert
        assert len(cities_list) == 2
        assert total_count == 2
        assert any(c.id == "test-city" for c in cities_list)
        assert any(c.id == "boston" for c in cities_list)


class TestCityServiceCreate:
    """Tests for creating cities."""

    @pytest.mark.asyncio
    async def test_create_valid_city(self, service: CityService, sample_city: CityDTO) -> None:
        """Create valid city succeeds."""
        # Act
        result = await service.create_city(sample_city)

        # Assert
        assert result.id == "test-city"
        assert result.name == "Test City"

        # Verify persistence
        retrieved = await service.get_city("test-city")
        assert retrieved.id == "test-city"

    @pytest.mark.asyncio
    async def test_create_city_missing_id(self, service: CityService) -> None:
        """Create city without ID raises ValidationError."""
        # Arrange
        invalid_city = CityDTO(
            id="",
            name="City",
            region="Region",
            population="1M",
            status="Active",
            baseline_temp_c=32.0,
            canopy_coverage="25%",
            planning_cost_multiplier=1.0,
            description="Invalid",
        )

        # Act & Assert
        with pytest.raises(ValidationError, match="ID is required"):
            await service.create_city(invalid_city)

    @pytest.mark.asyncio
    async def test_create_city_missing_name(self, service: CityService, sample_city: CityDTO) -> None:
        """Create city without name raises ValidationError."""
        # Arrange
        sample_city.name = ""

        # Act & Assert
        with pytest.raises(ValidationError, match="name is required"):
            await service.create_city(sample_city)

    @pytest.mark.asyncio
    async def test_create_city_invalid_multiplier(self, service: CityService, sample_city: CityDTO) -> None:
        """Create city with invalid multiplier raises ValidationError."""
        # Arrange
        sample_city.planning_cost_multiplier = -1.0

        # Act & Assert
        with pytest.raises(ValidationError, match="must be positive"):
            await service.create_city(sample_city)

    @pytest.mark.asyncio
    async def test_create_city_invalid_temperature(self, service: CityService, sample_city: CityDTO) -> None:
        """Create city with out-of-range temperature raises ValidationError."""
        # Arrange
        sample_city.baseline_temp_c = 100.0

        # Act & Assert
        with pytest.raises(ValidationError, match="must be between"):
            await service.create_city(sample_city)


class TestCityServiceUpdate:
    """Tests for updating cities."""

    @pytest.mark.asyncio
    async def test_update_existing_city(self, service: CityService, sample_city: CityDTO) -> None:
        """Update existing city succeeds."""
        # Arrange
        await service.create_city(sample_city)
        sample_city.name = "Updated City"

        # Act
        result = await service.update_city("test-city", sample_city)

        # Assert
        assert result.name == "Updated City"

        # Verify persistence
        retrieved = await service.get_city("test-city")
        assert retrieved.name == "Updated City"

    @pytest.mark.asyncio
    async def test_update_nonexistent_city(self, service: CityService, sample_city: CityDTO) -> None:
        """Update non-existent city raises error."""
        # Act & Assert
        with pytest.raises(Exception):  # Repository raises KeyError
            await service.update_city("nonexistent", sample_city)


class TestCityServiceDelete:
    """Tests for deleting cities."""

    @pytest.mark.asyncio
    async def test_delete_existing_city(self, service: CityService, sample_city: CityDTO) -> None:
        """Delete existing city succeeds."""
        # Arrange
        await service.create_city(sample_city)

        # Act
        result = await service.delete_city("test-city")

        # Assert
        assert result is True

        # Verify deleted
        with pytest.raises(NotFoundError):
            await service.get_city("test-city")

    @pytest.mark.asyncio
    async def test_delete_nonexistent_city(self, service: CityService) -> None:
        """Delete non-existent city returns False."""
        # Act
        result = await service.delete_city("nonexistent")

        # Assert
        assert result is False


class TestCityServiceHealthCheck:
    """Tests for health check."""

    @pytest.mark.asyncio
    async def test_health_check_ok(self, service: CityService) -> None:
        """Health check returns True when service is healthy."""
        # Act
        result = await service.health_check()

        # Assert
        assert result is True
