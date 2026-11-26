# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for major design decisions in the modernization of urban_heat_democratization.

Format: Each record follows the [ADR format](https://adr.github.io/) with Status, Context, Decision, and Consequences.

---

## ADR-001: Layered Architecture for Backend

**Date:** 2026-11-26

**Status:** Accepted

### Context

The current `api/main.py` has grown to 3,316 lines, mixing routing, authentication, business logic, persistence, and orchestration. This monolithic structure makes the codebase:
- Difficult to test (requires full app context)
- Difficult to understand (all concerns mixed)
- Difficult to extend (changes affect everything)
- Difficult to maintain (single point of modification)

### Decision

Implement **Clean Architecture** with 5 clear layers:

```
Presentation (HTTP/FastAPI)
    ↓
Application/Service (Use cases, orchestration)
    ↓
Domain (Business logic, entities)
    ↓
Infrastructure (Persistence, adapters)
```

### Implementation

1. **API Layer** (`api/routers/`) - Thin route handlers that delegate
   - Single responsibility: Validate requests, call services, format responses
   - <100 LOC per router
   - No business logic

2. **Service Layer** (`api/services/`) - Application use cases
   - Single responsibility: Coordinate domain operations
   - Injected repositories and services
   - Testable without app context
   - <300 LOC per service

3. **Domain Layer** (`core/models/`, `core/services/`) - Pure business logic
   - Entities, value objects, domain algorithms
   - No external dependencies (framework-agnostic)
   - Testable with unit tests

4. **Repository Layer** (`api/repositories/`) - Persistence abstraction
   - Generic `Repository[T]` interface
   - Swappable implementations (SQLite, PostgreSQL, etc.)
   - Testable with mocks

5. **DI Container** (`api/di_container.py`) - Service instantiation
   - Single responsibility: Create and wire services
   - Centralized dependency management
   - Easy to mock for testing

### Consequences

✅ **Positive**
- Each layer is independently testable
- Changes are localized to relevant layer
- Easy to understand data flow (request → router → service → domain → repository → database)
- Supports parallel development (teams own different layers)
- Easy to swap implementations (database, auth, etc.)

⚠️ **Challenges**
- Requires discipline to not violate layer boundaries
- Initial setup overhead (boilerplate for DI, services)
- Need comprehensive tests to ensure contracts are maintained

### Alternative Considered

**Hexagonal/Ports-and-Adapters:** More flexible but heavier overhead for current project scope. Layered architecture provides right balance of structure and simplicity.

---

## ADR-002: Zustand for Frontend State Management

**Date:** 2026-11-26

**Status:** Accepted

### Context

The map component (`city-heat-map.tsx`) currently uses 20+ `useState` hooks scattered throughout the component, making state management:
- Implicit and hard to reason about
- Difficult to share state across components
- Prone to synchronization bugs
- Hard to debug and test

Options evaluated:
1. **Redux** - Full featured, battle-tested, but heavy boilerplate
2. **Zustand** - Minimal API, flexible, TypeScript-friendly, tiny bundle
3. **Jotai** - Atomic state, complex for feature-scoped state
4. **MobX** - Powerful but requires decorators and class syntax

### Decision

Use **Zustand** for map state management with feature-scoped stores:

```typescript
// Global map state
export const useMapStore = create<MapState & MapActions>((set) => ({
  // Map viewport: center, zoom, bearing, pitch
  // Layer state: visibility, opacity
  // Filter state: active filters
  // Selection state: selected/hovered features
  // Interaction state: drawing mode
  
  // Actions: setters, toggles, mutations
}));

// Feature-scoped stores
export const useMitigationStore = create(...);
export const useScenarioStore = create(...);
```

### Implementation

1. **Store definition** - Single source of truth for each feature
2. **Hook composition** - Components consume via `useMapStore()` without prop drilling
3. **Testing** - Stores are pure functions, easy to test in isolation
4. **Devtools** - Redux devtools support for debugging

### Consequences

✅ **Positive**
- Minimal boilerplate (1/10th of Redux)
- Tiny bundle size (~2KB minified)
- Perfect for TypeScript (full type inference)
- Subscriptions enable fine-grained reactivity
- Easy to test (pure functions)
- Can coexist with React hooks

⚠️ **Challenges**
- Less mature than Redux (but stable and battle-tested)
- Smaller community (but growing)
- Need discipline to avoid prop drilling antipattern with props

---

## ADR-003: Pipeline Decomposition into Explicit Stages

**Date:** 2026-11-26

**Status:** Accepted

### Context

`core/pipeline.py` (677 lines) mixes multiple concerns:
- Raster data loading and preprocessing
- Graph construction
- Analysis algorithms
- Optimization
- Report generation
- Output serialization

This mixing makes it:
- Difficult to modify individual stages
- Difficult to test stages in isolation
- Difficult to parallelize or distribute processing
- Difficult to add new stages or replace implementations

### Decision

Decompose pipeline into explicit stages with:

1. **Clear stage contracts** (Pydantic models for input/output)
2. **Stage interface** (all stages implement same interface)
3. **Stage implementations** (each in separate module)
4. **Pipeline orchestrator** (simple coordinator)

```
Input Contract → Validation
    ↓
Stage 1: Loader (load rasters, validate)
    ↓ Output: NormalizedRasters
Stage 2: Preprocessor (normalize, interpolate)
    ↓ Output: ProcessedRasters
Stage 3: GraphBuilder (build network)
    ↓ Output: Graph
Stage 4: Analyzer (compute metrics)
    ↓ Output: AnalysisResult
Stage 5: Optimizer (allocate resources)
    ↓ Output: OptimizedResult
Stage 6: Reporter (generate outputs)
    ↓ Output: Report
```

### Implementation

```python
# Each stage:
class PipelineStage(ABC):
    @abstractmethod
    async def execute(self, input: InputContract) -> OutputContract:
        pass

class Loader(PipelineStage):
    async def execute(self, input: LoaderInput) -> LoaderOutput:
        # Load & validate rasters
        pass

class Pipeline:
    async def execute(self, config: PipelineConfig) -> Report:
        loader = Loader()
        preprocessor = Preprocessor()
        # ... run stages in sequence
```

### Consequences

✅ **Positive**
- Each stage is independently testable
- Easy to profile individual stages
- Easy to parallelize or distribute stages
- Easy to replace stage implementation
- Full visibility into processing (stage transitions)
- Provenance and error tracking simplified

⚠️ **Challenges**
- Initial refactoring effort (break up 677-line file)
- Need to define clear contracts (Pydantic models)
- Potential performance overhead (serialization between stages) - mitigated by using data classes vs JSON

---

## ADR-004: Component Decomposition Strategy

**Date:** 2026-11-26

**Status:** Accepted

### Context

`city-heat-map.tsx` (3,783 lines) is a monolithic component mixing:
- MapLibre lifecycle management
- Layer management and rendering
- Event handling and interactions
- Control UI and state
- Data fetching and caching

This makes it:
- Impossible to test individual pieces
- Impossible to reuse map layers/controls in other screens
- Difficult to understand and modify
- Difficult to collaborate on (single file, many concerns)

### Decision

Decompose into focused, composable components:

```
CityMapContainer (Integration)
├── MapCore (Map lifecycle, viewport)
├── LayerManager (Add/update/remove layers)
├── Interactions (Click, hover, selection)
├── Controls (UI controls for map)
└── Hooks (useMapData, useMapState, etc.)
```

Each component:
- Single responsibility
- <300 LOC
- Independently testable
- Independently reusable
- Receives data/state via props or Zustand hooks
- Emits events via callbacks or store mutations

### Implementation

```typescript
// Composable: Use individually where needed
<MapCore style={mapStyle} bounds={bounds} />
<LayerManager map={mapRef} data={data} />
<Controls store={store} />

// Or integrated: Everything together
<CityMapContainer cityId={cityId} />
```

### Consequences

✅ **Positive**
- Each component testable in isolation
- Reusable map ecosystem across different screens
- Clear ownership (LayerManager, Controls, etc.)
- Easier to understand data flow
- Easier to add features (new layer, new control, new interaction)

⚠️ **Challenges**
- More files to manage
- Need clear contracts between components
- Requires discipline on prop drilling (solved by Zustand store)

---

## ADR-005: Monorepo vs. Separate Frontend/Backend

**Date:** 2026-11-26

**Status:** Accepted (maintain current monorepo structure)

### Context

Currently, the codebase is a **monorepo**:
- Python backend in `/api` and `/core`
- JavaScript/TypeScript frontend in `/web` and `/src`
- Shared types/documentation in `/docs`

Options:
1. **Keep monorepo** - Easier to coordinate, shared docs, single CI/CD
2. **Split to two repos** - Clearer separation, independent deployment

### Decision

**Keep and embrace monorepo** with clear structure:

```
urban_heat_democratization/
├── api/              # Backend (Python)
├── core/             # Shared science (Python)
├── web/              # Frontend (TypeScript)
├── docs/             # Shared documentation
├── tests/            # Integration tests
└── [config files]    # Shared CI/CD, tools
```

### Benefits

✅ Advantages
- Single change can update API + frontend together
- Easier coordination during refactoring
- Shared documentation and fixtures
- Single CI/CD pipeline
- Scientists and engineers see full picture
- Easier for contributors to understand architecture

⚠️ Requires
- Clear separation of concerns (documented)
- Separate dependency management (pyproject.toml, package.json)
- Separate build/test commands
- Clear ownership of each directory

### Consequences

- Keep monorepo structure documented clearly
- Each layer (api, core, web) has its own tests and linting
- Deployment happens as single atomic unit

---

## ADR-006: Type Safety Strategy

**Date:** 2026-11-26

**Status:** Accepted

### Context

Type safety is critical for:
1. Scientific correctness (wrong types = wrong calculations)
2. Developer confidence (refactoring safety)
3. API contracts (request/response validation)
4. Maintainability (documentation in types)

Current state: 70% type coverage, some old-style annotations

### Decision

Mandate 100% type coverage with:

**Backend (Python):**
- `mypy --strict` mode (strictest checking)
- Pydantic models for all API requests/responses
- Type hints on all functions (params + return type)
- No `Any` types (exception: required for specific reasons)

**Frontend (TypeScript):**
- `strict: true` in tsconfig.json
- Exhaustive type checking for union types
- No `any` types
- Interface-first development

**Shared Contracts:**
- Pydantic models as single source of truth
- OpenAPI schema generation from models
- Generated TypeScript types from OpenAPI (optional but recommended)

### Implementation

```python
# Backend - Full type safety
def process_city(city_id: str) -> City:
    """Process city and return validated City entity"""
    city = repository.get(city_id)
    if city is None:
        raise NotFoundError(f"City {city_id} not found")
    return city

# Request/response models - Pydantic
class RunRequest(BaseModel):
    city_id: str
    planning_mode: Literal["greening", "cool_pavements", "water"]
    
class RunResponse(BaseModel):
    id: str
    city_id: str
    status: Literal["queued", "running", "completed", "failed"]
    result: Optional[RunResult]
```

```typescript
// Frontend - Full type safety
interface MapData {
  bounds: Bounds;
  heatData: GeoJSON.FeatureCollection;
  boundaries: GeoJSON.FeatureCollection;
}

async function fetchMapData(cityId: string): Promise<MapData> {
  const response = await api.get(`/cities/${cityId}/map-data`);
  return response as MapData;  // Validated by OpenAPI types
}
```

### Consequences

✅ **Positive**
- Compile-time error detection (scientific correctness)
- Self-documenting code (types are documentation)
- IDE support (autocomplete, refactoring)
- Confident refactoring (compiler checks everything)
- Easier onboarding (types explain contracts)

⚠️ **Challenges**
- Initial overhead (add types to existing code)
- Learning curve for some developers
- Some edge cases require `cast()` or `# type: ignore`

### Mitigation

- Incrementally enforce (start with new code, gradually refactor old)
- Provide type annotation guidelines
- Use IDE helpers (Pylance, TypeScript Language Server)
- Document complex types with comments

---

## ADR-007: Testing Strategy

**Date:** 2026-11-26

**Status:** Accepted

### Context

Good testing is essential for:
1. Scientific correctness verification
2. Regression prevention
3. Confident refactoring
4. Documentation (tests show how to use API)

Current state: ~60% coverage (estimated), focused on scientific modules

### Decision

Implement comprehensive testing at multiple levels:

```
Unit Tests (40% of test suite)
├── Service tests (mock repositories)
├── Component tests (isolated React components)
└── Utility tests (pure functions)

Integration Tests (40% of test suite)
├── API service tests (real database)
├── Pipeline stage tests (full data flow)
└── Component integration (multiple components together)

E2E Tests (20% of test suite)
├── Critical user flows (Playwright)
├── Full system flows (backend + frontend)
└── Deployment verification

Contract Tests (Continuous)
├── API response schema validation
├── Type checking (mypy, TypeScript)
└── Component props validation
```

### Implementation

**Backend:**
```python
# Unit: Test service in isolation
def test_run_service_validates_input():
    repo = MockRunRepository()
    service = RunService(repo)
    with pytest.raises(ValueError):
        service.create_run(invalid_config)

# Integration: Test with real database
def test_run_service_persists_to_database():
    repo = RunRepository(temp_db)
    service = RunService(repo)
    run = service.create_run(config)
    retrieved = repo.get(run.id)
    assert retrieved.id == run.id

# Contract: Test response schema
def test_api_response_schema():
    response = client.get("/runs/123")
    RunResponse.parse_obj(response.json())  # Validates
```

**Frontend:**
```typescript
// Unit: Test component in isolation
it('should toggle layer', () => {
  const { getByRole } = render(<LayerToggleControl />);
  fireEvent.click(getByRole('checkbox'));
  expect(getByRole('checkbox')).not.toBeChecked();
});

// Integration: Test multiple components
it('should load map and render layers', async () => {
  const { getByTestId } = render(<CityMapContainer />);
  await waitFor(() => {
    expect(getByTestId('heat-layer')).toBeInTheDocument();
  });
});

// E2E: Test full flow
it('user can load city and modify mitigation', async () => {
  await page.goto('/');
  await page.click('[data-testid="select-city"]');
  // ... full flow
});
```

### Coverage Targets

| Layer | Target | Current |
|-------|--------|---------|
| Backend services | 80% | ~40% |
| Backend domain | 90% | ~70% |
| Frontend components | 60% | ~30% |
| Frontend features | 70% | ~40% |
| Integration tests | High | Low |
| E2E tests | High | Low |

### Consequences

✅ **Positive**
- High confidence in correctness
- Rapid feedback loop (tests run <30 sec)
- Living documentation
- Safe refactoring
- Regression prevention

⚠️ **Challenges**
- 2-3x development time initially (but faster long-term)
- Maintenance overhead for tests
- Flaky E2E tests (mitigated by focusing on critical flows)

---

## ADR-008: Documentation Standards

**Date:** 2026-11-26

**Status:** Accepted

### Context

Documentation is critical for:
1. Onboarding new developers (reduce 2-week ramp-up to 2 days)
2. Scientific credibility (explain methods, limitations)
3. API discoverability (help users understand capabilities)
4. Decision rationale (why we made certain choices)

### Decision

Establish multi-level documentation:

**Code Level:**
- Docstrings on all public functions (Google format)
- Type hints as documentation
- Inline comments for non-obvious logic

**Module Level:**
- README in each major directory
- Architecture decision records (ADRs) for major decisions
- Module dependency diagrams

**System Level:**
- Architecture overview (layered, service, etc.)
- API documentation (OpenAPI/Swagger)
- Developer guide (setup, testing, deployment)
- Scientific documentation (methods, evidence, limitations)

**Example:**
```python
def calculate_heat_index(temperature: float, humidity: float) -> float:
    """
    Calculate apparent temperature using heat index formula.
    
    Uses the National Weather Service formula which factors in both
    temperature and humidity to calculate how hot it "feels".
    
    Formula: HI = -42.379 + 2.04901523T + 10.14333127RH - ...
    
    Args:
        temperature: Celsius (range: 20-50)
        humidity: Relative humidity percentage (range: 0-100)
        
    Returns:
        Heat index in Celsius
        
    Raises:
        ValueError: If temperature or humidity out of valid range
        
    References:
        - National Weather Service: https://www.weather.gov/media/epz/wxcalc/heatIndex.pdf
        - Steadman, R.G. (1979): The Assessment of Sultriness
        
    Examples:
        >>> calculate_heat_index(32, 50)
        34.5
    """
    if not (20 <= temperature <= 50):
        raise ValueError(f"Temperature {temperature} out of range [20, 50]")
    # ... implementation
```

### Consequences

✅ **Positive**
- Faster onboarding (types + docstrings = instant context)
- Scientific credibility (formulas and references documented)
- Maintainability (future self can understand decisions)
- Discoverability (users find API without digging code)

⚠️ **Challenges**
- Maintenance burden (must keep docs in sync with code)
- Requires discipline (easy to skip documentation)

### Mitigation

- Enforce in code review (documentation required for merge)
- Use IDE helpers (docstring templates)
- Automated checks (linters verify docstring presence)

---

## ADR-009: Deployment & Runtime Guarantees

**Date:** 2026-11-26

**Status:** Accepted (see ADR-010 for implementation)

### Context

Current deployment: Vercel serverless (stateless) + SQLite (single-process file-based)

This creates guarantees and limitations:
- Stateless: No session affinity, easy to scale
- SQLite: No distributed locking, not suitable for concurrent writes
- Serverless: 15-minute request timeout

### Decision

Establish clear operational guarantees:

```
╔════════════════════════════════════════╗
║ OPERATIONAL GUARANTEES                 ║
╠════════════════════════════════════════╣
║ Availability: Best-effort              ║
║   - Serverless: subject to vendor limits
║   - Database: single instance, potential downtime
║   - No SLA (this is research software)  ║
║                                        ║
║ Concurrency: Limited                   ║
║   - SQLite: single-writer (queued)      ║
║   - Acceptable: <10 concurrent requests ║
║   - Not suitable: multi-tenant, high-load
║                                        ║
║ Durability: Moderate                   ║
║   - SQLite backed up daily              ║
║   - Artifact loss: rare but possible    ║
║   - Code source-of-truth: GitHub        ║
║                                        ║
║ Performance: Good                       ║
║   - API response time (p95): <500ms     ║
║   - Pipeline execution: <30s (Boston)   ║
║   - Frontend: <1s page load (cached)    ║
╚════════════════════════════════════════╝
```

### Implementation

**Configuration:**
```python
# api/config.py

class RuntimeConfig:
    # Database
    DATABASE_PATH = "/mnt/data/app.db"  # Persistent storage
    DATABASE_POOL_SIZE = 5
    DATABASE_TIMEOUT = 30
    
    # Processing
    MAX_CONCURRENT_RUNS = 10
    RUN_TIMEOUT_SECONDS = 900  # 15 minutes
    
    # Artifacts
    ARTIFACT_PATH = "/mnt/data/artifacts"
    ARTIFACT_RETENTION_DAYS = 365
    
    # Deployment
    RUNTIME_MODE = "serverless"  # or "process"
    ENABLE_BACKGROUND_WORKERS = False  # Disabled in serverless
    PROCESS_QUEUE_ASYNC = True  # Externalize to separate worker
```

**Startup Verification:**
```python
@app.on_event("startup")
async def startup_verification():
    """Verify all prerequisites met before accepting requests"""
    
    # Check database
    db = get_db()
    if not db.is_healthy():
        raise RuntimeError("Database health check failed")
    
    # Check storage
    if not Path(ARTIFACT_PATH).exists():
        Path(ARTIFACT_PATH).mkdir(parents=True)
    
    # Check configuration
    if not os.getenv("AUTH_TOKEN"):
        logger.warning("AUTH_TOKEN not set - demo mode active")
    
    logger.info(f"Runtime: {RUNTIME_MODE}, Workers: {ENABLE_BACKGROUND_WORKERS}")
```

### Consequences

✅ **Positive**
- Clear communication of limitations
- Realistic expectations from users
- Guides infrastructure/scaling decisions
- Helps identify when to upgrade (more concurrency needed → upgrade DB)

⚠️ **Challenges**
- May seem limiting (but transparent is better than surprising failures)
- May need to upgrade infrastructure as usage grows

---

## ADR-010: Scaling & Deployment Strategy

**Date:** 2026-11-26

**Status:** Proposed (implement after ADR-009)

### Context

Current setup (Vercel + SQLite) works for:
- Research usage (10-20 concurrent users)
- Boston case study (reference implementation)
- Validation purposes

But will need upgrade when:
- Multiple cities deployed simultaneously
- 50+ concurrent users
- 24/7 operational requirement
- Multiple researchers/institutions

### Decision

Establish **staged scaling strategy**:

```
Stage 1: Research (Current - Vercel + SQLite)
├── Deployment: Vercel serverless
├── Database: SQLite (file-based)
├── Concurrency: <20 users
├── Cost: ~$0 (free tier) to $50/month
└── When to upgrade: Concurrency >20 or uptim SLA required

Stage 2: Pilot Cities (If needed)
├── Deployment: Vercel serverless (unchanged)
├── Database: PostgreSQL (managed, e.g., Neon, Railway)
├── Concurrency: <100 users
├── Cost: $50-200/month
└── When to upgrade: Need distributed computation

Stage 3: Production (If needed)
├── Deployment: Container (Azure Container Apps)
├── Database: PostgreSQL (HA cluster)
├── Queue: Redis (background workers)
├── Concurrency: 1000+ users
├── Cost: $500+/month
└── When to upgrade: Global scale, 24/7 SLA required
```

### Implementation

Each stage is a **self-contained upgrade path**:

**Stage 1 → Stage 2:**
1. Create PostgreSQL database (Neon, Railway)
2. Update `api/repositories/` to use PostgreSQL driver
3. Run migrations: `flask db upgrade`
4. Update environment variables
5. Deploy
6. Verify all tests pass

**Stage 2 → Stage 3:**
1. Create Container Apps cluster (Azure)
2. Deploy app as container (Dockerfile already exists)
3. Create Redis cluster
4. Update queue implementation to use Redis
5. Update environment variables
6. Deploy
7. Run load tests

### Consequences

✅ **Positive**
- Clear upgrade path as needs grow
- No over-engineering for current use case
- Can optimize each stage independently
- Architecture supports all stages (clean layers enable this)

⚠️ **Challenges**
- Each upgrade requires testing and validation
- Database schema migrations have risk
- Need to maintain backward compatibility during transition

---

## Summary Table

| ADR | Decision | Rationale | Status |
|-----|----------|-----------|--------|
| 001 | Layered Architecture | Separation of concerns, testability | Accepted |
| 002 | Zustand for state | Minimal, TypeScript-friendly | Accepted |
| 003 | Pipeline stages | Testable, debuggable, parallelizable | Accepted |
| 004 | Component decomposition | Testable, reusable, maintainable | Accepted |
| 005 | Keep monorepo | Coordination, shared docs | Accepted |
| 006 | 100% type coverage | Scientific correctness, refactoring safety | Accepted |
| 007 | Multi-level testing | Confidence, regression prevention | Accepted |
| 008 | Documentation standards | Onboarding, credibility, maintenance | Accepted |
| 009 | Operational guarantees | Transparent limitations | Accepted |
| 010 | Staged scaling | Growth path without over-engineering | Proposed |

---

*These ADRs are living documents. Update them as we learn more during implementation. Add new ADRs for major decisions (e.g., authentication strategy, logging architecture, etc.)*
