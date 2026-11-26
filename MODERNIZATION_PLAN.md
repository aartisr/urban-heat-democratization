# Urban Heat Democratization: Nobel-Caliber Modernization Plan

## Executive Summary

This document outlines the comprehensive architectural modernization strategy to transform urban_heat_democratization into a world-class, Nobel-prize-caliber scientific software platform. The plan addresses architectural debt concentrated in 4 key modules while preserving the strong domain foundation.

**Vision:** A cleanly architected, highly reusable, maximally extensible, maximally performant, and supremely maintainable platform for urban climate science.

---

## Part 1: Current State Assessment

### Core Issues

| Module | Lines | Issue | Impact | Priority |
|--------|-------|-------|--------|----------|
| `api/main.py` | 3,316 | God module: routing + orchestration + persistence + logic | Difficult to test, extend, understand | CRITICAL |
| `core/pipeline.py` | 677 | Mixed stages: analysis + optimization + output | Hard to modify safely, poor reuse | CRITICAL |
| `city-heat-map.tsx` | 3,783 | Monolithic component: map + controls + state + logic | Unmaintainable, poor testability | CRITICAL |
| `core/city_maps.py` | 870 | Multiple responsibilities | Violation of SRP | HIGH |
| `core/city_strategies.py` | 678 | Scenario logic + planning mode mixing | Difficult to extend | HIGH |
| Frontend roots ambiguity | 2 dirs | `/src` vs `/web/src`, different React versions | Build/deployment confusion | HIGH |

### SOLID Violations

- **SRP Violation:** Most critical modules have 3-5+ reasons to change
- **OCP Violation:** Adding features requires modifying core files, not extending
- **LSP:** Unclear interface contracts, inconsistent behaviors
- **ISP:** Large interfaces exposed (api/main.py has 50+ routes, components are massive)
- **DIP:** Direct imports of concrete implementations, poor inversion

### Architectural Debt

```
Current State (Monolithic):
┌─────────────────────────────────────┐
│         api/main.py (God)          │
├─────────────────────────────────────┤
│ Routes | Auth | Persistence | Logic │
└─────────────────────────────────────┘
         ↓ imports ↓
┌─────────────────────────────────────┐
│    core/ (Analysis Functions)       │
└─────────────────────────────────────┘

Frontend (Monolithic):
┌──────────────────────────────────────┐
│   CityHeatMap Component (3783 LOC)  │
├──────────────────────────────────────┤
│ Map + Controls + State + Logic + UI │
└──────────────────────────────────────┘
```

---

## Part 2: Target Architecture

### Layered Architecture (Clean Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│         (React Components, API Clients)                  │
├─────────────────────────────────────────────────────────┤
│                   API Layer                              │
│       (FastAPI Routers, Request/Response Models)        │
├─────────────────────────────────────────────────────────┤
│              Application/Service Layer                   │
│    (UseCases, Orchestration, Business Logic)            │
├─────────────────────────────────────────────────────────┤
│              Domain Model Layer                          │
│    (Entities, Value Objects, Domain Services)           │
├─────────────────────────────────────────────────────────┤
│              Infrastructure/Adapter Layer                │
│  (Persistence, External APIs, File Systems)             │
└─────────────────────────────────────────────────────────┘
```

### Backend Service Architecture

```
Backend (Layered Services):

