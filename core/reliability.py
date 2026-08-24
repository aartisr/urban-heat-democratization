
import numpy as np
import networkx as nx

def reliability_to_sinks(G: nx.Graph, sinks: set[int], p_keep: float = 0.9, trials: int = 256,
                          rng: np.random.Generator | None = None) -> float:
    """Estimate the expected share of nodes connected to at least one sink.

    Each trial independently retains every edge with probability ``p_keep``.
    The returned Monte Carlo mean is a graph-model reliability proxy, not a
    probability that people can reach cooling in the physical city.
    """
    if not 0.0 <= p_keep <= 1.0:
        raise ValueError("p_keep must lie in [0, 1]")
    if trials < 1:
        raise ValueError("trials must be at least 1")
    rng = rng or np.random.default_rng(123)
    edges = list(G.edges(data=True))
    n = G.number_of_nodes()
    sink_list = list(sinks)
    if n == 0 or not sink_list:
        return 0.0

    estimates = []
    for _ in range(trials):
        edge_mask = rng.random(len(edges)) < p_keep
        sampled_edges = [edges[i] for i in np.flatnonzero(edge_mask)]
        H = nx.Graph()
        H.add_nodes_from(G.nodes(data=True))
        H.add_edges_from([(u, v, d) for u, v, d in sampled_edges])
        reached = 0
        for component in nx.connected_components(H):
            if any(s in component for s in sink_list):
                reached += len(component)
        estimates.append(reached / n)
    return float(np.mean(estimates))
