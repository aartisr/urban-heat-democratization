"""Composable, provenance-first advanced thermal analysis primitives.

This module deliberately separates calculations from publication.  Callers
produce an :class:`AnalysisLayer`, attach their own geometry/artifact, then
pass it through ``validate_layer`` before it can be exposed by an API or map.
The functions use NumPy only so compact computations also work in the deployable
runtime; large raster jobs should run offline and publish COG/vector artifacts.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from hashlib import sha256
from typing import Any, Literal

import networkx as nx
import numpy as np

TruthStatus = Literal["observed", "derived", "context", "planning_proxy"]
ValidationStatus = Literal["blocked", "computationally_verified", "reference_compared", "externally_validated", "governance_approved"]


@dataclass(frozen=True)
class AnalysisLayer:
    """Portable metadata contract for a publishable analysis layer.

    ``validation_status`` is intentionally distinct from ``truth_status``:
    a derived layer can be computationally verified without being externally
    validated, and a context layer needs governance approval before public use.
    """

    id: str
    family: str
    display_label: str
    truth_status: TruthStatus
    validation_status: ValidationStatus
    method_name: str
    method_version: str
    source_inputs: tuple[str, ...]
    parameters: dict[str, Any]
    interpretation: str
    limitations: tuple[str, ...]
    artifact_path: str | None = None
    artifact_sha256: str | None = None
    quality: dict[str, Any] = field(default_factory=dict)
    visualization: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def validate_layer(layer: AnalysisLayer, *, public: bool = False) -> list[str]:
    """Return contract violations; an empty list means the layer is publishable.

    Public layers require reference comparison; context layers additionally need
    governance approval.  This prevents a mathematically valid preview from
    being silently promoted to a civic claim.
    """
    errors: list[str] = []
    if not layer.id or not layer.family or not layer.display_label:
        errors.append("id, family, and display_label are required")
    if not layer.source_inputs:
        errors.append("at least one source input is required")
    if not layer.method_name or not layer.method_version:
        errors.append("method name and version are required")
    if not layer.interpretation or not layer.limitations:
        errors.append("interpretation and at least one limitation are required")
    if layer.artifact_path and not layer.artifact_sha256:
        errors.append("artifact_path requires artifact_sha256")
    if public and layer.validation_status not in {"reference_compared", "externally_validated", "governance_approved"}:
        errors.append("public layers require reference_compared or stronger validation")
    if public and layer.truth_status == "context" and layer.validation_status != "governance_approved":
        errors.append("public context layers require governance_approved validation")
    return errors


def array_fingerprint(values: np.ndarray) -> str:
    """Stable content hash for provenance records, including shape and NaNs."""
    array = np.asarray(values, dtype="float64")
    canonical = np.nan_to_num(array, nan=np.inf, posinf=np.inf, neginf=-np.inf)
    return sha256(repr((array.shape, canonical.tolist())).encode("utf-8")).hexdigest()


def dn_to_radiance(dn: np.ndarray, multiplicative: float, additive: float) -> np.ndarray:
    return np.asarray(dn, dtype=float) * float(multiplicative) + float(additive)


def brightness_temperature_kelvin(radiance: np.ndarray, k1: float, k2: float) -> np.ndarray:
    radiance = np.asarray(radiance, dtype=float)
    if k1 <= 0 or k2 <= 0:
        raise ValueError("k1 and k2 must be positive")
    with np.errstate(divide="ignore", invalid="ignore"):
        return np.where(radiance > 0, float(k2) / np.log((float(k1) / radiance) + 1.0), np.nan)


def ndvi(nir: np.ndarray, red: np.ndarray) -> np.ndarray:
    nir, red = np.asarray(nir, dtype=float), np.asarray(red, dtype=float)
    if nir.shape != red.shape:
        raise ValueError("nir and red must have the same shape")
    with np.errstate(divide="ignore", invalid="ignore"):
        return np.where(np.abs(nir + red) > 1e-12, (nir - red) / (nir + red), np.nan)


def fractional_vegetation_cover(ndvi_values: np.ndarray, ndvi_min: float, ndvi_max: float) -> np.ndarray:
    if ndvi_max <= ndvi_min:
        raise ValueError("ndvi_max must be greater than ndvi_min")
    fraction = (np.asarray(ndvi_values, dtype=float) - ndvi_min) / (ndvi_max - ndvi_min)
    return np.clip(fraction, 0.0, 1.0) ** 2


def emissivity_from_fvc(fvc: np.ndarray, intercept: float = 0.986, slope: float = 0.004) -> np.ndarray:
    return np.clip(float(intercept) + (float(slope) * np.asarray(fvc, dtype=float)), 0.0, 1.0)


def single_channel_lst_celsius(brightness_kelvin: np.ndarray, emissivity: np.ndarray, wavelength_um: float, rho_um_k: float = 14388.0) -> np.ndarray:
    brightness_kelvin, emissivity = np.asarray(brightness_kelvin, dtype=float), np.asarray(emissivity, dtype=float)
    if brightness_kelvin.shape != emissivity.shape:
        raise ValueError("brightness_kelvin and emissivity must have the same shape")
    if wavelength_um <= 0 or rho_um_k <= 0:
        raise ValueError("wavelength_um and rho_um_k must be positive")
    with np.errstate(divide="ignore", invalid="ignore"):
        denominator = 1 + ((float(wavelength_um) * brightness_kelvin / float(rho_um_k)) * np.log(emissivity))
        return np.where((emissivity > 0) & (denominator > 0), (brightness_kelvin / denominator) - 273.15, np.nan)


def split_window_lst_celsius(
    tb10_c: np.ndarray, tb11_c: np.ndarray, mean_emissivity: np.ndarray, delta_emissivity: np.ndarray,
    water_vapor: np.ndarray | float, *, c0: float, c1: float, c2: float, a1: float, a2: float, b1: float, b2: float,
) -> np.ndarray:
    """Product-specific split-window calculation; callers must record coefficients."""
    tb10_c, tb11_c, mean_emissivity, delta_emissivity = [np.asarray(value, dtype=float) for value in (tb10_c, tb11_c, mean_emissivity, delta_emissivity)]
    delta = tb10_c - tb11_c
    water = np.asarray(water_vapor, dtype=float)
    return tb10_c + c1 * delta + c2 * delta**2 + c0 + (a1 + a2 * water) * (1 - mean_emissivity) + (b1 + b2 * water) * delta_emissivity


def rook_weights(shape: tuple[int, int], valid: np.ndarray | None = None) -> list[list[int]]:
    """Return deterministic raster-rook neighbours, omitting invalid cells."""
    rows, cols = shape
    mask = np.ones(shape, dtype=bool) if valid is None else np.asarray(valid, dtype=bool)
    if mask.shape != shape:
        raise ValueError("valid mask shape must match shape")
    neighbours: list[list[int]] = [[] for _ in range(rows * cols)]
    for row in range(rows):
        for col in range(cols):
            index = row * cols + col
            if not mask[row, col]:
                continue
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                rr, cc = row + dr, col + dc
                if 0 <= rr < rows and 0 <= cc < cols and mask[rr, cc]:
                    neighbours[index].append(rr * cols + cc)
    return neighbours


def _moran_statistics(values: np.ndarray, neighbours: list[list[int]]) -> tuple[float, np.ndarray, np.ndarray]:
    valid = np.isfinite(values)
    centered = np.where(valid, values - np.nanmean(values), 0.0)
    denominator = float(np.sum(centered**2))
    edge_count = sum(len(items) for items in neighbours)
    if denominator <= 0 or edge_count == 0:
        return 0.0, np.zeros_like(values), centered
    numerator = sum(centered[index] * sum(centered[j] for j in items) for index, items in enumerate(neighbours) if valid[index])
    global_i = (valid.sum() / edge_count) * (numerator / denominator)
    local_i = centered * np.array([sum(centered[j] for j in items) for items in neighbours], dtype=float)
    return float(global_i), local_i, centered


def benjamini_hochberg(p_values: np.ndarray) -> np.ndarray:
    """FDR-adjust p-values, retaining NaN for unavailable tests."""
    result = np.full(p_values.shape, np.nan, dtype=float)
    valid_indices = np.flatnonzero(np.isfinite(p_values))
    if not len(valid_indices):
        return result
    ordered = valid_indices[np.argsort(p_values[valid_indices])]
    count = len(ordered)
    adjusted = np.empty(count, dtype=float)
    running = 1.0
    for reverse_index in range(count - 1, -1, -1):
        rank = reverse_index + 1
        running = min(running, (p_values[ordered[reverse_index]] * count) / rank)
        adjusted[reverse_index] = running
    result[ordered] = adjusted
    return result


def moran_lisa(values_2d: np.ndarray, *, permutations: int = 499, seed: int = 42, alpha: float = 0.05) -> dict[str, np.ndarray | float]:
    """Global Moran's I plus FDR-adjusted local Moran categories for a raster.

    The permutation p-values test local-statistic magnitude under value exchange;
    they are a spatial-pattern diagnostic, not a causal or hotspot test.
    """
    values_2d = np.asarray(values_2d, dtype=float)
    if values_2d.ndim != 2:
        raise ValueError("values_2d must be two-dimensional")
    if permutations < 99:
        raise ValueError("permutations must be at least 99")
    flat = values_2d.ravel()
    valid = np.isfinite(flat)
    neighbours = rook_weights(values_2d.shape, valid.reshape(values_2d.shape))
    global_i, local_i, centered = _moran_statistics(flat, neighbours)
    p_values = np.full(flat.shape, np.nan, dtype=float)
    tested = valid & np.array([len(items) > 0 for items in neighbours])
    rng = np.random.default_rng(seed)
    valid_values = flat[valid]
    observed = np.abs(local_i)
    exceedances = np.zeros(flat.shape, dtype=int)
    for _ in range(permutations):
        shuffled = flat.copy()
        shuffled[valid] = rng.permutation(valid_values)
        _, simulated, _ = _moran_statistics(shuffled, neighbours)
        exceedances += (np.abs(simulated) >= observed) & tested
    p_values[tested] = (exceedances[tested] + 1) / (permutations + 1)
    adjusted = benjamini_hochberg(p_values)
    neighbour_mean = np.array([np.mean(flat[items]) if items else np.nan for items in neighbours])
    categories = np.full(flat.shape, "insufficient", dtype=object)
    significant = tested & (adjusted <= alpha)
    high = flat >= np.nanmean(flat)
    neighbour_high = neighbour_mean >= np.nanmean(flat)
    categories[significant & high & neighbour_high] = "high-high"
    categories[significant & ~high & ~neighbour_high] = "low-low"
    categories[significant & high & ~neighbour_high] = "high-low"
    categories[significant & ~high & neighbour_high] = "low-high"
    categories[tested & ~significant] = "not-significant"
    return {
        "global_i": global_i,
        "local_i": local_i.reshape(values_2d.shape),
        "p_value": p_values.reshape(values_2d.shape),
        "p_adjusted": adjusted.reshape(values_2d.shape),
        "category": categories.reshape(values_2d.shape),
    }


def threshold_exceedance(stack: np.ndarray, threshold: float) -> dict[str, np.ndarray]:
    """Scene-count and valid-scene share above a threshold for [time,row,col]."""
    stack = np.asarray(stack, dtype=float)
    if stack.ndim != 3:
        raise ValueError("stack must have shape [time, row, col]")
    valid_count = np.sum(np.isfinite(stack), axis=0)
    exceedance_count = np.sum(np.where(np.isfinite(stack), stack > threshold, False), axis=0)
    with np.errstate(divide="ignore", invalid="ignore"):
        share = np.where(valid_count > 0, exceedance_count / valid_count, np.nan)
    return {"valid_scene_count": valid_count, "exceedance_count": exceedance_count, "exceedance_share": share}


def land_transition(before: np.ndarray, after: np.ndarray, *, valid_classes: set[int] | None = None) -> dict[str, np.ndarray]:
    before, after = np.asarray(before), np.asarray(after)
    if before.shape != after.shape or before.ndim != 2:
        raise ValueError("before and after must be matching two-dimensional classifications")
    valid = np.isfinite(before) & np.isfinite(after)
    if valid_classes is not None:
        valid &= np.isin(before, list(valid_classes)) & np.isin(after, list(valid_classes))
    labels = np.full(before.shape, "insufficient", dtype=object)
    labels[valid & (before == after)] = "stable"
    labels[valid & (before != after)] = "changed"
    pairs = np.where(valid, np.char.add(np.char.add(before.astype(str), "→"), after.astype(str)), "insufficient")
    return {"transition": pairs, "change_class": labels, "valid": valid}


def empirical_density(values: np.ndarray, *, bins: int = 20) -> dict[str, np.ndarray]:
    """Histogram density for a documented time/window sample, never a forecast."""
    valid = np.asarray(values, dtype=float)[np.isfinite(values)]
    if not len(valid):
        raise ValueError("at least one finite value is required")
    density, edges = np.histogram(valid, bins=bins, density=True)
    return {"bin_edges": edges, "density": density, "sample_size": np.array([len(valid)])}


def joint_conditional_probability(condition_a: np.ndarray, condition_b: np.ndarray, *, valid: np.ndarray | None = None) -> dict[str, float]:
    """Area-level joint/conditional proportions with explicit denominator."""
    a, b = np.asarray(condition_a, dtype=bool), np.asarray(condition_b, dtype=bool)
    if a.shape != b.shape:
        raise ValueError("condition arrays must have the same shape")
    eligible = np.ones(a.shape, dtype=bool) if valid is None else np.asarray(valid, dtype=bool)
    if eligible.shape != a.shape:
        raise ValueError("valid mask must match condition arrays")
    denominator = int(eligible.sum())
    a_count = int((a & eligible).sum())
    b_count = int((b & eligible).sum())
    joint_count = int((a & b & eligible).sum())
    return {
        "denominator": float(denominator),
        "p_a": a_count / denominator if denominator else np.nan,
        "p_b": b_count / denominator if denominator else np.nan,
        "p_a_and_b": joint_count / denominator if denominator else np.nan,
        "p_b_given_a": joint_count / a_count if a_count else np.nan,
        "p_a_given_b": joint_count / b_count if b_count else np.nan,
    }


def markov_transition_matrix(before: np.ndarray, after: np.ndarray, classes: list[int]) -> dict[str, np.ndarray]:
    """Counts and row-normalized transitions for harmonized class rasters."""
    transitions = land_transition(before, after, valid_classes=set(classes))
    valid = transitions["valid"]
    before, after = np.asarray(before), np.asarray(after)
    counts = np.zeros((len(classes), len(classes)), dtype=int)
    for row, start in enumerate(classes):
        for col, end in enumerate(classes):
            counts[row, col] = int((valid & (before == start) & (after == end)).sum())
    with np.errstate(divide="ignore", invalid="ignore"):
        probabilities = np.divide(counts, counts.sum(axis=1, keepdims=True), where=counts.sum(axis=1, keepdims=True) > 0)
    return {"classes": np.asarray(classes), "counts": counts, "probabilities": probabilities}


def fit_gev_block_maxima(values: np.ndarray) -> dict[str, float]:
    """Fit a GEV distribution when the optional research dependency is present.

    This deliberately does not hide SciPy behind an approximate implementation:
    extreme-value estimates must be produced in the research environment and
    accompanied by diagnostics, block definition, and uncertainty artifacts.
    """
    valid = np.asarray(values, dtype=float)[np.isfinite(values)]
    if len(valid) < 20:
        raise ValueError("GEV fitting requires at least 20 finite block maxima")
    try:
        from scipy.stats import genextreme
    except ImportError as exc:  # pragma: no cover - deployable runtime intentionally omits SciPy
        raise RuntimeError("GEV fitting requires the optional research dependency scipy") from exc
    shape, location, scale = genextreme.fit(valid)
    return {"shape": float(shape), "location": float(location), "scale": float(scale), "sample_size": float(len(valid))}


def spectral_clusters(graph: nx.Graph, clusters: int) -> dict[str, Any]:
    """Deterministic normalized-Laplacian spectral clustering for audit use."""
    if clusters < 2 or clusters > graph.number_of_nodes():
        raise ValueError("clusters must be between 2 and the graph node count")
    nodes = list(graph.nodes())
    adjacency = nx.to_numpy_array(graph, nodelist=nodes, weight="w", dtype=float)
    degree = adjacency.sum(axis=1)
    inverse = np.zeros_like(degree)
    nonzero = degree > 0
    inverse[nonzero] = 1 / np.sqrt(degree[nonzero])
    laplacian = np.eye(len(nodes)) - (inverse[:, None] * adjacency * inverse[None, :])
    values, vectors = np.linalg.eigh(laplacian)
    embedding = vectors[:, :clusters]
    norms = np.linalg.norm(embedding, axis=1, keepdims=True)
    embedding = np.divide(embedding, norms, out=np.zeros_like(embedding), where=norms > 0)
    # Deterministic farthest-point initialization plus Lloyd iterations.
    centers = [embedding[0]]
    while len(centers) < clusters:
        distances = np.min(np.stack([np.sum((embedding - center) ** 2, axis=1) for center in centers]), axis=0)
        centers.append(embedding[int(np.argmax(distances))])
    centers_array = np.asarray(centers)
    labels = np.zeros(len(nodes), dtype=int)
    for _ in range(100):
        next_labels = np.argmin(((embedding[:, None, :] - centers_array[None, :, :]) ** 2).sum(axis=2), axis=1)
        next_centers = np.array([embedding[next_labels == label].mean(axis=0) if np.any(next_labels == label) else centers_array[label] for label in range(clusters)])
        if np.array_equal(next_labels, labels):
            break
        labels, centers_array = next_labels, next_centers
    communities = [set(nodes[np.flatnonzero(labels == label)]) for label in range(clusters)]
    return {"nodes": nodes, "labels": labels, "eigenvalues": values[:clusters], "modularity": float(nx.algorithms.community.modularity(graph, communities, weight="w"))}


def minimum_cut_summary(graph: nx.Graph, source: Any, target: Any, *, capacity: str = "w") -> dict[str, Any]:
    """Explicit opt-in min-cut helper; never substitutes raster adjacency for access."""
    value, partition = nx.minimum_cut(graph, source, target, capacity=capacity)
    left, right = partition
    return {"cut_value": float(value), "source_partition": sorted(left, key=str), "target_partition": sorted(right, key=str)}
