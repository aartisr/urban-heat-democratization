# Scenario Map Comparison: Staged Implementation Plan

> **Status:** proposed. This is the execution companion to
> [Scenario Map Comparison: Research and Product Design](SCENARIO_MAP_COMPARISON_DESIGN.md).
> The canonical current-state record remains [Repository Capability
> Status](IMPLEMENTATION_STATUS.md).

## Outcome

Deliver a plug-and-play, city-generic comparison module that lets people
compare baseline evidence with a budgeted intervention scenario at `$10,000`
through `$2,000,000`. It must be fast, accessible, auditable, responsive, and
explicit about whether it renders a planning result, a calibrated projection,
or a measured outcome.

## Operating principles

1. **One comparison contract, many cities.** No component depends on Boston
   names, files, coordinate assumptions, or action labels.
2. **Evidence state controls language.** A planning field cannot be rendered
   or described as temperature.
3. **Budget maps to quantity before effect.** The model allocates real units
   from a source-backed ledger, not a generic budget multiplier.
4. **Spatial claims need spatial inputs.** Recommendations without verified or
   candidate geometry remain lists, not map pins.
5. **Deterministic inputs produce reproducible outputs.** Version every city
   artifact, scenario schema, allocation model, and response model.
6. **Comparison first, complexity on demand.** The first screen answers one
   question; methods, constraints, and sensitivity analysis remain available.

## Target module boundaries

```
web/src/features/scenario-map-comparison/
├── domain/
│   ├── types.ts                 # city-generic contracts
│   ├── evidence-policy.ts       # claim/title guards
│   ├── allocation.ts            # budget → quantity ledger
│   ├── constraints.ts           # eligibility and fairness constraints
│   └── scenario-key.ts          # deterministic cache keys
├── engine/
│   ├── priority-field.ts        # Phase 2 planning field
│   ├── compose-effects.ts       # bounded overlap / diminishing returns
│   ├── optimize-allocation.ts   # candidate-area allocation
│   ├── uncertainty.ts           # deterministic or Monte Carlo envelopes
│   └── worker.ts                # off-main-thread computation
├── components/
│   ├── ScenarioMapComparison.tsx
│   ├── LinkedMapPair.tsx
│   ├── DifferenceMap.tsx
│   ├── BudgetPresetBar.tsx
│   ├── AllocationLedger.tsx
│   ├── ComparisonEvidenceDrawer.tsx
│   ├── AssumptionDisclosure.tsx
│   └── MobileComparison.tsx
├── hooks/
│   ├── useScenarioComparison.ts
│   └── useLinkedMapCamera.ts
└── tests/
    ├── allocation.test.ts
    ├── priority-field.test.ts
    ├── claim-guard.test.ts
    └── comparison.spec.ts
```

The route should compose this feature rather than embed allocation or map logic
inside `scenarios.tsx`. Existing city-map and mitigation-lab helpers may be
adapted behind small interfaces; do not couple new components directly to their
current Boston fixture shape.

## Shared contracts

### City input contract

```ts
type ComparisonEvidenceLevel = "planning" | "calibrated_projection" | "measured";
type SpatialStatus = "no_geometry" | "candidate_geometry" | "verified_geometry";

type SpatialField = {
  id: string;
  version: string;
  metric: "priority" | "land_surface_temperature_c" | "air_temperature_c";
  evidenceLevel: ComparisonEvidenceLevel;
  units: string;
  geojson?: GeoJSON.FeatureCollection;
  raster?: { tileTemplate: string; bounds: [number, number, number, number]; resolutionM: number };
  sourceLabel: string;
  capturedAt?: string;
  limitations: string[];
};

type EligibleArea = {
  id: string;
  geometry: GeoJSON.Geometry;
  status: "candidate" | "verified";
  allowedInterventionIds: string[];
  capacityByIntervention: Record<string, number>;
  feasibility: number;
  equityWeight?: number;
  source: { label: string; url?: string; updatedAt?: string };
};

type AllocatedAction = {
  interventionId: string;
  quantity: number;
  unit: string;
  capitalCostUsd: number;
  maintenanceCostUsd: number;
  evidenceStatus: "verified_unit_cost" | "ranking_only" | "benchmark_only";
  spatialStatus: SpatialStatus;
  areaIds: string[];
};
```

### Output contract

