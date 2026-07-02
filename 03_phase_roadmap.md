# Urban Heat Democratization Phase Roadmap

## 0. Implementation Snapshot

As of the current repo state:
- The TanStack UI is live and wired to the FastAPI backend.
- Boston uses real boundary GeoJSON and real exported spectral overlays.
- Scenario budgeting still lacks a full unit-cost table, but verified benchmark cost sources are now loaded into the repo.
- Run history is not yet persisted to a database.

## 1. Roadmap Goal
Deliver the platform in phased increments so that each phase produces a usable
product, not just unfinished infrastructure.

The roadmap is designed around four truth tests:
1. Can a user pick a city?
2. Can they understand the heat system?
3. Can they test mitigation scenarios?
4. Can they estimate cost and choose the best plan?

## 2. Delivery Philosophy
Each phase must ship something visible:
- a map,
- a report,
- a scenario tool,
- a budget estimate,
- a comparison table,
- or a reproducibility artifact.

Do not wait until the end to make the product useful.

## 3. Phase 0: Program Definition

### Objective
Lock the product mission, metrics, and evidence standards.

### Deliverables
- project charter,
- user persona definitions,
- evidence hierarchy,
- success metrics,
- risk register,
- data inventory.

### Key decisions
- Which cities are first-class launch cities?
- What is the minimum city data required?
- What counts as a valid mitigation recommendation?
- What thresholds define “good enough” confidence?

### Exit criteria
- everyone agrees on the target user groups,
- the platform scope is clear,
- benchmark metrics are frozen.

## 4. Phase 1: City Onboarding and Baseline Maps

### Objective
Let a user select or upload a city and see the first set of maps.

### Capabilities
- city selection,
- boundary upload,
- CRS normalization,
- raster/vector ingestion,
- heat map rendering,
- NDVI / vegetation rendering,
- study-area clipping.

### Deliverables
- TanStack city onboarding wizard,
- baseline heat atlas route,
- map legend,
- data source summary,
- quick-start documentation.

### Technical work
- build city registry,
- implement data validators,
- create geometry harmonization pipeline,
- generate first city layers,
- save provenance metadata,
- wire onboarding forms and route state in the web app.

### Exit criteria
- a new city can be onboarded without custom code,
- the user can see heat and vegetation layers,
- missing data is flagged clearly.

## 5. Phase 2: Structural Heat Analysis

### Objective
Reveal why the heat is trapped, not just where it exists.

### Capabilities
- graph build,
- weighted adjacency,
- spectral gap,
- Cheeger bottlenecks,
- cooling access / resistance,
- low-access zone overlays.

### Deliverables
- bottleneck map,
- access map,
- corridor explanation,
- street-level click inspection,
- plain-language interpretation panel.

### Technical work
- create node/edge graph from city layers,
- compute weighted Laplacian,
- extract cut corridors,
- infer cooling sinks,
- compute access scores.

### Exit criteria
- the user can click a hot corridor and understand why it matters,
- bottleneck and access signals are stable and reproducible.

## 6. Phase 3: Robustness and Reliability

### Objective
Show how fragile the cooling network is under stress.

### Capabilities
- percolation scans,
- reliability estimation,
- failure simulations,
- alternative network states,
- confidence intervals.

### Deliverables
- robustness chart,
- reliability summary,
- stress-test comparison panel,
- uncertainty summary.

### Technical work
- implement Monte Carlo failure runs,
- compute giant-component fractions,
- estimate sink-reachability reliability,
- compare baseline vs intervention robustness.

### Exit criteria
- the platform can explain not just what is hot, but what breaks when
  conditions worsen.

## 7. Phase 4: Intervention Library

### Objective
Turn analysis into action.

### Capabilities
- intervention definitions,
- cost tables,
- effect models,
- portfolio assembly,
- corridor-first actions,
- neighborhood-first actions.

### Intervention types
- tree planting,
- shade structure,
- cool pavement,
- cool roof,
- pocket park,
- curb extension,
- planting strip,
- median retrofit.

### Deliverables
- intervention catalog,
- cost-per-action table,
- effect-per-action table,
- implementation notes.

### Exit criteria
- the system can recommend actions with a cost and an expected benefit.

## 8. Phase 5: Budget and What-If Scenarios

### Objective
Make the platform useful for planning conversations.

### Capabilities
- fixed-budget optimization,
- budget sweeps,
- what-if sliders,
- scenario comparison,
- Pareto frontier views.

### Deliverables
- budget planner,
- “best plan under budget” output,
- “what if we had more money?” comparison,
- “what if we had less money?” comparison.

### Technical work
- scenario engine,
- optimization loop,
- marginal gain ranking,
- threshold analysis.

### Exit criteria
- a planner can ask for a budget and get a credible recommendation.

