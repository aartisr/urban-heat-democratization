"""Compare two declared ranking rules on each bundled thermal study array.

This is a computational disagreement study, not a field-validation benchmark.
Run from the repository root with ``python scripts/compare_bundled_heat_maps.py``.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("MPLCONFIGDIR", "/tmp/urban-heat-matplotlib")
os.environ.setdefault("XDG_CACHE_HOME", "/tmp/urban-heat-cache")

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import networkx as nx
import numpy as np

from core.graph import build_weighted_grid
from core.pipeline import (
    _cheeger_priority,
    _cut_boundary_mask,
    _distance_to_sinks,
    _sink_nodes,
)
from core.raster import normalize
from core.spectra import lambda2_and_fiedler, sweep_conductance


ASSETS = ROOT / "docs" / "final_paper_assets"
REPORT = ROOT / "docs" / "BUNDLED_MAP_COMPARISON.md"
METADATA = ROOT / "data" / "metadata" / "thermal_sources.json"
TOP_FRACTION = 0.05
ALPHAS = (1.0, 3.0, 5.0)


def selected_cells(scores: np.ndarray, count: int) -> np.ndarray:
    """Select the highest finite scores; break ties in row-major order."""
    flat = np.asarray(scores, dtype=float).ravel()
    valid = np.flatnonzero(np.isfinite(flat))
    if not 0 < count <= len(valid):
        raise ValueError("Selection count must fit the number of valid cells")
    order = valid[np.argsort(-flat[valid], kind="stable")[:count]]
    result = np.zeros(flat.size, dtype=bool)
    result[order] = True
    return result.reshape(scores.shape)


def graph_priority(lst01: np.ndarray, alpha: float) -> tuple[np.ndarray, dict]:
    """Use the repository's graph, sink, boundary and priority definitions."""
    graph, _ = build_weighted_grid(lst01, None, connect8=True, alpha=alpha, beta=0.0)
    if not nx.is_connected(graph):
        raise ValueError("The selected input graph is disconnected")
    lambda2, fiedler, nodes, degree = lambda2_and_fiedler(graph)
    phi, side = sweep_conductance(graph, fiedler, nodes, degree)
    boundary = _cut_boundary_mask(graph, side, lst01.shape, dilation=2)
    sinks = _sink_nodes(graph, None, lst01)
    access = _distance_to_sinks(graph, sinks, lst01.shape)
    priority = _cheeger_priority(boundary, lst01, access)
    return priority, {
        "lambda2": lambda2,
        "sweep_conductance": phi,
        "boundary_cells_after_display_dilation": int(boundary.sum()),
        "inferred_sink_cells": len(sinks),
        "access": access,
    }


def compare_source(source_id: str, record: dict) -> tuple[dict, tuple]:
    path = ROOT / record["file"]
    raw = np.load(path, allow_pickle=False)
    if raw.ndim != 2 or not np.all(np.isfinite(raw)):
        raise ValueError(f"{source_id}: expected a finite two-dimensional array")
    lst01 = normalize(raw)
    valid_count = int(np.isfinite(lst01).sum())
    count = math.ceil(TOP_FRACTION * valid_count)
    baseline = selected_cells(lst01, count)
    rows = []
    default_plot = None
    for alpha in ALPHAS:
        priority, diagnostics = graph_priority(lst01, alpha)
        if int((priority > 0).sum()) < count:
            raise ValueError(f"{source_id}: fewer positive priority cells than selection count")
        graph = selected_cells(priority, count)
        overlap = int(np.logical_and(baseline, graph).sum())
        row = {
            "alpha": alpha,
            "selected_per_method": count,
            "overlap_cells": overlap,
            "jaccard": overlap / (2 * count - overlap),
            "graph_selected_row_col": np.argwhere(graph).tolist(),
            "shared_selected_row_col": np.argwhere(baseline & graph).tolist(),
            "baseline_mean_normalized_heat": float(np.mean(lst01[baseline])),
            "graph_mean_normalized_heat": float(np.mean(lst01[graph])),
            "baseline_mean_poor_modeled_access": float(np.mean(1 - diagnostics["access"][baseline])),
            "graph_mean_poor_modeled_access": float(np.mean(1 - diagnostics["access"][graph])),
            "lambda2": diagnostics["lambda2"],
            "sweep_conductance": diagnostics["sweep_conductance"],
            "boundary_cells_after_display_dilation": diagnostics["boundary_cells_after_display_dilation"],
            "inferred_sink_cells": diagnostics["inferred_sink_cells"],
        }
        rows.append(row)
        if alpha == 3.0:
            default_plot = (lst01, baseline, graph)
    result = {
        "source_label": record["source"],
        "path": str(path.relative_to(ROOT)),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "shape": list(raw.shape),
        "finite_cells": valid_count,
        "simple_selected_row_col": np.argwhere(baseline).tolist(),
        "rows": rows,
    }
    assert default_plot is not None
    return result, default_plot