┌─────────────────────────────────────────────┐
│          FastAPI Application                │
└──────────────┬──────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────┐
│         API Layer (Routers)                      │
├──────────────────────────────────────────────────┤
│ RunRouter │ CityRouter │ ScenarioRouter │ ...   │
└──────────────┬───────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────┐
│      Service Layer (Injected Services)           │
├──────────────────────────────────────────────────┤
│ CityService │ RunService │ ScenarioService │ ... │
└──────────────┬───────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────┐
│    Domain Layer (Core Business Logic)            │
├──────────────────────────────────────────────────┤
│  City │ Run │ Scenario │ Robustness │ Pipeline  │
└──────────────┬───────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────┐
│   Repository Layer (Persistence Adapters)       │
├──────────────────────────────────────────────────┤
│ RunRepository │ CityRepository │ ArtifactRepo │ ...│
└──────────────────────────────────────────────────┘
```

### Frontend Component Architecture

```
App (Route Layer)
├── Layout (Shared)
│   ├── Header
│   ├── Navigation
│   └── Footer
├── Pages
│   ├── Dashboard
│   ├── CityMap
│   ├── ScenarioComparison
│   └── Evidence
├── Features (Feature-Scoped)
│   ├── Mitigation
│   │   ├── domain/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── Scenarios
│   │   ├── domain/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── LiveThermal
│       ├── domain/
│       ├── components/
│       ├── hooks/
│       └── types/
├── Core/Shared
│   ├── ui/ (Reusable components)
│   ├── hooks/ (Custom hooks)
│   ├── types/ (Shared types)
│   ├── api/ (API client)
│   └── utils/ (Utilities)
└── Map (Extracted from monolith)
    ├── MapCore (map lifecycle)
    ├── Layers (layer management)
    ├── Controls (interactive controls)
    ├── Interactions (event handlers)
    └── hooks/ (map-specific hooks)
```

---

## Part 3: 8-Week Modernization Roadmap

### Week 1-2: Backend Service Layer Architecture

**Objective:** Split monolithic `api/main.py` into clean service layer

**Deliverables:**
1. Service interface contracts
2. Dependency injection framework setup
3. Base repository/adapter pattern
4. Service implementations (Cities, Runs, Scenarios, Robustness)
5. Refactored routers (thin, delegating to services)

**Key Files Created:**
- `api/services/__init__.py` - Service layer
- `api/services/city_service.py` - City management
- `api/services/run_service.py` - Run execution
- `api/services/scenario_service.py` - Scenario planning
- `api/services/robustness_service.py` - Analysis scoring
- `api/repositories/__init__.py` - Persistence adapters
- `api/repositories/run_repository.py`
- `api/repositories/artifact_repository.py`
- `api/di_container.py` - Dependency injection

**Refactoring Pattern:**
```python
# Before (God Module)
@app.get("/runs/{run_id}")
def get_run(run_id: str):
    # 50 lines: validation + db query + orchestration + formatting
    
# After (Service Layer)
@app.get("/runs/{run_id}")
def get_run(run_id: str, service: RunService = Depends()):
    return service.get_run(run_id)  # Clean, delegated
```

---

### Week 3: Scientific Pipeline Decomposition

**Objective:** Break `core/pipeline.py` into 5 explicit, testable stages

**Current Pipeline Flow:**
```
Raw Raster → Preprocessing → Graph Construction → Analysis → 
Optimization → Recommendations → Report Generation
```

**Refactored Pipeline Architecture:**
```python
# Each stage has:
# 1. Clear input contracts (TypedDict/Pydantic)
# 2. Clear output contracts
# 3. Isolated responsibility
# 4. Full type hints
# 5. Comprehensive logging

class PipelineStage(ABC):
    @abstractmethod
    def execute(self, input_data: InputContract) -> OutputContract:
        pass
    
    def validate_input(self, data: InputContract) -> None:
        pass
    
    def log_execution(self, duration: float, output: OutputContract) -> None:
        pass
```

**New Pipeline Module Structure:**
```
core/pipeline/
├── __init__.py
├── contracts.py          # Pydantic input/output models
├── loader.py             # Stage 1: Load & validate rasters
├── preprocessor.py       # Stage 2: Normalize & interpolate
├── graph_builder.py      # Stage 3: Build graph structures
├── analyzer.py           # Stage 4: Run analysis algorithms
├── optimizer.py          # Stage 5: Optimize allocations
├── reporter.py           # Stage 6: Generate outputs
├── pipeline.py           # Orchestrator (10-20 lines)
└── provenance.py         # Track run metadata/evidence
```

**Type Safety:**
```python
# Contracts with full validation
class RasterInput(BaseModel):
    file_path: Path
    bands: int
    crs: str
    bounds: Bounds
    
class PreprocessOutput(BaseModel):
    normalized_array: ndarray
    metadata: RasterMetadata
    execution_time_ms: float
