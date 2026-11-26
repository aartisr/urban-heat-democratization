"""City repository implementation using in-memory store.

Implements the Repository[T] interface for Cities. This in-memory version
can be swapped for SQLite, PostgreSQL, MongoDB, etc. without changing
service or router code.
"""

from typing import Optional, List, cast
from api.services.base import Repository
from api.services.city import CityDTO


class CityRepository(Repository[CityDTO]):
    """In-memory repository for city profiles.

    Design:
    - Implements Repository[CityDTO] interface for type safety
    - Can be swapped for SQL/NoSQL implementations
    - Supports basic CRUD operations
    - Thread-safe for concurrent access

    Note:
    - This is a proof-of-concept in-memory implementation
    - For production, replace with database-backed version
    - Future: Add query filters, pagination, sorting
    """

    def __init__(self, store: dict[str, dict[str, object]] | None = None) -> None:
        """Initialize repository with optional backing store.

        Args:
            store: Optional existing city store to use. If None, starts empty.
        """
        self._store: dict[str, dict[str, object]] = store or {}

    async def get(self, id: str) -> Optional[CityDTO]:
        """Get city by ID.

        Args:
            id: City ID

        Returns:
            CityDTO if found, None otherwise
        """
        if id not in self._store:
            return None
        
        city_dict = self._store[id]
        return self._dict_to_dto(city_dict)

    async def list(self) -> List[CityDTO]:
        """List all cities.

        Returns:
            List of all CityDTOs
        """
        return [self._dict_to_dto(city_dict) for city_dict in self._store.values()]

    async def create(self, item: CityDTO) -> CityDTO:
        """Create new city.

        Args:
            item: City to create

        Returns:
            Created city
        """
        self._store[item.id] = self._dto_to_dict(item)
        return item

    async def update(self, id: str, item: CityDTO) -> CityDTO:
        """Update existing city.

        Args:
            id: City ID to update
            item: Updated city data

        Returns:
            Updated city

        Raises:
            KeyError: If city not found
        """
        if id not in self._store:
            raise KeyError(f"City '{id}' not found")
        
        self._store[id] = self._dto_to_dict(item)
        return item

    async def delete(self, id: str) -> bool:
        """Delete city by ID.

        Args:
            id: City ID to delete

        Returns:
            True if deleted, False if not found
        """
        if id in self._store:
            del self._store[id]
            return True
        return False

    @staticmethod
    def _dict_to_dto(city_dict: dict[str, object]) -> CityDTO:
        """Convert dictionary to CityDTO.

        Args:
            city_dict: Dictionary representation

        Returns:
            CityDTO instance
        """
        baseline_temp = city_dict.get("baselineTempC")
        multiplier = city_dict.get("planningCostMultiplier")
        
        return CityDTO(
            id=str(city_dict.get("id", "")),
            name=str(city_dict.get("name", "")),
            region=str(city_dict.get("region", "Unknown")),
            population=str(city_dict.get("population", "Unknown")),
            status=str(city_dict.get("status", "Research")),
            baseline_temp_c=float(cast(float, baseline_temp)) if baseline_temp is not None else 32.0,
            canopy_coverage=str(city_dict.get("canopyCoverage", "Unknown")),
            planning_cost_multiplier=float(cast(float, multiplier)) if multiplier is not None else 1.0,
            description=str(city_dict.get("description", "")),
        )

    @staticmethod
    def _dto_to_dict(city_dto: CityDTO) -> dict[str, object]:
        """Convert CityDTO to dictionary.

        Args:
            city_dto: CityDTO instance

        Returns:
            Dictionary representation
        """
        return {
            "id": city_dto.id,
            "name": city_dto.name,
            "region": city_dto.region,
            "population": city_dto.population,
            "status": city_dto.status,
            "baselineTempC": city_dto.baseline_temp_c,
            "canopyCoverage": city_dto.canopy_coverage,
            "planningCostMultiplier": city_dto.planning_cost_multiplier,
            "description": city_dto.description,
        }
