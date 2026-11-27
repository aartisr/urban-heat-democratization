"""Background workers must match the runtime lifecycle."""

import pytest

from api import main


@pytest.mark.asyncio
@pytest.mark.parametrize("serverless", [False, True])
async def test_lifespan_only_runs_workers_for_persistent_process(monkeypatch, serverless):
    calls = []

    class Queue:
        def start(self):
            calls.append("queue-start")

        def stop(self):
            calls.append("queue-stop")

    monkeypatch.setattr(main, "is_serverless_runtime", lambda: serverless)
    monkeypatch.setattr(main, "_RUN_QUEUE", Queue())
    monkeypatch.setattr(main, "_resume_live_thermal_workers", lambda: calls.append("thermal-resume"))
    monkeypatch.setattr(main, "_stop_live_thermal_worker", lambda city: calls.append(f"thermal-stop:{city}"))
    monkeypatch.setattr(main, "_LIVE_THERMAL_WORKERS", {"boston": object()})

    async with main.app_lifespan(main.app):
        calls.append("serving")

    assert calls == (["serving"] if serverless else [
        "queue-start", "thermal-resume", "serving", "queue-stop", "thermal-stop:boston",
    ])