```

---

### Week 4-5: Frontend Modularization

**Objective:** Decompose monolithic map component into reusable, testable modules

**Current State:**
```
CityHeatMap (3,783 lines)
├── Map rendering logic
├── Layer management
├── Control panels
├── State management
├── API calls
├── UI rendering
└── Everything coupled
```

**Target State:**
```
Map Ecosystem (Modular)
├── MapCore (200 lines)
│   └── MapLibre lifecycle, viewport management
├── LayerManager (500 lines)
│   ├── Heat layer
│   ├── Boundary layer
│   ├── Evidence layers
│   └── Layer visibility logic
├── Controls (600 lines)
│   ├── ColorScaleControl
│   ├── LayerToggleControl
│   ├── FilterControl
│   ├── LegendControl
│   └── Control layout
├── StateManagement (Zustand store, 200 lines)
│   ├── Map state
│   ├── Layer state
│   ├── Filter state
│   └── Selection state
├── Interactions (300 lines)
│   ├── Click handlers
│   ├── Hover tooltips
│   ├── Selection logic
│   └── Event propagation
├── Hooks (400 lines)
│   ├── useMapData() - Fetch & cache
│   ├── useMapState() - Access store
│   ├── useLayerInteraction() - Event handling
│   └── useMapPerformance() - Metrics
└── Integration (100 lines)
    └── CityMapContainer - Compose all pieces
```

**Component Reusability:**
```typescript
// Composable, testable, reusable
export const MapContainer: React.FC<MapProps> = ({ cityId }) => {
  const mapRef = useRef<MapLibre.Map>(null);
  const store = useMapStore();
  const { data, loading } = useMapData(cityId);
  
  return (
    <div className="map-container">
      <MapCore ref={mapRef} {...mapProps} />
      <LayerManager map={mapRef.current} data={data} />
      <Controls store={store} onFilterChange={handleFilter} />
      <Interactions map={mapRef.current} store={store} />
      <PerformanceMonitor map={mapRef.current} />
    </div>
  );
};

