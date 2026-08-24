import numpy as np
import networkx as nx

from core.graph import build_weighted_grid
from core.percolation import percolation_scan
from core.reliability import reliability_to_sinks
from core.spectra import lambda2_and_fiedler, sweep_conductance


def test_normalized_laplacian_path_has_expected_lambda2():
    graph = nx.path_graph(3)
    nx.set_edge_attributes(graph, 1.0, "w")

    lambda2, fiedler, nodes, deg = lambda2_and_fiedler(graph)

    assert np.isclose(lambda2, 1.0)
    assert len(fiedler) == 3
    assert nodes == [0, 1, 2]
    assert np.allclose(deg, [1.0, 2.0, 1.0])


def test_grid_edges_store_conductance_and_resistance_cost():
    lst = np.array([[0.0, 0.1], [0.2, 0.3]], dtype="float32")
    ndvi = np.ones_like(lst)

    graph, _ = build_weighted_grid(lst, ndvi, connect8=False, alpha=1.0, beta=0.5)

    assert graph.number_of_nodes() == 4
    assert graph.number_of_edges() == 4
    for _, _, data in graph.edges(data=True):
        assert data["w"] > 0
        assert data["cost"] > 0
        assert np.isclose(data["cost"], 1.0 / data["w"])


def test_cheeger_sweep_and_sink_reliability_are_bounded():
    graph = nx.path_graph(5)
    nx.set_edge_attributes(graph, 1.0, "w")
    nx.set_edge_attributes(graph, 1.0, "cost")

    lambda2, fiedler, nodes, deg = lambda2_and_fiedler(graph)
    phi, selected = sweep_conductance(graph, fiedler, nodes, deg)
    reliability = reliability_to_sinks(graph, {0}, p_keep=1.0, trials=4)

    assert lambda2 > 0
    assert 0 <= phi <= 1
    assert selected
    assert reliability == 1.0


def test_probability_contracts_reject_invalid_values():
    graph = nx.path_graph(2)
    nx.set_edge_attributes(graph, 1.0, "w")

    with np.testing.assert_raises(ValueError):
        reliability_to_sinks(graph, {0}, p_keep=1.01)
    with np.testing.assert_raises(ValueError):
        percolation_scan(graph, [-0.1])
