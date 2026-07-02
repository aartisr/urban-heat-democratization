
import numpy as np
import networkx as nx

def giant_component_fraction(G: nx.Graph) -> float:
    if G.number_of_nodes() == 0:
        return 0.0
    cc = max((len(c) for c in nx.connected_components(G)), default=0)
    return cc / G.number_of_nodes()

def percolation_scan(G: nx.Graph, p_values: list[float], rng: np.random.Generator | None = None):
    rng = rng or np.random.default_rng(42)
    fractions = []
    edges = list(G.edges(data=True))
    for p in p_values:
        H = nx.Graph()
        H.add_nodes_from(G.nodes(data=True))
        for u,v,d in edges:
            if rng.random() < p:
                H.add_edge(u,v, **d)
        fractions.append(giant_component_fraction(H))
    return fractions
