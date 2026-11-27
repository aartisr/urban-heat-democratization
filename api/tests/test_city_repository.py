"""Tests for city repository layer.

Covers:
- CRUD operations
- Data type conversions (DTO ↔ dict)
- Error conditions
"""

import pytest
from api.domain.errors import NotFoundError
from api.repositories.city import CityRepository
from api.services.city import CityDTO


@pytest.fixture
def sample_city() -> CityDTO:
    """Create a sample city DTO."""
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
def repository() -> CityRepository:
    """Create a fresh repository for each test."""
    return CityRepository()


class TestCityRepositoryGet:
    """Tests for repository get operations."""

    @pytest.mark.asyncio
    async def test_get_existing_city(self, repository: CityRepository, sample_city: CityDTO) -> None:
        """Get existing city returns correct DTO."""
        # Arrange
        await repository.create(sample_city)

        # Act
        result = await repository.get("test-city")

        # Assert
        assert result is not None
        assert result.id == "test-city"
        assert result.name == "Test City"
        assert result.planning_cost_multiplier == 1.0

    @pytest.mark.asyncio
    async def test_get_nonexistent_city(self, repository: CityRepository) -> None:
        """Get non-existent city returns None."""
        # Act
        result = await repository.get("nonexistent")

        # Assert
        assert result is None


class TestCityRepositoryList:
    """Tests for repository list operations."""

    @pytest.mark.asyncio
    async def test_list_empty(self, repository: CityRepository) -> None:
        """List empty repository returns empty list."""
        # Act
        result, total = await repository.list()

        # Assert
        assert result == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_list_multiple(self, repository: CityRepository) -> None:
        """List returns all cities."""
        # Arrange
        city1 = CityDTO("id1", "City 1", "Region", "1M", "Active", 30.0, "20%", 1.0, "City 1")
        city2 = CityDTO("id2", "City 2", "Region", "2M", "Active", 35.0, "25%", 1.1, "City 2")
        await repository.create(city1)
        await repository.create(city2)

        # Act
        result, total = await repository.list()

        # Assert
        assert len(result) == 2
        assert total == 2
        assert any(c.id == "id1" for c in result)
        assert any(c.id == "id2" for c in result)


class TestCityRepositoryCreate:
    """Tests for repository create operations."""

    @pytest.mark.asyncio
    async def test_create_city(self, repository: CityRepository, sample_city: CityDTO) -> None:
        """Create city persists and returns created city."""
        # Act
        result = await repository.create(sample_city)

        # Assert
        assert result.id == "test-city"
        assert result.name == "Test City"

        # Verify persistence
        retrieved = await repository.get("test-city")
        assert retrieved is not None
        assert retrieved.id == "test-city"


class TestCityRepositoryUpdate:
    """Tests for repository update operations."""

    @pytest.mark.asyncio
    async def test_update_existing_city(self, repository: CityRepository, sample_city: CityDTO) -> None:
        """Update existing city modifies data."""
        # Arrange
        await repository.create(sample_city)
        sample_city.name = "Updated"

        # Act
        result = await repository.update("test-city", sample_city)

        # Assert
        assert result.name == "Updated"

        # Verify persistence
        retrieved = await repository.get("test-city")
        assert retrieved is not None
        assert retrieved.name == "Updated"

    @pytest.mark.asyncio
    async def test_update_nonexistent_city(self, repository: CityRepository, sample_city: CityDTO) -> None:
        """Update non-existent city raises the shared domain error."""
        # Act & Assert
        with pytest.raises(NotFoundError):
            await repository.update("nonexistent", sample_city)


class TestCityRepositoryDelete:
    """Tests for repository delete operations."""

    @pytest.mark.asyncio
    async def test_delete_existing_city(self, repository: CityRepository, sample_city: CityDTO) -> None:
        """Delete existing city removes it."""
        # Arrange
        await repository.create(sample_city)

        # Act
        result = await repository.delete("test-city")

        # Assert
        assert result is True

        # Verify deleted
        retrieved = await repository.get("test-city")
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent_city(self, repository: CityRepository) -> None:
        """Delete non-existent city returns False."""
        # Act
        result = await repository.delete("nonexistent")

        # Assert
        assert result is False


class TestCityRepositoryConversions:
    """Tests for DTO ↔ dict conversions."""

    def test_dict_to_dto(self) -> None:
        """Convert dict to DTO preserves all fields."""
        # Arrange
        city_dict = {
            "id": "test",
            "name": "Test",
            "region": "Region",
            "population": "1M",
            "status": "Active",
            "baselineTempC": 32.0,
            "canopyCoverage": "25%",
            "planningCostMultiplier": 1.5,
            "description": "Test city",
        }

        # Act
        result = CityRepository._dict_to_dto(city_dict)

        # Assert
        assert result.id == "test"
        assert result.name == "Test"
        assert result.baseline_temp_c == 32.0
        assert result.planning_cost_multiplier == 1.5

    def test_dto_to_dict(self) -> None:
        """Convert DTO to dict preserves all fields."""
        # Arrange
        city_dto = CityDTO(
            id="test",
            name="Test",
            region="Region",
            population="1M",
            status="Active",
            baseline_temp_c=32.0,
            canopy_coverage="25%",
            planning_cost_multiplier=1.5,
            description="Test city",
        )

        # Act
        result = CityRepository._dto_to_dict(city_dto)

        # Assert
        assert result["id"] == "test"
        assert result["baselineTempC"] == 32.0
        assert result["planningCostMultiplier"] == 1.5
