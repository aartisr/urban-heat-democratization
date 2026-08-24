# Cheeger bottleneck priority

## Plain-language purpose

This layer marks places where the modeled urban heat-and-cooling network is weakly connected. It is a **prioritization signal**, not a diagnosis of any person, block, or neighborhood.

## Inputs

- A land-surface-temperature raster, normalized to a 0–1 scale.
- An optional vegetation index (NDVI), also normalized to 0–1.
- Valid raster cells, joined to their four or eight neighboring cells.

## Step 1 — build a weighted graph

Every valid raster cell becomes a node. Neighboring cells are joined by an edge with conductance

`w_ij = exp(-alpha × g_ij) × (1 + beta × NDVI_ij)`.

Here `g_ij` is the mean local temperature-gradient magnitude across the two cells. Sharp heat changes lower conductance; greener connections can raise it. The published pipeline defaults are `alpha = 3.0` and `beta = 0.6`.

## Step 2 — find the mathematically weak seam

Let `A` be the weighted adjacency matrix and `D` the diagonal degree matrix. The normalized graph Laplacian is

`L_norm = D^(-1/2) (D - A) D^(-1/2)`.

We compute its second-smallest eigenvalue and corresponding Fiedler vector. Sorting cells by that vector produces candidate partitions. For each candidate set `S`, the pipeline calculates conductance

`phi(S) = cut(S, Sᶜ) / min(vol(S), vol(Sᶜ))`.

The lowest-conductance sweep cut is the Cheeger-style bottleneck. The displayed cells are the boundary of that cut, expanded slightly for a readable geographic output.

## Step 3 — turn a seam into a priority

Only cells on the bottleneck boundary receive a priority score:

`priority = 0.65 × normalized_heat + 0.35 × (1 - cooling_access)`.

The value is clipped to `[0, 1]` and exported on a 0–100 display scale. The score says **where to investigate first**, not that an intervention will produce a particular temperature reduction.

## How to interpret responsibly

- Compare with local shade, housing, health, access, and community knowledge before acting.
- A low-conductance result can reflect raster resolution, missing cells, or parameter choices.
- The result is not a causal estimate, exposure measurement, or individual-level risk score.

## Reproducibility

Implementation: `core/graph.py`, `core/spectra.py`, and `core/pipeline.py`. Run configuration, input dates, raster resolution, missing-data treatment, and parameters must accompany any public claim.
