# Urban Heat Democratization System Architecture

## 1. Architectural Goal
Create a modular, city-agnostic platform that can ingest urban data, build a
thermal network model, run scenario analysis, and present results in a
friendly web interface.

The architecture must support:
- public city selection,
- custom city onboarding,
- interactive map exploration,
- scenario generation,
- budget optimization,
- exhaustive cost estimation,
- reproducibility and exports.

## 2. High-Level Stack

### 2.1 Scientific compute layer
Python-based core for:
- geospatial preprocessing,
- graph construction,
- spectral analysis,
- GMRF inference,
- robustness analysis,
- optimization,
- cost estimation.

### 2.2 Orchestration layer
FastAPI or equivalent service for:
- config validation,
- scenario submission,
- job tracking,
- artifact lookup,
- report generation requests.

### 2.3 Execution layer
Worker service for:
- long-running city runs,
- Monte Carlo simulations,
- scenario sweeps,
- exhaustive cost searches,
- report rendering.

### 2.4 Data layer
Persistent store for:
- run metadata,
- city definitions,
- artifact registry,
- scenario outputs,
- provenance records,
- decision logs.

### 2.5 Presentation layer
TanStack web app for:
- map visualization,
- scenario editing,
- table exploration,
- report download,
- educational narratives.

The presentation layer should be built with:
- TanStack Router,
- TanStack Query,
- TanStack Form,
- TanStack Table,
- a shared design system,
- and typed API contracts.

## 3. Core Domain Objects

### 3.1 City
Represents the geographic study area.
Fields:
- city id,
- name,
- boundary,
- CRS,
- resolution,
- time window,
- data sources.

### 3.2 Layer
Represents a map dataset.
Examples:
- temperature,
- NDVI,
- canopy,
- imperviousness,
- roads,
- parcels,
- vulnerability,
- cost surface.

### 3.3 Graph
Represents the city as a weighted network.
Fields:
- nodes,
- edges,
- weights,
- boundary nodes,
- sinks,
- connectivity metadata.

### 3.4 Scenario
Represents a what-if simulation.
Fields:
- budget,
- constraints,
- intervention palette,
- target metric,
- objective weights,
- climate assumptions.

### 3.5 Intervention
Represents a mitigation action.
Examples:
- tree planting,
- shade structures,
- cool roofs,
- cool pavement,
- pocket parks,
- corridor upgrades,
- green curb extensions.

### 3.6 Result
Represents the output of one scenario.
Fields:
- score,
- cost,
- impacted area,
- bottleneck changes,
- access changes,
- reliability changes,
- equity effects.

## 4. Data Flow

1. User selects city or uploads a boundary.
2. System validates the data contract.
3. System ingests and harmonizes layers.
4. System constructs the thermal graph.
5. System computes baseline metrics.
6. System runs one or more scenarios.
7. System stores artifacts and provenance.
8. UI renders maps, tables, and explanations.

## 5. Compute Pipeline Stages

### Stage A: City onboarding
- normalize CRS,
- clip layers to boundary,
- validate missing layers,
- compute spatial resolution,
- register city metadata.

### Stage B: Feature synthesis
- derive local heat signals,
- derive vegetation and access signals,
- generate candidate sinks,
- generate vulnerability weights,
- compute implementation feasibility features.

### Stage C: Graph build
- create nodes,
- create adjacency,
- assign weights,
- identify special structures:
  - bottleneck corridors,
  - sink-connected zones,
  - low-access zones.

### Stage D: Baseline analysis
- spectral gap,
- Cheeger cut,
- resistance/access,
- robustness/percolation,
- equity exposure.

### Stage E: Scenario simulation
- apply interventions,
- recompute metrics,
- compare against baseline,
- compute marginal gains.

### Stage F: Cost estimation
- attach unit costs,
- compute portfolio cost,
- estimate exhaustive mitigation cost,
- compute budget sufficiency gap.

### Stage G: Report generation
- render narrative report,
- create map exports,
- create machine-readable summaries,
- save provenance and audit logs.

## 6. Recommended Module Boundaries

### 6.1 `city/`
Responsibilities:
- city registry,
- boundary logic,
- onboarding templates,
- adapters,
- local CRS policy.

### 6.2 `data/`
Responsibilities:
- ingest files,
- normalize schemas,
- derive clean feature tables,
- manage provenance.

### 6.3 `graph/`
Responsibilities:
- graph construction,
- Laplacian computation,
- adjacency logic,
- cut boundary extraction.

### 6.4 `metrics/`
Responsibilities:
- Cheeger analysis,
- resistance/access,
- percolation,
- reliability,
- fairness metrics,
- cost normalization.

