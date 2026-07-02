# Implementation Status

This is the living source of truth for what is implemented, what is partial, and what remains.

Reviewed against:

- [01_master_plan.md](../01_master_plan.md)
- [02_system_architecture.md](../02_system_architecture.md)
- [03_phase_roadmap.md](../03_phase_roadmap.md)

## Snapshot

The repo is now a working TanStack-first urban-heat planning app with a Python API, SQLite-backed runtime persistence, a generic city-experience layer, formal bundled-package metadata, and two real Boston package variants built on the same local artifacts. It supports city browsing, upload-first city onboarding, metadata-driven study guidance, reusable starter scenarios, package validation, planner-facing validation, file-backed and content-checked uploaded-city data registration, scenario-to-run handoff, grouped run visibility inside scenarios, richer run inspection, geometry-derived artifact previews, export bundle curation, an uploaded-city artifact area, city-detail robustness context, benchmark scenario planning, and a more research-grade city atlas with a real geographic basemap, a layer rail, polygon inspection, explicit truth/provenance panels, scenario-facing evidence badges, source-switchable full-surface thermal layers built from bundled study arrays, a scenario-composition sunburst, a Sankey budget-flow companion, and a second hierarchy-style scenario ladder that separates evidence, budget, and benefit. The atlas now also includes an honest live-thermal adapter pipeline: operator-configured Landsat and ECOSTRESS payload adapters can refresh in the background on a worker thread, merge into the city map contract, and be enabled or paused from the map UI without blocking the request path. The bundled city page is now being normalized into a generic city-intelligence layout with a shared overview component, calmer map-first flow, and reference-backed design synthesis drawn from comparable public civic-analysis tools. The atlas also includes a below-map analysis dock with selected-polygon explanation, map-driven queue navigation, a pinned selected-area tooltip, mitigation suggestion chips that deep-link into scenario planning, a cleaner atlas-verification panel, a layman-friendly explanation of why the spectral math ranked a location highly, and a more compact tabbed control deck that keeps the most-used controls closer to the map. The scenario engine now also supports explicit planning modes for best-under-budget, evidence-first, benchmark-share, and whole-city benchmark framing, and it returns evidence-weighted confidence values instead of leaving every scenario confidence field blank. The scenario layer now also has a compact benchmark-suite contract and snapshot test so Boston budget cases can be regression-checked in CI. The planner now also includes a broader verified unit-cost seed set for light surfaces, street trees, curbside planting, shade structures, transit shade canopies, pocket parks, cool roofs, green roofs, permeable paving, and cool pavement so the exact knapsack path can execute against real public examples instead of only benchmark anchors. The run pipeline now emits a phased worker log trail with queue submission, validation, staging, and completion markers so execution is more inspectable than a single queued-to-succeeded jump. The web build now also performs a first round of manual chunk splitting so the map UI code and the heavy MapLibre vendor payload are separated more cleanly from the lighter app shell, and a second pass now splits the broader frontend vendor graph more explicitly even though the core `maplibre-gl` runtime still remains a very large lazy chunk. It also includes a much stronger operator-facing documentation set with a visual screen tour, onboarding recipes, a quick-reference guide, explicit Python 3.11 environment guardrails for the pinned scientific stack, and a safer one-command API startup path through `make api`. The setup path now also attempts a Homebrew-backed `python3.11` install on macOS when the interpreter is missing. The UI now also has a broader premium polish pass across the shell, landing flow, city onboarding, scenario review, exports, runs, shared city-detail cards, and the atlas shell itself so the product reads more like a coherent civic-analysis platform than a collection of utilitarian screens. The top-level shell is now intentionally simplified to core pages, and the removed specialist pages were folded back into the home, city, scenario, and run workflows. The city detail page now also exposes a trust audit with a benchmark protocol, reproducibility manifest, and provenance checks so the validation layer is visible instead of buried in docs only.

## Partial

