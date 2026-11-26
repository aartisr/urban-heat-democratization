"""City service implementation.

Handles all city-related business logic: profile management, validation,
and coordination with the repository. Completely decoupled from FastAPI.
"""

from typing import Optional, List
from dataclasses import dataclass

from api.services.base import AbstractService, Repository, NotFoundError, ValidationError


@dataclass
class CityDTO:
    """Data Transfer Object for City.
    
    Represents a city with all its attributes. Used for service layer
    communication and type safety.
    """
    id: str
    name: str
    region: str
    population: str
    status: str
    baseline_temp_c: float
    canopy_coverage: str
    planning_cost_multiplier: float
    description: str


class CityService(AbstractService):
    """Service for city domain operations.

    Responsibilities:
    - Profile validation and normalization
    - Business rules enforcement (e.g., planning cost multiplier ranges)
    - Coordination between routers and repositories
    - Error transformation to domain-specific exceptions

    Design:
    - Depends on CityRepository interface (not concrete implementation)
    - Fully testable by mocking repository
    - Independent of FastAPI routing layer
    - 100% type-safe for mypy --strict
    """

    def __init__(self, repository: Repository[CityDTO]) -> None:
        """Initialize service with injected repository.

        Args:
            repository: Abstraction for city persistence
        """
        self._repository = repository

    async def health_check(self) -> bool:
        """Verify service and repository are healthy.

        Returns:
            bool: True if service can operate
        """
        try:
            # Try to list cities to verify repository connectivity
            await self._repository.list()
            return True
        except Exception:
            return False

    async def get_city(self, city_id: str) -> CityDTO:
        """Get city profile by ID.

        Args:
            city_id: City identifier

        Returns:
            City profile with full details

        Raises:
            NotFoundError: If city not found
        """
        city = await self._repository.get(city_id)
        if city is None:
            raise NotFoundError(f"City '{city_id}' not found in registry")
        return city

    async def list_cities(self) -> List[CityDTO]:
        """List all available cities.

        Returns:
            List of all city profiles (may be empty)
        """
        return await self._repository.list()

    async def create_city(self, city: CityDTO) -> CityDTO:
        """Create new city profile.

        Args:
            city: City data to create

        Returns:
            Created city with ID assigned

        Raises:
            ValidationError: If city data is invalid
        """
        self._validate_city(city)
        return await self._repository.create(city)

    async def update_city(self, city_id: str, city: CityDTO) -> CityDTO:
        """Update existing city profile.

        Args:
            city_id: ID of city to update
            city: Updated city data

        Returns:
            Updated city profile

        Raises:
            NotFoundError: If city not found
            ValidationError: If city data is invalid
        """
        self._validate_city(city)
        return await self._repository.update(city_id, city)

    async def delete_city(self, city_id: str) -> bool:
        """Delete city profile.

        Args:
            city_id: ID of city to delete

        Returns:
            True if deleted, False if not found
        """
        return await self._repository.delete(city_id)

    def _validate_city(self, city: CityDTO) -> None:
        """Validate city data.

        Args:
            city: City to validate

        Raises:
            ValidationError: If validation fails
        """
        if not city.id or not city.id.strip():
            raise ValidationError("City ID is required")
        if not city.name or not city.name.strip():
            raise ValidationError("City name is required")
        if city.planning_cost_multiplier <= 0:
            raise ValidationError("Planning cost multiplier must be positive")
        if city.baseline_temp_c < -50 or city.baseline_temp_c > 60:
            raise ValidationError("Baseline temperature must be between -50°C and 60°C")
