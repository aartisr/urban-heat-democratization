# Science and Interpretation

## A model is a lens, not the city itself

The scientific core includes graph, spectral, resistance, reliability, percolation, raster, reporting, and city-package workflows. These methods help structure questions about connectivity, barriers, cooling pathways, and robustness. They are valuable because they make assumptions explicit—not because they eliminate uncertainty.

## Conceptual model

An urban area can be represented as a network of spatial units and their relationships. The choice of units, edges, weights, thresholds, and input layers affects the result. In this project, graph and spectral methods identify places where the modeled system appears weakly connected or where relief may not spread smoothly through the network.

## Spectral urbanism, in one minute

**Spectral urbanism reads the city as a pattern of relationships, not just a
collection of map pixels.** It asks: *where does the modeled connection between
heat, shade, cooling features, and public routes become thin, fragmented, or
hard to traverse?*

The answer is a **place to investigate together**—not a score for a person,
property, or neighborhood. It turns a complex map into a clear civic question:
*What is breaking continuity here, and what evidence would help us repair it?*

| Method family | Plain-language question | Careful interpretation |
| --- | --- | --- |
| Raster workflows | What spatial surface patterns are present in the supplied layers? | Results depend on source, resolution, processing, date, and coverage. |
| Graph representation | Which spatial units are connected in the chosen model? | Connectivity is a modeling choice, not a direct social relationship. |
| Spectral / Cheeger analysis | Where does the network appear structurally pinched? | A bottleneck is an analytical signal requiring local interpretation. |
| Resistance-style metrics | Where may movement through the modeled network face more friction? | A proxy for modeled access or flow, not a measured person-level outcome. |
| Reliability / percolation | How does modeled connectivity respond to removals or changes? | A stress test, not a forecast of a real intervention’s performance. |

## How probability and combinatorics are used

**In brief:** probability tests how the *modeled network* holds up when some
connections disappear; combinatorics helps choose among many possible
network cuts or intervention combinations. Neither predicts an individual’s
heat risk or guarantees a real-world outcome.

| Tool | What it does here | Read it as |
| --- | --- | --- |
| **Probability** | Randomly removes modeled connections, then checks how much of the network remains connected to cooling points. | A resilience stress test. |
| **Combinatorics** | Finds practical candidate bottlenecks and selects a budget-fitting combination of verified actions. | A transparent selection rule. |

### Probability: “What if some connections fail?”

The project runs two simple checks:

1. **Percolation:** retain each connection with a chosen chance, then measure
   the largest remaining connected area.
2. **Sink reliability:** repeat that random test many times and average the
   share of locations that still connect to a cooling point.

In the lab, a **percolation scan** repeats the first check across several
retention chances, written as $p$. At each $p$, it keeps each modeled edge with
chance $p$, removes the rest, and reports the fraction of nodes in the largest
remaining connected group. A sharp fall in the curve means the *modelled*
network has few alternate routes under that stress assumption. It is useful for
finding fragile corridors to investigate; it is not a probability forecast for
a street, a park, infrastructure, or a person.

For example, a retention chance of 70% means that each modeled connection has
a 70-in-100 chance of being kept in a simulated test. It does not mean exactly
seven connections survive in every group of ten, nor does it mean a real street
has a 70% chance of remaining usable. It is simply a clear dial for comparing
the same model under gentler and harsher hypothetical stress.

**Redundant routes** are backup edges added to the scenario graph so a narrow
corridor is not the only modeled connection toward a cooling-sink candidate. In
a real-world review, they stand for asking where continuity could be improved:
for example, by linking shade, vegetation, cooler public-realm materials, or
verified cooling assets. They do not prescribe a road, a parcel change, or an
intervention without site evidence and community review.

### Why is a corridor called vulnerable?

In the interactive scenario, the highlighted corridor is intentionally the
only short bridge between two denser clusters of nodes. That makes it a useful
teaching bottleneck: removing one of its few links can separate a large part of
the graph, while removing a link inside a dense cluster often leaves several
alternatives. It is not selected because the lab knows it is a real hot street.

