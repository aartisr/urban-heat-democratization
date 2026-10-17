import numpy as np
import networkx as nx

from core.assurance import (
    GraphParameters,
    InterventionEffectEvidence,
    ThermalInputContract,
    bootstrap_graph_uncertainty,
    build_geometric_grid,
    calibration_metrics,
    calibrated_effect,
    component_aware_diagnostics,
    fiedler_exact_cut_benchmark,
    parameter_sensitivity,
)


def test_input_contract_requires_calibration_and_quality_metadata():
    invalid = ThermalInputContract("", "celsius", "", 0, "", "", "", "")
    assert invalid.validate()
    valid = ThermalInputContract("Landsat Collection 2 L2", "celsius", "2026-07-01T10:00:00Z", 30, "EPSG:32619", "QA_PIXEL clear", "USGS product metadata", "https://example.test/scene")
    assert valid.validate() == []


def test_sensitivity_and_bootstrap_return_explicit_stability_assumptions():
    lst = np.array([[0.1, 0.2, 0.7], [0.1, 0.3, 0.8], [0.2, 0.4, 0.9]])
    ndvi = np.ones_like(lst) * 0.4
    candidates = [GraphParameters(alpha=1.0, beta=0.2), GraphParameters(alpha=2.0, beta=0.6, connect8=False)]
    sensitivity = parameter_sensitivity(lst, ndvi, candidates)
    assert len(sensitivity["runs"]) == 2
    assert 0 <= sensitivity["boundaryPersistence"] <= 1
    uncertainty = bootstrap_graph_uncertainty(lst, ndvi, candidates[0], lst_sigma=0.01, ndvi_sigma=0.01, trials=20)
    assert uncertainty["assumptions"]["trials"] == 20
    assert uncertainty["lambda2Interval"][0] <= uncertainty["lambda2Interval"][1]


def test_geometry_and_exact_cut_benchmark_have_declared_units_and_small_graph_limit():
    graph = build_geometric_grid(np.ones((2, 2)), cell_size_m=30, barrier_mask=np.array([[False, False], [True, False]]))
    assert graph.number_of_nodes() == 3
    assert all(edge[2]["length_m"] > 0 for edge in graph.edges(data=True))
    path = nx.path_graph(4)
    nx.set_edge_attributes(path, 1.0, "w")
    result = fiedler_exact_cut_benchmark(path)
    assert result["exactConductance"] <= result["sweepConductance"] + 1e-9
    metrics = calibration_metrics(np.array([1.0, 2.0]), np.array([1.5, 1.5]))
    assert metrics["mae"] == 0.5


def test_effects_and_component_regularization_are_explicitly_gated():
    unsupported = InterventionEffectEvidence("trees", "land_surface_temperature", -1.0, -2.0, 0.0, "Boston", "summer noon", "source", "planning")
    assert calibrated_effect(unsupported) is None
    supported = InterventionEffectEvidence("trees", "land_surface_temperature", -1.0, -2.0, 0.0, "Boston", "summer noon", "source", "reference_compared")
    assert calibrated_effect(supported)["effect_celsius"] == -1.0
    graph = nx.path_graph(3)
    nx.set_edge_attributes(graph, 1.0, "weight")
    diagnostic = component_aware_diagnostics(graph)
    assert diagnostic["status"] in {"regularized_success", "unavailable"}
