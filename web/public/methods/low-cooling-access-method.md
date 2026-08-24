# Cooling-access constraint

## Plain-language purpose

This layer shows where the modeled network has the weakest route to a cooling-supporting cell. It is a network-access proxy, not a census of air-conditioning, tree ownership, or lived experience.

## Inputs and network

The analysis uses the same raster graph as the Cheeger layer. Each edge has conductance `w_ij`; its travel cost is `cost_ij = length_ij / w_ij`. High-conductance connections therefore cost less to traverse in the model.

## Cooling sinks

The pipeline identifies candidate cooling sinks from the overlap of relatively green and relatively cool cells. A zero-cost super-sink is connected to every identified cooling sink. This selective rule prevents the map from treating most of the city as a sink and collapsing access into a binary label.

## Access score

For each cell `i`, Dijkstra's algorithm finds the least accumulated network cost `d(i, sink)`. The map normalizes the negative distance:

`cooling_access(i) = normalize(-d(i, sink))`.

Thus higher values mean easier modeled access. The map inverts that display into a **relative constraint score**: higher constraint means lower modeled access. The full 0–100 surface is ranked within this layer only; it is not combined with Cheeger priority, observed temperature, or a funding recommendation.

Cells can tie when the graph gives them the same modeled least-resistance path. A tie is shown as a tie, not broken with an invented secondary score.

## What the score includes — and omits

It includes modeled thermal gradients, neighborhood connectivity, and optional greenness through the graph weights. It does not directly include building access, opening hours, cost, disability access, safety, social trust, private cooling, or public-program eligibility.

## Responsible use

Use it to ask “where should we learn more about relief?” Validate against locally maintained cooling-center, tree-canopy, transit, and community knowledge. Do not use it as a claim that residents lack cooling, or as the sole basis for allocating resources.

## Reproducibility

Implementation: the Boston spectral pipeline's cooling-access metric and spatial-artifact export. Report the sink-selection rule, inputs, resolution, graph connectivity, and score distribution alongside the output. The pipeline rejects a publishable ranking when non-sink scores have no variation.
