"""Unified Data Transfer Objects (DTOs) for all domain entities.

DTOs represent domain concepts as plain data containers. They are:

- Used throughout the application (services, repositories, APIs)
- Independent of any specific framework or storage
- Immutable (should not be modified after creation)
- Completely typed for type checking and documentation

Design principles:
- One DTO per domain entity
- DTOs contain only data, no behavior
- Use dataclass for simplicity and immutability
- All fields explicitly typed (no Any)
- Docstrings document semantic meaning, not technical details
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class CityDTO:
    """City profile and configuration.

    Represents a geographic city participating in the heat analysis
    platform. Contains metadata, baseline data, and configuration.

    Attributes:
        id: Unique city identifier (lowercase slug)
        name: Display name (human-readable)
        region: Geographic region
        population: Population estimate
        status: City onboarding status (active, inactive, etc.)
        baseline_temp_c: Baseline temperature in Celsius
        canopy_coverage: Tree canopy coverage estimate
        planning_cost_multiplier: Cost adjustment for planning
        description: Human-readable description
    """

    id: str
    name: str
    region: str
    population: str
    status: str
    baseline_temp_c: float
    canopy_coverage: str
    planning_cost_multiplier: float
    description: str


@dataclass
class RunDTO:
    """Thermal analysis run.

    Represents a single heat analysis execution over a city area.
    Contains the analysis parameters and tracking information.

    Attributes:
        id: Unique run identifier
        city_id: City this run analyzes
        scenario: Scenario name/identifier
        queue_job_id: Optional queue job identifier
        status: Run status (queued, running, completed, failed)
        progress: Progress percentage (0-100)
        created_at: ISO timestamp when run was created
        updated_at: ISO timestamp when run was last updated
        outputs: List of output identifiers
        summary: Text summary of run results
        notes: List of notes/comments about the run
        output_artifact_ids: List of output artifact IDs
        logs: List of run logs/messages
    """

    id: str
    city_id: str
    scenario: str
    queue_job_id: Optional[str]
    status: str
    progress: int
    created_at: str
    updated_at: str
    outputs: list[str]
    summary: str
    notes: list[str]
    output_artifact_ids: list[str]
    logs: list[str]


@dataclass
class ScenarioDTO:
    """Mitigation scenario and analysis.

    Represents a hypothetical scenario with specific interventions
    and their projected impact on urban heat.

    Attributes:
        id: Unique scenario identifier
        name: Scenario name
        description: Scenario description
        parameters: Parameters for scenario (dict of key-value pairs)
        baseline_temp: Baseline temperature value
        mitigations: List of mitigation intervention names
        expected_reduction: Expected temperature reduction
        cost_estimate: Estimated cost
        created_at: ISO timestamp when created
        updated_at: ISO timestamp when last updated
    """

    id: str
    name: str
    description: str
    parameters: dict[str, object]
    baseline_temp: float
    mitigations: list[str]
    expected_reduction: float
    cost_estimate: float
    created_at: str
    updated_at: str


@dataclass
class ExperienceDTO:
    """User experience event or interaction.

    Tracks user interactions with the platform for analytics and UX
    improvement. Contains click-stream and engagement data.

    Attributes:
        id: Unique event identifier
        user_id: User who generated event
        city_id: City context for event
        event_type: Type of interaction (view, click, analyze, etc.)
        timestamp: ISO timestamp when event occurred
        metadata: Optional additional context
    """

    id: str
    user_id: str
    city_id: str
    event_type: str
    timestamp: str
    metadata: Optional[dict] = None


@dataclass
class MitigationDTO:
    """Mitigation strategy recommendation.

    Represents a recommended intervention strategy including cost,
    impact, and implementation guidance.

    Attributes:
        id: Unique strategy identifier
        city_id: City this strategy targets
        name: Strategy name
        description: Detailed description
        cost_estimate: Estimated cost in local currency
        impact_estimate: Estimated temperature reduction (degrees C)
        implementation_time_weeks: Estimated implementation duration
        priority: Implementation priority (high, medium, low)
    """

    id: str
    city_id: str
    name: str
    description: str
    cost_estimate: float
    impact_estimate: float
    implementation_time_weeks: int
    priority: str
