# Interactive Heat-Mitigation Lab: Product and Engineering Plan

> Status: active staged implementation — Phase 1 and browser-deliverable Phase
> 2 foundations are implemented; no city-specific cooling prediction is enabled
> by this document.  
> Owner: Urban Heat Democratization  
> Last updated: 2026-08-25

## Delivery status snapshot

| Phase | Implementation state | Exit-gate state |
| --- | --- | --- |
| 0 — Contract, sources, UX validation | Engineering contracts and safety wording are implemented. | Open: moderated walkthroughs and governance/source-owner approval are human-review work. |
| 1 — Synthetic browser lab | Implemented: offline synthetic baseline, worker calculation, manifest plugins, undo/reset, comparison, and JSON export. | Open: formal accessibility and performance-device gate review. |
| 2 — Evidence library and visual explanations | Browser foundation implemented: evidence/context links, prompts, qualitative envelopes, seven interventions, and versioned public scenario links. | Open: source review, export audit, and moderated comprehension testing. |
| 3 — Boston study adapter | Safe engineering foundation implemented: server-produced 64 × 64 aggregate and explicit lab selector. | Open: provenance, community, public-health, technical, sensitivity, and explanation review. |
| 4 — Calibrated local-study pathway | Guarded readiness endpoint and calibration/facilitation documentation are implemented; no calibrated output path exists. | Blocked by the registered study, observation, diagnostic, governance, and communication requirements in the Impact Evidence Protocol. |

## 1. Decision and north star

Create a lightweight, browser-first **Interactive Heat-Mitigation Lab** where
people can place and adjust interventions—tree canopy, shade, cool surfaces,
cool roofs, permeable paving, and cooling-access nodes—and immediately see how
their *modeled planning scenario* changes.

The experience should feel like arranging pieces on a clear map, not operating
a GIS. A resident should understand what they changed, a teacher should be able
to explain why the result moved, a planner should see the assumptions and
budget implications, and a researcher should be able to inspect the complete
calculation record.

The north star is not an attractive temperature dial. It is a public learning
and deliberation tool that makes this chain visible:

```text
Place + intervention design + stated assumptions
        → modeled local influence / access pattern
        → evidence strength and uncertainty
        → next validation step
```

## 2. Non-negotiable scientific and ethical boundary

The existing [Impact Evidence Protocol](IMPACT_EVIDENCE_PROTOCOL.md) is the
governing contract. It says a planning preview may show a shift in priority
geometry, but must not claim that an intervention *will* reduce temperature by
a stated amount. The lab must preserve that boundary.

### Two deliberately separate modes

| Mode | Available when | What the user sees | What the product must never imply |
| --- | --- | --- | --- |
| **Explore relationships** | Always; runs entirely in the browser using a documented synthetic or representative baseline. | Relative heat-pressure change, shade coverage, cooling-route continuity, cost range, and source-backed *illustrative response range*. | A site-specific forecast, health outcome, or guaranteed cooling. |
| **Calibrated local study** | Only after documented baseline/follow-up, spatial support, intervention geometry, weather controls, validation, and governance review. | A clearly labeled estimated local response with uncertainty, applicability scope, and method link. | A causal claim without the registered study design and diagnostics. |

The default mode is **Explore relationships**. Its central output is a
`modeled priority shift`, not `°C cooler`. If the interface shows temperature
units at all, they are secondary, labelled **illustrative literature range**,
shown with their source/context, and visually separated from the mapped result.

No exact address, person, household, health status, or indoor condition enters
this lab. Address-level functionality remains governed by
[Address-Level Spectral Urbanism Advice](ADDRESS_LEVEL_SPECTRAL_URBANISM_ADVICE.md).

## 3. User jobs and success criteria

| Person | Job to be done | First successful outcome |
| --- | --- | --- |
| Resident / advocate | Test whether an idea is worth bringing to a local conversation. | “I can say what we changed, what the model assumes, and what we should verify on the ground.” |
| Educator / student | Learn how place, intervention type, and network connectivity interact. | “I can compare two designs and explain why their modeled patterns differ.” |
| Planner / public team | Frame a transparent preliminary option before committing resources. | “I can export an auditable planning hypothesis and its evidence gaps.” |
| Researcher / reviewer | Examine assumptions, transformations, sensitivity, and provenance. | “I can reproduce the browser result from a versioned scenario payload.” |

