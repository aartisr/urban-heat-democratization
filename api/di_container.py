"""Dependency Injection container setup.

Centralizes creation and configuration of services and repositories.
This ensures consistent, testable wiring of application components.
"""

from api.services.city import CityService
from api.repositories.city import CityRepository


def create_city_service(city_store: dict[str, dict[str, object]] | None = None) -> CityService:
    """Factory for CityService.

    Creates a CityService with an in-memory CityRepository.
    For production, inject a database-backed repository instead.

    Args:
        city_store: Optional existing city store to use

    Returns:
        Fully configured CityService instance
    """
    repository = CityRepository(store=city_store)
    return CityService(repository=repository)
