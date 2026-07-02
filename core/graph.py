
import numpy as np
import networkx as nx
from scipy.sparse import coo_matrix, diags

def _indexer(h, w):
    return lambda r, c: r*w + c

def build_weighted_grid(lst01: np.ndarray, ndvi01: np.ndarray | None = None, connect8: bool = True,
                        alpha: float = 3.0, beta: float = 0.5) -> tuple[nx.Graph, np.ndarray]:
    assert lst01.ndim == 2
    h, w = lst01.shape
    mask = np.isfinite(lst01)
    idx = _indexer(h, w)
    G = nx.Graph()
    for r in range(h):
        for c in range(w):
            if mask[r, c]:
                G.add_node(idx(r,c), rc=(r,c))
    gx, gy = np.gradient(np.nan_to_num(lst01, nan=np.nanmean(lst01)))
    gradmag = np.hypot(gx, gy)
    dirs = [(1,0),(0,1)] + ([(1,1),(1,-1)] if connect8 else [])
    for r in range(h):
        for c in range(w):
            if not mask[r,c]:
                continue
            for dr,dc in dirs:
                rr, cc = r+dr, c+dc
                if 0 <= rr < h and 0 <= cc < w and mask[rr,cc]:
                    g = 0.5*(gradmag[r,c] + gradmag[rr,cc])
                    wgt = np.exp(-alpha * g)
                    if ndvi01 is not None:
                        ndv = 0.5*(np.nan_to_num(ndvi01[r,c], nan=0.0) + np.nan_to_num(ndvi01[rr,cc], nan=0.0))
                        wgt *= (1.0 + beta*ndv)
                    wgt = max(float(wgt), 1e-9)
                    length = float(np.hypot(dr, dc))
                    G.add_edge(idx(r,c), idx(rr,cc), w=wgt, cost=length / wgt)
    deg = np.array([sum(d['w'] for _,_,d in G.edges(n, data=True)) for n in G.nodes()], dtype=float)
    return G, deg

def normalized_laplacian(G: nx.Graph):
    nodes = list(G.nodes())
    n = len(nodes)
    i_map = {u:i for i,u in enumerate(nodes)}
    rows, cols, data = [], [], []
    deg = np.zeros(n)
    for u,v,d in G.edges(data=True):
        i,j = i_map[u], i_map[v]
        w = d.get('w',1.0)
        rows += [i,j]; cols += [j,i]; data += [w, w]
        deg[i] += w; deg[j] += w
    A = coo_matrix((data,(rows,cols)), shape=(n,n)).tocsr()
    D = diags(deg)
    L = D - A
    with np.errstate(divide='ignore'):
        d_is = 1.0/np.sqrt(deg)
        d_is[np.isinf(d_is)] = 0.0
    S = diags(d_is)
    Lnorm = S @ L @ S
    return Lnorm, nodes, deg