### Product success metrics

- At least 80% of moderated first-time users can place, compare, and explain
  one intervention package without assistance.
- At least 80% can correctly distinguish a `modeled priority shift` from an
  `observed` or `causal` temperature effect in comprehension testing.
- Initial interactive update stays under 100 ms on a typical laptop and under
  250 ms on a mid-range mobile device for the standard 64 × 64 demo grid.
- No network request is required to change a scenario in Explore mode.
- Every export includes model version, inputs, evidence state, limitations, and
  a reproducible deterministic seed.

## 4. Experience design: one task at a time

### Entry points

1. **Scenarios → Build an intervention sketch**: primary entry for deliberate
   comparison and export.
2. **Boston city atlas → Try an intervention here**: opens the lab with the
   active map extent and a boundary-safe, city-wide or neighborhood-scale
   context—never parcel-level targeting.
3. **Robustness Lab → See the network consequence**: optional handoff showing
   how an intervention package changes modeled cooling-route connectivity.

### Screen sequence

```text
Question → Choose a place scale → Add interventions → Read the change
         → Compare designs → Save/export a planning hypothesis
```

1. **Question card** — one plain-language prompt: “Where might a combination
   of shade and surface changes deserve closer investigation?” The user selects
   *study area*, not an address.
2. **Canvas** — a simplified map/grid with a persistent legend. It begins with
   the base condition and contains only two visible controls: `Add` and
   `Compare`.
3. **Intervention tray** — keyboard-accessible cards with icons, a short
   mechanism sentence, unit, cost status, evidence state, and “Place on map.”
   Advanced parameters are inside each card’s disclosure.
4. **Placement interaction** — tap/click to drop a shape; drag to move; handles
   resize area or length; delete key/removal button reverses it. A visible
   placement footprint and a compact “Undo” make experimentation safe.
5. **Impact readout** — three ordered cards only:
   - **Modeled priority shift** (primary): which modeled cells/routes changed;
   - **Cooling continuity** (secondary): whether modeled routes to cooling
     opportunity became more or less connected;
   - **Evidence and next step** (always visible): source quality, uncertainty,
     and the specific measurement or local review needed.
6. **Compare drawer** — overlays baseline vs. Scenario A vs. Scenario B with a
   small “what changed?” narrative. Do not make users decode multiple maps at
   once.
7. **Share/export** — produces a permalink payload for public/synthetic data,
   plus a compact planning-hypothesis PDF/JSON record. Local/city-restricted
   data use a server-side permission gate and never expose restricted geometry.

### Progressive disclosure rules

- Default to a single intervention at a time; “Add another” is explicit.
- Reveal equations, parameter sliders, source excerpts, and sensitivity
  controls only on request.
- Use `planning hypothesis`, `modeled`, `observed`, and `causal` badges with
  shared wording from the existing evidence protocol.
- Avoid red/green success semantics. Use labelled neutral-to-priority color
  scales with patterns/text equivalents for color-blind access.
- Keep the question, legend, and evidence state pinned while a user edits.

## 5. Intervention model: plug-and-play contract

Interventions must be data-driven. A new intervention should arrive as a
versioned manifest, a small mechanism function, source references, and test
fixtures—not as a new branch inside a monolithic UI component.

### Core types (TypeScript)

```ts
export type EvidenceState = "illustrative" | "planning" | "observed" | "causal";
export type GeometryKind = "point" | "line" | "polygon";
export type MitigationMechanism =
  | "canopy_shade"
  | "surface_albedo"
  | "evapotranspiration"
  | "route_shade"
  | "cooling_access";

export type InterventionDefinition = {
  id: string;
  version: string;
  name: string;
  category: string;
  geometry: GeometryKind[];
  mechanisms: MitigationMechanism[];
  defaultParameters: Record<string, number>;
  parameterSchema: ParameterDefinition[];
  costModel: CostModelReference;
  responseModel: ResponseModelReference;
  evidence: EvidenceReference[];
  applicability: ApplicabilityRule[];
  accessibility: { label: string; shortMechanism: string; icon: string };
};

export type PlacedIntervention = {
  id: string;
  definitionId: string;
  definitionVersion: string;
  geometry: GeoJSON.Geometry;
  parameters: Record<string, number>;
};

export type MitigationScenario = {
  schemaVersion: 1;
  id: string;
  baselineId: string;
  evidenceState: EvidenceState;
  interventions: PlacedIntervention[];
  seed: number;
  createdAt: string;
};
```

