# Technical Reference

## Where the technical documentation lives

The project’s technical documentation is distributed across the repository rather than generated from a single API-documentation site. This page is the technical front door: it links the operational guides, architecture documents, implementation code, contracts, scripts, and tests that define what the system does.

## Architecture and implementation status

| Need | Primary reference | What it covers |
| --- | --- | --- |
| System architecture and production direction | [Production Blueprint](../PRODUCTION_BLUEPRINT.md) | Application layers, operational model, and production considerations |
| Feature-level truth | [Implementation Status](../IMPLEMENTATION_STATUS.md) | Implemented, partial, and remaining capabilities |
| Fast local operation | [Quick Reference](../QUICK_REFERENCE.md) | Setup, API/web startup, health checks, validation, and runtime files |
| Repository artifact policy | [Artifact Strategy](../ARTIFACT_STRATEGY.md) | Provenance, Git policy, runtime versus bundled artifacts |
| System code | [`api/`](../../api/), [`core/`](../../core/), [`web/`](../../web/) | The executable source of truth |

## Service/API

The FastAPI application is defined in [`api/main.py`](../../api/main.py). It
composes the router layer, runtime orchestration, and access behavior.

| Component | Source | Responsibility |
| --- | --- | --- |
| Application entry point | [`api/main.py`](../../api/main.py) | App creation, routes, health/service setup |
| System router | [`api/routers/system.py`](../../api/routers/system.py) | City, package, artifact, and system-oriented API contracts |
| Run router | [`api/routers/runs.py`](../../api/routers/runs.py) | Run creation, inspection, and workflow interaction |
| Queue/runtime state | [`api/run_queue.py`](../../api/run_queue.py) | Local SQLite/JSON-backed execution records |
| Workspace access | [`api/access_control.py`](../../api/access_control.py) | Workspace-scoped role checks and demo access keys |
| Middleware | [`api/http_middleware.py`](../../api/http_middleware.py) | HTTP request/response behavior |

Run the service with `make api`. The primary local health endpoints are
`GET /api/health` and `GET /api/v1/health`. For the current API surface, start
the service and inspect its generated OpenAPI interface at `/docs`.

## Scientific core

The Python domain modules are intentionally separated from the user interface.
They should be treated as the primary technical reference for algorithmic
behavior, alongside their tests.

| Module | Technical responsibility | Test/reference |
| --- | --- | --- |
| [`core/graph.py`](../../core/graph.py) | Graph representation and network operations | [`tests/test_spectral_core.py`](../../tests/test_spectral_core.py) |
| [`core/spectra.py`](../../core/spectra.py) | Spectral analysis and bottleneck-oriented calculations | [`tests/test_spectral_core.py`](../../tests/test_spectral_core.py) |
| [`core/reliability.py`](../../core/reliability.py) | Reliability-style analysis | [`tests/test_sanity.py`](../../tests/test_sanity.py) |
| [`core/percolation.py`](../../core/percolation.py) | Connectivity stress/percolation workflows | [`tests/test_sanity.py`](../../tests/test_sanity.py) |
| [`core/raster.py`](../../core/raster.py) | Raster handling utilities | [`tests/test_sanity.py`](../../tests/test_sanity.py) |
| [`core/city_maps.py`](../../core/city_maps.py) | City map contracts and map-layer assembly | [`core/city_experience.py`](../../core/city_experience.py) |
| [`core/city_package_contract.py`](../../core/city_package_contract.py) | Bundled-city package contract | [`scripts/validate_city_packages.py`](../../scripts/validate_city_packages.py) |
| [`core/city_strategies.py`](../../core/city_strategies.py) | Scenario/planning strategy behavior | [`tests/test_city_strategies.py`](../../tests/test_city_strategies.py) |
| [`core/pipeline.py`](../../core/pipeline.py) | Pipeline orchestration | [`core/report.py`](../../core/report.py) |

The [Science and Interpretation](03-science-and-interpretation.md) page explains how to read these outputs responsibly; it is not a substitute for the code-level contracts above.

## Web application

The client is a Vite/React/TanStack application. Its dependency and command
surface is documented in [`web/README.md`](../../web/README.md) and
[`web/package.json`](../../web/package.json).

| Area | Key files |
| --- | --- |
| Routing and application bootstrap | [`web/src/main.tsx`](../../web/src/main.tsx), [`web/src/router.tsx`](../../web/src/router.tsx) |
| Atlas/map experience | [`web/src/components/city-heat-map.tsx`](../../web/src/components/city-heat-map.tsx), [`web/src/components/city-atlas-shell.tsx`](../../web/src/components/city-atlas-shell.tsx) |
| Major user workflows | [`web/src/routes/`](../../web/src/routes/) |
| API client and types | [`web/src/lib/api.ts`](../../web/src/lib/api.ts), [`web/src/lib/types.ts`](../../web/src/lib/types.ts) |
| Browser coverage | [`web/tests/e2e/`](../../web/tests/e2e/) |

## Data, city packages, and live sources

| Topic | Reference |
| --- | --- |
| Bundled-data policy and provenance | [Artifact Strategy](../ARTIFACT_STRATEGY.md) |
| Boston study meaning and limits | [Boston Study Guide](../BOSTON_STUDY_GUIDE.md) |
| City registration recipes | [City Onboarding Recipes](../CITY_ONBOARDING_RECIPES.md) |
| Package validation | [`scripts/validate_city_packages.py`](../../scripts/validate_city_packages.py) and `make validate-packages` |
| Cost sources and unit-cost model | [Verified Cost Sources](../verified_cost_sources.md), [Intervention Unit Costs](../INTERVENTION_UNIT_COSTS.md) |
| Live payload configuration | [Live Thermal Setup](../LIVE_THERMAL_SETUP.md), [Live Provider Bridges](../LIVE_PROVIDER_BRIDGES.md) |
| Provider bridge scripts | [`scripts/fetch_landsat_live_source.py`](../../scripts/fetch_landsat_live_source.py), [`scripts/fetch_ecostress_live_source.py`](../../scripts/fetch_ecostress_live_source.py), [`scripts/build_live_thermal_bridge.py`](../../scripts/build_live_thermal_bridge.py) |

## Validation and testing

The project uses Python tests, frontend tests, a production build, package validation, and Playwright coverage. The most useful commands are:

```bash
make test
make build
make validate-packages
cd web && npm run test:e2e
```

Relevant test suites include [`tests/test_benchmark_suite.py`](../../tests/test_benchmark_suite.py), [`tests/test_city_strategies.py`](../../tests/test_city_strategies.py), [`tests/test_spectral_core.py`](../../tests/test_spectral_core.py), and the browser tests under [`web/tests/e2e/`](../../web/tests/e2e/).

## Documentation gaps

This hub makes existing material navigable. It does not replace the next technical-documentation milestone: generated API schemas, module-level docstrings/API reference, explicit data schemas, algorithm parameter documentation, and reproducible end-to-end method notebooks. Until those are added, the combination of source code, tests, and the references above is the authoritative implementation record.