```ts
type ScenarioComparisonPayload = {
  schemaVersion: 1;
  cityId: string;
  baseline: SpatialField;
  scenarioField: SpatialField;
  deltaField: SpatialField;
  budgetUsd: number;
  allocatedActions: AllocatedAction[];
  coverage: { changedCellCount: number; changedHighPriorityShare: number };
  assumptions: string[];
  uncertainty: { kind: "not_applicable" | "planning" | "interval"; summary: string };
  model: { allocationVersion: string; effectModelVersion: string; inputFingerprint: string };
};
```

Validation must reject a `land_surface_temperature_c` scenario field unless the
city’s calibration record passes the Phase 5 gate.

## Stage 0 — Foundations and guardrails

### Deliverables

- Add the feature folder, contracts, schema validation, and evidence-policy
  title guard.
- Define a canonical set of budget presets: `$10k`, `$50k`, `$250k`, `$1m`,
  `$2m`.
- Define calculation versioning and deterministic input fingerprints.
- Add a city capability object stating whether a city can render planning,
  calibrated-projection, or measured comparison fields.
- Add fixtures for: planning-only city, candidate-geometry city, calibrated
  city, and insufficient-data city.

### Acceptance criteria

- A planning payload cannot be named “after temperature” anywhere in UI, export,
  metadata, or API responses.
- No city-specific string exists in shared components.
- Contracts pass TypeScript, JSON schema, and invalid-state tests.

## Stage 1 — Baseline versus planning result MVP

### Deliverables

- Implement `ScenarioMapComparison` on the What-if Scenarios page.
- Build a linked baseline/scenario pair using synchronized camera state with a
  loop guard and one shared legend-domain calculation.
- Implement `DifferenceMap` from baseline minus scenario priority values.
- Reuse the existing deterministic priority-field engine behind
  `engine/priority-field.ts`; preserve its current “planning exploration”
  limitation.
- Add `$10k` and `$2m` comparisons plus intermediate presets.
- Render a concise, computed result sentence and an evidence-state badge beside
  each title.

### UX behavior

- Desktop: two linked maps, optional swipe, visible difference strip.
- Tablet: two maps when each remains at least 360 CSS pixels wide; otherwise
  switch to swipe.
- Mobile: Baseline / Scenario / Difference tabs, shared selection, no tiny maps.
- Selecting a cell reveals one drawer with baseline value, scenario value,
  delta, assumptions, and next steps.

### Acceptance criteria

- The map result updates after a budget selection without blocking the UI.
- Baseline and scenario maps retain identical camera and legend scale.
- Keyboard and screen-reader users can access the selected-cell comparison
  without operating a map canvas.
- The result is explicitly called “Modeled priority after scenario.”

## Stage 2 — Allocation ledger and portfolio logic

### Deliverables

- Implement `allocation.ts` to turn budget into intervention quantities.
- Support capital, maintenance, and contingency line items.
- Add allocation policies: recommended, shade first, surface first,
  cooling-access first, and custom.
- Show action source, unit cost, evidence status, allocation rationale, and
  unallocated remainder.
- Add a scenario export containing input version, allocation ledger, and
  limitations.

### Rules

- Never allocate an action beyond the amount supported by its cost/evidence
  record.
- A benchmark-only action remains visibly benchmark-only.
- `$10k` may be infeasible for a given action; report that rather than inventing
  a fractional/unsupported installation.

### Acceptance criteria

- Every dollar is assigned, held as contingency, or shown as unallocated.
- Changing budget changes quantities before changing the field.
- Unit tests cover boundary budgets, missing costs, rounding, and infeasible
  portfolios.

## Stage 3 — Candidate geometry and constrained allocation

### Deliverables

- Add a city onboarding extension for `EligibleArea` records and source
  provenance.
- Build a constraint evaluator for ownership, intervention suitability,
  capacity, spatial separation, maintenance, and exclusion zones.
- Implement an optimizer that returns allocations and a human-readable reason
  for every chosen/rejected candidate area.
- Render candidate geometry as dashed outlines and influence as halos.

### Optimization

Use a configurable objective such as:

\[
\max_x \sum_i (w_h H_i + w_c C_i + w_e E_i + w_f F_i)x_i
\]

subject to budget, capacity, spacing, and equity constraints. Store weights in
the scenario payload and display them in an “Allocation policy” disclosure.

### Acceptance criteria

- No map marker is produced without a candidate or verified geometry record.
- Each candidate area reveals its source, eligibility, capacity, and reason for
  selection.
- Re-running the same inputs produces identical allocation output.

## Stage 4 — Performance, accessibility, and reliability hardening

### Deliverables

- Move field composition, allocation, and uncertainty sampling to a Web Worker.
- Cache by city ID, baseline version, budget, policy, scenario input, and model
  version.
