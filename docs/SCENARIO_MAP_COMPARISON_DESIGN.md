# Scenario Map Comparison: Research and Product Design

> **Status:** proposed. This document defines the product and scientific
> boundary for a reusable before/scenario/difference map comparison. It does
> not authorize calling a planning result a future temperature prediction.

## 1. The decision this experience should support

Help a person compare a modest and a city-scale cooling investment without
requiring them to infer spatial consequences from a table of actions:

> “What changes between a $10,000 starter package and a $2,000,000 package,
> where does it change, what remains unresolved, and how certain is that
> conclusion?”

The experience must work for any onboarded city. Boston is a bundled study
example, never a special-case interface or a substitute for a city data
contract.

## 2. Non-negotiable truth boundary

The product currently contains observed/bundled thermal evidence, derived heat
and cooling-access priority layers, scenario actions, source-backed planning
costs, and a deterministic browser priority-field model. It does **not** yet
contain city-calibrated intervention-response functions, verified intervention
footprints, or a validated citywide future-temperature model.

Therefore the map vocabulary must follow this evidence ladder:

| Evidence level | Right-hand map title | Permitted claim | Not permitted |
| --- | --- | --- | --- |
| Planning | **Modeled priority after scenario** | A transparent decision-priority field changes under documented scenario rules. | Temperature, health, engineering, or funding outcome. |
| Calibrated projection | **Projected surface-temperature change** | A validated local model estimates land-surface-temperature change with uncertainty. | Air-temperature, comfort, health, or causal claim unless separately validated. |
| Outcome evaluation | **Measured change after implementation** | Comparable observations changed after a documented project. | Attribution without a registered comparison design. |

Use “temperature” only in the second or third row. The initial release must
label the right map as a modeled planning result. This preserves the current
Mitigation Lab boundary: it models a priority field, not a local temperature
forecast.

## 3. Why a two-map comparison is the right interaction

Two linked views let people hold geography constant while comparing evidence
states. They should not need to remember a color in one map while looking at
another. The interface uses three coordinated surfaces:

| Surface | Question answered | Required behavior |
| --- | --- | --- |
| Baseline map | “What is the observed/derived situation now?” | Uses the selected city baseline and its own source/date/status label. |
| Scenario map | “What does this documented package change in the model?” | Uses exactly the same extent, scale, legend domain, and selected cell. |
| Difference strip/map | “Where and how much did the model change?” | Diverging colors, unchanged neutral cells, and an explicit uncertainty status. |