In the actual pipeline, a candidate bottleneck qualifies through graph
structure. The Fiedler-vector sweep seeks a split with a relatively small
weighted cut compared with the connected volume on either side (low
conductance, $\phi$); $\lambda_2$ characterizes how strongly the graph is
stitched together overall. Thermal gradients—and vegetation where an NDVI layer
is supplied—affect edge conductance. The resulting signal means “inspect this
possible break in modeled thermal-landscape continuity,” not “this is proven to
be the hottest or most dangerous corridor.”

Fixed random seeds make these demonstrations repeatable. The results describe
the graph model only—they are not a forecast of infrastructure failure or a
claim that a particular person can reach cooling.

### Try the interactive robustness lab

The **Robustness lab** turns those exact project methods into a bounded
irregular nine-node teaching district. Choose an edge-retention assumption, the number
of Monte Carlo trials, and zero to three redundant modeled routes. The lab then
uses `core/percolation.py` to show the largest connected share under random
edge removals, and `core/reliability.py` to estimate the share still connected
to a designated cooling point.

This distinction is intentional: those two routines test whether an edge is
present, not how visually strong an edge looks. The lab therefore models a
reinforcement as an explicit alternate route, so the control changes the same
network structure that the stress tests evaluate. Its repeatable random seeds
make before/after comparison easier to inspect; they do not reduce real-world
uncertainty or convert the synthetic example into a local prediction.

### What is real in this project, and what is a scenario?

The lab now displays a **project reality anchor** drawn directly from the
bundled Landsat surface-temperature input. The pipeline normalizes that raster,
creates one graph node for each valid analysis cell, connects adjacent cells,
uses local thermal-gradient-derived conductance weights, identifies low-LST
cooling-sink candidates, and then applies the spectral, percolation, and
reliability methods described here.

The interactive irregular district is deliberately smaller and hypothetical.
It makes the causal structure of a robustness question visible: where a narrow
corridor is, what an alternate route changes, and how assumptions affect a
network result. The actual bundled field gives the method its study context;
the scenario gives a user a safe, comprehensible place to experiment. Neither
is a parcel-level, person-level, indoor-temperature, or live-condition model.

The lab’s **Explain this run** control turns the selected retention chance,
trial count, route setting, and measured graph outputs into a plain-language
record. It is designed to support a planning conversation: *what stress did we
assume, what modeled alternative did we test, what changed, and what local
evidence is still needed before acting?*

### What does “connected” mean in the real world?

In the graph, a connection is an edge between adjacent valid raster cells. A
sequence of those edges means the model can trace a continuous pattern across
the **study surface**. Edge conductance is lower where the local thermal signal
changes more sharply, and can incorporate vegetation when an NDVI layer is
provided. A connection to an inferred cooling sink therefore means *the model
finds a contiguous, relatively favorable thermal-landscape pattern toward a
cooler candidate area*.

That is a useful question for fieldwork—might this corridor support continuous
shade, planting, cooler materials, or access to an actual cooling asset? It is
not a finding that a route is walkable, safe, publicly accessible, maintained,
open, or usable by any particular person. Those real-world conditions must be
verified with local knowledge, street and sidewalk data, accessibility review,
and community input.

### Combinatorics: “Which combination should we examine?”

There are too many possible groups of map cells or interventions to inspect
one by one. The project therefore uses clear shortcuts:

- **Bottlenecks:** a spectral ordering narrows the search to sensible candidate
  cuts, rather than testing every possible group of nodes.
- **Budgets:** an exact knapsack calculation selects the highest-utility
  combination of verified actions that fits the stated budget.
- **Raster demonstration:** a bounded greedy rule focuses on bottleneck or
  cooling-sink-adjacent edges.

These rules are inspectable choices, not hidden optimization claims.

<details>
<summary>Implementation references</summary>

