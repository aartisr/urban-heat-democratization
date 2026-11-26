"""Scenario Repository - Data access layer for scenarios."""

from typing import Optional, List, Any

from api.domain import Repository, ScenarioDTO, NotFoundError


class ScenarioRepository(Repository[ScenarioDTO]):
    """In-memory repository for scenarios."""

    def __init__(self, store: dict[str, dict[str, object]] | None = None) -> None:
        """Initialize repository with optional backing store.

        Args:
            store: Optional pre-populated data store
        """
        self._store: dict[str, dict[str, object]] = store or {}

    async def get(self, id: str) -> Optional[ScenarioDTO]:
        """Get scenario by ID.

        Args:
            id: Scenario identifier

        Returns:
            ScenarioDTO if found, None otherwise
        """
        if id not in self._store:
            return None
        return self._dict_to_dto(self._store[id])

    async def list(
        self,
        filter: dict[str, Any] | None = None,
        offset: int = 0,
        limit: int | None = None,
    ) -> tuple[List[ScenarioDTO], int]:
        """List all scenarios with pagination.

        Args:
            filter: Optional filters (not used in in-memory version)
            offset: Starting position (0-based)
            limit: Maximum scenarios to return

        Returns:
            Tuple of (scenarios, total_count)
        """
        all_scenarios = [self._dict_to_dto(r) for r in self._store.values()]
        
        # Apply offset and limit
        end = offset + limit if limit else None
        paginated = all_scenarios[offset:end]
        
        return (paginated, len(all_scenarios))

    async def create(self, item: ScenarioDTO) -> ScenarioDTO:
        """Create new scenario.

        Args:
            item: ScenarioDTO to create

        Returns:
            Created ScenarioDTO
        """
        self._store[item.id] = self._dto_to_dict(item)
        return item

    async def update(self, id: str, item: ScenarioDTO) -> ScenarioDTO:
        """Update existing scenario.

        Args:
            id: Scenario identifier
            item: Updated ScenarioDTO

        Returns:
            Updated ScenarioDTO

        Raises:
            NotFoundError: If scenario not found
        """
        if id not in self._store:
            raise NotFoundError(f"Scenario '{id}' not found in repository")
        self._store[id] = self._dto_to_dict(item)
        return item

    async def delete(self, id: str) -> bool:
        """Delete scenario.

        Args:
            id: Scenario identifier

        Returns:
            True if deleted, False if not found
        """
        if id in self._store:
            del self._store[id]
            return True
        return False

    async def health_check(self) -> bool:
        """Check if repository is healthy.

        Returns:
            Always True for in-memory repository
        """
        return True

    @staticmethod
    def _dict_to_dto(scenario_dict: dict[str, object]) -> ScenarioDTO:
        """Convert dictionary to ScenarioDTO.

        Args:
            scenario_dict: Dictionary with scenario data

        Returns:
            ScenarioDTO instance
        """
        baseline = scenario_dict.get("baseline_temp")
        reduction = scenario_dict.get("expected_reduction")
        cost = scenario_dict.get("cost_estimate")
        return ScenarioDTO(
            id=str(scenario_dict.get("id", "")),
            name=str(scenario_dict.get("name", "")),
            description=str(scenario_dict.get("description", "")),
            parameters=scenario_dict.get("parameters", {}),
            baseline_temp=float(baseline) if baseline is not None else 0.0,
            mitigations=[str(m) for m in scenario_dict.get("mitigations", [])],
            expected_reduction=float(reduction) if reduction is not None else 0.0,
            cost_estimate=float(cost) if cost is not None else 0.0,
            created_at=str(scenario_dict.get("created_at", "")),
            updated_at=str(scenario_dict.get("updated_at", "")),
        )

    @staticmethod
    def _dto_to_dict(scenario_dto: ScenarioDTO) -> dict[str, object]:
        """Convert ScenarioDTO to dictionary.

        Args:
            scenario_dto: ScenarioDTO instance

        Returns:
            Dictionary representation
        """
        return {
            "id": scenario_dto.id,
            "name": scenario_dto.name,
            "description": scenario_dto.description,
            "parameters": scenario_dto.parameters,
            "baseline_temp": scenario_dto.baseline_temp,
            "mitigations": scenario_dto.mitigations,
            "expected_reduction": scenario_dto.expected_reduction,
            "cost_estimate": scenario_dto.cost_estimate,
            "created_at": scenario_dto.created_at,
            "updated_at": scenario_dto.updated_at,
        }
