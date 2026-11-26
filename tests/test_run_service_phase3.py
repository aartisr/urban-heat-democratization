"""Tests for RunService"""

import pytest

from api.services.run import RunService, RunDTO
from api.domain import NotFoundError, ValidationError
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
    """Create a RunService for testing."""
    repository = RunRepository()
    return RunService(repository=repository)


class TestRunServiceGet:
    """Tests for RunService.get_run"""

    @pytest.mark.asyncio
    async def test_get_existing_run(self, service: RunService, sample_run: RunDTO) -> None:
        """Test retrieving an existing run."""
        await service.create_run(sample_run)
        result = await service.get_run("run-boston-123")
        assert result.id == "run-boston-123"
        assert result.city_id == "boston"

    @pytest.mark.asyncio
    async def test_get_nonexistent_run(self, service: RunService) -> None:
        """Test retrieving a non-existent run raises NotFoundError."""
        with pytest.raises(NotFoundError):
            await service.get_run("nonexistent")

    @pytest.mark.asyncio
    async def test_get_run_preserves_data(self, service: RunService, sample_run: RunDTO) -> None:
        """Test that retrieved run data matches created run."""
        await service.create_run(sample_run)
        result = await service.get_run(sample_run.id)
        assert result.scenario == sample_run.scenario
        assert result.progress == sample_run.progress


class TestRunServiceList:
    """Tests for RunService.list_runs"""

    @pytest.mark.asyncio
    async def test_list_empty_runs(self, service: RunService) -> None:
        """Test listing runs when none exist."""
        runs, total = await service.list_runs()
        assert runs == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_list_multiple_runs(self, service: RunService, sample_run: RunDTO) -> None:
        """Test listing multiple runs."""
        run1 = sample_run
        run2 = RunDTO(
            id="run-boston-456",
            city_id="boston",
            scenario="scenario-2",
            queue_job_id=None,
            status="running",
            progress=50,
            created_at="2024-01-02T00:00:00Z",
            updated_at="2024-01-02T00:00:00Z",
            outputs=[],
            summary="Test run 2",
            notes=[],
            output_artifact_ids=[],
            logs=[],
        )
        await service.create_run(run1)
        await service.create_run(run2)
        runs, total = await service.list_runs()
        assert len(runs) == 2
        assert total == 2

    @pytest.mark.asyncio
    async def test_list_by_city(self, service: RunService, sample_run: RunDTO) -> None:
        """Test listing runs filtered by city."""
        boston_run = sample_run
        newyork_run = RunDTO(
            id="run-newyork-123",
            city_id="newyork",
            scenario="scenario-1",
            queue_job_id=None,
            status="queued",
            progress=0,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
            outputs=[],
            summary="Test run",
            notes=[],
            output_artifact_ids=[],
            logs=[],
        )
        await service.create_run(boston_run)
        await service.create_run(newyork_run)
        runs, total = await service.list_runs(city_id="boston")
        assert len(runs) == 1
        assert total == 1
        assert runs[0].city_id == "boston"


class TestRunServiceCreate:
    """Tests for RunService.create_run"""

    @pytest.mark.asyncio
    async def test_create_valid_run(self, service: RunService, sample_run: RunDTO) -> None:
        """Test creating a valid run."""
        result = await service.create_run(sample_run)
        assert result.id == "run-boston-123"
        assert result.city_id == "boston"

    @pytest.mark.asyncio
    async def test_create_missing_id(self, service: RunService, sample_run: RunDTO) -> None:
        """Test creating run without ID raises ValidationError."""
        sample_run.id = ""
        with pytest.raises(ValidationError, match="Run ID"):
            await service.create_run(sample_run)

    @pytest.mark.asyncio
    async def test_create_missing_city_id(self, service: RunService, sample_run: RunDTO) -> None:
        """Test creating run without city_id raises ValidationError."""
        sample_run.city_id = ""
        with pytest.raises(ValidationError, match="City ID"):
            await service.create_run(sample_run)

    @pytest.mark.asyncio
    async def test_create_missing_scenario(self, service: RunService, sample_run: RunDTO) -> None:
        """Test creating run without scenario raises ValidationError."""
        sample_run.scenario = ""
        with pytest.raises(ValidationError, match="Scenario"):
            await service.create_run(sample_run)

    @pytest.mark.asyncio
    async def test_create_invalid_progress(self, service: RunService, sample_run: RunDTO) -> None:
        """Test creating run with invalid progress raises ValidationError."""
        sample_run.progress = 101
        with pytest.raises(ValidationError, match="Progress"):
            await service.create_run(sample_run)

    @pytest.mark.asyncio
    async def test_create_invalid_status(self, service: RunService, sample_run: RunDTO) -> None:
        """Test creating run with invalid status raises ValidationError."""
        sample_run.status = "invalid"
        with pytest.raises(ValidationError, match="Status"):
            await service.create_run(sample_run)


class TestRunServiceUpdate:
    """Tests for RunService.update_run"""

    @pytest.mark.asyncio
    async def test_update_existing_run(self, service: RunService, sample_run: RunDTO) -> None:
        """Test updating an existing run."""
        await service.create_run(sample_run)
        sample_run.progress = 50
        sample_run.status = "running"
        result = await service.update_run("run-boston-123", sample_run)
        assert result.progress == 50
        assert result.status == "running"

    @pytest.mark.asyncio
    async def test_update_validates_data(self, service: RunService, sample_run: RunDTO) -> None:
        """Test that update validates run data."""
        await service.create_run(sample_run)
        sample_run.progress = 101
        with pytest.raises(ValidationError):
            await service.update_run("run-boston-123", sample_run)


class TestRunServiceDelete:
    """Tests for RunService.delete_run"""

    @pytest.mark.asyncio
    async def test_delete_existing_run(self, service: RunService, sample_run: RunDTO) -> None:
        """Test deleting an existing run."""
        await service.create_run(sample_run)
        result = await service.delete_run("run-boston-123")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_nonexistent_run(self, service: RunService) -> None:
        """Test deleting a non-existent run returns False."""
        result = await service.delete_run("nonexistent")
        assert result is False

    @pytest.mark.asyncio
    async def test_delete_removes_run(self, service: RunService, sample_run: RunDTO) -> None:
        """Test that deleted run is removed."""
        await service.create_run(sample_run)
        await service.delete_run("run-boston-123")
        with pytest.raises(NotFoundError):
            await service.get_run("run-boston-123")


class TestRunServiceEnqueue:
    """Tests for RunService.enqueue_run"""

    @pytest.mark.asyncio
    async def test_enqueue_run(self, service: RunService) -> None:
        """Test enqueueing a run returns job ID."""
        job_id = await service.enqueue_run("run-123", "boston", "scenario-1")
        assert job_id.startswith("job-run-123-")
        assert len(job_id) > len("job-run-123-")


class TestRunServiceHealthCheck:
    """Tests for RunService.health_check"""

    @pytest.mark.asyncio
    async def test_health_check_ok(self, service: RunService) -> None:
        """Test health check returns True."""
        result = await service.health_check()
        assert result is True
