"""Run router for HTTP endpoints (refactored with clean architecture).

Thin delegation layer that routes HTTP requests to service layer.
Responsible for:
- Request validation and transformation
- HTTP status codes and error responses
- Response serialization

Design:
- Router has ZERO business logic
- All logic delegated to RunService
- Independent of service implementation
- 100% testable by mocking service
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api.services.run import RunService, RunDTO
from api.services.base import NotFoundError, ValidationError


class RunResponse(BaseModel):
    """Run response schema."""
    id: str
    cityId: str = Field(alias="city_id")
    scenario: str
    queueJobId: str | None = Field(alias="queue_job_id")
    status: str
    progress: int
    createdAt: str = Field(alias="created_at")
    updatedAt: str = Field(alias="updated_at")
    outputs: list[str]
    summary: str
    notes: list[str]
    outputArtifactIds: list[str] = Field(alias="output_artifact_ids")
    logs: list[str]

    model_config = {"populate_by_name": True}


def create_runs_router(service: RunService) -> APIRouter:
    """Create runs router with injected service.

    Args:
        service: RunService instance

    Returns:
        Configured APIRouter for runs endpoints
    """
    router = APIRouter()

    @router.get("/api/v1/runs", response_model=dict[str, list[RunResponse]])
    async def list_runs(city_id: str | None = None) -> dict[str, list[RunResponse]]:
        """List all runs, optionally filtered by city.

        Args:
            city_id: Optional city filter

        Returns:
            Dictionary with 'runs' key containing list of run profiles
        """
        try:
            runs_list, total_count = await service.list_runs(city_id=city_id)
            return {
                "runs": [
                    RunResponse(
                        id=r.id,
                        city_id=r.city_id,
                        scenario=r.scenario,
                        queue_job_id=r.queue_job_id,
                        status=r.status,
                        progress=r.progress,
                        created_at=r.created_at,
                        updated_at=r.updated_at,
                        outputs=r.outputs,
                        summary=r.summary,
                        notes=r.notes,
                        output_artifact_ids=r.output_artifact_ids,
                        logs=r.logs,
                    )
                    for r in runs_list
                ]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/api/v1/runs/{run_id}", response_model=RunResponse)
    async def get_run(run_id: str) -> RunResponse:
        """Get run by ID.

        Args:
            run_id: Run identifier

        Returns:
            Run profile

        Raises:
            HTTPException: If run not found
        """
        try:
            run = await service.get_run(run_id)
            return RunResponse(
                id=run.id,
                city_id=run.city_id,
                scenario=run.scenario,
                queue_job_id=run.queue_job_id,
                status=run.status,
                progress=run.progress,
                created_at=run.created_at,
                updated_at=run.updated_at,
                outputs=run.outputs,
                summary=run.summary,
                notes=run.notes,
                output_artifact_ids=run.output_artifact_ids,
                logs=run.logs,
            )
        except NotFoundError:
            raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.post("/api/v1/runs", response_model=RunResponse, status_code=201)
    async def create_run(request: dict) -> RunResponse:
        """Create new run.

        Args:
            request: Run data

        Returns:
            Created run profile

        Raises:
            HTTPException: If validation fails
        """
        try:
            run_dto = RunDTO(
                id=str(request.get("id", "")),
                city_id=str(request.get("cityId", "")),
                scenario=str(request.get("scenario", "")),
                queue_job_id=request.get("queueJobId"),
                status=str(request.get("status", "queued")),
                progress=int(request.get("progress", 0)),
                created_at=str(request.get("createdAt", "")),
                updated_at=str(request.get("updatedAt", "")),
                outputs=request.get("outputs", []),
                summary=str(request.get("summary", "")),
                notes=request.get("notes", []),
                output_artifact_ids=request.get("outputArtifactIds", []),
                logs=request.get("logs", []),
            )
            created = await service.create_run(run_dto)
            return RunResponse(
                id=created.id,
                city_id=created.city_id,
                scenario=created.scenario,
                queue_job_id=created.queue_job_id,
                status=created.status,
                progress=created.progress,
                created_at=created.created_at,
                updated_at=created.updated_at,
                outputs=created.outputs,
                summary=created.summary,
                notes=created.notes,
                output_artifact_ids=created.output_artifact_ids,
                logs=created.logs,
            )
        except ValidationError as e:
            raise HTTPException(status_code=422, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return router
