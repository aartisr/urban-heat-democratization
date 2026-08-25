# Interactive Heat-Mitigation Lab Method

## Current release: synthetic Explore relationships mode

The lab uses a fictional 64 × 64 neighborhood grid. Its initial priority field
is a deliberately synthetic teaching surface with a corridor and a hotspot; it
does not encode an actual place or a hidden city dataset.

Each placed intervention emits a bounded influence field `I(x)` between zero
and one. Fields are combined as `1 - Π(1 - I_m(x))`, then the model applies a
documented synthetic planning coefficient of `0.62` to the baseline priority:

`priority'(x) = priority(x) × (1 - 0.62 × I_total(x))`.

The result is a **modeled priority shift**, not degrees Celsius, exposure,
energy use, health impact, construction suitability, or a guaranteed outcome.

## Shared graph-metric contract

The production pipeline, Robustness Lab, and Mitigation Lab use the canonical
`core.robustness_metrics.evaluate_graph_delta` evaluator for spectral gap,
Fiedler-sweep conductance, seeded bond percolation, and seeded sink
reliability. The lab fetches the same serialized nine-node teaching graph used
by the Robustness Lab; its visible cooling-network nodes and links use that
contract rather than a separately drawn network.

Only a placed `cooling-access-node` maps to one bounded redundant-link scenario
(up to three). Shade, canopy, paving, and surface placements remain browser
priority-field explorations; they do not imply a graph-topology change. A
fixed-input, fixed-seed test verifies that the teaching-lab metric payload is
identical to the canonical evaluator. This verifies computational parity for
the declared graph, inputs, parameters, and seeds—not a Boston graph result,
temperature reduction, or intervention outcome.

For the documented connected, non-negative weighted graph, those methods
validly measure their stated structural properties. They do not represent
walking, safety, hours, capacity, eligibility, or access to cooling without
separate local evidence.

Intervention manifests are versioned in
`data/mitigation_lab/intervention-definitions.json`. Each records its
mechanism, allowed geometry, defaults, evidence state, cost status, and a
plain-language limitation. The initial three interventions are all marked
illustrative and ranking-only for cost.

Every JSON export includes the scenario seed, manifest versions, baseline
version, inputs, output summary, limitations, and the statement: “Planning
exploration; not a measured or guaranteed temperature outcome.”

## Phase 2 evidence and sharing boundary

Each manifest carries one or more source-context links, a cost status, a pair
of qualitative illustrative response cases, and concrete local applicability
questions. These explain model scope and do not convert a literature source
into a local effect estimate. The initial library contains seven interventions;
all remain illustrative and ranking-only unless their canonical catalog status
changes after review.

## Current interaction contract

The grid has a compact icon-only intervention picker and a separate compact
Sketch controls group for Undo, Reset, Copy link, and Export. Their labels and
short mechanisms are available on hover and keyboard focus; the full tray
remains the source/evidence review surface. Canvas node tooltips wrap vertically
and are constrained to the visible grid rectangle. The fictional teaching
network includes an explicit high heat-pressure node located on the synthetic
field's high-priority ridge; its location changes no graph topology or metric.

Public scenario links use a versioned, size-limited payload in the URL hash.
They contain only the synthetic scenario inputs and do not transmit geometry to
a service. Unknown or malformed payloads are rejected; migrations must be
added before a future scenario schema is accepted.