### 6.5 `model/`
Responsibilities:
- GMRF inference,
- posterior estimation,
- uncertainty propagation.

### 6.6 `opt/`
Responsibilities:
- intervention definitions,
- greedy search,
- portfolio optimization,
- budget search,
- exhaustive cost estimation.

### 6.7 `scenarios/`
Responsibilities:
- scenario templates,
- what-if sweeps,
- policy constraints,
- counterfactual comparisons.

### 6.8 `report/`
Responsibilities:
- docs,
- figures,
- tables,
- maps,
- summary exports.

### 6.9 `web/`
Responsibilities:
- map UI,
- forms,
- scenario builders,
- tables,
- dashboards,
- education mode.

### 6.10 `services/`
Responsibilities:
- API,
- worker,
- auth,
- job queue,
- artifact registry.

## 7. API Surface

### 7.1 City endpoints
- list cities
- get city metadata
- create city onboarding package
- validate city layers

### 7.2 Scenario endpoints
- create scenario
- simulate scenario
- compare scenarios
- sweep budgets
- estimate exhaustive cost

### 7.3 Run endpoints
- submit run
- poll run status
- fetch metrics
- fetch artifacts
- fetch logs

### 7.4 Education endpoints
- get plain-language explanation
- get glossary definitions
- get lesson-friendly summary
- get “what changed?” comparisons

## 8. Scenario Engine Design

Each scenario should be defined by:
- target city,
- baseline state,
- intervention set,
- budget limit,
- policy constraints,
- objective weights,
- evaluation horizon.

The engine must support:
- deterministic replay from saved config,
- stochastic runs with seeds,
- Monte Carlo confidence intervals,
- side-by-side scenario comparison.

## 9. Cost Estimation Design

The cost engine should compute:
- direct cost,
- deployment cost,
- maintenance cost,
- cumulative cost,
- cost per cooled block,
- cost per access gain,
- cost to reach threshold,
- cost to fully mitigate.

Cost outputs must support:
- per-intervention cost,
- per-scenario cost,
- per-city aggregate cost,
- completeness gap cost.

## 10. User Experience Design

### 10.1 Educator mode
- simplified copy,
- guided steps,
- visual callouts,
- glossary popovers.

### 10.2 Planner mode
- ranked actions,
- cost tables,
- budgets,
- feasibility flags,
- exportable memos.

### 10.3 Student mode
- playful but accurate explanations,
- before/after comparisons,
- “why this matters” text,
- map legend simplification.

### 10.4 Research mode
- model cards,
- uncertainty,
- citations,
- assumptions,
- full parameter exposure.

## 11. Governance and Trust

### Must-have logs
- data source provenance,
- config hash,
- run hash,
- model version,
- artifact checksum,
- user action trail.

### Must-have warnings
- missing data,
- low confidence,
- extrapolation beyond training domain,
- unresolved city layer gaps,
- cost assumptions that may vary by municipality.

## 12. Security and Access
The platform should be safe for public use:
- no secrets in configs,
- explicit user permissions for uploads,
- city-level data isolation,
- auditability of exported reports,
- optional public/private project modes.

## 13. Recommended Technology Choices

### Backend
- Python 3.11+
- FastAPI
- Pydantic
- SQLAlchemy
- Celery or Dramatiq
- Redis
- PostgreSQL/PostGIS

### Scientific stack
- GeoPandas
- Rasterio
- NetworkX
- SciPy
- NumPy
- Shapely

### Frontend
- React
- TypeScript
- TanStack Router
- TanStack Query
- TanStack Table
- TanStack Form
- MapLibre GL

### Quality
- Pytest
- Vitest
- Playwright
- CI workflows
- reproducibility manifests

## 14. Architecture Phases

### Phase 1: Minimum viable architecture
- single-city support,
- file upload,
- heat map viewer,
- baseline graph metrics,
- run storage.

### Phase 2: Generic city onboarding
- city registry,
- plugin adapters,
- validation,
- config templates,
- multiple-city support.

### Phase 3: Scenario and budget engine
- portfolio optimization,
- budget sweeps,
- exhaustive cost estimation,
- policy constraints,
- output comparison.

### Phase 4: Democratized web product
- educator/student/planner/researcher modes,
- guided walkthroughs,
- shareable views,
- export templates.

### Phase 5: Trust and validation layer
- audits,
- uncertainty,
- benchmark suite,
- reproducibility,
- city comparison studies.

## 15. Architecture Outcome
If implemented well, this architecture creates a platform that can scale from a
single classroom demo to a city-planning decision system without changing the
core scientific logic.
