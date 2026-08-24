# Urban Heat Democratization impact evidence protocol

## Purpose

This protocol governs every claim that an intervention changed heat. It prevents a planning scenario, an observed change, and a causal estimate from being presented as the same thing.

## Public evidence states

| State | May say | Must not say |
| --- | --- | --- |
| Planning hypothesis | A scenario has a modelled local influence on priority zones. | The intervention cooled a place or will reduce temperature by a stated amount. |
| Observed change | Comparable observations changed after implementation. | The intervention caused the change. |
| Estimated causal effect | A registered design estimates an attributable effect, with uncertainty. | The effect is certain or transferable without qualification. |

## Required study design

1. Register the outcome, intervention geometry, installation date, comparison areas, inclusion rules, and analysis plan before inspecting post-intervention outcomes.
2. Collect a baseline and follow-up record under comparable seasons, times of day, sensors, and weather conditions.
3. Measure the outcome that fits the claim: land-surface temperature for surface patterns; shaded, pedestrian-height air temperature and humidity for experienced heat; energy or health outcomes only with their own valid data.
4. Use matched untreated controls for site-level work. Evaluate pre-trends, weather covariates, spillovers, and placebo tests. Use synthetic control only when an aggregate intervention has no credible local control.
5. Publish sample size, missing observations, matched-scene rules, uncertainty intervals, assumptions, and reproducible code/data references.

## Product gates

The application may show a `Planning` influence preview when action placements and source heat-priority geometry exist. It must label the result as a priority shift, never degrees Celsius.

`Observed` impact requires retained source observations and a documented comparable-observation protocol.

`Causal` impact requires a registered counterfactual design, diagnostics supporting its assumptions, effect estimates with uncertainty, and robustness or placebo results.

## Core references

- U.S. EPA, [Measuring Heat Islands](https://www.epa.gov/heatislands/measuring-heat-islands): surface and air temperature selection, monitoring considerations, and limitations.
- World Meteorological Organization, [Guidance on Measuring, Modelling and Monitoring Urban Heat](https://urban-climate.org/wp-content/uploads/2023/10/WMO_2023_1292_en.pdf).
- Abadie, Diamond & Hainmueller, [Synthetic Control Methods for Comparative Case Studies](https://economics.mit.edu/sites/default/files/publications/Synthetic%20Control%20Methods.pdf).
- Zang et al., [Guide to recent advances in difference-in-differences methodology for population health studies](https://doi.org/10.1136/jech-2025-225449).
