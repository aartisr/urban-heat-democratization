"""Mitigation Service - Heat mitigation strategy recommendations."""

from dataclasses import dataclass
from typing import Optional

from api.services.base import AbstractService, Repository, NotFoundError, ValidationError


@dataclass
class MitigationStrategyDTO:
    """Data Transfer Object for Mitigation Strategy"""

    id: str
    city_id: str
    name: str
    description: str
    primary_intervention: str  # "green_roof", "urban_tree", "cool_pavement", etc.
    estimated_impact: float  # Temperature reduction in degrees
    implementation_cost: float  # In dollars
    payback_period_years: float
    co_benefits: list[str]  # Health, air quality, etc.
    implementation_timeline: str  # "immediate", "short_term", "medium_term", "long_term"
    priority_score: float  # 0-100
    created_at: str


class MitigationService(AbstractService):
    """Service for heat mitigation strategies and recommendations."""

    def __init__(self, repository: Repository[MitigationStrategyDTO]) -> None:
        """Initialize MitigationService.

        Args:
            repository: Repository for strategy persistence
        """
        self._repository = repository

    async def health_check(self) -> bool:
        """Check if service is healthy."""
        try:
            await self._repository.list()
            return True
        except Exception:
            return False

    async def get_strategy(self, strategy_id: str) -> MitigationStrategyDTO:
        """Get mitigation strategy by ID.

        Args:
            strategy_id: Strategy identifier

        Returns:
            MitigationStrategyDTO

        Raises:
            NotFoundError: If strategy not found
        """
        strategy = await self._repository.get(strategy_id)
        if strategy is None:
            raise NotFoundError(f"Strategy '{strategy_id}' not found")
        return strategy

    async def list_strategies_for_city(self, city_id: str) -> list[MitigationStrategyDTO]:
        """List mitigation strategies for a city.

        Args:
            city_id: City identifier

        Returns:
            List of MitigationStrategyDTO
        """
        all_strategies_list, _ = await self._repository.list()
        return [s for s in all_strategies_list if s.city_id == city_id]

    async def rank_strategies_by_impact(self, city_id: str) -> list[MitigationStrategyDTO]:
        """List strategies ranked by estimated impact (descending).

        Args:
            city_id: City identifier

        Returns:
            Sorted list of MitigationStrategyDTO
        """
        strategies = await self.list_strategies_for_city(city_id)
        return sorted(strategies, key=lambda s: s.estimated_impact, reverse=True)

    async def rank_strategies_by_roi(self, city_id: str) -> list[MitigationStrategyDTO]:
        """List strategies ranked by ROI (impact per dollar).

        Args:
            city_id: City identifier

        Returns:
            Sorted list of MitigationStrategyDTO
        """
        strategies = await self.list_strategies_for_city(city_id)

        def roi_score(s: MitigationStrategyDTO) -> float:
            if s.implementation_cost == 0:
                return 0.0
            return s.estimated_impact / (s.implementation_cost / 1_000_000)

        return sorted(strategies, key=roi_score, reverse=True)

    async def create_strategy(self, strategy: MitigationStrategyDTO) -> MitigationStrategyDTO:
        """Create new mitigation strategy.

        Args:
            strategy: MitigationStrategyDTO

        Returns:
            Created MitigationStrategyDTO

        Raises:
            ValidationError: If strategy data is invalid
        """
        self._validate_strategy(strategy)
        return await self._repository.create(strategy)

    def _validate_strategy(self, strategy: MitigationStrategyDTO) -> None:
        """Validate strategy data.

        Args:
            strategy: MitigationStrategyDTO to validate

        Raises:
            ValidationError: If validation fails
        """
        if not strategy.id or not strategy.id.strip():
            raise ValidationError("Strategy ID is required")
        if not strategy.city_id or not strategy.city_id.strip():
            raise ValidationError("City ID is required")
        if strategy.estimated_impact < 0:
            raise ValidationError("Impact must be non-negative")
        if strategy.implementation_cost < 0:
            raise ValidationError("Cost must be non-negative")
        if strategy.payback_period_years < 0:
            raise ValidationError("Payback period must be non-negative")
        if not 0 <= strategy.priority_score <= 100:
            raise ValidationError("Priority score must be between 0 and 100")