### Initial intervention library

| Intervention | Placeable geometry | Primary modeled mechanism | Initial interface output | Required caveat |
| --- | --- | --- | --- | --- |
| Tree canopy / curbside planting | point or polygon | shade + evapotranspiration proxy | relative shade/priority change; optional literature range | Time to mature, species, irrigation, soil volume, survival, and maintenance are not inferred. |
| Shade structure | point, line, polygon | direct shade proxy | time-of-day shade coverage proxy | Structural feasibility, wind/snow, ownership, and accessibility need local review. |
| Cool roof | polygon | albedo/roof surface proxy | roof-focused surface-pressure proxy | Does not claim pedestrian air-temperature or indoor-energy change. |
| Cool pavement / light surface | polygon or line | albedo surface proxy | surface-pressure proxy | Surface temperature is not air temperature or human exposure. |
| Permeable paving | polygon | moisture/evaporation proxy | conditional surface-pressure proxy | Requires hydrology, maintenance, traffic, and seasonal suitability review. |
| Cooling-access node / center | point | graph sink/access | route continuity and access proxy | Does not establish operational capacity, opening hours, safety, or eligibility. |

The existing `data/intervention_catalog.json` remains the canonical catalog for
names, high-level evidence, and cost status. Add a separate
`data/mitigation_lab/intervention-definitions.json` rather than overloading it
with UI-specific parameter schema or unsupported response coefficients.

## 6. Computation design

### 6.1 Browser-first calculation pipeline

```text
Baseline package + placed geometry + parameters
  → spatial rasterization to a lightweight working grid
  → mechanism plugins emit bounded influence fields
  → compositing / saturation / overlap rules
  → priority field and cooling-route graph update
  → deterministic summary, uncertainty, and explanation payload
```

`Web Worker` execution keeps drag/placement responsive. The main thread owns
interaction and rendering; a worker owns rasterization, influence fields, and
graph metrics. Use `OffscreenCanvas` only as a progressive enhancement. The
first release uses 2D Canvas or SVG overlays; do not load a heavier GIS engine
for the educational baseline.

### 6.2 Bounded response functions

Each mechanism returns a bounded, dimensionless influence field `I(x) ∈ [0,1]`
rather than a direct temperature prediction:

```text
I_total(x) = 1 - Πm (1 - clamp(Im(x), 0, 1))
priority'(x) = priority(x) × (1 - β · I_total(x))
```

Where `β` is a documented mode-specific planning coefficient. The multiplicative
composite prevents impossible additive claims when shapes overlap. A mechanism
can optionally provide a **literature response envelope**:

```text
illustrative envelope = [q10, q90] from named sources and applicability rules
```

This envelope may appear in an “What research has observed in comparable
contexts” disclosure. It must never drive map colors or read as a forecast.

### 6.3 Graph update

The app already contains graph, spectral, conductance, percolation, and
reliability primitives. The lab adapter should transform the bounded influence
field into explicitly documented graph deltas:

```text
w'ij = wij × (1 + γroute · shade_route(i,j))
sink_score'(i) = sink_score(i) + γaccess · cooling_node(i)
```

Then calculate, where supported by the baseline package:

- connected share of valid cells to a cooling node;
- relative conductance / weakest-link movement;
- percolation retention curve shift; and
- sensitivity of the result to defensible parameter alternatives.

These are model properties—not human mobility, safety, or health outcomes.

### 6.4 Performance guardrails

- Preview grid: 64 × 64 cells; route graph ≤ 4,096 nodes by default.
- Debounce slider updates at 50 ms; compute geometry movement on animation
  frames; cancel stale worker jobs using monotonically increasing job IDs.
- Cache baseline rasterization and each placed-intervention influence field by
  `definitionVersion + geometry hash + parameter hash`.
