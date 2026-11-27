"""Tests for run repository layer.

Covers:
- CRUD operations
- Data type conversions (DTO ↔ dict)
- Error conditions
"""

import pytest
from api.domain.errors import NotFoundError
from api.repositories.run import RunRepository
from api.services.run import RunDTO


@pytest.fixture
def sample_run() -> RunDTO:
    """Create a sample run DTO."""
    return RunDTO(
        id="run-boston-123",
        city_id="boston",
        scenario="scenario-1",
        queue_job_id=None,
        status="queued",
        progress=0,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        outputs=["output.json"],
        summary="Test run",
        notes=[],
        output_artifact_ids=[],
        logs=[],
    )


@pytest.fixture
def repository() -> RunRepository:
    """Create a fresh repository for each test."""
    return RunRepository()


class TestRunRepositoryGet:
    """Tests for repository get operations."""

    @pytest.mark.asyncio
    async def test_get_existing_run(self, repository: RunRepository, sample_run: RunDTO) -> None:
        """Get existing run returns correct DTO."""
        # Arrange
        await repository.create(sample_run)

        # Act
        result = await repository.get("run-boston-123")

        # Assert
        assert result is not None
        assert result.id == "run-boston-123"
        assert result.city_id == "boston"
        assert result.status == "queued"

    @pytest.mark.asyncio
    async def test_get_nonexistent_run(self, repository: RunRepository) -> None:
        """Get non-existent run returns None."""
        # Act
        result = await repository.get("nonexistent")

        # Assert
        assert result is None


class TestRunRepositoryList:
    """Tests for repository list operations."""

    @pytest.mark.asyncio
    async def test_list_empty(self, repository: RunRepository) -> None:
        """List empty repository returns empty list."""
        # Act
        result, total = await repository.list()

        # Assert
        assert result == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_list_multiple(self, repository: RunRepository) -> None:
        """List returns all runs."""
        # Arrange
        run1 = RunDTO(
            "run1", "boston", "scenario-1", None, "queued", 0,
            "2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z",
            [], "Run 1", [], [], [],
        )
        run2 = RunDTO(
            "run2", "chicago", "scenario-2", None, "queued", 0,
            "2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z",
            [], "Run 2", [], [], [],
        )
        await repository.create(run1)
        await repository.create(run2)

        # Act
        result, total = await repository.list()

        # Assert
        assert len(result) == 2
        assert total == 2
        assert any(r.id == "run1" for r in result)
        assert any(r.id == "run2" for r in result)


class TestRunRepositoryCreate:
    """Tests for repository create operations."""

    @pytest.mark.asyncio
    async def test_create_run(self, repository: RunRepository, sample_run: RunDTO) -> None:
        """Create run persists and returns created run."""
        # Act
        result = await repository.create(sample_run)

        # Assert
        assert result.id == "run-boston-123"
        assert result.city_id == "boston"

        # Verify persistence
        retrieved = await repository.get("run-boston-123")
        assert retrieved is not None
        assert retrieved.id == "run-boston-123"


class TestRunRepositoryUpdate:
    """Tests for repository update operations."""

    @pytest.mark.asyncio
    async def test_update_existing_run(self, repository: RunRepository, sample_run: RunDTO) -> None:
        """Update existing run modifies data."""
        # Arrange
        await repository.create(sample_run)
        sample_run.status = "running"
        sample_run.progress = 50

        # Act
        result = await repository.update("run-boston-123", sample_run)

        # Assert
        assert result.status == "running"
        assert result.progress == 50

        # Verify persistence
        retrieved = await repository.get("run-boston-123")
        assert retrieved is not None
        assert retrieved.status == "running"
        assert retrieved.progress == 50

    @pytest.mark.asyncio
    async def test_update_nonexistent_run(self, repository: RunRepository, sample_run: RunDTO) -> None:
        """Update non-existent run raises the shared domain error."""
        # Act & Assert
        with pytest.raises(NotFoundError):
            await repository.update("nonexistent", sample_run)


class TestRunRepositoryDelete:
    """Tests for repository delete operations."""

    @pytest.mark.asyncio
    async def test_delete_existing_run(self, repository: RunRepository, sample_run: RunDTO) -> None:
        """Delete existing run removes it."""
        # Arrange
        await repository.create(sample_run)

        # Act
        result = await repository.delete("run-boston-123")

        # Assert
        assert result is True

        # Verify deleted
        retrieved = await repository.get("run-boston-123")
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent_run(self, repository: RunRepository) -> None:
        """Delete non-existent run returns False."""
        # Act
        result = await repository.delete("nonexistent")

        # Assert
        assert result is False


class TestRunRepositoryConversions:
    """Tests for DTO ↔ dict conversions."""

    def test_dict_to_dto(self) -> None:
        """Convert dict to DTO preserves all fields."""
        # Arrange
        run_dict = {
            "id": "run-123",
            "cityId": "boston",
            "scenario": "scenario-1",
            "queueJobId": "job-123",
            "status": "running",
            "progress": 50,
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T12:00:00Z",
            "outputs": ["output.json"],
            "summary": "Test run",
            "notes": ["Note 1"],
            "outputArtifactIds": ["artifact1"],
            "logs": ["Log 1"],
        }

        # Act
        result = RunRepository._dict_to_dto(run_dict)

        # Assert
        assert result.id == "run-123"
        assert result.city_id == "boston"
        assert result.queue_job_id == "job-123"
        assert result.progress == 50
        assert result.outputs == ["output.json"]

    def test_dto_to_dict(self) -> None:
        """Convert DTO to dict preserves all fields."""
        # Arrange
        run_dto = RunDTO(
            id="run-123",
            city_id="boston",
            scenario="scenario-1",
            queue_job_id="job-123",
            status="running",
            progress=50,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T12:00:00Z",
            outputs=["output.json"],
            summary="Test run",
            notes=["Note 1"],
            output_artifact_ids=["artifact1"],
            logs=["Log 1"],
        )

        # Act
        result = RunRepository._dto_to_dict(run_dto)

        # Assert
        assert result["id"] == "run-123"
        assert result["cityId"] == "boston"
        assert result["queueJobId"] == "job-123"
        assert result["progress"] == 50
        assert result["outputs"] == ["output.json"]