def save_figure(plots: list[tuple[str, tuple]]) -> None:
    fig, axes = plt.subplots(len(plots), 3, figsize=(11.5, 7.0), constrained_layout=True)
    for source_index, (source, (heat, baseline, graph)) in enumerate(plots):
        for column, (mask, title, color) in enumerate((
            (baseline, "Hottest 5%", "#d94828"),
            (graph, "Graph priority 5%", "#126b69"),
            (baseline & graph, "Selected by both", "#6546a6"),
        )):
            ax = axes[source_index, column]
            ax.imshow(heat, cmap="Greys", vmin=0, vmax=1, interpolation="nearest")
            overlay = np.zeros((*heat.shape, 4))
            overlay[mask] = matplotlib.colors.to_rgba(color, 0.88)
            ax.imshow(overlay, interpolation="nearest")
            ax.set_title(f"{source}: {title}", fontsize=10)
            ax.set_xlabel("Array column")
            ax.set_ylabel("Array row")
    fig.suptitle("Same source cells, same selection count; locations are array positions only", fontsize=12)
    fig.savefig(ASSETS / "bundled_map_comparison.png", dpi=170)
    plt.close(fig)


def save_paper_figure(plot: tuple[str, tuple]) -> None:
    """A compact single-array comparison that stays legible in the paper."""
    source, (heat, baseline, graph) = plot
    fig, axes = plt.subplots(1, 3, figsize=(11.5, 3.6), constrained_layout=True)
    for ax, mask, title, color in zip(
        axes,
        (baseline, graph, baseline & graph),
        ("Hottest 5%", "Graph priority 5%", "Selected by both"),
        ("#d94828", "#126b69", "#6546a6"),
    ):
        ax.imshow(heat, cmap="Greys", vmin=0, vmax=1, interpolation="nearest")
        overlay = np.zeros((*heat.shape, 4))
        overlay[mask] = matplotlib.colors.to_rgba(color, 0.88)
        ax.imshow(overlay, interpolation="nearest")
        ax.set_title(title, fontsize=12)
        ax.set_xticks([])
        ax.set_yticks([])
    fig.suptitle(f"{source} source-labeled array · 52 cells per method · no verified coordinates", fontsize=12)
    fig.savefig(ASSETS / "bundled_map_comparison_paper.png", dpi=180)
    plt.close(fig)


