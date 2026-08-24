
import numpy as np
import networkx as nx
from .graph import normalized_laplacian

try:
    from scipy.sparse.linalg import eigsh
except ImportError:  # The Vercel runtime uses NumPy for compact demo graphs.
    eigsh = None

def lambda2_and_fiedler(G: nx.Graph):
    L, nodes, deg = normalized_laplacian(G)
    n = L.shape[0]
    if n < 2:
        return 0.0, np.zeros(n), nodes, deg
    if eigsh is not None and n > 3:
        vals, vecs = eigsh(L, k=2, which='SM')
    else:
        dense_laplacian = L.toarray() if hasattr(L, "toarray") else L
        vals, vecs = np.linalg.eigh(dense_laplacian)
    order = np.argsort(vals)
    vals, vecs = vals[order], vecs[:,order]
    return float(vals[1]), vecs[:,1], nodes, deg

def sweep_conductance(G: nx.Graph, fiedler: np.ndarray, nodes: list, deg: np.ndarray):
    order = np.argsort(fiedler)
    node_order = [nodes[i] for i in order]
    idx = {u:i for i,u in enumerate(node_order)}
    vol_total = deg.sum()
    in_set = np.zeros(len(nodes), dtype=bool)
    best_phi, best_t = None, None
    boundary_w, vol_S = 0.0, 0.0
    adj = {u:list(G.edges(u, data=True)) for u in nodes}
    for t,u in enumerate(node_order[:-1], start=1):
        i = idx[u]; in_set[i] = True
        deg_u = 0.0
        for _,v,d in adj[u]:
            w = d.get('w',1.0)
            deg_u += w
            j = idx[v]
            boundary_w -= w if in_set[j] else -w
        vol_S += deg_u
        vol_comp = vol_total - vol_S
        cut = boundary_w
        denom = min(vol_S, vol_comp) if min(vol_S, vol_comp) > 0 else np.inf
        phi = cut/denom
        if best_phi is None or phi < best_phi:
            best_phi, best_t = phi, t
    if best_t is None:
        return 0.0, set()
    S = set(node_order[:best_t])
    return float(best_phi), S
