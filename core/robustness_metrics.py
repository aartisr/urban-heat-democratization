"""One auditable graph-metric bundle for pipelines and teaching interfaces.

This module deliberately owns no intervention semantics. Callers provide a
baseline graph, a comparison graph, and the sink nodes. That makes the same
spectral, conductance, percolation, and sink-reliability calculation available
to the production pipeline and any bounded learning scenario.
"""

from __future__ import annotations

import networkx as nx
import numpy as np

from core.percolation import percolation_scan
from core.reliability import reliability_to_sinks
from core.spectra import lambda2_and_fiedler, sweep_conductance


def evaluate_graph_delta(
    baseline: nx.Graph,
    comparison: nx.Graph,
    sinks: set[int],
    *,
    p_values: list[float],
    edge_retention: float = 0.7,
    trials: int = 64,
    percolation_seeds: tuple[int, int] = (42, 43),
    reliability_seeds: tuple[int, int] = (123, 124),
) -> dict[str, object]:
    """Evaluate one graph pair with the project's canonical metric functions."""
    lambda2_baseline, fiedler_baseline, nodes_baseline, degrees_baseline = lambda2_and_fiedler(baseline)
    lambda2_comparison, fiedler_comparison, nodes_comparison, degrees_comparison = lambda2_and_fiedler(comparison)
    phi_baseline, _ = sweep_conductance(baseline, fiedler_baseline, nodes_baseline, degrees_baseline)
    phi_comparison, _ = sweep_conductance(comparison, fiedler_comparison, nodes_comparison, degrees_comparison)
    return {
        "lambda2Baseline": float(lambda2_baseline),
        "lambda2Intervention": float(lambda2_comparison),
        "phiBaseline": float(phi_baseline),
        "phiIntervention": float(phi_comparison),
        "baselinePercolation": list(map(float, percolation_scan(baseline, p_values, rng=np.random.default_rng(percolation_seeds[0])))),
        "interventionPercolation": list(map(float, percolation_scan(comparison, p_values, rng=np.random.default_rng(percolation_seeds[1])))),
        "reliabilityBaseline": float(reliability_to_sinks(baseline, sinks, p_keep=edge_retention, trials=trials, rng=np.random.default_rng(reliability_seeds[0]))),
        "reliabilityIntervention": float(reliability_to_sinks(comparison, sinks, p_keep=edge_retention, trials=trials, rng=np.random.default_rng(reliability_seeds[1]))),
    }