// Each piece is independently testable
describe('LayerManager', () => {
  it('should toggle layers correctly', () => {
    // Test in isolation
  });
});
```

---

### Week 6-7: Testing & Quality Assurance

**Objective:** Achieve high confidence through comprehensive testing

**Testing Strategy:**

1. **Contract Tests (OpenAPI + Pydantic)**
   ```python
   # Validate API contracts remain stable during refactoring
   def test_run_response_schema():
       response = client.get("/runs/123")
       assert RunResponseSchema.parse_obj(response.json())
   ```

2. **Service Tests (Unit)**
   ```python
   def test_run_service_executes_pipeline():
       service = RunService(repo=MockRepository())
       result = service.create_run(config)
       assert result.status == "completed"
   ```

3. **Integration Tests (Pipeline)**
   ```python
   def test_full_pipeline_with_boston_data():
       run = service.create_run(boston_config)
       assert run.results.robustness_metrics is not None
   ```

4. **Frontend Component Tests**
   ```typescript
   describe('MapLayer', () => {
     it('renders heat layer when data loads', async () => {
       const { getByTestId } = render(
         <MapLayer data={mockData} visible={true} />
       );
       await waitFor(() => expect(getByTestId('heat-layer')).toBeInTheDocument());
     });
   });
   ```

5. **E2E Tests (Critical Flows)**
   ```typescript
   it('user can load city, modify scenario, compare results', async () => {
     await page.goto('/');
     await page.click('[data-testid="select-city"]');
     await page.click('text=Boston');
     // ... complete flow
   });
   ```

**Coverage Targets:**
- Backend: 80%+ service layer, 70%+ integration
- Frontend: 60%+ components, 90%+ critical flows
- Pipeline: 100% stage transitions

---

### Week 8: Security & Production Hardening

**Objective:** Secure production defaults, operational excellence

**Security Checklist:**
1. ✅ Fail-closed auth (require explicit enable, not demo token default)
2. ✅ Comprehensive input validation + sanitization
3. ✅ Rate limiting per endpoint
4. ✅ CORS strict configuration (allowlist production origins)
5. ✅ Database connection pooling + timeouts
6. ✅ File upload security (size limits, type validation)
7. ✅ API key rotation policy
8. ✅ Error handling (never expose internals in production)
9. ✅ Logging policy (PII redaction, audit trail)
10. ✅ Documentation (security guarantees, threat model)

**Operational Excellence:**
1. Health checks + startup verification
2. Graceful shutdown procedures
3. Database migration strategy
4. Artifact backup/recovery procedures
5. Monitoring + alerting setup
6. Performance baseline + regression detection
7. Deployment checklist

---

## Part 4: Design Patterns & Principles Applied

### Design Patterns Implemented

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Layered Architecture** | Full stack | Clear separation of concerns |
| **Dependency Injection** | `api/di_container.py` | Loose coupling, testability |
| **Repository/Adapter** | `api/repositories/` | Persistence abstraction |
| **Service/UseCase** | `api/services/` | Business logic isolation |
| **Strategy Pattern** | `core/city_strategies.py` | Pluggable planning modes |
| **Observer Pattern** | React hooks/effects | Event-driven UI updates |
| **Builder Pattern** | Pipeline stages | Complex object construction |
| **Facade Pattern** | API routers | Simplified service access |
| **Decorator Pattern** | Middleware | Cross-cutting concerns |
| **Factory Pattern** | Service creation | Object instantiation |

### SOLID Principles

**Single Responsibility**
- Each service handles one domain (Cities, Runs, Scenarios)
- Each component renders one concern
- Each pipeline stage performs one transformation

**Open/Closed**
- New planning modes via configuration, not code modification
- New features via feature folders + services, not API changes
- New analysis algorithms via plugin registry

**Liskov Substitution**
- All repositories implement `Repository[T]` interface
- All services implement consistent interface
- Components accept props through consistent contracts

**Interface Segregation**
- Small, focused APIs for each service
- Component props split by concern (data, handlers, display)
- API endpoint groups by domain

**Dependency Inversion**
- Inject repositories, not direct database access
- Inject configuration, not environment reads
- Components receive data via props, not global state

### Best Practices

1. **Type Safety:** 100% type coverage with mypy + TypeScript strict mode
2. **Error Handling:** Explicit error types, structured exceptions
3. **Logging:** Structured logs with request IDs, tracing
4. **Configuration:** 12-factor app principles, environment-based
5. **Testing:** TDD for critical paths, comprehensive integration tests
6. **Documentation:** ADRs, docstrings, API contracts, runbooks
7. **Performance:** Profiling before optimization, benchmark tracking
8. **Security:** Fail-closed, explicit allowlists, defense in depth

---

## Part 5: Implementation Guidelines

### File Organization Post-Refactoring

```
urban_heat_democratization/
├── core/                           # Domain logic
│   ├── models/                     # Domain entities
│   │   ├── city.py
│   │   ├── run.py
│   │   ├── scenario.py
│   │   └── robustness.py
│   ├── services/                   # Domain algorithms
│   │   ├── spectral_analysis.py
│   │   ├── graph_analysis.py
│   │   └── optimization.py
│   └── pipeline/                   # Orchestration
│       ├── contracts.py
│       ├── stages/
│       └── pipeline.py
│
├── api/                            # HTTP Interface
│   ├── main.py                     # App setup (50 lines)
│   ├── di_container.py             # Dependency injection
│   ├── middleware/                 # Cross-cutting
│   ├── routers/                    # Thin route handlers
│   │   ├── cities.py
│   │   ├── runs.py
│   │   ├── scenarios.py
│   │   └── analysis.py
│   ├── services/                   # Application services
│   │   ├── city_service.py
│   │   ├── run_service.py
│   │   └── scenario_service.py
│   └── repositories/               # Persistence adapters
│       ├── base.py
│       ├── run_repository.py
│       └── artifact_repository.py
│
├── web/src/                        # Frontend
│   ├── components/
│   │   ├── common/                 # Reusable UI
│   │   ├── map/                    # Modular map ecosystem
│   │   │   ├── MapCore.tsx
│   │   │   ├── LayerManager.tsx
│   │   │   ├── Controls/
│   │   │   ├── hooks/
│   │   │   └── store.ts
│   │   └── features/               # Feature domains
│   ├── pages/
│   ├── hooks/
│   ├── types/
│   ├── api/
│   ├── utils/
│   └── store.ts                    # Global state (Zustand)
│
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    └── fixtures/
```

### Code Quality Standards

```yaml
Python:
  type_checking:
    tool: mypy
    strict: true
    
  linting:
    tool: ruff
    rules: [E, W, F, I]  # Errors, warnings, style, imports
    
  formatting:
    tool: black
    line_length: 100
    
  testing:
    framework: pytest
    min_coverage: 80%
    
