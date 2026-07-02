from __future__ import annotations

from collections.abc import Callable
from threading import RLock
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request

from api.access_control import AccessControl


def create_runs_router(
    *,
    run_store: list[dict[str, object]],
    city_store: dict[str, dict[str, object]],
    runtime_state_lock: RLock,
    persist_runtime_runs: Callable[[], None],
    resolve_city_experience: Callable[[str], object],
    utc_now: Callable[[], str],
    access_control: AccessControl,
    workspace_id_from_request: Callable[[Request], str],
    enqueue_run_execution: Callable[[str, str, str], None],
) -> APIRouter:
    router = APIRouter()

    @router.get("/api/v1/runs")
    async def runs(city_id: str | None = None):
        records = run_store if city_id is None else [item for item in run_store if item.get("cityId") == city_id]
        return records

    @router.get("/api/v1/runs/{run_id}")
    async def run_detail(run_id: str):
        record = next((item for item in run_store if item.get("id") == run_id), None)
        if record is None:
            raise HTTPException(status_code=404, detail="Run not found")
        city_id = str(record.get("cityId", ""))
        city_name = None
        if city_id:
            city_record = city_store.get(city_id)
            if isinstance(city_record, dict):
                city_name = str(city_record.get("name", city_id))
        return {
            **record,
            "cityName": city_name,
            "createdAt": record.get("createdAt", record.get("updatedAt")),
            "summary": record.get("summary", ""),
            "notes": record.get("notes", []),
            "outputArtifactIds": record.get("outputArtifactIds", []),
            "logs": record.get("logs", []),
        }

    @router.post("/api/v1/runs")
    async def create_run(request: dict[str, object], http_request: Request):
        access_control.ensure_access(
            http_request,
            minimum_role="editor",
            workspace_id=workspace_id_from_request(http_request),
        )
        city_id = str(request.get("cityId") or "")
        scenario = str(request.get("scenario") or "")
        if not city_id or not scenario:
            raise HTTPException(status_code=422, detail="cityId and scenario are required")

        city_record = city_store.get(city_id, {})
        city_name = str(city_record.get("name", city_id)) if isinstance(city_record, dict) else city_id
        experience = resolve_city_experience(city_id)
        output_artifact_ids = list(getattr(experience, "run_seed_artifact_ids", []))
        now = utc_now()
        run_id = f"run-{city_id}-{uuid4().hex[:10]}"
        validation_notes = (
            [
                f"Validation: {len(output_artifact_ids)} bundled seed artifact(s) attached from the city experience.",
                "Validation: run payload passed basic queue submission checks and is ready for durable execution.",
            ]
            if output_artifact_ids
            else [
                "Validation: this city has no bundled seed artifacts, so the run will execute without bundled local inputs.",
                "Validation: run payload passed basic queue submission checks and is ready for durable execution.",
            ]
        )
        record = {
            "id": run_id,
            "cityId": city_id,
            "scenario": scenario,
            "queueJobId": None,
            "status": "queued",
            "progress": 0,
            "createdAt": now,
            "updatedAt": now,
            "outputs": [f"{city_id}-analysis-summary.json"],
            "summary": (
                f"{city_name} run queued from the TanStack planning app. "
                "This run tracks the spectral atlas context, selected scenario, and export-ready artifacts."
            ),
            "notes": (
                [
                    f"{city_name} runs are seeded with the bundled study artifacts available in this workspace.",
                    "Current runs are processed by a durable local async queue.",
                ]
                if output_artifact_ids
                else [
                    "This run was queued from the city detail page.",
                    "Current runs are processed by a durable local async queue.",
                ]
            ),
            "outputArtifactIds": output_artifact_ids,
            "logs": [
                f"[{now}] Run created for {city_name}.",
                f"[{now}] Scenario selected: {scenario}.",
                f"[{now}] Runtime mode: local TanStack + FastAPI durable queue worker.",
                *[f"[{now}] {note}" for note in validation_notes],
            ],
        }
        with runtime_state_lock:
            run_store.insert(0, record)
            persist_runtime_runs()

        job_id = enqueue_run_execution(run_id, city_id, scenario)
        with runtime_state_lock:
            record["queueJobId"] = job_id
            record["logs"] = list(record.get("logs", [])) + [f"[{utc_now()}] Durable queue job queued: {job_id}."]
            persist_runtime_runs()
        return record

    return router