## 9. Phase 6: Exhaustive Mitigation Estimation

### Objective
Answer the high-end question:
How much would it cost to mitigate the city exhaustively?

### Capabilities
- full coverage cost estimate,
- threshold-based completeness model,
- corridor completion estimate,
- vulnerable-area completion estimate,
- policy constraint handling.

### Deliverables
- exhaustive mitigation cost report,
- citywide mitigation upper bound,
- incomplete-coverage gap analysis,
- map of remaining hot traps after budget exhaustion.

### Technical work
- define completion threshold,
- compute cost to raise all eligible cells above threshold,
- estimate the cost of closing all major bottlenecks,
- separate direct and maintenance costs.

### Exit criteria
- the user can see the difference between targeted mitigation and full
  mitigation.

## 10. Phase 7: Democratized UX

### Objective
Build interfaces that different audiences can actually use.

### Modes
- educator mode,
- student mode,
- planner mode,
- researcher mode.

### Deliverables
- guided walkthrough,
- glossary,
- explain-this-map panel,
- side-by-side scenario comparison,
- exportable teaching/report materials.

### Technical work
- persona-aware TanStack layouts,
- narrative tooltips,
- simplified legends,
- route-level dashboards,
- report templates.

### Exit criteria
- users with different expertise levels can all get value from the same data.

## 11. Phase 8: Validation, Benchmarking, and Trust

### Objective
Prove the system is reliable and reproducible.

### Capabilities
- benchmark suite,
- ablations,
- reproducibility runs,
- city cross-validation,
- data provenance audit,
- fairness analysis.

### Deliverables
- benchmark protocol,
- model card,
- fairness audit,
- reproducibility manifest,
- regression tests.

### Technical work
- compare against baselines,
- measure sensitivity to assumptions,
- quantify uncertainty,
- document data gaps.

### Exit criteria
- the platform can be defended scientifically and operationally.

## 12. Phase 9: Public Release and Research Package

### Objective
Make the platform reusable by others.

### Deliverables
- public docs,
- tutorial cities,
- sample datasets,
- one-command demo,
- challenge benchmark,
- release notes.

### Technical work
- package the repo,
- freeze versions,
- publish reproducible examples,
- create onboarding guides for new cities.

### Exit criteria
- an outside user can run the demo and understand the outputs.

## 13. Workstreams

### Stream A: Science
Graph theory, spectral methods, reliability, optimization, uncertainty.

### Stream B: Data
City ingestion, QA, provenance, harmonization, licensing.

### Stream C: Product
Maps, reports, comparison tools, educator mode, planner mode.

### Stream D: Engineering
APIs, workers, storage, testing, CI, deployment.

### Stream E: Trust
Fairness, transparency, reproducibility, documentation.

## 14. Milestone Table

| Milestone | User-visible outcome | Internal outcome |
|---|---|---|
| M1 | City loads and shows baseline heat map | ingestion + CRS + provenance working |
| M2 | Bottlenecks and cooling access are visible | graph + spectral pipeline working |
| M3 | Reliability and stress tests appear | Monte Carlo and robustness in place |
| M4 | Intervention suggestions appear | effect model and cost model working |
| M5 | Budget slider works | scenario engine working |
| M6 | Exhaustive mitigation cost works | threshold completion model working |
| M7 | Persona modes work | UX + narrative layer working |
| M8 | Benchmarks and audits exist | validation and trust layer working |
| M9 | Public release package | docs + reproducibility + examples |

## 15. Risks and Mitigations

### Risk: city data is incomplete
Mitigation:
- defaults,
- warnings,
- uncertainty flags,
- partial-mode analysis.

### Risk: cost model is too speculative
Mitigation:
- separate direct cost from maintenance,
- show ranges,
- document assumptions.

### Risk: users misread maps as certainty
Mitigation:
- confidence labels,
- plain-English caveats,
- provenance panels,
- “what this does not mean” sections.

### Risk: the tool becomes too technical
Mitigation:
- educator mode,
- guided walkthroughs,
- one-click summaries,
- glossary tooltips.

## 16. Example Phase Timeline

### Weeks 1-2
- city onboarding,
- baseline maps,
- simple UI.

### Weeks 3-4
- graph analysis,
- bottlenecks,
- access layers.

### Weeks 5-6
- reliability,
- intervention library,
- cost tables.

### Weeks 7-8
- scenarios,
- budget planner,
- comparison outputs.

### Weeks 9-10
- exhaustive mitigation,
- persona modes,
- polished reports.

### Weeks 11-12
- benchmarking,
- validation,
- public release package.

## 17. Definition of Done
The project is done when a user can:
- choose a city,
- see heat traps,
- understand why they matter,
- test interventions,
- compare budget options,
- ask for exhaustive mitigation cost,
- and export a defendable, reproducible plan.
