import asyncio

import pytest
from fastapi import HTTPException

from api.main import _SCENARIO_STORE, preview_scenario


def test_preview_is_repeatable_and_does_not_persist_a_scenario():
    original_count = len(_SCENARIO_STORE)
    first = asyncio.run(preview_scenario("boston", 120_000, "benchmark_share"))
    second = asyncio.run(preview_scenario("boston", 120_000, "benchmark_share"))

    assert first.id == second.id
    assert first.budgetUsd == 120_000
    assert first.planningMode == "benchmark_share"
    assert first.allocationSummary is not None
    assert len(_SCENARIO_STORE) == original_count


def test_preview_rejects_unknown_cities():
    with pytest.raises(HTTPException) as error:
        asyncio.run(preview_scenario("missing-city", 120_000, "benchmark_share"))
    assert error.value.status_code == 404
