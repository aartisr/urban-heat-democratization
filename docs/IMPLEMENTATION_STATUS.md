# Implementation Status

> Last reviewed: 2026-08-25. This is the concise repository-wide status
> register. For the authoritative Address-Level Spectral Urbanism roadmap and
> release gates, see [Address-Level Spectral Urbanism Advice](ADDRESS_LEVEL_SPECTRAL_URBANISM_ADVICE.md).

## Implemented

- A TanStack web application and Python API with city browsing, upload-first
  city onboarding, scenario planning, runs, exports, trust/provenance views,
  and SQLite-backed runtime persistence.
- A reusable city-experience contract with bundled Boston study and classroom
  variants, thermal-source metadata, local overlays, and atlas inspection.
- Graph, spectral, conductance, percolation, and sink-reliability methods;
  reproducibility tests; and an interactive robustness lab that teaches the
  same method family alongside a bundled Landsat graph reference.
- Source-backed intervention and unit-cost seed data, multiple planning modes,
  benchmark-suite checks, and evidence-readiness labels.
- Browser-only approximate-place action planning. Place text remains in the
  browser; no geocoding, address transmission, or address-level spectral result
  is enabled.
- Operator documentation, setup guides, screenshots, design/accessibility
  guidance, API health checks, package validation, and initial browser smoke
  coverage.
- A route-by-route responsive engineering audit: [Responsive and Usability
  Audit](RESPONSIVE_USABILITY_AUDIT.md).
- Preconfigured city starters for New York City, Chicago, Los Angeles, and
  Houston. They fill repeatable city context and focus onboarding on the first
  real local input: a boundary GeoJSON; they do not represent bundled evidence.
- A public [Civic Starter Guide](wiki/12-civic-starter-guide.md), also rendered
  on GitHub Pages, for residents, educators, advocates, and public teams.
- Interactive Heat-Mitigation Lab Phase 1 and the browser-deliverable Phase 2
  foundation: a synthetic, offline-first planning lab with bounded responses,
  manifest-driven interventions, evidence/applicability disclosures,
  deterministic exports, and size-limited public scenario links. It remains an
  illustrative planning tool, never a local temperature forecast.
- A shared mitigation-lab/robustness teaching-graph contract: the lab consumes
  the serialized robustness baseline and receives `lambda2`, conductance,
  percolation, and sink-reliability deltas from the same server-side helpers.
  Its separate browser priority field is labelled as such.
- A canonical `evaluate_graph_delta` core evaluator now serves the production
  pipeline and both labs, with a fixed-input/seed parity test covering the
  teaching graph metric payload. This is computational verification, not a
  real-world intervention or usefulness finding.
- The labs explicitly declare their validated scope: computational parity is
  verified, and the graph methods are mathematically valid for the documented
  weighted-graph question; real-world validity remains externally gated.
- The Mitigation Lab grid includes in-context icon pickers for interventions
  and sketch controls, keyboard/focus descriptions, vertically wrapping
  bounded tooltips, and an explicit high heat-pressure teaching node. These
  are usability improvements; they do not alter the graph topology or claims.

## Partial / constrained

| Area | Current limit |
| --- | --- |
| Intervention planning | Costs, benefits, and confidence are still partly benchmark- or ranking-derived; they are not a calibrated city-specific engineering model. |
| City coverage | Boston is the only real bundled local study dataset. The classroom package is not a second city. |
| Robustness | The lab is a transparent scenario linked to a real bundled thermal-graph reference; it is not a city-specific resilience run or forecast. |
| City onboarding | Boundaries and selected artifacts are validated, but full raster semantics, licensing, and data-contract validation are not yet automated. |
| Execution | Run queue, progress markers, and inspection exist; full production worker lifecycle and live logs do not. |
| Live thermal data | Adapter and bridge patterns exist, but the API does not directly ingest and raster-process fresh orbital scenes. |
| Frontend performance | Heavy atlas code is deferred and split, but MapLibre remains substantial once the interactive map is opened. |
| Stylesheet budget | Current global CSS is marginally above its performance budget; route-level CSS splitting or reduction is still needed. |
| Test coverage | Unit, contract, and smoke coverage exist; broader end-to-end persona-flow coverage remains incomplete. |
| Interactive Mitigation Lab | Synthetic Explore mode is implemented. Moderated comprehension walkthroughs, richer source review, and all city/Boston/calibrated pathways remain gated. |
| Boston mitigation adapter | A coarse server-produced study aggregate is available in the lab; it deliberately omits source geometry and temperature claims. Review gates and calibrated local study work remain incomplete. |
| Mitigation graph math | The shared graph is the nine-node teaching scenario used by the robustness lab. It is not a Boston graph, and only the bounded cooling-access-node mapping changes graph topology. |
| Calibrated local study | A guarded readiness endpoint and a public checklist exist, but calibrated output is disabled pending every external Impact Evidence Protocol gate. |

The phase-by-phase implementation and exit-gate ledger is maintained in the
[Interactive Heat-Mitigation Lab plan](INTERACTIVE_MITIGATION_LAB_PLAN.md#delivery-status-snapshot).

## Remaining priorities

1. Build a complete, source-backed, city-specific intervention cost, feasibility,
   maintenance, and benefit model.
2. Add distinct, documented real city datasets beyond Boston.
3. Reach Boston pipeline-execution parity with reproducible worker jobs,
   configuration validation, and pipeline logs.
4. Implement full raster/data-contract validation for uploaded cities.
5. Expand end-to-end accessibility and persona-flow testing.
6. Advance Address-Level Spectral Urbanism only through its explicit external
   gates—especially comprehension testing, partner governance, privacy review,
   sensitivity validation, and field evaluation. See the canonical
   [address-level status](ADDRESS_LEVEL_SPECTRAL_URBANISM_ADVICE.md#current-delivery-status-and-what-remains).
7. Implement the browser-first [Interactive Heat-Mitigation Lab](INTERACTIVE_MITIGATION_LAB_PLAN.md)
   through its evidence, accessibility, performance, and comprehension gates;
   do not present planning output as a city-specific temperature forecast.

## Status maintenance rule

When work changes, update this summary and the relevant canonical roadmap.
Do not duplicate phase status in readiness contracts; link to the canonical
record instead. Do not describe planned, externally gated, or benchmark-based
work as implemented.
