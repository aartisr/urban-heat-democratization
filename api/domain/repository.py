"""Repository interface - stable contract for data persistence.

This module defines the Repository interface that all data adapters must
implement. This enables:

- Swappable implementations (in-memory, SQLite, PostgreSQL, etc.)
- Testing against multiple backends with same test suite
- Clear data access contracts
- Server-side filtering and efficient queries

Design:
- Generic [T] for type safety
- Minimal interface (not every query pattern)
- Query parameters support common patterns (filter, pagination)
- Returns explicit error types from api.domain.errors
"""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Optional, List, Any

from api.domain.errors import NotFoundError, ValidationError, RepositoryError

T = TypeVar("T")


class Repository(ABC, Generic[T]):
    """Generic repository for data persistence abstraction.

    All repositories implement this interface, ensuring consistency and
    enabling substitutability. Services depend on this interface, not
    concrete implementations.

    Type Safety:
    - Generic[T] ensures type-safe access
    - All methods fully typed for mypy --strict
    - No `Any` types in signatures

    Error Contracts:
    - NotFoundError: Resource does not exist
    - ValidationError: Input validation fails
    - RepositoryError: Infrastructure error (database, etc.)
    - Exceptions always match documentation

    Thread Safety:
    - Concrete implementations must document concurrency guarantees
    - Adapters should use transactions for consistency
    """

    @abstractmethod
    async def get(self, id: str) -> Optional[T]:
        """Get single item by ID.

        Args:
            id: Unique identifier (never None)

        Returns:
            Item if found, None if not found

        Raises:
            ValidationError: If id is invalid
            RepositoryError: If storage access fails

        Example:
            >>> city = await repo.get("boston")
            >>> assert city is None or city.id == "boston"
        """
        pass

    @abstractmethod
    async def list(
        self,
        filter: dict[str, Any] | None = None,
        offset: int = 0,
        limit: int | None = None,
    ) -> tuple[List[T], int]:
        """List items with optional filtering and pagination.

        Server-side filtering and pagination are essential for scalability.
        Implementations should use database query capabilities, not
        load-all-then-filter.

        Args:
            filter: Optional filters (implementation-defined keys)
            offset: Starting position (0-based)
            limit: Maximum items to return; None = no limit

        Returns:
            Tuple of (items, total_count) where total_count is count
            of all matching items (ignoring limit)

        Raises:
            ValidationError: If filter/offset/limit invalid
            RepositoryError: If storage access fails

        Example:
            >>> items, total = await repo.list(
            ...     filter={"status": "active"},
            ...     offset=0,
            ...     limit=20,
            ... )
            >>> assert len(items) <= 20
            >>> assert total >= len(items)
        """
        pass

    @abstractmethod
    async def create(self, item: T) -> T:
        """Create new item.

        Args:
            item: Item to create (should not have ID set)

        Returns:
            Created item with ID assigned

        Raises:
            ValidationError: If item validation fails
            RepositoryError: If storage access fails

        Example:
            >>> city = CityDTO(id="", name="Boston", ...)
            >>> created = await repo.create(city)
            >>> assert created.id != ""
        """
        pass

    @abstractmethod
    async def update(self, id: str, item: T) -> T:
        """Update existing item.

        Args:
            id: ID of item to update
            item: Updated item data

        Returns:
            Updated item

        Raises:
            NotFoundError: If item not found
            ValidationError: If item validation fails
            RepositoryError: If storage access fails

        Example:
            >>> updated = await repo.update("boston", new_data)
            >>> assert updated.id == "boston"
        """
        pass

    @abstractmethod
    async def delete(self, id: str) -> bool:
        """Delete item by ID.

        Args:
            id: ID of item to delete

        Returns:
            True if deleted, False if not found (never raises NotFoundError)

        Raises:
            ValidationError: If id is invalid
            RepositoryError: If storage access fails

        Note:
            Idempotent: calling twice with same id returns True then False
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if repository is healthy and accessible.

        Returns:
            True if repository can operate, False otherwise

        Note:
            Never raises; always returns bool for health endpoints
        """
        pass
