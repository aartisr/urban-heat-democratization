"""Tests for run service layer.

Comprehensive test suite covering:
- RunService business logic
- Error handling and validation
- Repository integration
- Type safety
"""

import pytest
from api.services.run import RunService, RunDTO
from api.services.base import NotFoundError, ValidationError
from api.repositories.run import RunRepository


@pytest.fixture
def sample_run() -> RunDTO:
    """Create a sample run for testing."""
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
def service() -> RunService:
    """Create service with fresh repository for each test."""
    repository = RunRepository()
    return RunService(repository=repository)


class TestRunServiceGet:
    """Tests for getting runs."""

    @pytest.mark.asyncio
    async def test_get_existing_run(self, service: RunService, sample_run: RunDTO) -> None:
        """Get existing run returns correct data."""
        # Arrange
        await service.create_run(sample_run)

        # Act
        result = await service.get_run("run-boston-123")

        # Assert
        assert result.id == "run-boston-123"
        assert result.city_id == "boston"
        assert result.status == "queued"

    @pytest.mark.asyncio
    async def test_get_nonexistent_run(self, service: RunService) -> None:
        """Get non-existent run raises NotFoundError."""
        # Act & Assert
        with pytest.raises(NotFoundError, match="not found"):
            await service.get_run("nonexistent")


class TestRunServiceList:
    """Tests for listing runs."""

    @pytest.mark.asyncio
    async def test_list_empty(self, service: RunService) -> None:
        """List runs from empty service returns empty list."""
        # Act
        result_list, total_count = await service.list_runs()

        # Assert
        assert result_list == []
        assert total_count == 0

    @pytest.mark.asyncio
    async def test_list_all(self, service: RunService, sample_run: RunDTO) -> None:
        """List all runs returns all runs."""
        # Arrange
        run2 = RunDTO(
            id="run-chicago-456",
            city_id="chicago",
            scenario="scenario-2",
            queue_job_id=None,
            status="queued",
            progress=0,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
            outputs=[],
            summary="Chicago run",
            notes=[],
            output_artifact_ids=[],
            logs=[],
        )
        await service.create_run(sample_run)
        await service.create_run(run2)

        # Act
        result_list, total_count = await service.list_runs()

        # Assert
        assert len(result_list) == 2
        assert total_count == 2
        assert any(r.city_id == "boston" for r in result_list)
        assert any(r.city_id == "chicago" for r in result_list)

    @pytest.mark.asyncio
    async def test_list_filtered_by_city(self, service: RunService, sample_run: RunDTO) -> None:
        """List runs filtered by city returns only matching runs."""
        # Arrange
        run2 = RunDTO(
            id="run-chicago-456",
            city_id="chicago",
            scenario="scenario-2",
            queue_job_id=None,
            status="queued",
            progress=0,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
            outputs=[],
            summary="Chicago run",
            notes=[],
            output_artifact_ids=[],
            logs=[],
        )
        await service.create_run(sample_run)
        await service.create_run(run2)

        # Act
        result_list, total_count = await service.list_runs(city_id="boston")

        # Assert
        assert len(result_list) == 1
        assert total_count == 1
        assert result_list[0].city_id == "boston"


