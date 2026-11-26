"""Tests for ScenarioService"""

import pytest

from api.services.scenario import ScenarioService, ScenarioDTO
from api.services.base import NotFoundError, ValidationError
from api.repositories.scenario import ScenarioRepository


@pytest.fixture
def sample_scenario() -> ScenarioDTO:
    """Create a sample scenario for testing."""
    return ScenarioDTO(
        id="scenario-green-roof",
        name="Green Roof Installation",
        description="Install green roofs on 50% of buildings",
        parameters={"coverage": 0.5, "vegetation_type": "extensive"},
        baseline_temp=28.5,
        mitigations=["green_roof"],
        expected_reduction=15.0,
        cost_estimate=2500000.0,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
    )


@pytest.fixture
def service() -> ScenarioService:
    """Create a ScenarioService for testing."""
    repository = ScenarioRepository()
    return ScenarioService(repository=repository)


class TestScenarioServiceGet:
    """Tests for ScenarioService.get_scenario"""

    @pytest.mark.asyncio
    async def test_get_existing_scenario(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test retrieving an existing scenario."""
        await service.create_scenario(sample_scenario)
        result = await service.get_scenario("scenario-green-roof")
        assert result.id == "scenario-green-roof"
        assert result.name == "Green Roof Installation"

    @pytest.mark.asyncio
    async def test_get_nonexistent_scenario(self, service: ScenarioService) -> None:
        """Test retrieving a non-existent scenario raises NotFoundError."""
        with pytest.raises(NotFoundError):
            await service.get_scenario("nonexistent")


class TestScenarioServiceList:
    """Tests for ScenarioService.list_scenarios"""

    @pytest.mark.asyncio
    async def test_list_empty_scenarios(self, service: ScenarioService) -> None:
        """Test listing scenarios when none exist."""
        result = await service.list_scenarios()
        assert result == []

    @pytest.mark.asyncio
    async def test_list_multiple_scenarios(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test listing multiple scenarios."""
        scenario1 = sample_scenario
        scenario2 = ScenarioDTO(
            id="scenario-street-trees",
            name="Street Tree Planting",
            description="Plant trees along streets",
            parameters={"trees_per_km": 50},
            baseline_temp=28.5,
            mitigations=["tree_planting"],
            expected_reduction=10.0,
            cost_estimate=1000000.0,
            created_at="2024-01-02T00:00:00Z",
            updated_at="2024-01-02T00:00:00Z",
        )
        await service.create_scenario(scenario1)
        await service.create_scenario(scenario2)
        result = await service.list_scenarios()
        assert len(result) == 2


class TestScenarioServiceCreate:
    """Tests for ScenarioService.create_scenario"""

    @pytest.mark.asyncio
    async def test_create_valid_scenario(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test creating a valid scenario."""
        result = await service.create_scenario(sample_scenario)
        assert result.id == "scenario-green-roof"
        assert result.expected_reduction == 15.0

    @pytest.mark.asyncio
    async def test_create_missing_id(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test creating scenario without ID raises ValidationError."""
        sample_scenario.id = ""
        with pytest.raises(ValidationError, match="Scenario ID"):
            await service.create_scenario(sample_scenario)

    @pytest.mark.asyncio
    async def test_create_missing_name(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test creating scenario without name raises ValidationError."""
        sample_scenario.name = ""
        with pytest.raises(ValidationError, match="name"):
            await service.create_scenario(sample_scenario)

    @pytest.mark.asyncio
    async def test_create_invalid_temperature(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test creating scenario with invalid temperature raises ValidationError."""
        sample_scenario.baseline_temp = 100.0
        with pytest.raises(ValidationError, match="temperature"):
            await service.create_scenario(sample_scenario)

    @pytest.mark.asyncio
    async def test_create_invalid_reduction(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test creating scenario with invalid reduction raises ValidationError."""
        sample_scenario.expected_reduction = 150.0
        with pytest.raises(ValidationError, match="reduction"):
            await service.create_scenario(sample_scenario)

    @pytest.mark.asyncio
    async def test_create_negative_cost(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test creating scenario with negative cost raises ValidationError."""
        sample_scenario.cost_estimate = -1000.0
        with pytest.raises(ValidationError, match="Cost"):
            await service.create_scenario(sample_scenario)


class TestScenarioServiceUpdate:
    """Tests for ScenarioService.update_scenario"""

    @pytest.mark.asyncio
    async def test_update_existing_scenario(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test updating an existing scenario."""
        await service.create_scenario(sample_scenario)
        sample_scenario.expected_reduction = 20.0
        result = await service.update_scenario("scenario-green-roof", sample_scenario)
        assert result.expected_reduction == 20.0

    @pytest.mark.asyncio
    async def test_update_validates_data(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test that update validates scenario data."""
        await service.create_scenario(sample_scenario)
        sample_scenario.cost_estimate = -100.0
        with pytest.raises(ValidationError):
            await service.update_scenario("scenario-green-roof", sample_scenario)


class TestScenarioServiceDelete:
    """Tests for ScenarioService.delete_scenario"""

    @pytest.mark.asyncio
    async def test_delete_existing_scenario(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test deleting an existing scenario."""
        await service.create_scenario(sample_scenario)
        result = await service.delete_scenario("scenario-green-roof")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_nonexistent_scenario(self, service: ScenarioService) -> None:
        """Test deleting a non-existent scenario returns False."""
        result = await service.delete_scenario("nonexistent")
        assert result is False


class TestScenarioServiceCalculateImpact:
    """Tests for ScenarioService.calculate_impact"""

    @pytest.mark.asyncio
    async def test_calculate_impact(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test calculating temperature impact."""
        await service.create_scenario(sample_scenario)
        impact = await service.calculate_impact("scenario-green-roof", 28.5)
        expected = 28.5 * 15.0 / 100.0
        assert abs(impact - expected) < 0.01

    @pytest.mark.asyncio
    async def test_calculate_impact_zero_baseline(
        self, service: ScenarioService, sample_scenario: ScenarioDTO
    ) -> None:
        """Test calculating impact with zero baseline."""
        await service.create_scenario(sample_scenario)
        impact = await service.calculate_impact("scenario-green-roof", 0.0)
        assert impact == 0.0


class TestScenarioServiceHealthCheck:
    """Tests for ScenarioService.health_check"""

    @pytest.mark.asyncio
    async def test_health_check_ok(self, service: ScenarioService) -> None:
        """Test health check returns True."""
        result = await service.health_check()
        assert result is True
