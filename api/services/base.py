"""Base service and repository interfaces for clean architecture.

This module defines the abstract base classes that all services and repositories
must implement. This ensures consistent contracts and enables dependency injection.
"""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Optional, List

T = TypeVar("T")


class ServiceError(Exception):
    """Base exception for all service errors."""
    pass


class NotFoundError(ServiceError):
    """Raised when a requested resource is not found."""
    pass


class ValidationError(ServiceError):
    """Raised when input validation fails."""
    pass


class AbstractService(ABC):
    """Base class for all application services.

    Services handle business logic and coordinate operations between routers
    and repositories. They are independent of FastAPI and can be tested
    without HTTP context.

    Design principles:
    - Single Responsibility: Each service handles one domain
    - Loose Coupling: Injected dependencies, no direct imports
    - High Testability: Can mock all dependencies
    - Framework Agnostic: No FastAPI/HTTP concepts
    """

    @abstractmethod
    async def health_check(self) -> bool:
        """Verify service is healthy and ready.

        Returns:
            bool: True if service is healthy and can operate

        Note:
            Implementations should check critical dependencies (database, etc.)
        """
        pass


class Repository(ABC, Generic[T]):
    """Generic repository for data persistence abstraction.

    This interface ensures all repositories implement the same contract,
    making them swappable. Services depend on this interface, not concrete
    repository implementations.

    Design principles:
    - Single Responsibility: Only handles persistence
    - Interface Consistency: All repositories have same methods
    - Swappability: Can replace SQLite with PostgreSQL, MongoDB, etc.
    - Framework Agnostic: No ORM-specific concepts leaking out

    Type Safety:
    - Repositories are Generic[T], ensuring type-safe access
    - All methods are fully typed for mypy --strict compliance
    """

    @abstractmethod
    async def get(self, id: str) -> Optional[T]:
        """Get single item by ID.

        Args:
            id: Unique identifier

        Returns:
            Item if found, None if not found

        Raises:
            ServiceError: On database errors
        """
        pass

    @abstractmethod
    async def list(self) -> List[T]:
        """List all items.

        Returns:
            List of all items (may be empty)

        Raises:
            ServiceError: On database errors
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
            ServiceError: On database errors
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
            ServiceError: On database errors
        """
        pass

    @abstractmethod
    async def delete(self, id: str) -> bool:
        """Delete item by ID.

        Args:
            id: ID of item to delete

        Returns:
            True if deleted, False if not found

        Raises:
            ServiceError: On database errors
        """
        pass
