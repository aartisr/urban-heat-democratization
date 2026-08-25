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

## Status maintenance rule

When work changes, update this summary and the relevant canonical roadmap.
Do not duplicate phase status in readiness contracts; link to the canonical
record instead. Do not describe planned, externally gated, or benchmark-based
work as implemented.
