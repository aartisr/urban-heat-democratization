# Scenario Map Comparison: Delivery Status

> Canonical implementation record for
> [Scenario Map Comparison: Staged Implementation Plan](SCENARIO_MAP_COMPARISON_IMPLEMENTATION_PLAN.md).
> This register tracks what is actually built; it does not upgrade scientific
> claims before their external evidence gates are satisfied.

## Status summary

| Stage | Outcome | Repository status | External gate |
| --- | --- | --- | --- |
| 0. Foundations and guardrails | City-generic contracts, claim guard, preset vocabulary, cache-key contract | Complete | No |
| 1. Baseline versus planning-result MVP | Linked before/scenario/difference map experience | Complete | No |
| 2. Allocation ledger | Budget-to-quantity portfolio and traceable costs | In progress | No |
| 3. Candidate geometry | Feasibility-aware spatial allocation | In progress | City data / governance required |
| 4. Hardening | Worker, caching, accessibility, performance gates | In progress | No |
| 5. Calibrated temperature projection | Validated local physical projection | In progress — gated | Yes |
| 6. Measured implementation evaluation | Existing-project and outcome evidence | In progress — gated | Yes |

## Completed work

### Stage 0 — Foundations and guardrails

- Added city-generic comparison types under
  `web/src/features/scenario-map-comparison/domain/`.
- Added an evidence-policy guard that makes a planning result title
  “Modeled priority after scenario” and rejects a planning payload that attempts
  to declare a temperature metric.
- Added the canonical budget presets: `$10k`, `$50k`, `$250k`, `$1m`, and
  `$2m`.
- Added a deterministic scenario-comparison cache-key contract that normalizes
  allocation order and candidate-area IDs.
- Added focused unit coverage for the claim guard.

### Stage 1 — Baseline versus planning-result MVP

- Added a lazy route-level, city-generic comparison component to the What-if
  Scenarios page.
- It renders actual city heat-priority polygons in shared-scale baseline,
  modeled-priority, and difference views.
- Added `$10k`, `$50k`, `$250k`, `$1m`, and `$2m` comparison controls linked to
  the scenario page budget state.
- Added keyboard-selectable polygon comparison and a non-technical selected-cell
  summary.
- Added a bounded deterministic planning-priority engine and focused unit test.
- Added responsive single-column behavior below 760 CSS pixels.
- Added desktop and narrow-mobile browser coverage for budget selection, the
  closest-saved-scenario disclosure, difference mode, selected-polygon readout,
  and the single-column map layout.
- Added one shared zoom/pan camera for the before, scenario, and difference
  views, with explicit keyboard-accessible zoom and reset controls.
- Replaced narrow-screen stacked maps with Baseline / Scenario / Difference
  tabs, preserving the same camera and selected polygon across views.
- Added a selected-area drawer with before/scenario/difference values, the
  planning-model assumption, an exact-budget reminder, and next steps.
- Made geographic context resilient to tile-network failures. The comparison
  now renders the bundled municipal boundary as an always-available local
  geographic reference; OpenStreetMap streets remain an optional enhancement
  and the attribution/status text makes unavailable tiles explicit. The pale
  study grid was reduced so it cannot be mistaken for a street map.
- Made the separate cooling-access study grid an explicit, default-off map
  toggle. The comparison now opens with only comparable Cheeger-priority
  polygons visible, preventing the two evidence layers from being read as one
  score surface.
- Made scenario-budget integrity strict: the baseline remains visible, but an
  after or difference map is withheld unless the workspace contains a scenario
  at the selected budget and planning mode. The comparison provides a direct
  exact-budget generation action instead of substituting a nearest-budget map.
- Added a downloadable, versioned JSON allocation-ledger record containing the
  scenario identity, planning mode, allocation and evidence summaries, ledger
  lines, and explicit limitations. It retains provisional and unallocated
  balances rather than implying a complete procurement plan.

