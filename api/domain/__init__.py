"""Domain layer - core types and contracts.

This module contains stable, business-domain types and interfaces that
higher-level layers depend on. It has no dependencies on framework code
or infrastructure implementations.

Stability: These types are the foundation for the entire application.
Changes here affect all dependent layers and should be carefully planned.
"""

from api.domain.errors import (
    DomainError,
    NotFoundError,
    ValidationError,
    ConflictError,
)
from api.domain.models import (
    CityDTO,
    RunDTO,
    ScenarioDTO,
    ExperienceDTO,
    MitigationDTO,
)
from api.domain.repository import Repository

__all__ = [
    # Errors
    "DomainError",
    "NotFoundError",
    "ValidationError",
    "ConflictError",
    # Models
    "CityDTO",
    "RunDTO",
    "ScenarioDTO",
    "ExperienceDTO",
    "MitigationDTO",
    # Interfaces
    "Repository",
]