class TestRunServiceCreate:
    """Tests for creating runs."""

    @pytest.mark.asyncio
    async def test_create_valid_run(self, service: RunService, sample_run: RunDTO) -> None:
        """Create valid run succeeds."""
        # Act
        result = await service.create_run(sample_run)

        # Assert
        assert result.id == "run-boston-123"
        assert result.city_id == "boston"

        # Verify persistence
        retrieved = await service.get_run("run-boston-123")
        assert retrieved.id == "run-boston-123"

    @pytest.mark.asyncio
    async def test_create_run_missing_id(self, service: RunService, sample_run: RunDTO) -> None:
        """Create run without ID raises ValidationError."""
        # Arrange
        sample_run.id = ""

        # Act & Assert
        with pytest.raises(ValidationError, match="ID is required"):
            await service.create_run(sample_run)

    @pytest.mark.asyncio
    async def test_create_run_missing_city_id(self, service: RunService, sample_run: RunDTO) -> None:
        """Create run without city ID raises ValidationError."""
        # Arrange
        sample_run.city_id = ""

        # Act & Assert
        with pytest.raises(ValidationError, match="City ID is required"):
            await service.create_run(sample_run)

    @pytest.mark.asyncio
    async def test_create_run_missing_scenario(self, service: RunService, sample_run: RunDTO) -> None:
        """Create run without scenario raises ValidationError."""
        # Arrange
        sample_run.scenario = ""

        # Act & Assert
        with pytest.raises(ValidationError, match="Scenario is required"):
            await service.create_run(sample_run)

    @pytest.mark.asyncio
    async def test_create_run_invalid_progress(self, service: RunService, sample_run: RunDTO) -> None:
        """Create run with invalid progress raises ValidationError."""
        # Arrange
        sample_run.progress = 150

        # Act & Assert
        with pytest.raises(ValidationError, match="Progress must be between"):
            await service.create_run(sample_run)

    @pytest.mark.asyncio
    async def test_create_run_invalid_status(self, service: RunService, sample_run: RunDTO) -> None:
        """Create run with invalid status raises ValidationError."""
        # Arrange
        sample_run.status = "invalid"

        # Act & Assert
        with pytest.raises(ValidationError, match="Status must be"):
            await service.create_run(sample_run)


class TestRunServiceUpdate:
    """Tests for updating runs."""

    @pytest.mark.asyncio
    async def test_update_existing_run(self, service: RunService, sample_run: RunDTO) -> None:
        """Update existing run succeeds."""
        # Arrange
        await service.create_run(sample_run)
        sample_run.status = "running"
        sample_run.progress = 50

        # Act
        result = await service.update_run("run-boston-123", sample_run)

        # Assert
        assert result.status == "running"
        assert result.progress == 50

        # Verify persistence
        retrieved = await service.get_run("run-boston-123")
        assert retrieved.status == "running"
        assert retrieved.progress == 50

    @pytest.mark.asyncio
    async def test_update_nonexistent_run(self, service: RunService, sample_run: RunDTO) -> None:
        """Update non-existent run raises error."""
        # Act & Assert
        with pytest.raises(Exception):  # Repository raises KeyError
            await service.update_run("nonexistent", sample_run)


class TestRunServiceDelete:
    """Tests for deleting runs."""

    @pytest.mark.asyncio
    async def test_delete_existing_run(self, service: RunService, sample_run: RunDTO) -> None:
        """Delete existing run succeeds."""
        # Arrange
        await service.create_run(sample_run)

        # Act
        result = await service.delete_run("run-boston-123")

        # Assert
        assert result is True

        # Verify deleted
        with pytest.raises(NotFoundError):
            await service.get_run("run-boston-123")

    @pytest.mark.asyncio
    async def test_delete_nonexistent_run(self, service: RunService) -> None:
        """Delete non-existent run returns False."""
        # Act
        result = await service.delete_run("nonexistent")

        # Assert
        assert result is False


class TestRunServiceEnqueue:
    """Tests for enqueueing runs."""

    @pytest.mark.asyncio
    async def test_enqueue_run_generates_job_id(self, service: RunService) -> None:
        """Enqueue run generates unique job ID."""
        # Act
        job_id = await service.enqueue_run("run-123", "boston", "scenario-1")

        # Assert
        assert job_id.startswith("job-run-123-")
        assert len(job_id) > 12

    @pytest.mark.asyncio
    async def test_enqueue_run_generates_unique_ids(self, service: RunService) -> None:
        """Enqueue same run twice generates different job IDs."""
        # Act
        job_id_1 = await service.enqueue_run("run-123", "boston", "scenario-1")
        job_id_2 = await service.enqueue_run("run-123", "boston", "scenario-1")

        # Assert
        assert job_id_1 != job_id_2


class TestRunServiceHealthCheck:
    """Tests for health check."""

    @pytest.mark.asyncio
    async def test_health_check_ok(self, service: RunService) -> None:
        """Health check returns True when service is healthy."""
        # Act
        result = await service.health_check()

        # Assert
        assert result is True
