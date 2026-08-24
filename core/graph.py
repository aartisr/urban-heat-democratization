
import numpy as np
import networkx as nx

try:
    from scipy.sparse import coo_matrix, diags
except ImportError:  # Serverless API runtime uses the dense NumPy fallback below.
    coo_matrix = None
    diags = None

def _indexer(h, w):
    return lambda r, c: r*w + c

def build_weighted_grid(lst01: np.ndarray, ndvi01: np.ndarray | None = None, connect8: bool = True,
                        alpha: float = 3.0, beta: float = 0.5) -> tuple[nx.Graph, np.ndarray]:
    """Build an undirected weighted raster graph.

    A valid raster cell is a node.  For adjacent cells ``i`` and ``j``, the
    conductance is ``w_ij = exp(-alpha * g_ij) * (1 + beta * ndvi_ij)`` where
    ``g_ij`` is mean local LST-gradient magnitude and ``ndvi_ij`` is mean
    normalized NDVI when supplied.  The companion ``cost_ij = length_ij/w_ij``
    is a least-cost-path input; it is not an electrical resistance measurement.
    """
    assert lst01.ndim == 2
    if ndvi01 is not None and ndvi01.shape != lst01.shape:
        raise ValueError("lst01 and ndvi01 must have the same shape")
    if alpha < 0 or beta < 0:
        raise ValueError("alpha and beta must be non-negative")
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
    """Return ``D^(-1/2)(D-A)D^(-1/2)``, node order, and weighted degrees.

    Isolated nodes receive a zero inverse-square-root degree, the conventional
    finite representation for this normalized-Laplacian construction.
    """
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
    with np.errstate(divide='ignore'):
        d_is = 1.0/np.sqrt(deg)
        d_is[np.isinf(d_is)] = 0.0

    if coo_matrix is not None and diags is not None:
        A = coo_matrix((data, (rows, cols)), shape=(n, n)).tocsr()
        L = diags(deg) - A
        S = diags(d_is)
        Lnorm = S @ L @ S
    else:
        # The public serverless API evaluates compact demonstration graphs.
        # Avoid a heavyweight SciPy runtime by using the equivalent dense form.
        A = np.zeros((n, n), dtype=float)
        if rows:
            A[rows, cols] = data
        Lnorm = d_is[:, None] * (np.diag(deg) - A) * d_is[None, :]
    return Lnorm, nodes, deg
