"""Calibration, uncertainty, geometry, and benchmark controls for graph studies.

No function in this module makes a public claim.  It produces versionable
evidence objects that a city package must attach before a modelled layer can be
promoted beyond computational verification.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from itertools import combinations, product
from typing import Callable

import networkx as nx
import numpy as np

from .graph import build_weighted_grid
from .spectra import lambda2_and_fiedler, sweep_conductance


@dataclass(frozen=True)
class ThermalInputContract:
    product: str
    units: str
    acquisition_time: str
    spatial_resolution_m: float
    crs: str
    quality_mask_rule: str
    calibration_provenance: str
    source_uri: str

    def validate(self) -> list[str]:
        errors = []
        if not self.product or not self.source_uri or not self.calibration_provenance:
            errors.append("product, source_uri, and calibration_provenance are required")
        if self.units not in {"celsius", "kelvin", "radiance", "reflectance", "digital_number"}:
            errors.append("units must be a supported explicit value")
        if self.spatial_resolution_m <= 0 or not self.crs:
            errors.append("positive spatial_resolution_m and crs are required")
        if not self.acquisition_time or not self.quality_mask_rule:
            errors.append("acquisition_time and quality_mask_rule are required")
        return errors

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class GraphParameters:
    version: str = "1.0.0"
    alpha: float = 3.0
    beta: float = 0.6
    connect8: bool = True
    sink_percentile: float = 95.0
    heat_weight: float = 0.65
    access_weight: float = 0.35

    def validate(self) -> list[str]:
        errors = []
        if not self.version:
            errors.append("version is required")
        if self.alpha < 0 or self.beta < 0:
            errors.append("alpha and beta must be non-negative")
        if not 0 < self.sink_percentile < 100:
            errors.append("sink_percentile must lie strictly between 0 and 100")
        if self.heat_weight < 0 or self.access_weight < 0 or not np.isclose(self.heat_weight + self.access_weight, 1.0):
            errors.append("heat_weight and access_weight must be non-negative and sum to 1")
        return errors

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class InterventionEffectEvidence:
    """A location-aware effect record; absent evidence must not yield a °C claim."""
    intervention_id: str
    outcome: str
    effect_celsius: float
    lower_celsius: float
    upper_celsius: float
    geography: str
    season_window: str
    source: str
    validation_status: str

    def validate(self) -> list[str]:
        errors = []
        if self.outcome not in {"land_surface_temperature", "pedestrian_air_temperature"}:
            errors.append("outcome must be an explicitly supported temperature measure")
        if self.lower_celsius > self.effect_celsius or self.effect_celsius > self.upper_celsius:
            errors.append("effect must lie within its stated interval")
        if not all((self.intervention_id, self.geography, self.season_window, self.source)):
            errors.append("intervention_id, geography, season_window, and source are required")
        if self.validation_status not in {"reference_compared", "externally_validated"}:
            errors.append("effect evidence requires reference_compared or externally_validated status")
        return errors


def calibrated_effect(evidence: InterventionEffectEvidence | None) -> dict[str, object] | None:
    """Return a display-safe effect only when a complete evidence record exists."""
    if evidence is None or evidence.validate():
        return None
    return asdict(evidence)


def graph_metrics(lst01: np.ndarray, ndvi01: np.ndarray | None, parameters: GraphParameters) -> dict[str, object]:
    """One parameterized graph run with stable scalar/cut outputs."""
    errors = parameters.validate()
    if errors:
        raise ValueError("; ".join(errors))
    graph, _ = build_weighted_grid(lst01, ndvi01, connect8=parameters.connect8, alpha=parameters.alpha, beta=parameters.beta)
    if graph.number_of_nodes() < 2 or not nx.is_connected(graph):
        raise ValueError("sensitivity input must create a connected graph with at least two nodes")
    lambda2, fiedler, nodes, degree = lambda2_and_fiedler(graph)
    conductance, cut = sweep_conductance(graph, fiedler, nodes, degree)
    sink_field = ndvi01 if ndvi01 is not None else 1 - np.asarray(lst01, dtype=float)
    sink_cutoff = float(np.nanpercentile(sink_field, parameters.sink_percentile))
    sink_count = int(np.sum(np.isfinite(sink_field) & (sink_field >= sink_cutoff)))
    return {
        "lambda2": lambda2,
        "conductance": conductance,
        "cut": frozenset(cut),
        "node_count": graph.number_of_nodes(),
        "sinkCount": sink_count,
        "sinkCutoff": sink_cutoff,
        "priorityWeights": {"heat": parameters.heat_weight, "access": parameters.access_weight},
    }


def parameter_sensitivity(
    lst01: np.ndarray, ndvi01: np.ndarray | None, candidates: list[GraphParameters],
) -> dict[str, object]:
    """Evaluate declared parameter candidates and report cut persistence."""
    if not candidates:
        raise ValueError("at least one parameter candidate is required")
    runs = [graph_metrics(lst01, ndvi01, candidate) for candidate in candidates]
    cuts = [set(run["cut"]) for run in runs]
    union = set().union(*cuts)
    intersection = set.intersection(*cuts) if cuts else set()
    pairwise = [len(left & right) / len(left | right) if left | right else 1.0 for left, right in combinations(cuts, 2)]
    return {
        "parameters": [candidate.to_dict() for candidate in candidates],
        "runs": [{key: value for key, value in run.items() if key != "cut"} for run in runs],
        "boundaryPersistence": len(intersection) / len(union) if union else 0.0,
        "meanPairwiseCutJaccard": float(np.mean(pairwise)) if pairwise else 1.0,
    }


def bootstrap_graph_uncertainty(
    lst01: np.ndarray, ndvi01: np.ndarray | None, parameters: GraphParameters, *,
    lst_sigma: float, ndvi_sigma: float = 0.0, trials: int = 100, seed: int = 42,
) -> dict[str, object]:
    """Propagate declared independent input-error assumptions through the graph.

    ``lst_sigma``/``ndvi_sigma`` are assumptions, not inferred sensor error.
    They are returned in the result so callers cannot hide them.
    """
    if trials < 20 or lst_sigma < 0 or ndvi_sigma < 0:
        raise ValueError("trials must be at least 20 and sigmas non-negative")
    rng = np.random.default_rng(seed)
    lambda2_values, conductance_values, cuts = [], [], []
    for _ in range(trials):
        sampled_lst = np.where(np.isfinite(lst01), np.clip(lst01 + rng.normal(0, lst_sigma, lst01.shape), 0, 1), np.nan)
        sampled_ndvi = None if ndvi01 is None else np.where(np.isfinite(ndvi01), np.clip(ndvi01 + rng.normal(0, ndvi_sigma, ndvi01.shape), 0, 1), np.nan)
        run = graph_metrics(sampled_lst, sampled_ndvi, parameters)
        lambda2_values.append(float(run["lambda2"]))
        conductance_values.append(float(run["conductance"]))
        cuts.append(set(run["cut"]))
    union = set().union(*cuts)
    frequency = {int(node): sum(node in cut for cut in cuts) / trials for node in union}
    return {
        "assumptions": {"lstSigma": lst_sigma, "ndviSigma": ndvi_sigma, "trials": trials, "seed": seed},
        "lambda2Interval": [float(np.quantile(lambda2_values, 0.05)), float(np.quantile(lambda2_values, 0.95))],
        "conductanceInterval": [float(np.quantile(conductance_values, 0.05)), float(np.quantile(conductance_values, 0.95))],
        "cutMembershipFrequency": frequency,
    }


def calibration_metrics(predicted: np.ndarray, observed: np.ndarray) -> dict[str, float]:
    """Held-out metric helper; callers must supply matched, independent values."""
    predicted, observed = np.asarray(predicted, dtype=float), np.asarray(observed, dtype=float)
    mask = np.isfinite(predicted) & np.isfinite(observed)
    if mask.sum() < 2:
        raise ValueError("at least two matched finite observations are required")
    residual = predicted[mask] - observed[mask]
    return {"n": float(mask.sum()), "mae": float(np.mean(np.abs(residual))), "rmse": float(np.sqrt(np.mean(residual**2))), "bias": float(np.mean(residual))}


def build_geometric_grid(
    values: np.ndarray, *, cell_size_m: float, connect8: bool = False, barrier_mask: np.ndarray | None = None,
) -> nx.Graph:
    """CRS-aware metric grid topology with explicit barriers and edge lengths."""
    if cell_size_m <= 0:
        raise ValueError("cell_size_m must be positive")
    values = np.asarray(values, dtype=float)
    valid = np.isfinite(values)
    barrier = np.zeros(values.shape, dtype=bool) if barrier_mask is None else np.asarray(barrier_mask, dtype=bool)
    if barrier.shape != values.shape:
        raise ValueError("barrier_mask shape must match values")
    graph = nx.Graph()
    rows, cols = values.shape
    directions = [(1, 0), (0, 1)] + ([(1, 1), (1, -1)] if connect8 else [])
    for row, col in product(range(rows), range(cols)):
        if valid[row, col] and not barrier[row, col]:
            graph.add_node(row * cols + col, row=row, col=col, cell_area_m2=cell_size_m**2)
    for row, col in product(range(rows), range(cols)):
        source = row * cols + col
        if source not in graph:
            continue
        for dr, dc in directions:
            rr, cc = row + dr, col + dc
            target = rr * cols + cc
            if 0 <= rr < rows and 0 <= cc < cols and target in graph:
                graph.add_edge(source, target, length_m=float(np.hypot(dr, dc) * cell_size_m))
    return graph


def fiedler_exact_cut_benchmark(graph: nx.Graph, *, max_nodes: int = 16) -> dict[str, float]:
    """Compare sweep conductance to exhaustive cuts only on bounded graphs."""
    if graph.number_of_nodes() > max_nodes:
        raise ValueError(f"exact benchmark limited to {max_nodes} nodes")
    lambda2, fiedler, nodes, degree = lambda2_and_fiedler(graph)
    sweep_phi, _ = sweep_conductance(graph, fiedler, nodes, degree)
    all_nodes, total_volume = set(nodes), float(degree.sum())
    exact_phi = float("inf")
    # Fix the first node outside S to remove complement duplicates.
    first = nodes[0]
    for size in range(1, len(nodes)):
        for subset in combinations(nodes[1:], size):
            selected = set(subset)
            if not selected or len(selected) == len(nodes):
                continue
            cut = sum(float(data.get("w", 1.0)) for left, right, data in graph.edges(data=True) if (left in selected) != (right in selected))
            volume = sum(float(data.get("w", 1.0)) for node in selected for _, _, data in graph.edges(node, data=True))
            denominator = min(volume, total_volume - volume)
            if denominator > 0:
                exact_phi = min(exact_phi, cut / denominator)
    return {"lambda2": float(lambda2), "sweepConductance": float(sweep_phi), "exactConductance": float(exact_phi), "approximationGap": float(sweep_phi - exact_phi)}


def component_aware_diagnostics(graph: nx.Graph, *, island_damping: float = 0.85) -> dict[str, object]:
    """Wire the coastal/island regularizer into the assurance surface.

    It is a diagnostic for disconnected declared graphs, not a fabricated bridge
    or a replacement for the standard pipeline's connected-graph requirement.
    """
    if not 0 <= island_damping <= 1:
        raise ValueError("island_damping must lie in [0, 1]")
    try:
        from .spectral_filter import regularized_fiedler_sweep
    except ImportError as exc:  # deployable runtime intentionally has no SciPy
        return {"status": "unavailable", "reason": "component-aware diagnostics require optional research dependency scipy", "components": nx.number_connected_components(graph)}
    result = regularized_fiedler_sweep(graph, island_damping=island_damping)
    return {**result, "interpretation": "Diagnostic only; damping does not represent a physical ferry, cooling path, or access connection."}