- Cancel stale calculations when controls change.
- Prefer compact rasters/tiles for city-scale output; keep GeoJSON only for
  small/inspectable overlays.
- Add reduced-motion, high-contrast, no-color-only, and keyboard interaction
  support.

### Performance targets

| Concern | Target |
| --- | --- |
| Budget preset result | Cached: perceptibly immediate; uncached planning result: under 1 second on reference hardware |
| Main-thread work | No sustained calculation task over 50 ms |
| Map synchronization | No feedback loop; camera settles once per user gesture |
| Initial route cost | Comparison code remains lazy-loaded until the experience is opened |
| Memory | Dispose MapLibre maps, workers, blob URLs, sources, and event listeners on exit |

### Acceptance criteria

- Browser tests cover desktop, tablet, mobile, reduced motion, and keyboard flow.
- Performance traces show calculation work off the main thread.
- Long scenario changes cannot leave a stale map result visible.

## Stage 5 — Calibration gate for projected surface temperature

### Preconditions

- City-specific intervention geometry and quantities.
- Baseline and validation scenes with documented weather/season context.
- Locally calibrated response functions by intervention family.
- Held-out validation, bias/error thresholds, and uncertainty coverage checks.
- Independent method review and the applicable gates in
  [Impact Evidence Protocol](IMPACT_EVIDENCE_PROTOCOL.md).

### Deliverables after approval

- A separate calibrated response-model service and versioned output artifact.
- Expected, conservative, and upper-plausible land-surface-temperature deltas.
- Explicit unsupported-cell masks.
- Projection metadata in map legend, exports, and accessibility text.

### Acceptance criteria

- The UI exposes “Projected surface-temperature change” only from an approved
  calibration artifact.
- It never silently substitutes land-surface temperature for air temperature.
- Validation results are linked from the scenario comparison.

## Stage 6 — Measured implementation and causal evaluation

### Deliverables

- Existing-project registry with geometry, project dates, quantities,
  maintenance, operator, access, source, and licensing fields.
- Baseline/post-implementation scene matching and field-observation ingestion.
- Evaluation notebooks and pre-registered comparison design.
- A measured-outcome map separate from planning and projection maps.

### Acceptance criteria

- Every observed claim links to project and measurement provenance.
- Causal wording appears only when the registered evaluation supports it.
- Existing projects, candidate areas, and scenario recommendations remain
  visibly distinct layers.

## Integration sequence

1. Build Stage 0 contracts and Stage 1 planning comparison without changing the
   claim boundary of the current mitigation lab.
2. Add Stage 2 allocation before expanding map visual claims.
3. Require Stage 3 city geometry for mapped candidate interventions.
4. Complete Stage 4 hardening before expanding to multiple cities.
5. Treat Stages 5 and 6 as externally gated research capabilities, not normal
   frontend enhancements.

## Test matrix

| Layer | Required tests |
| --- | --- |
| Domain | schema validation, budget rounding, evidence-title guard, deterministic cache key |
| Engine | baseline preservation, effect composition, overlap limits, optimizer constraints, uncertainty bounds |
| API | city capability, provenance fields, invalid calibrated payload rejection |
| UI | synchronized map state, selected-cell linking, presets, ledger, mobile tabs, keyboard drawer |
| E2E | planning-only city, candidate-geometry city, no-data fallback, full-map return path |
| Accessibility | screen-reader result sentence, focus order, contrast, reduced motion, non-color legend |
| Performance | worker execution, cancellation, lazy loading, map teardown, memory regression |

## Documentation and release artifacts

- `SCENARIO_MAP_COMPARISON_METHOD.md` — equations, model inputs, versions, and limits.
- `SCENARIO_MAP_COMPARISON_DATA_CONTRACT.md` — onboarding schema for every city.
- `SCENARIO_MAP_COMPARISON_CALIBRATION_GATE.md` — criteria before temperature language.
- `SCENARIO_MAP_COMPARISON_EVALUATION_PROTOCOL.md` — criteria before outcome or causal language.
- A short in-product “How this comparison works” disclosure generated from the
  same contract values used by the calculation.

## Definition of done for the initial release

The initial release is complete when a user can choose `$10k` and `$2m`, see
the same city geography before and after a **modeled planning scenario**, read
the allocation ledger and uncertainty boundary, inspect any selected cell
without relying on color or hover, and export a reproducible scenario record.
It is not complete when a visually appealing map merely appears to show a
future temperature outcome.