## Current boundary

The current repository can begin Stage 1 with a baseline-versus-modeled-priority
comparison. It cannot yet show an “after temperature” map: it lacks a
city-calibrated temperature-response artifact, verified intervention geometry,
and the validation required by the implementation plan.

### Stage 2 — Allocation ledger (in progress)

- Added a city-generic allocation-ledger domain module.
- Verified unit-cost actions can produce only whole, source-supported quantities;
  target quantities cap those calculations.
- Ranking-only and benchmark-only actions remain provisional envelopes with no
  invented installation quantity.
- Added an in-product ledger that accounts for costed quantities, provisional
  envelopes, and unallocated/remainder balances separately.
- Added focused unit coverage for whole-unit remainders and the no-invented-
  quantity rule.
- Corrected the benchmark-share allocator so it normalizes and distributes with
  the same inverse-rank weights. A lone low-ranked action now receives the full
  scenario envelope rather than an erroneous fraction of the budget; rounding
  remainder is assigned deterministically to the highest-ranked envelope.
- Corrected a second benchmark-share regression: verified unit-cost remedies
  were accidentally excluded after their source-backed cost rows were merged,
  leaving only ranking-only remedies in that mode. Benchmark-share now retains
  every ranked evidence-backed remedy and preserves each action's evidence
  status in the ledger.

## Next implementation target

Complete Stage 2 by adding allocation policies (recommended, shade first,
surface first, cooling-access first, and custom), explicit contingency support,
and an exportable scenario-ledger record. The priority field must continue to
use only ledger-backed allocations.

### Stage 3 — Candidate geometry foundations (in progress)

- Added city-generic `EligibleArea` and `CandidateEligibility` contracts.
- Added a deterministic constraint evaluator that checks intervention
  suitability, positive feasibility, requested capacity, and source
  provenance, returning human-readable reasons for every rejection.
- Added focused tests proving that no placement can be approved when these
  constraints are absent or exceeded.
- No candidate locations are rendered yet. This remains deliberately blocked
  until a city supplies governed candidate or verified geometry with capacity
  and provenance records.

**User-facing boundary:** Until that governed city geometry is supplied, every
before/after result remains a planning estimate. It can inform investigation,
but it cannot identify a project site, confirm feasibility, or represent an
approved intervention.

### Stage 4 — Hardening (in progress)

- Added reduced-motion support for comparison controls and polygon transitions.
- Strengthened keyboard focus visibility on selectable evidence polygons so the
  comparison does not rely on color or pointer hover alone.
- The existing shared camera and exact-scenario gate remain the current
  interaction reliability controls.
- Off-main-thread field composition and cache cancellation are deferred until
  candidate-geometry payloads are integrated; implementing them earlier would
  optimize a temporary, non-spatial planning fixture rather than the stable
  city-generic contract they are intended to protect.

### Stage 5 — Calibrated temperature projection (gated)

- Added a city-generic calibration record and a strict projection gate.
- The gate requires documented local baseline and follow-up observations, a
  validated counterfactual, uncertainty validation, governance approval, and a
  versioned calibration artifact.
- Until every requirement is supplied, the product continues to render only
  modeled planning priority—not temperature—and the gate returns the exact
  missing requirements.

### Stage 6 — Measured implementation evaluation (gated)

- Added a city-generic implementation-evaluation record and strict measured-
  outcome gate.
- A measured claim requires verified intervention geometry, observed before and
  after data, a validated comparison design, reported uncertainty, governance
  approval, and a versioned evaluation artifact.
- No existing-project impact claim is rendered until each requirement is met.

## Verification record

- Stage 0 passed the focused evidence-policy unit tests and the production
  TypeScript/Vite build.
- Stage 1 has focused priority-engine coverage, a production build pass, and a
  passing desktop/mobile browser interaction check covering linked zoom,
  selected-area details, and mobile tab switching.