Side-by-side maps are the default desktop view. A swipe/divider view is an
alternative for compact comparisons; MapLibre provides comparison and
synchronized-map plugin options. See [MapLibre plugins](https://maplibre.org/maplibre-gl-js/docs/plugins/).

On phones, preserve legibility instead of shrinking two maps into unusable
panels: use Baseline / Scenario / Difference tabs with one persistent selected
cell and a compact result summary.

## 4. The primary experience

### 4.1 Entry question

Create a dedicated scenario-comparison surface in the existing What-if
Scenarios route:

> **Compare a cooling investment**
>
> Start with a budget, inspect the intervention package, then compare the
> baseline evidence with the modelled planning change.

The initial visible controls are intentionally few:

1. Budget: `$10k`, `$50k`, `$250k`, `$1m`, `$2m`.
2. Package: `Recommended`, `Shade first`, `Surface first`, `Cooling access
   first`, or `Custom`.
3. Comparison view: `Side by side`, `Swipe`, or `Difference`.

Advanced controls—equity weighting, feasibility filters, maintenance horizon,
and uncertainty view—remain in a disclosure. This maintains a clear first
task while retaining research depth.

### 4.2 Desktop layout

```
┌──────────────── Compare a cooling investment ────────────────┐
│ $10k  $50k  $250k  $1m  $2m     Recommended package          │
│ Observed / Derived baseline · Planning result · City/version  │
├───────────────────────┬──────────────────────────────────────┤
│ BEFORE                │ SCENARIO                              │
│ Baseline evidence     │ Modeled priority after scenario       │
│ [linked map]          │ [linked map]                          │
│ same legend/extent    │ same legend/extent                    │
├───────────────────────┴──────────────────────────────────────┤
│ DIFFERENCE: lower modeled priority / unchanged / investigate  │
├──────────────────────────────────────────────────────────────┤
│ What changed | Allocation ledger | Assumptions | Uncertainty  │
└──────────────────────────────────────────────────────────────┘
```

Every interaction is linked:

- Pan, zoom, rotate, and selected-cell state synchronize in both maps.
- Hover highlights the corresponding cell in the other map and the difference
  surface.
- Keyboard focus traverses map, cell summary, allocation ledger, assumptions,
  and recommendation links in that order.
- A selected cell opens one compact evidence drawer, never two competing
  popups.

### 4.3 The result sentence

The interface should generate a single, bounded sentence that changes with
the scenario:

> “At $10,000, this planning package changes 3% of currently high-priority
> study cells in the model. At $2,000,000, it changes 31%. These are modeled
> investigation priorities, not predicted site temperatures or approved
> projects.”

The sentence must be produced from actual computed coverage and scenario
metadata, never hard-coded marketing copy.

## 5. Budget is not an effect multiplier

The system must convert money to quantities before it produces a spatial
result. A generic “more money equals more cooling” multiplier is not enough.

For every action, retain:

- quantity and unit (tree, square foot, site, operating day, etc.);
- unit cost, source URL, cost status, and source date;
- capital, establishment, maintenance, and contingency components;
- implementation time horizon and expected useful life;
- eligibility / feasibility requirements; and
- evidence status for the effect mechanism.

An allocation ledger should make this inspectable:

| Budget | Action | Quantity | Cost | Evidence status | Spatial status |
| ---: | --- | ---: | ---: | --- | --- |
| $10,000 | Example intervention | Derived from eligible quantity | Source-backed planning estimate | Verified / ranked / benchmark | Candidate only / no geometry |
| $2,000,000 | Portfolio | Derived from eligible quantities | Total plus maintenance reserve | Mixed status shown | Candidate only / verified geometry |

The intervention families should remain separate because they have different
mechanisms and co-benefits. EPA identifies trees/vegetation, green roofs, cool
roofs, and cool pavements as distinct heat-island strategies; their benefits
and constraints are not interchangeable. [EPA heat-island solutions](https://www.epa.gov/heatislands/heat-island-reduction-solutions)

## 6. Spatial model progression

### 6.1 First release: priority-field comparison

The first map comparison reuses the existing bounded mitigation-lab mechanics:

1. Start with the city’s baseline priority field.
2. Translate a scenario budget into documented intervention quantities.
3. Rasterize only documented, generalized planning influence fields.
4. Compose bounded effects with diminishing returns.
5. Render baseline, modeled-priority result, and delta.

The right map is explicitly a **planning screen**. It is useful because it
shows relative, transparent model change, not because it claims a physical
temperature outcome.

### 6.2 Candidate geometry

Once a city supplies eligibility data, allocate actions over candidate areas
instead of abstract influence fields. Minimum layers include:

- public right-of-way or tree opportunity inventory;
- roof, pavement, and open-space suitability where lawful and licensed;
- canopy, imperviousness, albedo, and surface-temperature context;
- known cooling assets and public access conditions;
- ownership, permits, utility conflicts, maintenance capacity, and accessibility;
- community-defined priorities and exclusions.

Use different visual semantics:

- solid outline: verified existing intervention;
- dashed outline: feasible candidate area;
- soft halo: modeled influence extent;
- no map footprint: recommendation has no spatial evidence and stays in the
  allocation ledger.

### 6.3 Calibrated projection

Only use “Projected surface-temperature change” after an explicit calibration
gate. A generic form is:

\[
T_{scenario,i} = T_{baseline,i} - \sum_k \beta_{k,i} q_{k,i} g_k(d_i) + \epsilon_i
\]

where \(q_{k,i}\) is an intervention quantity, \(g_k\) describes spatial
influence, \(\beta_{k,i}\) is a locally calibrated response, and
\(\epsilon_i\) is uncertainty. The model needs held-out validation, bias and
error thresholds, and a declared scene/weather context before this map title
is enabled.

Surface-temperature and air-temperature claims must remain separate. For
example, vegetation can cool through shade and evapotranspiration, while the
magnitude depends on placement and context. [EPA trees and vegetation guidance](https://www.epa.gov/heatislands/benefits-trees-and-vegetation)

### 6.4 Outcome evaluation

After implementation, retain project geometry, dates, quantities, maintenance,
and matched observations. A measured-change view needs appropriate pre/post
comparison data and an evaluation design; it is not an automatic consequence
of a scenario map.

## 7. Optimization and equity

Candidate allocation should optimize a declared public-interest objective,
not merely maximize a heat score:

\[
\max_x \sum_i (w_h H_i + w_c C_i + w_e E_i + w_f F_i)x_i
\]

subject to

\[
\sum_i cost_i x_i \le B
\]

Where \(H\) is heat evidence, \(C\) cooling-access benefit, \(E\) equity
priority, \(F\) feasibility, and \(B\) the selected budget. Additional
constraints enforce eligible land, maximum feasible coverage, maintenance
capacity, spacing, and minimum equity allocation.

The interface must expose the chosen weights and allow a reader to see how a
result changes under a small set of named policies. Do not hide normative
choices inside an optimization score.

## 8. Uncertainty and communication

Each comparison must show, beside the map titles:

- **Observed:** baseline source, acquisition date, resolution, and coverage.
- **Derived:** model/version and inputs that created a priority field.
- **Assumed:** action quantities, placement logic, survival/maintenance, and
  budget assumptions.
- **Unknown / verify locally:** ownership, engineering, access, operations,
  community priorities, and realized effect.

When calibrated projections exist, show expected, conservative, and upper
plausible results—not one deceptively precise after-map. When evidence is
insufficient, use hatching or explicit “insufficient evidence” cells rather
than interpolation that looks certain.

## 9. Accessibility and usability requirements

- No information may exist only in color; provide a text result summary,
  symbols, and table alternative.
- Maintain the same legend range across before/after maps.
- Announce budget, selection, and model-version changes through concise live
  regions.
- Preserve keyboard map navigation and a non-map evidence list.
- Respect reduced motion; map synchronization must not create unnecessary
  fly-to animation.
- On small screens, show one full-width map at a time, never two illegible
  mini-maps.
- Save comparison state in the URL for sharing and reproducibility.

## 10. Product guardrails

The comparison must never:

- place an intervention at a named street without verified geometry;
- use a scenario color surface as proof of a built project;
- convert scenario priority change into degrees Celsius without calibration;
- treat a source-backed unit cost as an engineering estimate;
- obscure trade-offs, uncertainty, or feasibility exclusions; or
- make Boston-only fields required for other cities.

## 11. References informing this design

- [EPA: Heat Island Reduction Solutions](https://www.epa.gov/heatislands/heat-island-reduction-solutions)
- [EPA: Reduce Heat Islands with Green Infrastructure](https://www.epa.gov/green-infrastructure/reduce-heat-islands)
- [EPA: Using Cool Pavements to Reduce Heat Islands](https://www.epa.gov/heatislands/using-cool-pavements-reduce-heat-islands)
- [EPA: Using Cool Roofs to Reduce Heat Islands](https://www.epa.gov/heatislands/using-cool-roofs-reduce-heat-islands)
- [EPA: Benefits of Trees and Vegetation](https://www.epa.gov/heatislands/benefits-trees-and-vegetation)
- [MapLibre comparison and synchronization plugins](https://maplibre.org/maplibre-gl-js/docs/plugins/)
- [Existing Impact Evidence Protocol](IMPACT_EVIDENCE_PROTOCOL.md)
- [Interactive Mitigation Lab Method](INTERACTIVE_MITIGATION_LAB_METHOD.md)