- Bond-percolation scan: [`core/percolation.py`](../../core/percolation.py)
- Monte Carlo sink reliability: [`core/reliability.py`](../../core/reliability.py)
- Spectral sweep cut: [`core/spectra.py`](../../core/spectra.py)
- Budget subset selection: [`core/city_strategies.py`](../../core/city_strategies.py)
</details>

## Reading the Boston overlays

Boston is the project’s real bundled example. It includes a boundary, a Cheeger bottleneck overlay, and a low-cooling-access overlay. These provide a concrete way to learn the workflow, but they should be read at the level of their documented artifact and method—not as a complete account of heat risk.

A high-priority looking polygon is an invitation to investigate:

- Is the geometry and source layer current and appropriate?
- Does the pattern align with community observation and local agency knowledge?
- What nearby factors—shade, transit, housing conditions, water access, maintenance, safety, or construction—are not represented?
- Does the appropriate response require capital improvements, operations, emergency response, tenant protections, public communication, or something else?

## Mathematical detail: why a spectral signal is not a verdict

Let the selected spatial units form a weighted graph $G=(V,E,W)$, with
weighted adjacency $W=[w_{ij}]$, degree $d_i=\sum_jw_{ij}$, and degree
matrix $D$. The combinatorial Laplacian is $L=D-W$; a common normalized
form is $\mathcal{L}=I-D^{-1/2}WD^{-1/2}$. For any signal $f$ on the
nodes,

$$
f^\top Lf=\frac{1}{2}\sum_{i,j}w_{ij}(f_i-f_j)^2.
$$

This identity makes the modeling choice visible: the analysis penalizes a
difference across an edge only to the extent that the chosen $w_{ij}$ says
the two units are connected. A different boundary, adjacency rule, distance
kernel, thermal similarity rule, or missing-data treatment produces a
different graph and may produce a different signal.

For a candidate set $S$, conductance is

$$
\phi(S)=\frac{\operatorname{cut}(S,V\setminus S)}
{\min\{\operatorname{vol}(S),\operatorname{vol}(V\setminus S)\}},
\qquad \operatorname{vol}(S)=\sum_{i\in S}d_i.
$$

Low conductance means that $S$ is weakly connected *in the specified
model*. Cheeger-style inequalities relate the optimum conductance $\phi_*$
to the second normalized-Laplacian eigenvalue $\lambda_2$:
$\lambda_2/2\leq\phi_*\leq\sqrt{2\lambda_2}$. This supports using a
spectral partition as a disciplined candidate for investigation. It does not
establish a causal health effect, a neighborhood deficit, or an intervention
priority. Those claims require additional evidence.

The extended [Urban Thermal Math Deep Dive](../Urban_Thermal_Math_Deep_Dive.md)
walks through spatial support, graph construction, resistance, robustness,
uncertainty, and validation in greater depth.

## Interpretation protocol

Before sharing an output as a finding, use this sequence:

1. **Name the layer.** State exactly what the map or metric represents.
2. **Name the inputs.** Record the source, date, resolution, processing path, and missing coverage.
3. **Name the inference.** Explain what is being inferred and why it is only an inference.
4. **Test locally.** Seek lived experience, agency knowledge, field observation, and domain review.
5. **State the decision boundary.** Say whether the output is educational, exploratory, prioritization-supporting, or ready for a formal process.

## What the platform cannot conclude

The current system cannot determine an individual’s health risk, prove that a specific investment will reduce a city’s temperature by a stated amount, or establish that one intervention is equitable without locally appropriate data and partnership. It cannot replace public-health surveillance, environmental review, engineering design, procurement, or community consent.

Those are not footnotes. They are the conditions that keep a useful analytical tool from becoming a misleading authority.

## Explore the science with the evidence beside it

The [Boston study](https://urban-heat.ai-aarti.com/cities/boston) makes the bundled overlays inspectable. The [scenario workspace](https://urban-heat.ai-aarti.com/scenarios) presents the project’s mathematical and planning reasoning as a guided exploration; use both alongside this interpretation guide.

*Authored by [Aarti S Ravikumar](https://ai-aarti.com).*
