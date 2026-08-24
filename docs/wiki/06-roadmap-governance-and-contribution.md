# Roadmap, Governance, and Contribution

## The project is unfinished by design—and explicit about it

The platform has a working app, scientific core, local runtime persistence, bundled Boston artifacts, package validation, and an extensible onboarding architecture. Its public-interest value will depend on improving the evidence and governance around those capabilities, not merely adding features.

The current feature-level record lives in [Implementation Status](../IMPLEMENTATION_STATUS.md).

## Priorities that would materially strengthen the work

1. **Additional real bundled cities.** The generic architecture needs testing against multiple distinct, documented city datasets.
2. **City-specific intervention evidence.** Build complete, source-backed, locally valid unit-cost, feasibility, maintenance, and benefit inputs.
3. **Uncertainty and evaluation.** Add appropriately calibrated uncertainty treatment and connect plans to outcome measurement.
4. **Community governance.** Establish repeatable practices for partnership, redress, privacy, accessibility, and public explanation.
5. **Robust execution.** Evolve from local-first workflows toward production operations only when security, stewardship, and operational ownership are clear.

## Decision rights

The project should be governed so that technical capability does not outrun public accountability. At minimum, distinguish these roles:

| Role | Core responsibility |
| --- | --- |
| Community partners | Identify lived priorities, omissions, risks, and acceptable uses |
| Public agencies | Define public purpose, legal obligations, implementation authority, and maintenance |
| Domain experts | Review methods, sources, interpretation, health implications, and feasibility |
| Product and engineering contributors | Build transparent, secure, accessible, maintainable workflows |
| Project stewardship | Enforce claim discipline and keep limitations visible |

No map layer should erase these distinct responsibilities.

## How to contribute

Useful contributions include documented local datasets; reproducible processing scripts; source improvements; accessibility work; translations; method review; tests; privacy and governance patterns; and corrections to overconfident or unclear language.

Before submitting a contribution, ask:

1. What claim will this addition enable?
2. Is the provenance public, inspectable, or reproducible?
3. Is the geographic and temporal scope clear?
4. Could the addition mislead, expose people, or create displacement risk?
5. Does it need a caveat, license notice, or access restriction?
6. Can another person reproduce or independently review it?

Read [Artifact Strategy](../ARTIFACT_STRATEGY.md) for repository data rules and run `make test`, `make build`, and `make validate-packages` for relevant changes.

## The standard we are aiming for

The most meaningful recognition for this work would not be a prize. It would be evidence that more people can participate substantively in heat-resilience decisions, that public institutions can explain their reasoning more honestly, and that investments better reflect local knowledge and need. That standard is high enough to guide the project—and concrete enough to be tested.

## Experience the work, then improve it

Explore the current [Urban Heat Democratization platform](https://ai-aarti.com/), its [Boston study](https://ai-aarti.com/cities/boston), and [transparent scenarios](https://ai-aarti.com/scenarios). Contributions should make these public experiences more truthful, legible, accessible, and accountable—not merely more elaborate.
