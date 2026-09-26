# How Urban Thermal Math Is Used in Urban Heat Democratization

This companion makes one promise: every mathematical term should lead to a
real implementation location, a visible product surface, and an honest
interpretation boundary. Read the full derivations in [Urban Thermal Network
Math Deep Dive](Urban_Thermal_Math_Deep_Dive.md).

## The short answer

Urban Heat Democratization uses graph mathematics to turn a declared thermal
and vegetation raster into **inspectable structural questions**:

```text
valid raster cells + stated adjacency + stated weight rule
                         ↓
                 weighted graph
                         ↓
  spectral cut + least-cost cooling-access + stress-test metrics
                         ↓
      map overlays, evidence records, and learning experiences
                         ↓
   questions for local investigation — never an automatic prescription
```

The mathematics is used to describe the structure of the modelled network. It
does not measure air flow, indoor temperature, a person’s exposure, public
accessibility, or the effect of a proposed intervention.

## What is implemented today

| Mathematical step | Repository implementation | Where a person encounters it | What it can support | What it cannot support |
| --- | --- | --- | --- | --- |
| Build the graph | [`core/graph.py`](../core/graph.py) converts valid LST cells, and optional NDVI cells, into a weighted 4- or 8-neighbor graph. | A processed city package; the Robustness Lab’s shared teaching graph. | A declared network representation. | A complete physical model of a city. |
| Calculate \(\lambda_2\) and Fiedler ordering | [`core/spectra.py`](../core/spectra.py) constructs the normalized Laplacian and its second eigenpair. | Robustness and Mitigation Lab explanatory readouts. | Relative structural connectivity in the declared graph. | A temperature, health, or equity outcome. |
| Find a low-conductance cut | [`core/spectra.py`](../core/spectra.py) sweeps Fiedler-ordered threshold sets. [`core/pipeline.py`](../core/pipeline.py) converts the boundary to an exportable mask/overlay. | City atlas “Cheeger bottleneck” layer, when a city package provides it. | A candidate break in modelled connectivity worth checking locally. | Proof that heat is trapped, relief moves through a corridor, or a parcel caused harm. |
| Estimate cooling-access proxy | [`core/pipeline.py`](../core/pipeline.py) selects inferred sinks, creates a zero-cost super-sink, and runs Dijkstra over `cost = length / conductance`. | City atlas cooling-access constraint layer. | Relative least-cost linkage to the project’s inferred sinks. | Verified walking access, safe access, or access to an operating cooling center. |
| Stress-test connections | [`core/percolation.py`](../core/percolation.py) samples independently retained edges; [`core/reliability.py`](../core/reliability.py) estimates sink reachability. | Interactive Robustness Lab and shared Mitigation Lab graph readout. | How the stated graph changes under the stated random-edge model. | A forecast of failures during a heat event. |
| Compare a bounded graph scenario | [`core/robustness_metrics.py`](../core/robustness_metrics.py) evaluates the same metrics for a baseline and comparison graph. | `/robustness` and the Mitigation Lab graph-delta readout. | Reproducible changes in a teaching scenario. | A city-specific intervention benefit or infrastructure design. |

## From source artifact to city atlas

The analytical pipeline is deliberately separable from the interface:

1. A supported thermal raster is normalized; optional vegetation values are
   normalized and masked to compatible valid cells.
2. `build_weighted_grid` creates nodes and weighted adjacent edges. Steeper
   local LST gradients lower conductance; optional NDVI raises it according to
   the declared parameters.
3. The pipeline computes the normalized-Laplacian eigenpair and a Fiedler
   sweep. The selected cut’s crossing edges become the bottleneck boundary.
4. It infers cooling sinks from the declared percentile rule, computes a
   least-cost access field, and creates an explicit priority field only on the
   selected boundary.