def save_report(results: list[dict]) -> None:
    shapes = ", ".join(f"{item['source_label'].split(' ')[0]} {item['shape'][0]}×{item['shape'][1]}" for item in results)
    selected_counts = {item["rows"][0]["selected_per_method"] for item in results}
    if len(selected_counts) != 1:
        raise ValueError("The bundled arrays require different selection counts; report them separately")
    selected_count = selected_counts.pop()
    default_rows = [next(row for row in item["rows"] if row["alpha"] == 3.0) for item in results]
    overlap_description = ", ".join(
        f"{item['source_label'].split(' ')[0]} {row['overlap_cells']}/{selected_count} (Jaccard {row['jaccard']:.3f})"
        for item, row in zip(results, default_rows)
    )
    if all(
        row["graph_mean_normalized_heat"] < row["baseline_mean_normalized_heat"]
        and row["graph_mean_poor_modeled_access"] < row["baseline_mean_poor_modeled_access"]
        for row in default_rows
    ):
        internal_comparison = "**The graph-selected cells have both lower mean normalized heat and lower mean modeled poor access than the simple-map cells in these arrays.** Those internal descriptors do not support claiming the graph selection is better; its distinct purpose is highlighting a structural boundary."
    else:
        internal_comparison = "The selected-set averages are internal descriptors, not independent evidence that either method chose better sites."
    lines = [
        "# Bundled-array comparison: hot cells versus graph priority",
        "",
        f"This is a **computational disagreement study**, not a field-validation or impact study. It uses two source-labeled arrays already bundled in the repository ({shapes}). The present metadata does not identify acquisition scenes or dates, georeferencing, quality masks, or a reproducible source-to-array processing chain. The arrays must therefore not be described here as independently verified Boston satellite observations or matched locations across sensors.",
        "",
        "## Fair comparison within each array",
        "",
        f"Both methods receive the **same finite cells** after the repository's 2nd/98th-percentile normalization. The simple baseline selects the highest normalized-LST 5% of cells. The graph method builds the repository's eight-neighbor weighted graph without NDVI, selects a Fiedler-sweep boundary, finds least-cost links to the coolest 5% of cells, and ranks the boundary by `0.65 × normalized heat + 0.35 × poor modeled cooling linkage`. The boundary is dilated by two array cells as in the pipeline. Each method selects exactly {selected_count} cells. Ties use row-major order. Alpha is 3 by default; 1 and 5 are sensitivity checks. No location coordinates, field labels, or intervention outcomes enter either ranking.",
        "",
        "## Results",
        "",
        "| Bundled array | Alpha | Cells per method | Overlap | Jaccard overlap | Mean heat: simple / graph | Mean poor modeled access: simple / graph |",
        "|:--|--:|--:|--:|--:|:--|:--|",
    ]
    for source in results:
        name = source["source_label"].split(" ")[0]
        for row in source["rows"]:
            lines.append(
                f"| {name} | {row['alpha']:g} | {row['selected_per_method']} | {row['overlap_cells']} "
                f"| {row['jaccard']:.3f} | {row['baseline_mean_normalized_heat']:.3f} / {row['graph_mean_normalized_heat']:.3f} "
                f"| {row['baseline_mean_poor_modeled_access']:.3f} / {row['graph_mean_poor_modeled_access']:.3f} |"
            )
    lines += [
        "",
        "![Array-cell selection comparison](final_paper_assets/bundled_map_comparison.png)",
        "",
        f"At default alpha 3, the overlaps are {overlap_description}. The graph rule includes modeled access and restricts priority to a candidate boundary, so a different selection is plausible. {internal_comparison} The comparison demonstrates **different selection logic**, not better site selection. Similar results across the two arrays are not independent replication because the arrays' provenance, spatial alignment, and relationship are unverified.",
        "",
        "## What would make this an empirical benchmark",
        "",
        "Recover original product identifiers, acquisition times, georeferencing, quality masks, units, processing code, and exact input hashes. Define independent site or route-segment outcomes before inspecting either ranking. Give both methods the same candidate budget and blinded field-review effort, include sites favored by either and a background sample, and publish exclusions, disagreement, uncertainty, and null results. Local review or measured outcomes are still required to say which method is more useful. A cooling-effect claim additionally needs the design in the [impact evidence protocol](IMPACT_EVIDENCE_PROTOCOL.md).",
        "",
        "## Reproduce and audit",
        "",
        "Run `python scripts/compare_bundled_heat_maps.py` from the repository root. The script uses the same graph and pipeline functions as the app, writes [machine-readable results](final_paper_assets/bundled_map_comparison.json), and regenerates the figure and this report. Source file hashes are in the JSON. The repository's [thermal metadata](../data/metadata/thermal_sources.json) provides source labels but not scene-level provenance. Official [USGS Landsat Level-2 documentation](https://www.usgs.gov/landsat-missions/landsat-collection-2-level-2-science-products) describes the scene metadata needed for a stronger study; [EPA measurement guidance](https://www.epa.gov/heatislands/measuring-heat-islands) explains why surface maps and lived heat need different observations.",
        "",
    ]
    REPORT.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    metadata = json.loads(METADATA.read_text(encoding="utf-8"))
    results = []
    plots = []
    for source_id in ("landsat", "ecostress"):
        result, plot = compare_source(source_id, metadata[source_id])
        results.append(result)
        plots.append((source_id.title(), plot))
    machine = {
        "scope": "bundled-array computational disagreement; no independent ground truth",
        "top_fraction": TOP_FRACTION,
        "alpha_settings": ALPHAS,
        "graph_connect8": True,
        "ndvi_used": False,
        "results": results,
    }
    (ASSETS / "bundled_map_comparison.json").write_text(
        json.dumps(machine, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    save_figure(plots)
    save_paper_figure(plots[0])
    save_report(results)
    print(REPORT)


if __name__ == "__main__":
    main()
