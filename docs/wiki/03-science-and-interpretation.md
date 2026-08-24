# Science and Interpretation

## A model is a lens, not the city itself

The scientific core includes graph, spectral, resistance, reliability, percolation, raster, reporting, and city-package workflows. These methods help structure questions about connectivity, barriers, cooling pathways, and robustness. They are valuable because they make assumptions explicit—not because they eliminate uncertainty.

## Conceptual model

An urban area can be represented as a network of spatial units and their relationships. The choice of units, edges, weights, thresholds, and input layers affects the result. In this project, graph and spectral methods identify places where the modeled system appears weakly connected or where relief may not spread smoothly through the network.

| Method family | Plain-language question | Careful interpretation |
| --- | --- | --- |
| Raster workflows | What spatial surface patterns are present in the supplied layers? | Results depend on source, resolution, processing, date, and coverage. |
| Graph representation | Which spatial units are connected in the chosen model? | Connectivity is a modeling choice, not a direct social relationship. |
| Spectral / Cheeger analysis | Where does the network appear structurally pinched? | A bottleneck is an analytical signal requiring local interpretation. |
| Resistance-style metrics | Where may movement through the modeled network face more friction? | A proxy for modeled access or flow, not a measured person-level outcome. |
| Reliability / percolation | How does modeled connectivity respond to removals or changes? | A stress test, not a forecast of a real intervention’s performance. |

## Reading the Boston overlays

Boston is the project’s real bundled example. It includes a boundary, a Cheeger bottleneck overlay, and a low-cooling-access overlay. These provide a concrete way to learn the workflow, but they should be read at the level of their documented artifact and method—not as a complete account of heat risk.

A high-priority looking polygon is an invitation to investigate:

- Is the geometry and source layer current and appropriate?
- Does the pattern align with community observation and local agency knowledge?
- What nearby factors—shade, transit, housing conditions, water access, maintenance, safety, or construction—are not represented?
- Does the appropriate response require capital improvements, operations, emergency response, tenant protections, public communication, or something else?

## Mathematical detail: why a spectral signal is not a verdict

Let the selected spatial units form a weighted graph \(G=(V,E,W)\), with
weighted adjacency \(W=[w_{ij}]\), degree \(d_i=\sum_jw_{ij}\), and degree
matrix \(D\). The combinatorial Laplacian is \(L=D-W\); a common normalized
form is \(\mathcal{L}=I-D^{-1/2}WD^{-1/2}\). For any signal \(f\) on the
nodes,

\[
f^\top Lf=\frac{1}{2}\sum_{i,j}w_{ij}(f_i-f_j)^2.
\]

This identity makes the modeling choice visible: the analysis penalizes a
difference across an edge only to the extent that the chosen \(w_{ij}\) says
the two units are connected. A different boundary, adjacency rule, distance
kernel, thermal similarity rule, or missing-data treatment produces a
different graph and may produce a different signal.

For a candidate set \(S\), conductance is

\[
\phi(S)=\frac{\operatorname{cut}(S,V\setminus S)}
{\min\{\operatorname{vol}(S),\operatorname{vol}(V\setminus S)\}},
\qquad \operatorname{vol}(S)=\sum_{i\in S}d_i.
\]

Low conductance means that \(S\) is weakly connected *in the specified
model*. Cheeger-style inequalities relate the optimum conductance \(\phi_*\)
to the second normalized-Laplacian eigenvalue \(\lambda_2\):
\(\lambda_2/2\leq\phi_*\leq\sqrt{2\lambda_2}\). This supports using a
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
