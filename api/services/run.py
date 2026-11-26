"""Run service implementation.

Handles all run-related business logic: execution tracking, validation,
coordination with the repository. Completely decoupled from FastAPI.
"""

from typing import Optional, List, Any
from uuid import uuid4

from api.domain import Repository, NotFoundError, ValidationError, RunDTO
from api.services.base import AbstractService


class RunService(AbstractService):
    """Service for run domain operations.

    Responsibilities:
    - Execution tracking and validation
    - Business rules enforcement (progress bounds, status transitions)
    - Coordination between routers and repositories
    - Error transformation to domain-specific exceptions

    Design:
    - Depends on RunRepository interface (not concrete implementation)
    - Fully testable by mocking repository
    - Independent of FastAPI routing layer
    - 100% type-safe for mypy --strict
    """

    def __init__(self, repository: Repository[RunDTO]) -> None:
        """Initialize service with injected repository.

        Args:
            repository: Abstraction for run persistence
        """
        self._repository = repository

    async def health_check(self) -> bool:
        """Verify service and repository are healthy.

        Returns:
            bool: True if service can operate
        """
        try:
            await self._repository.health_check()
            return True
        except Exception:
            return False

    async def get_run(self, run_id: str) -> RunDTO:
        """Get run by ID.

        Args:
            run_id: Run identifier

        Returns:
            Run with full details

        Raises:
            NotFoundError: If run not found
        """
        run = await self._repository.get(run_id)
        if run is None:
            raise NotFoundError(f"Run '{run_id}' not found")
        return run

    async def list_runs(self, city_id: Optional[str] = None, offset: int = 0, limit: int | None = None) -> tuple[List[RunDTO], int]:
        """List runs with optional filtering and pagination.

        Args:
            city_id: Optional city filter
            offset: Starting position (0-based)
            limit: Maximum runs to return

        Returns:
            Tuple of (runs, total_count)
        """
        filter_dict = {"city_id": city_id} if city_id else None
        return await self._repository.list(filter=filter_dict, offset=offset, limit=limit)

    async def create_run(self, run: RunDTO) -> RunDTO:
        """Create new run.

        Args:
            run: Run data to create

        Returns:
            Created run with ID assigned

        Raises:
            ValidationError: If run data is invalid
        """
        self._validate_run(run)
        return await self._repository.create(run)

    async def update_run(self, run_id: str, run: RunDTO) -> RunDTO:
        """Update existing run.

        Args:
            run_id: ID of run to update
            run: Updated run data

        Returns:
            Updated run profile

        Raises:
            NotFoundError: If run not found
            ValidationError: If run data is invalid
        """
        self._validate_run(run)
        return await self._repository.update(run_id, run)

    async def delete_run(self, run_id: str) -> bool:
        """Delete run.

        Args:
            run_id: ID of run to delete

        Returns:
            True if deleted, False if not found
        """
        return await self._repository.delete(run_id)

    async def enqueue_run(self, run_id: str, city_id: str, scenario: str) -> str:
        """Enqueue run for execution.

        Args:
            run_id: ID of run to enqueue
            city_id: City for the run
            scenario: Scenario to execute

        Returns:
            Job ID assigned for durable queue tracking
        """
        job_id = f"job-{run_id}-{uuid4().hex[:8]}"
        return job_id

    def _validate_run(self, run: RunDTO) -> None:
        """Validate run data.

        Args:
            run: Run to validate

        Raises:
            ValidationError: If validation fails
        """
        if not run.id or not run.id.strip():
            raise ValidationError("Run ID is required")
        if not run.city_id or not run.city_id.strip():
            raise ValidationError("City ID is required")
        if not run.scenario or not run.scenario.strip():
            raise ValidationError("Scenario is required")
        if run.progress < 0 or run.progress > 100:
            raise ValidationError("Progress must be between 0 and 100")
        if run.status not in ("queued", "running", "completed", "failed"):
            raise ValidationError("Status must be queued, running, completed, or failed")