- Scenario generation now supports multiple planning modes, and the verified subset now spends full program cost when target quantities exist, but it is still not a calibrated city-specific intervention optimizer because the repo still lacks a full verified city-specific unit-cost table and benefit model.
- Per-action scenario budgets are currently benchmark-share allocations derived from ranking, not validated procurement or engineering quantities.
- Generated scenarios now expose transparent proxy heat-reduction and equity fields, but the repo still does not yet have a validated city-specific benefit model.
- An intervention catalog now exists from real sources, but many entries are still ranking-based or benchmark-based rather than verified per-action unit-cost rows.
- The verified unit-cost file path now exists and is wired into the API, and it now covers a broader source-backed seed table, but it still needs a full city-specific catalog before it should be treated as complete.
- Confidence-aware comparison is only partial so far: evidence-readiness labels exist, and the app now carries proxy heat-reduction and equity fields plus best-value-per-dollar and confidence-adjusted lower-bound lenses, but benefit uncertainty and confidence intervals are still not city-calibrated.
- Confidence-aware comparison is still partial so far: comparison views now exist, and they now compare evidence and proxy benefit structure, but they still do not expose validated benefit uncertainty.
- Exhaustive mitigation cost is only partial so far: the app now has a verified-cost exhaustive-estimate contract and can compute it for the current verified seed set, but it still lacks a full city-specific unit-cost table.
- Multi-city onboarding is only partial so far: the workflow now supports multiple upload-first city presets, but the repo still lacks broad real layer ingestion beyond boundary files.
- Robustness integration is only partial so far: planning views now surface robustness context, but the metrics are still drawn from the toy lab rather than city-specific resilience runs.
- Run inspection is only partial so far: the app now supports run detail, notes, attached artifacts, and a phased worker-backed log trail, but not a full worker-backed execution lifecycle with live logs.
- Planning readiness is only partial so far: the app can now distinguish bundled Boston readiness from upload-first cities, but it does not yet validate full local data stacks the way the Boston research repo does.
- The app architecture is now substantially more generic, but Boston is still the only real city with bundled local overlays; the second bundled package is a Boston classroom variant rather than a second real city.
- The bundled city page is now much more generic structurally, but parts of the workflow and data depth are still anchored by Boston because Boston remains the only real bundled local dataset.
- The Boston thermal-source story is now much closer to `spectral_urbanism_boston`, and the repo now supports adapter-driven async refresh, but it still depends on operator-provided live adapter payloads rather than a built-in satellite ingestion stack.
- Frontend performance is only partially improved so far: the map bundle is now split more cleanly, MapLibre is deferred behind the city-map boundary, but the MapLibre vendor chunk is still large once requested.
- Frontend performance is only partially improved so far: the atlas now waits for explicit user activation before loading its heaviest assets, but the MapLibre vendor chunk is still large once the interactive atlas is opened.
- Live thermal refresh is now active and asynchronous when configured, but the system still depends on operator-provided adapter endpoints or files rather than shipping with direct Landsat or ECOSTRESS provider integrations.
- Live thermal refresh is now active and asynchronous when configured, and the atlas now shows source freshness, but it still depends on operator-provided adapter endpoints or files rather than shipping with direct Landsat or ECOSTRESS provider integrations.
- Live thermal refresh is now active and asynchronous when configured, and the repo now ships official-metadata bridge scripts for Landsat and ECOSTRESS, but Landsat still requires an operator-selected official collection concept id and the system still does not raster-process fresh orbital scenes into new thermal polygons inside the API itself.
- Planning strategies are now modular, but only benchmark-share strategies are implemented so far; no city-specific optimizer or calibrated benefit engine exists yet.
- The documentation now includes a real screenshot gallery generated from browser automation against the running app UI.
- Planner validation is only partial so far: it now reports readiness, missing pieces, and warnings in planner language, but it is still much lighter than the full research-repo validation stack.
- Uploaded-city validation is only partial so far: it now detects real boundary presence and distinguishes missing overlays from missing boundaries, but it still does not run full raster or data-contract validation.
- Uploaded-city validation now also checks non-empty payload content for registered thermal and artifact paths, validates GeoJSON overlays for usable geometry plus score-like numeric properties, and flags weak overlay content quality in planner validation; it still does not validate full raster semantics or full artifact contents.
- Browser automation support now exists with Playwright smoke coverage, fullscreen-map regression specs, and opt-in live-backend runs, but broader end-to-end persona-flow coverage is still pending.
- The home page now carries the theory/model/results explanation as simple cards instead of separate pages.
- The scenario and city detail pages now absorb the calibration, comparison, procurement, and history context so users do not have to jump across many specialist pages.

## Remaining

- Real intervention unit-cost table for trees, cool roofs, shade structures, cool pavement, pocket parks, permeable paving, green walls, and other related actions.
- Exhaustive mitigation cost estimation for whole-city and subregion scenarios.
- Additional real bundled cities beyond Boston so the generic city-experience architecture is exercised by multiple city datasets rather than multiple Boston package variants.
- Full Boston run execution parity with `spectral_urbanism_boston` including worker-backed jobs, config validation, and real pipeline logs.
- Built-in first-party Landsat and ECOSTRESS ingestion connectors; current live refresh requires a configured adapter payload source rather than shipping with provider-authenticated fetchers out of the box.

## Keep Updating

When progress is made:

- move completed items out of `Partial` or `Remaining`,
- split ambiguous items into smaller pieces,
- keep the snapshot short and factual,
- avoid describing planned work as implemented.
