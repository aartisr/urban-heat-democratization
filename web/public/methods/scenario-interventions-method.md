# Scenario intervention layers

## Plain-language purpose

Scenario layers are planning illustrations. They show where a proposed package aligns with the selected bottleneck or cooling-gap evidence. They are not forecasts and do not claim observed or attributable impact.

## Candidate locations

Candidate interventions inherit evidence from the active Cheeger bottleneck or low-cooling-access polygon. The app then combines the action's stated priority, its match to the selected evidence, and separation from previously selected placements. This discourages a visually crowded cluster of identical actions.

## Graph-based intervention experiment

The research pipeline also runs a bounded conductance experiment. It considers edges that cross the Cheeger cut or touch cooling sinks, sorts them by their baseline conductance, and selects a limited budget share. For a selected edge,

`w'_ij = boost × w_ij` and `cost'_ij = cost_ij / boost`.

The default demonstration uses a `boost` of 1.5 and chooses at least one edge, or 4% of eligible edges. The pipeline recalculates the spectral gap, conductance, percolation scan, and sink-reliability proxy after this change.

## What this means

The experiment tests whether strengthening modeled weak connections could improve network connectivity. It does **not** prove that a tree, shade structure, cool pavement, or any other action will produce that exact improvement on the ground.

## What is needed for real-world claims

Before claiming measured impact, use a documented implementation record, before/after observations, a comparison strategy, uncertainty analysis, and community review. Before claiming causal impact, use a pre-specified study design with credible controls.

## Reproducibility

Implementation: `core/pipeline.py` (`_optimize_interventions`) and the scenario-placement logic in `web/src/components/city-heat-map.tsx`. Preserve the selected scenario, budget, action assumptions, source layers, and run configuration.
