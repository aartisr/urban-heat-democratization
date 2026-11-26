"""Dependency Injection container setup.

Centralizes creation and configuration of services and repositories.
This ensures consistent, testable wiring of application components.
"""

from typing import Union, List, Dict, Any
from api.services.city import CityService
from api.services.run import RunService
from api.repositories.city import CityRepository
from api.repositories.run import RunRepository


def _convert_list_to_dict_store(store: Union[List[Dict[str, Any]], Dict[str, Dict[str, Any]], None]) -> Dict[str, Dict[str, Any]]:
    """Convert list-based store to dict-based store for repository compatibility.

    Args:
        store: Either a list of dicts or dict of dicts. If list, uses 'id' field as key.

    Returns:
        Dict-based store with IDs as keys
    """
    if store is None:
        return {}
    if isinstance(store, dict):
        return store
    if isinstance(store, list):
        return {str(item.get("id", "")): item for item in store if item.get("id")}
    return {}


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


def create_run_service(run_store: Union[list[dict[str, object]], dict[str, dict[str, object]], None] = None) -> RunService:
    """Factory for RunService.

    Creates a RunService with an in-memory RunRepository.
    For production, inject a database-backed repository instead.

    Args:
        run_store: Optional existing run store (can be list or dict)

    Returns:
        Fully configured RunService instance
    """
    dict_store = _convert_list_to_dict_store(run_store)
    repository = RunRepository(store=dict_store)
    return RunService(repository=repository)