5. The pipeline exports artifacts. The city-map adapter in
   [`core/city_maps.py`](../core/city_maps.py) loads those artifacts with their
   provenance and renders them as separate Cheeger and cooling-access layers.
6. The city route requests the spectral summary through
   [`getCitySpectral`](../web/src/lib/api.ts) and makes the result available to
   the guided evidence brief and atlas.

The separation matters: a map overlay is not treated as a fresh runtime
calculation, and a city cannot honestly display a local spectral story merely
because it has a boundary or starter profile. The reusable city-experience
contract requires a documented readiness state.

## How to read the Boston study

Boston is the repository’s bundled local study. Its atlas may present:

- **Cheeger bottleneck polygons:** exported low-conductance boundary features
  in the stated weighted raster graph.
- **Cooling-access constraint cells:** a separate inverse least-cost-access
  proxy to inferred cooling sinks.
- **Thermal sources:** contextual evidence with its own provenance, scale, and
  limitation—not a causal explanation for every derived feature.

The two derived layers are intentionally not silently combined. A place may be
structurally weak in the graph, have a cooling-access constraint, both, or
neither. The appropriate user action is to inspect the source, assumptions,
and local context before discussing a possible collective response. See the
[Boston Study Guide](BOSTON_STUDY_GUIDE.md) for the study-specific terms.

## How the interactive labs use the same math

### Robustness Lab

The `/robustness` route is a controlled nine-node teaching scenario. Its API
uses `evaluate_graph_delta` to compare a baseline graph with a graph that has
zero to three redundant links. It reports changes in \(\lambda_2\), sweep
conductance, the percolation curve, and sink reachability. Fixed seeds make a
given experiment reproducible.

The lab also shows a bundled-study reference so people can distinguish:

- the **real project method and source context**, from
- the **synthetic interactive district** used to explain that method.

### Interactive Mitigation Lab

The Mitigation Lab has two deliberately separate models:

1. A fast, bounded browser priority-field exploration for placing interventions.
2. A shared nine-node graph readout from the same canonical evaluator used by
   the Robustness Lab.

Only a placed cooling-access node changes the teaching graph. Shade, paving,
and surface placements remain browser priority-field explorations unless a
future validated graph mapping is added. This prevents an attractive UI change
from being misrepresented as a spectral or temperature result.

## Why the implementation is trustworthy enough to inspect

“Trustworthy” here means **auditable and reproducible within the declared
model**, not proven correct for every city or decision.

- The graph builder rejects mismatched raster shapes and invalid parameters.
- Conductance is positive and least-cost values are well-defined.
- A disconnected graph returns \(\lambda_2 = 0\); callers must not infer a
  unique Cheeger partition from it.
- The Fiedler sweep is explicitly a tractable candidate search, not an
  exhaustive global cut optimizer.
- Probability inputs must be in \([0,1]\), and reliability requires at least
  one trial.
- The test suite checks numerical behavior on small graphs and validates key
  bounds and error contracts.

Run the focused core checks from the repository root:

```bash
source .venv/bin/activate
python -m pytest tests/test_spectral_core.py
```

For the broader scientific and public-use boundary, consult the [Impact
Evidence Protocol](IMPACT_EVIDENCE_PROTOCOL.md) and [Address-Level Spectral
Urbanism Advice](ADDRESS_LEVEL_SPECTRAL_URBANISM_ADVICE.md).

## A careful vocabulary for the product

Use these phrases in pages, presentations, and discussions:

| Prefer | Avoid |
| --- | --- |
| “low-conductance feature in the stated graph” | “heat trap” |
| “modelled cooling-access constraint” | “people cannot reach cooling” |
| “candidate location for local investigation” | “the best place to intervene” |
| “bounded planning scenario” | “predicted cooling benefit” |
| “mathematically reproducible under fixed inputs and seeds” | “scientifically proven effective” |

This language is not hedging. It is what allows a rigorous method to remain
useful in public without claiming more than its data, calibration, and
validation can support.
