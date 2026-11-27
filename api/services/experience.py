"""Experience Service - User experience and interaction tracking."""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime, timezone

from api.services.base import AbstractService, Repository, NotFoundError, ValidationError


@dataclass
class ExperienceDTO:
    """Data Transfer Object for Experience"""

    id: str
    user_id: str
    city_id: str
    interaction_type: str  # "view", "analyze", "explore", "export"
    duration_ms: int
    timestamp: str
    metadata: dict[str, object]
    created_at: str


class ExperienceService(AbstractService):
    """Service for tracking user interactions and experiences."""

    def __init__(self, repository: Repository[ExperienceDTO]) -> None:
        """Initialize ExperienceService.

        Args:
            repository: Repository for experience persistence
        """
        self._repository = repository

    async def health_check(self) -> bool:
        """Check if service is healthy."""
        try:
            await self._repository.list()
            return True
        except Exception:
            return False

    async def track_interaction(
        self,
        user_id: str,
        city_id: str,
        interaction_type: str,
        duration_ms: int,
        metadata: Optional[dict[str, object]] = None,
    ) -> ExperienceDTO:
        """Track user interaction.

        Args:
            user_id: User identifier
            city_id: City being interacted with
            interaction_type: Type of interaction
            duration_ms: Duration in milliseconds
            metadata: Optional interaction metadata

        Returns:
            Created ExperienceDTO

        Raises:
            ValidationError: If interaction data is invalid
        """
        from uuid import uuid4

        experience = ExperienceDTO(
            id=f"exp-{uuid4().hex[:12]}",
            user_id=user_id,
            city_id=city_id,
            interaction_type=interaction_type,
            duration_ms=duration_ms,
            timestamp=datetime.now(timezone.utc).isoformat(),
            metadata=metadata or {},
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        self._validate_experience(experience)
        return await self._repository.create(experience)

    async def get_user_analytics(self, user_id: str) -> dict[str, object]:
        """Get analytics for a user.

        Args:
            user_id: User identifier

        Returns:
            Dictionary with analytics data
        """
        all_experiences_list, _ = await self._repository.list()
        user_experiences = [e for e in all_experiences_list if e.user_id == user_id]

        if not user_experiences:
            return {"user_id": user_id, "interactions": 0, "total_time_ms": 0}

        total_time = sum(e.duration_ms for e in user_experiences)
        interaction_counts = {}
        for exp in user_experiences:
            interaction_counts[exp.interaction_type] = (
                interaction_counts.get(exp.interaction_type, 0) + 1
            )

        return {
            "user_id": user_id,
            "interactions": len(user_experiences),
            "total_time_ms": total_time,
            "avg_duration_ms": total_time // len(user_experiences),
            "interaction_types": interaction_counts,
        }

    def _validate_experience(self, experience: ExperienceDTO) -> None:
        """Validate experience data.

        Args:
            experience: ExperienceDTO to validate

        Raises:
            ValidationError: If validation fails
        """
        if not experience.user_id or not experience.user_id.strip():
            raise ValidationError("User ID is required")
        if not experience.city_id or not experience.city_id.strip():
            raise ValidationError("City ID is required")
        if experience.duration_ms < 0:
            raise ValidationError("Duration must be non-negative")
