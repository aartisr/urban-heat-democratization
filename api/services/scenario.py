"""Scenario Service - Business logic for thermal mitigation scenarios."""

from typing import Optional, List, Any

from api.domain import Repository, NotFoundError, ValidationError, ScenarioDTO
from api.services.base import AbstractService


class ScenarioService(AbstractService):
    """Service for managing thermal mitigation scenarios."""

    def __init__(self, repository: Repository[ScenarioDTO]) -> None:
        """Initialize ScenarioService.

        Args:
            repository: Repository for scenario persistence
        """
        self._repository = repository

    async def health_check(self) -> bool:
        """Check if service is healthy.

        Returns:
            True if service is operational
        """
        try:
            await self._repository.health_check()
            return True
        except Exception:
            return False

    async def get_scenario(self, scenario_id: str) -> ScenarioDTO:
        """Get scenario by ID.

        Args:
            scenario_id: Scenario identifier

        Returns:
            ScenarioDTO with all scenario data

        Raises:
            NotFoundError: If scenario does not exist
        """
        scenario = await self._repository.get(scenario_id)
        if scenario is None:
            raise NotFoundError(f"Scenario '{scenario_id}' not found")
        return scenario

    async def list_scenarios(self, offset: int = 0, limit: int | None = None) -> tuple[list[ScenarioDTO], int]:
        """List all scenarios with pagination.

        Args:
            offset: Starting position (0-based)
            limit: Maximum scenarios to return

        Returns:
            Tuple of (scenarios, total_count)
        """
        return await self._repository.list(offset=offset, limit=limit)

    async def create_scenario(self, scenario: ScenarioDTO) -> ScenarioDTO:
        """Create new scenario.

        Args:
            scenario: ScenarioDTO with scenario data

        Returns:
            Created ScenarioDTO

        Raises:
            ValidationError: If scenario data is invalid
        """
        self._validate_scenario(scenario)
        return await self._repository.create(scenario)

    async def update_scenario(self, scenario_id: str, scenario: ScenarioDTO) -> ScenarioDTO:
        """Update existing scenario.

        Args:
            scenario_id: Scenario identifier
            scenario: Updated ScenarioDTO

        Returns:
            Updated ScenarioDTO

        Raises:
            ValidationError: If scenario data is invalid
        """
        self._validate_scenario(scenario)
        return await self._repository.update(scenario_id, scenario)

    async def delete_scenario(self, scenario_id: str) -> bool:
        """Delete scenario.

        Args:
            scenario_id: Scenario identifier

        Returns:
            True if deleted, False if not found
        """
        return await self._repository.delete(scenario_id)

    async def calculate_impact(self, scenario_id: str, baseline_temp: float) -> float:
        """Calculate temperature reduction impact.

        Args:
            scenario_id: Scenario identifier
            baseline_temp: Baseline temperature

        Returns:
            Expected temperature reduction in degrees
        """
        scenario = await self.get_scenario(scenario_id)
        return baseline_temp * scenario.expected_reduction / 100.0

    def _validate_scenario(self, scenario: ScenarioDTO) -> None:
        """Validate scenario data.

        Args:
            scenario: ScenarioDTO to validate

        Raises:
            ValidationError: If validation fails
        """
        if not scenario.id or not scenario.id.strip():
            raise ValidationError("Scenario ID is required")
        if not scenario.name or not scenario.name.strip():
            raise ValidationError("Scenario name is required")
        if scenario.baseline_temp < -50 or scenario.baseline_temp > 60:
            raise ValidationError("Baseline temperature must be between -50 and 60°C")
        if scenario.expected_reduction < 0 or scenario.expected_reduction > 100:
            raise ValidationError("Expected reduction must be between 0 and 100%")
        if scenario.cost_estimate < 0:
            raise ValidationError("Cost estimate must be non-negative")
