# Platform and Workflows

## From observation to a documented conversation

The application connects an atlas, scenario workspace, city onboarding flow, exports, and run history. These are not isolated features: each is intended to carry context forward so that a map observation can become a documented, bounded planning discussion.

```mermaid
flowchart LR
    A[Choose a city] --> B[Inspect layers and context]
    B --> C[Read provenance and limits]
    C --> D[Explore benchmark scenarios]
    D --> E[Record a run]
    E --> F[Export for review and discussion]
```

## The atlas: observe before prescribing

The city atlas is the starting place. It brings together a geographic basemap, thermal and study layers, polygon inspection, a layer rail, source and freshness context, and an analysis dock. Its role is to support careful observation—not to make a location look self-explanatory.

For the bundled Boston experience, users can inspect a boundary, a Cheeger bottleneck overlay, and a low-cooling-access overlay. In plain language, a highlighted bottleneck represents a place where the modeled network appears pinched or weakly connected; a low-cooling-access area represents weaker modeled access to cooling support. Both are analytical signals, not diagnoses of individual experience or mandates for a particular intervention.

## Scenarios: compare, do not promise

The scenario workspace supports benchmark-based what-if exploration. It can organize interventions, cost references, budgets, planning modes, evidence labels, proxy heat-reduction/equity fields, and a handoff into a tracked run.

Use scenarios to ask: “What would we want to investigate under these constraints?” Do not use them as a procurement quote, an engineering design, or proof of a health outcome. The current implementation lacks a complete city-specific unit-cost catalog and calibrated city-specific benefit model.

## City onboarding: let readiness grow visibly

Cities can be onboarded through the UI or `POST /api/v1/cities/onboard`. The practical minimum is a usable boundary. A city record can then accumulate thermal inputs, artifacts, bottleneck overlays, cooling overlays, and provenance as those become available.

This incremental design is intentional. It avoids a false choice between a perfect, inaccessible system and an unstructured map. But readiness must stay visible: a boundary-only city is not comparable to Boston’s bundled study experience.

## Runs, exports, and live adapters

Runtime state is stored locally in SQLite and mirrored as JSON under `data/runtime/`. Runs provide a record of queued work, staged execution, notes, and attached artifacts; exports curate material for review. This is a local-first audit trail, not a multi-agency production records system.

The platform can asynchronously refresh configured, city-ready thermal adapter payloads without blocking atlas use. It can also surface freshness information and fall back to a configured cached payload. This is an integration mechanism, not direct raw Landsat or ECOSTRESS processing. See [Live Thermal Setup](../LIVE_THERMAL_SETUP.md).

## Suggested first session

1. Start the API with `make api` and the web app with `make web`.
2. Open Boston and read the map before opening a scenario.
3. Select a polygon and review its explanation, provenance, and caveats.
4. Compare a small, medium, and stretch budget scenario as discussion prompts.
5. Create a run, then inspect the resulting record and artifacts.
6. Read the [Boston Study Guide](../BOSTON_STUDY_GUIDE.md) before treating an output as decision-ready.