TypeScript:
  strict_mode: true
  eslint: recommended
  prettier: auto-format
  vitest: for unit tests
  playwright: for e2e
```

---

## Part 6: Success Metrics

### Code Quality

| Metric | Target | Current |
|--------|--------|---------|
| Avg module size | <300 LOC | 500+ LOC (god modules) |
| Cyclomatic complexity | <10 | 15-25 (critical modules) |
| Test coverage | 80%+ | 60% (estimated) |
| Type safety | 100% | 70% (estimated) |
| Dependency cycles | 0 | Unknown |

### Maintainability

| Metric | Target | Current |
|--------|--------|---------|
| Time to understand module | <30 min | 2+ hours (api/main.py) |
| Time to add feature | 1-2 days | 3-5 days |
| Time to fix bug | 1 day | 2-3 days |
| Test feedback loop | <10 sec | 30+ sec |

### Performance

| Metric | Target | Current |
|--------|--------|---------|
| API response time (p95) | <500ms | Unknown |
| Map render time | <1s | Unknown |
| Pipeline execution (Boston) | <30s | Measure |
| Frontend bundle size | <500KB | Unknown |
| Lighthouse score | 90+ | Measure |

### Developer Experience

| Metric | Target | Measure |
|--------|--------|---------|
| Onboarding time | <2 hours | Via new contributor |
| Feature completeness | 100% | Via checklist |
| IDE support | Excellent | Via LSP + types |
| Documentation quality | Comprehensive | Via peer review |

---

## Part 7: Risk Mitigation

### Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Breaking changes | Medium | High | Comprehensive test suite + feature flags |
| Performance regression | Medium | High | Benchmarking + profiling before/after |
| Data loss | Low | Critical | Database versioning + backups |
| Deployment issues | Medium | High | Staging environment + rollback plan |
| Team knowledge gaps | Medium | Medium | Documentation + pair programming |

### Rollback Strategy

Each week's work should be:
1. Developed in feature branch
2. Thoroughly tested before merge
3. Mergeable to main within 1 hour
4. Rollback procedure documented and tested
5. No data migrations without dry-run

---

## Part 8: Next Steps

### Immediate Actions

1. **Week 1 Kickoff**
   - Review this plan with team
   - Set up feature branch workflow
   - Create service contracts document
   - Begin DI framework setup

2. **Parallel Tracking**
   - Architecture Decision Records (ADRs) for major choices
   - Weekly architecture review meetings
   - Continuous refactoring guidance documents
   - Community updates (what changed & why)

3. **Tools & Automation**
   - CI/CD enhanced: type checking, linting, coverage
   - Code metrics dashboard
   - Performance regression detection
   - Test coverage tracking

---

## Conclusion

This modernization plan transforms urban_heat_democratization from a solid-but-concentrated codebase into a **world-class scientific software platform** worthy of Nobel-caliber impact. The plan is aggressive but achievable in 8 weeks with focused effort.

**Key Success Factors:**
1. ✅ Systematic refactoring, not cleanup
2. ✅ Comprehensive testing at each stage
3. ✅ Clear ownership & accountability
4. ✅ Regular progress reviews & course corrections
5. ✅ Community communication & transparency

**Expected Outcomes:**
- 70%+ reduction in largest modules
- 100% type safety (Python + TypeScript)
- 80%+ test coverage
- <100 LOC service methods (clear, delegatable)
- <50 LOC component files (focused, testable)
- 50% reduction in onboarding time
- 3x faster feature development
- Nobel-caliber code quality

---

*This plan is living documentation. Update as you learn more during implementation.*