- Use typed arrays and transferable buffers between UI and worker.
- Degrade gracefully: show relative priority only if graph calculation exceeds
  the time budget; never silently substitute fake graph results.

## 7. Component and module architecture

```text
web/src/features/mitigation-lab/
  domain/
    types.ts                    # versioned public contracts
    intervention-registry.ts    # manifest validation + registration
    scenario-reducer.ts         # pure undoable scenario state
    evidence-policy.ts          # all evidence-state display gates
    geometry.ts                 # geometry hashing / validation / bounds
  engine/
    worker.ts                   # worker message boundary
    rasterize.ts                # geometry → typed-array mask
    compose-influences.ts       # bounded overlap/saturation logic
    mechanisms/                 # one pure plugin per mechanism
    graph-adapter.ts            # influence field → graph deltas
    uncertainty.ts              # deterministic sensitivity samples
    explain.ts                  # output → plain-language explanation
  components/
    MitigationLab.tsx           # orchestration shell only
    LabQuestionCard.tsx
    InterventionTray.tsx
    InterventionInspector.tsx
    InterventionCanvas.tsx
    ImpactReadout.tsx
    ScenarioCompareDrawer.tsx
    EvidenceDrawer.tsx
    ScenarioExportDialog.tsx
  hooks/
    useMitigationScenario.ts
    useLabWorker.ts
    useScenarioComparison.ts
  fixtures/
    synthetic-neighborhood.ts
    boston-neighborhood-safe.ts
```

The `domain/` and `engine/` layers must have no React dependency. That makes
them testable in Vitest, reusable in the FastAPI validation service later, and
portable to a classroom embed.

## 8. Data, provenance, and governance

### Baseline packages

```ts
type LabBaseline = {
  id: string;
  version: string;
  scale: "synthetic" | "citywide" | "neighborhood";
  boundary: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  grid: { width: number; height: number; cellSizeM: number; priority: Float32Array };
  graph?: { nodes: number; edges: number; serialized: ArrayBuffer };
  sourceRefs: EvidenceReference[];
  allowedModes: EvidenceState[];
  limitations: string[];
};
```

- **Synthetic baseline**: shipped with the app; safest initial learning mode;
  uses a labelled fictional neighborhood, never a disguised real place.
- **Boston study baseline**: only derives from the bundled boundary and
  documented study layers at their stated scale. It must respect licensing,
  spatial support, and existing caveats.
- **Partner baseline**: server-delivered only after a signed data contract,
  permission check, provenance record, and expiration/update rule.

### Provenance requirements

Every scenario export and share payload includes:

- baseline/package ID and version;
- intervention definition and response-model versions;
- geometry scope and grid resolution;
- parameter values, seed, and sensitivity settings;
- evidence-state label, sources, and applicability notes;
- all limitations, date, and software revision; and
- an explicit statement: “Planning exploration; not a measured or guaranteed
  temperature outcome.”

## 9. Accessibility, safety, and trust requirements

- Full keyboard placement: select tray item, arrow-position, resize with
  modifier keys, then confirm or delete; announce changes through a concise
  live region.
- Provide an equivalent table/list editor for all placed geometry and
  parameters. Canvas is never the only control path.
- Respect reduced motion and screen-reader modes; never encode a result by
  animation or color alone.
- Meet WCAG 2.2 AA contrast, target 44 × 44 px hit targets, and ensure map
  tooltips can be focused, pinned, and dismissed.
- State the analysis scale in the first visible screen and block input that
  appears to be an exact address in Explore mode.
- Offer `Reset`, `Undo`, and `Restore example` actions; an experiment must be
  reversible and safe to explore.
- Run comprehension testing with residents, educators, planners, and people
  with low vision before any public calibrated-mode release.

## 10. Delivery phases and explicit exit gates

### Phase 0 — Contract, sources, and UX validation (1–2 weeks)

- Finalize intervention-definition JSON Schema and evidence-policy rules.
- Inventory current intervention evidence; exclude entries that cannot state a
  mechanism, context, and limitation honestly.
- Prototype the one-question / one-placement / one-readout journey.
- Conduct 5–8 moderated cognitive walkthroughs across the four user groups.

