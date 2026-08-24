import numpy as np

from core.graph import build_weighted_grid
from core.percolation import percolation_scan
from core.reliability import reliability_to_sinks
from core.spectra import lambda2_and_fiedler, sweep_conductance


def _run_reference_analysis():
    lst = np.array(
        [[0.10, 0.20, 0.80], [0.15, 0.35, 0.75], [0.05, 0.30, 0.70]],
        dtype="float32",
    )
    ndvi = np.array(
        [[0.90, 0.60, 0.10], [0.80, 0.50, 0.15], [0.95, 0.55, 0.20]],
        dtype="float32",
    )
    graph, _ = build_weighted_grid(lst, ndvi, connect8=False, alpha=2.0, beta=0.5)
    lambda2, fiedler, nodes, degrees = lambda2_and_fiedler(graph)
    phi, selected = sweep_conductance(graph, fiedler, nodes, degrees)
    percolation = percolation_scan(graph, [0.3, 0.7, 1.0], rng=np.random.default_rng(2026))
    reliability = reliability_to_sinks(graph, {0}, p_keep=0.7, trials=128, rng=np.random.default_rng(2027))
    return lambda2, phi, selected, percolation, reliability


def test_reference_spectral_analysis_is_repeatable_with_fixed_inputs_and_seeds():
    first = _run_reference_analysis()
    second = _run_reference_analysis()

    assert np.isclose(first[0], second[0])
    assert np.isclose(first[1], second[1])
    assert first[2] == second[2]
    assert np.allclose(first[3], second[3])
    assert np.isclose(first[4], second[4])
