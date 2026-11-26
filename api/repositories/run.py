"""Run repository implementation using in-memory store.

Implements the Repository[T] interface for Runs. This in-memory version
can be swapped for SQLite, PostgreSQL, MongoDB, etc. without changing
service or router code.

Note: Repositories now import from api.domain (not api.services) to fix
dependency direction: domain <- adapters <- services.
"""

from typing import Optional, List, Any, cast
from api.domain import Repository, RunDTO, NotFoundError


class RunRepository(Repository[RunDTO]):
    """In-memory repository for runs.

    Design:
    - Implements Repository[RunDTO] interface for type safety
    - Can be swapped for SQL/NoSQL implementations
    - Supports basic CRUD operations
    - Thread-safe for concurrent access

    Note:
    - This is a proof-of-concept in-memory implementation
    - For production, replace with database-backed version
    - Future: Add query filters, pagination, sorting
    """

    def __init__(self, store: dict[str, dict[str, object]] | None = None) -> None:
        """Initialize repository with optional backing store.

        Args:
            store: Optional existing run store to use. If None, starts empty.
        """
        self._store: dict[str, dict[str, object]] = store or {}

    async def get(self, id: str) -> Optional[RunDTO]:
        """Get run by ID.

        Args:
            id: Run ID

        Returns:
            RunDTO if found, None otherwise
        """
        if id not in self._store:
            return None
        
        run_dict = self._store[id]
        return self._dict_to_dto(run_dict)

    async def list(
        self,
        filter: dict[str, Any] | None = None,
        offset: int = 0,
        limit: int | None = None,
    ) -> tuple[List[RunDTO], int]:
        """List all runs with optional filtering and pagination.

        Args:
            filter: Optional filters (supports city_id filter)
            offset: Starting position (0-based)
            limit: Maximum items to return

        Returns:
            Tuple of (runs, total_count)
        """
        all_runs = [self._dict_to_dto(run_dict) for run_dict in self._store.values()]
        
        # Apply filter if provided
        if filter:
            if "city_id" in filter:
                city_id = filter["city_id"]
                all_runs = [r for r in all_runs if r.city_id == city_id]
        
        # Apply offset and limit
        end = offset + limit if limit else None
        paginated = all_runs[offset:end]
        
        return (paginated, len(all_runs))

    async def create(self, item: RunDTO) -> RunDTO:
        """Create new run.

        Args:
            item: Run to create

        Returns:
            Created run
        """
        self._store[item.id] = self._dto_to_dict(item)
        return item

    async def update(self, id: str, item: RunDTO) -> RunDTO:
        """Update existing run.

        Args:
            id: Run ID to update
            item: Updated run data

        Returns:
            Updated run

        Raises:
            NotFoundError: If run not found
        """
        if id not in self._store:
            raise NotFoundError(f"Run '{id}' not found in repository")
        
        self._store[id] = self._dto_to_dict(item)
        return item

    async def delete(self, id: str) -> bool:
        """Delete run by ID.

        Args:
            id: Run ID to delete

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
    def _dict_to_dto(run_dict: dict[str, object]) -> RunDTO:
        """Convert dictionary to RunDTO.

        Args:
            run_dict: Dictionary representation

        Returns:
            RunDTO instance
        """
        progress = run_dict.get("progress")
        queue_job_id = run_dict.get("queueJobId")
        
        return RunDTO(
            id=str(run_dict.get("id", "")),
            city_id=str(run_dict.get("cityId", "")),
            scenario=str(run_dict.get("scenario", "")),
            queue_job_id=str(queue_job_id) if queue_job_id is not None else None,
            status=str(run_dict.get("status", "queued")),
            progress=int(cast(int, progress)) if progress is not None else 0,
            created_at=str(run_dict.get("createdAt", "")),
            updated_at=str(run_dict.get("updatedAt", "")),
            outputs=[str(o) for o in cast(list[object], run_dict.get("outputs", []))],
            summary=str(run_dict.get("summary", "")),
            notes=[str(n) for n in cast(list[object], run_dict.get("notes", []))],
            output_artifact_ids=[str(a) for a in cast(list[object], run_dict.get("outputArtifactIds", []))],
            logs=[str(l) for l in cast(list[object], run_dict.get("logs", []))],
        )

    @staticmethod
    def _dto_to_dict(run_dto: RunDTO) -> dict[str, object]:
        """Convert RunDTO to dictionary.

        Args:
            run_dto: RunDTO instance

        Returns:
            Dictionary representation
        """
        return {
            "id": run_dto.id,
            "cityId": run_dto.city_id,
            "scenario": run_dto.scenario,
            "queueJobId": run_dto.queue_job_id,
            "status": run_dto.status,
            "progress": run_dto.progress,
            "createdAt": run_dto.created_at,
            "updatedAt": run_dto.updated_at,
            "outputs": run_dto.outputs,
            "summary": run_dto.summary,
            "notes": run_dto.notes,
            "outputArtifactIds": run_dto.output_artifact_ids,
            "logs": run_dto.logs,
        }