**Exit gate:** participants can state that the preview is a planning model, not
a measured temperature forecast; governance and source owners approve wording.

### Phase 1 — Synthetic browser lab (2–3 weeks)

- Implement domain contracts, deterministic reducer, worker boundary,
  synthetic baseline, Canvas/SVG renderer, and 3 initial intervention plugins:
  canopy, shade structure, cool surface.
- Add keyboard/list alternative, undo, reset, compare A/B, and export JSON.
- Add bounded priority-change and route-continuity readouts.

**Exit gate:** zero-network interaction; 100 ms desktop / 250 ms mobile
updates at the standard grid; deterministic replay; accessibility smoke pass.

### Phase 2 — Evidence library and visual explanations (2–3 weeks)

- Add source-backed illustrative response envelopes, applicability prompts,
  cost-status display, uncertainty/sensitivity ribbon, and “why it changed”
  explanation cards.
- Add four more interventions only after definition/schema fixtures and
  evidence review pass.
- Integrate shareable public scenario links with size limits and schema
  migration support.

**Exit gate:** every displayed quantity has source/evidence status; export
audit is complete; comprehension testing shows no mistaken causal inference.

**Progress (2026-08-25):** The manifest-driven browser foundation is complete:
source/context links, ranking-only cost labels, applicability prompts,
non-predictive illustrative response envelopes, four additional interventions,
and versioned size-limited synthetic scenario links are implemented. The exit
gate remains open pending source review, export-audit review, and moderated
comprehension testing.

### Phase 3 — Boston study adapter (3–5 weeks)

- Build a scale-limited adapter from documented Boston package artifacts to the
  lab baseline contract.
- Add graph adapter and compare lab results with the existing robustness
  teaching model without conflating them.
- Conduct source/provenance, community, public-health, and technical review.

**Exit gate:** boundary, scale, and caveats are correct; no client exposes
restricted data; results pass sensitivity and explanation review.

**Progress (2026-08-25):** The safe adapter foundation is implemented. A
server endpoint aggregates the already-bundled Boston low-cooling-access study
overlay into a 64 × 64 planning field and returns neither source polygons nor a
temperature surface. The Lab can explicitly select this study context and
keeps its provenance and limitations with every result. The exit gate remains
open pending source/provenance, community, public-health, technical,
sensitivity, and explanation review.

**Implementation update (2026-08-25):** The Boston grid adapter and Canvas
worker boundary were hardened: the selected study baseline is stable across
renders, and the UI falls back to the deterministic main-thread calculation if
a worker fails. A regression test checks the adapter emits only bounded 64 ×
64 aggregate values.

**Usability update (2026-08-25):** The grid renderer now has a restored
responsive canvas layout, smoothed field rendering, visible intervention
influence rings, direct marker dragging, and keyboard removal. The current
placement model remains point-based while line and polygon editing is retained
as future interaction work.

**In-context control update (2026-08-25):** A compact, icon-only intervention
picker is now anchored immediately above the grid. It supports pointer and
keyboard selection, exposes an intervention name and short mechanism on hover
or focus, and retains the full intervention tray for evidence review. This
reduces scroll and preserves the choose-then-place workflow.

**Grid affordance update (2026-08-25):** The grid now includes a separate
icon-only Sketch controls group for Undo, Reset, Copy link, and Export, with
accessible names and disabled states. Node and icon tooltips wrap vertically
and remain inside their visible horizontal boundary. The serialized teaching
graph identifies a high heat-pressure node on the synthetic field's
high-priority ridge; this presentation coordinate does not change topology or
graph metrics.

**Shared-math update (2026-08-25):** The lab now fetches the same serialized
nine-node teaching baseline graph as the robustness workflow and obtains
`lambda2`, conductance, percolation, and sink-reliability deltas through the
same server-side helpers. Only the bounded `cooling-access-node` learning
mapping can add a redundant graph link; all other intervention placements stay
in the separate browser priority-field model. The interface names this
distinction directly. This establishes teaching-model parity, not Boston graph
or temperature-model parity; the Phase 3 exit gate remains open.

