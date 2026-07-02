# Intervention Unit Costs

This file documents the dedicated verified unit-cost input used by the planner:

- [intervention_unit_costs.json](../data/intervention_unit_costs.json)

## Purpose

The main intervention catalog mixes:

- ranking-only comparative evidence,
- benchmark-only citywide anchors,
- and, when available, verified per-action unit-cost rows.

To keep those sources honest and maintainable, verified unit-cost rows now live in
a separate file and are merged into the intervention catalog at API load time.

## JSON shape

```json
{
  "unitCosts": [
    {
      "interventionId": "street-trees",
      "unitCostUsd": 2500,
      "measurementUnit": "tree",
      "targetQuantity": 1000,
      "summaryOverride": "Verified unit-cost row from a public source.",
      "evidenceUrl": "https://example.gov/source.pdf",
      "sourceNote": "Use this row as a verified unit-cost input for planning."
    }
  ]
}
```

## Merge behavior

If a matching `interventionId` exists in the base catalog:

- `costStatus` becomes `verified_unit_cost`
- `unitCostUsd` is overwritten
- `measurementUnit` is overwritten when provided
- `summary`, `evidenceUrl`, and `sourceNote` can be overridden

If `targetQuantity` is provided too, the scenario engine can compute a first
honest exhaustive mitigation estimate across the verified-cost subset only.

If no rows are present, the app remains honest and continues using ranking-only
or benchmark-only evidence.

## Current state

The file now contains a larger seed set of public, source-backed examples for
light surfaces, street trees, curbside planting, shade structures, transit
shade canopies, pocket parks, cool roofs, green roofs, permeable paving, and
cool pavement.

This is still not a complete procurement table. The planner can now exercise
verified unit-cost logic end-to-end, and when a verified row includes a target
quantity the scenario engine spends the full program cost instead of only the
seed unit price. Cooler roofs, green walls, and many other actions still need
more source-backed rows before the catalog should be treated as comprehensive.
