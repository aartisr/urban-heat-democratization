import asyncio

import numpy as np

from api.main import _boston_mitigation_lab_baseline, _mitigation_lab_graph_baseline, _mitigation_lab_graph_delta, _toy_robustness_graphs, _toy_robustness_payload, mitigation_lab_calibration_gate
from core.robustness_metrics import evaluate_graph_delta


def test_boston_lab_baseline_is_coarse_and_safe():
    baseline = _boston_mitigation_lab_baseline()

    assert baseline["id"] == "boston-study-aggregate"
    assert (baseline["width"], baseline["height"]) == (64, 64)
    assert len(baseline["priority"]) == 64 * 64
    assert all(0 <= value <= 1 for value in baseline["priority"])
    assert "source geometry" in " ".join(baseline["limitations"]).lower()


def test_calibration_gate_is_closed_until_external_requirements_are_met():
    gate = asyncio.run(mitigation_lab_calibration_gate())

    assert gate.enabled is False
    assert gate.evidenceState == "planning"
    assert len(gate.requirements) == 4


def test_mitigation_graph_uses_the_robustness_scenario_contract():
    baseline = _mitigation_lab_graph_baseline()
    delta = _mitigation_lab_graph_delta(1)

    assert baseline["graphId"] == delta["graphId"]
    assert len(baseline["nodes"]) == 9
    assert len(baseline["edges"]) == 10
    assert any(node["label"] == "High heat-pressure zone" for node in baseline["nodes"])
    assert baseline["sharedMetrics"] == ["lambda2", "conductance", "percolation", "sink_reliability"]
    assert delta["lambda2Intervention"] > delta["lambda2Baseline"]
    assert delta["reliabilityIntervention"] >= delta["reliabilityBaseline"]


def test_labs_use_the_same_canonical_graph_metric_evaluator():
    baseline, intervention = _toy_robustness_graphs(1)
    direct = evaluate_graph_delta(
        baseline,
        intervention,
        {0},
        p_values=list(np.linspace(0.1, 1.0, 10)),
        edge_retention=0.7,
        trials=256,
    )
    lab = _toy_robustness_payload(edge_retention=0.7, trials=256, redundant_links=1)

    for key, expected in direct.items():
        assert np.allclose(lab[key], expected)