**Canonical-evaluator update (2026-08-25):** The production pipeline,
Robustness Lab, and Mitigation Lab now share
`core.robustness_metrics.evaluate_graph_delta` for the spectral gap,
conductance sweep, percolation, and sink-reliability bundle. A fixed-input,
fixed-seed parity test proves that the lab payload equals this canonical
evaluator for its declared teaching graph. This proves computational parity in
the declared scope; it does not prove an intervention outcome or real-world
utility. Those claims remain subject to the validation path below.

**Validity declaration (2026-08-25):** The application declares two distinct
validated claims: (1) computational parity is verified by the fixed-input,
fixed-seed evaluator test; and (2) the graph metrics are mathematically valid
for the documented connected, non-negative weighted graph and their stated
structural questions. Neither claim is expanded into a temperature, health,
feasibility, or causal-intervention claim without the required external
validation.

### Phase 4 — Calibrated local-study pathway (external-gated)

- Implement server-side study registration, monitoring plan, observed data
  retention, counterfactual analysis, diagnostics, and governance workflow.
- Expose calibrated output only for studies meeting every requirement in the
  Impact Evidence Protocol.

**Exit gate:** registered evaluation design, comparable observations,
counterfactual diagnostics, uncertainty reporting, partner approval, and
public communication review. This phase must not be scheduled as a simple UI
feature.

**Progress (2026-08-25):** A read-only calibration-gate endpoint and the
calibration checklist are implemented. They deliberately return `enabled:
false` and no calibrated result path exists. The external exit gate remains
open.

## 11. Test strategy

| Layer | Tests | Required examples |
| --- | --- | --- |
| Domain | Unit/property tests | schema migration, invalid geometry, evidence-policy blocking, stable scenario hashes |
| Mechanisms | Numerical unit tests | zero area, maximum clamp, overlap saturation, monotonic bounded response |
| Worker | Contract/integration tests | cancellation, transferable buffers, deterministic output across runs |
| Graph adapter | Scientific regression tests | no intervention equals baseline; added route shade cannot lower its own bounded connectivity proxy without a declared tradeoff |
| Components | Accessibility/component tests | keyboard placement, focus recovery, undo, visible evidence label, non-color equivalent |
| E2E | Playwright journeys | build → compare → reset → export; mobile and reduced-motion paths |
| Comprehension | Moderated research | interpretation of modeled vs. observed vs. causal claims |

Test fixtures must include a synthetic irregular neighborhood, not only a
rectangular grid, so the interaction does not teach a false picture of cities.

## 12. Observability and operational safeguards

- Collect only opt-in, aggregated interaction telemetry: feature entry,
  intervention category, completion, reset, export, and error/performance
  events. Do not record placement geometry or typed place text by default.
- Track calculation latency, worker failures, WebGL/Canvas fallback, schema
  version, and evidence-policy blocks.
- Feature-flag each baseline and each intervention definition independently.
- Add a kill switch that removes a response model while preserving existing
  exported scenarios as archived, clearly marked records.
- Use semantic versioning for response manifests and retain migrations for
  saved/public scenarios.

## 13. Documentation deliverables

- `docs/INTERACTIVE_MITIGATION_LAB_PLAN.md` — this plan and decision record.
- `docs/INTERACTIVE_MITIGATION_LAB_METHOD.md` — final formula definitions,
  source selection, applicability, and model limitations before Phase 1 ships.
- `docs/INTERACTIVE_MITIGATION_LAB_FACILITATION_GUIDE.md` — a 15-minute civic
  and classroom exercise, including discussion prompts and language guidance.
- `docs/INTERACTIVE_MITIGATION_LAB_CALIBRATION_GATE.md` — checklist mapping
  any future temperature output to the Impact Evidence Protocol.

## 14. What this plan intentionally does not promise

- It does not promise a universal “trees added → exact °C drop” calculator.
- It does not treat satellite land-surface temperature as pedestrian heat,
  indoor temperature, health outcome, or intervention performance.
- It does not automate city-specific calibration or substitute a browser model
  for community governance, engineering, field measurement, or public-health
  review.
- It does not bring address-level analysis forward before its separate privacy,
  comprehension, sensitivity, and field-validation gates are satisfied.

Those limits are what make the lab credible, reusable, and safe enough to earn
public trust.
