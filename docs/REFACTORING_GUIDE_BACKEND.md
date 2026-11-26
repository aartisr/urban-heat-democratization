# Backend Refactoring Guide: api/main.py → Service Architecture

## 1. Current State: The God Module Anti-Pattern

### api/main.py Structure (3,316 lines)

```
api/main.py (THE PROBLEM)
├── FastAPI app initialization
├── CORS/middleware setup
├── Access control logic
├── Authentication handlers
├── ~50 route handlers (mixed concerns)
├── Error handling
├── Logging setup
├── Queue/worker management
├── City/data loading
├── Analysis orchestration
├── Persistence logic
├── Response formatting
└── Everything imported here
```

### Why This Is Unmaintainable

```python
# Current: 50+ lines per endpoint, everything inline
@app.get("/runs/{run_id}")
def get_run(run_id: str):
    # 1. Validate access
    # 2. Load from database
    # 3. Orchestrate analysis if needed
    # 4. Format response
    # 5. Handle errors
    # 6. Log execution
    # Total: 50+ lines of mixed concerns
    pass

@app.post("/runs")
def create_run(config: RunConfig):
    # 1. Validate config
    # 2. Load city data
    # 3. Create pipeline stage
    # 4. Queue for processing
    # 5. Persist to database
    # 6. Format response
    # Total: 60+ lines
    pass

# This repeats for 50+ endpoints = 2,500+ LOC
```

**Consequences:**
- 🔴 Cannot test endpoints without full app context
- 🔴 Cannot understand code without reading everything
- 🔴 Cannot modify one route without risk to others
- 🔴 Cannot reuse logic across endpoints
- 🔴 Cannot parallelize development (everyone edits same file)

---

## 2. Target State: Clean Service Architecture

### New Structure

```
api/main.py (CLEAN, ~100 lines)
├── App initialization (FastAPI())
├── Middleware setup (CORS, logging, errors)
├── DI container injection
├── Router registration
└── Startup/shutdown handlers

api/di_container.py (Dependency Injection)
├── Service factories
├── Repository factories
├── Configuration injection
└── Singleton management

api/routers/
├── cities.py         (Thin router, delegates to CityService)
├── runs.py          (Thin router, delegates to RunService)
├── scenarios.py     (Thin router, delegates to ScenarioService)
├── analysis.py      (Thin router, delegates to AnalysisService)
└── system.py        (Thin router, system endpoints)

api/services/
├── city_service.py              (City management use cases)
├── run_service.py              (Run execution use cases)
├── scenario_service.py         (Scenario planning use cases)
├── analysis_service.py         (Analysis orchestration)
└── artifact_service.py         (Evidence/artifact management)

api/repositories/
├── base.py                      (Generic Repository[T])
├── run_repository.py           (Run persistence)
├── artifact_repository.py      (Artifact persistence)
└── city_repository.py          (City data access)
```

---

## 3. Step-by-Step Refactoring

### Step 1: Create Service Interface Contracts (Day 1)

Create abstract base classes defining service contracts:

```python
# api/services/base.py

from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List
from pydantic import BaseModel

T = TypeVar('T')

class Service(ABC, Generic[T]):
    """Base service interface - all services implement this"""
    
    @abstractmethod
    async def get(self, id: str) -> T:
        """Retrieve one entity"""
        pass
    
    @abstractmethod
    async def list(self, filters: dict) -> List[T]:
        """List entities with filters"""
        pass
    
    @abstractmethod
    async def validate(self, data: BaseModel) -> bool:
        """Validate data before operations"""
        pass


# api/services/city_service.py

from api.services.base import Service
from core.models import City
from api.repositories import CityRepository
from api.repositories import ArtifactRepository

class CityService(Service[City]):
    """Manage cities, boundaries, evidence"""
    
    def __init__(
        self,
        city_repo: CityRepository,
        artifact_repo: ArtifactRepository,
    ):
        self.city_repo = city_repo
        self.artifact_repo = artifact_repo
    
    async def get(self, city_id: str) -> City:
        """Get city with all metadata"""
        city = await self.city_repo.get(city_id)
        city.evidence = await self.artifact_repo.list_by_city(city_id)
        return city
    
    async def validate(self, data: CityInput) -> bool:
        """Validate city configuration"""
        # Clear, testable validation logic
        return data.name and data.bounds
    
    async def create_city(self, config: CityInput) -> City:
        """Create new city"""
        # Clear business logic
        pass
    
    async def update_boundaries(self, city_id: str, boundaries: Bounds) -> City:
        """Update city boundaries"""
        # Clear, testable business logic
        pass


# api/services/run_service.py

class RunService(Service[Run]):
    """Manage analysis runs, executions, results"""
    
    def __init__(
        self,
        run_repo: RunRepository,
        artifact_repo: ArtifactRepository,
        analysis_svc: AnalysisService,
    ):
        self.run_repo = run_repo
        self.artifact_repo = artifact_repo
        self.analysis_svc = analysis_svc
    
    async def create_run(self, config: RunConfig) -> Run:
        """Execute a full analysis run"""
        # 1. Validate
        await self.validate(config)
        
        # 2. Create entity
        run = Run(id=uuid4(), config=config, status="queued")
        
        # 3. Persist
        await self.run_repo.save(run)
        
        # 4. Execute analysis
        result = await self.analysis_svc.execute_pipeline(config)
        
        # 5. Update run with results
        run.result = result
        run.status = "completed"
        await self.run_repo.save(run)
        
        return run
    
    async def get_run_results(self, run_id: str) -> RunResult:
        """Get run results with full provenance"""
        run = await self.run_repo.get(run_id)
        artifacts = await self.artifact_repo.list_by_run(run_id)
        return RunResult(run=run, artifacts=artifacts)
```

### Step 2: Create Repository Adapters (Day 2)

Persistence layer abstraction:

```python
# api/repositories/base.py

from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

class Repository(ABC, Generic[T]):
    """Base repository - all persistence goes through this"""
    
    @abstractmethod
    async def get(self, id: str) -> Optional[T]:
        pass
    
    @abstractmethod
    async def list(self, filters: dict = None) -> List[T]:
        pass
    
    @abstractmethod
    async def save(self, entity: T) -> T:
        pass
    
    @abstractmethod
    async def delete(self, id: str) -> bool:
        pass


# api/repositories/run_repository.py

import sqlite3
from pathlib import Path

class RunRepository(Repository[Run]):
    """Persist runs to SQLite"""
    
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._ensure_schema()
    
    async def get(self, run_id: str) -> Optional[Run]:
        """Load run from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM runs WHERE id = ?",
            (run_id,)
        )
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        return Run.parse_obj(row)
    
    async def list(self, filters: dict = None) -> List[Run]:
        """List runs with optional filters"""
        query = "SELECT * FROM runs WHERE 1=1"
        params = []
        
        if filters:
            if "city_id" in filters:
                query += " AND city_id = ?"
                params.append(filters["city_id"])
            if "status" in filters:
                query += " AND status = ?"
                params.append(filters["status"])
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [Run.parse_obj(row) for row in rows]
    
    async def save(self, run: Run) -> Run:
        """Persist run to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO runs 
            (id, city_id, config, status, result, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            run.id,
            run.city_id,
            run.config.json(),
            run.status,
            run.result.json() if run.result else None,
            run.created_at.isoformat(),
        ))
        
        conn.commit()
        conn.close()
        
        return run
    
    async def delete(self, run_id: str) -> bool:
        """Delete run"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM runs WHERE id = ?", (run_id,))
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        return success
    
    def _ensure_schema(self):
        """Create tables if they don't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                city_id TEXT NOT NULL,
                config TEXT NOT NULL,
                status TEXT NOT NULL,
                result TEXT,
                created_at TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()
```

### Step 3: Set Up Dependency Injection (Day 3)

Centralized service creation:

```python
# api/di_container.py

from typing import Dict, Any
from pathlib import Path

class DIContainer:
    """Dependency injection container - create all services"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self._singletons: Dict[str, Any] = {}
    
    def get_singleton(self, name: str, factory):
        """Create singleton instances"""
        if name not in self._singletons:
            self._singletons[name] = factory()
        return self._singletons[name]
    
    # Repositories
    @property
    def run_repository(self) -> RunRepository:
        return self.get_singleton(
            "run_repo",
            lambda: RunRepository(Path(self.config["db_path"]))
        )
    
    @property
    def artifact_repository(self) -> ArtifactRepository:
        return self.get_singleton(
            "artifact_repo",
            lambda: ArtifactRepository(Path(self.config["artifact_dir"]))
        )
    
    # Services
    @property
    def city_service(self) -> CityService:
        return self.get_singleton(
            "city_svc",
            lambda: CityService(
                city_repo=self.city_repository,
                artifact_repo=self.artifact_repository,
            )
        )
    
    @property
    def run_service(self) -> RunService:
        return self.get_singleton(
            "run_svc",
            lambda: RunService(
                run_repo=self.run_repository,
                artifact_repo=self.artifact_repository,
                analysis_svc=self.analysis_service,
            )
        )
    
    @property
    def scenario_service(self) -> ScenarioService:
        return self.get_singleton(
            "scenario_svc",
            lambda: ScenarioService(
                scenario_repo=self.scenario_repository,
                analysis_svc=self.analysis_service,
            )
        )


# Create container at app startup
_di_container: DIContainer = None

def get_di_container() -> DIContainer:
    """Get global DI container"""
    global _di_container
    if _di_container is None:
        config = {
            "db_path": os.getenv("DB_PATH", "./data/app.db"),
            "artifact_dir": os.getenv("ARTIFACT_DIR", "./data/artifacts"),
        }
        _di_container = DIContainer(config)
    return _di_container


# FastAPI dependency
async def get_run_service() -> RunService:
    return get_di_container().run_service

async def get_city_service() -> CityService:
    return get_di_container().city_service
```

### Step 4: Create Thin Routers (Day 4)

Delegate to services:

```python
# api/routers/runs.py

from fastapi import APIRouter, Depends, HTTPException
from api.services import RunService
from api.di_container import get_run_service
from core.models import Run

router = APIRouter(prefix="/runs", tags=["runs"])

@router.post("/")
async def create_run(
    config: RunConfig,
    service: RunService = Depends(get_run_service),
) -> Run:
    """Create and execute a run - delegates to service"""
    try:
        return await service.create_run(config)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{run_id}")
async def get_run(
    run_id: str,
    service: RunService = Depends(get_run_service),
) -> Run:
    """Get run results - delegates to service"""
    run = await service.get_run_results(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/")
async def list_runs(
    city_id: str = None,
    status: str = None,
    service: RunService = Depends(get_run_service),
) -> List[Run]:
    """List runs with filters - delegates to service"""
    filters = {}
    if city_id:
        filters["city_id"] = city_id
    if status:
        filters["status"] = status
    
    return await service.list(filters)


# api/routers/cities.py

router = APIRouter(prefix="/cities", tags=["cities"])

@router.get("/")
async def list_cities(
    service: CityService = Depends(get_city_service),
) -> List[City]:
    """List all cities"""
    return await service.list()


@router.get("/{city_id}")
async def get_city(
    city_id: str,
    service: CityService = Depends(get_city_service),
) -> City:
    """Get city details"""
    city = await service.get(city_id)
    if not city:
        raise HTTPException(status_code=404)
    return city


@router.post("/{city_id}/boundaries")
async def update_boundaries(
    city_id: str,
    boundaries: Bounds,
    service: CityService = Depends(get_city_service),
) -> City:
    """Update city boundaries"""
    return await service.update_boundaries(city_id, boundaries)
```

### Step 5: Refactor Main App (Day 5)

```python
# api/main.py (CLEAN & SIMPLE)

from fastapi import FastAPI, middleware
from fastapi.middleware.cors import CORSMiddleware
from api.di_container import get_di_container
from api.routers import cities, runs, scenarios, analysis, system

# Create app
app = FastAPI(
    title="Urban Heat Democratization API",
    version="2.0.0",
    description="Scientific platform for urban climate analysis"
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://urbanheatlab.org", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handling middleware
@app.middleware("http")
async def error_handler(request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Request error: {e}", exc_info=True)
        raise


# Initialize DI container on startup
@app.on_event("startup")
async def startup():
    """Initialize services on startup"""
    container = get_di_container()
    # Verify all services initialized
    _ = container.run_service
    _ = container.city_service
    _ = container.scenario_service
    logger.info("All services initialized")


# Register routers (10 lines total)
app.include_router(cities.router)
app.include_router(runs.router)
app.include_router(scenarios.router)
app.include_router(analysis.router)
app.include_router(system.router)


# Health check
@app.get("/health")
async def health():
    return {"status": "healthy"}


# Root
@app.get("/")
async def root():
    return {"message": "Urban Heat Democratization API v2.0"}
```

---

## 4. Testing Strategy

### Unit Tests (Service Layer)

```python
# tests/unit/test_run_service.py

import pytest
from unittest.mock import AsyncMock, MagicMock
from api.services import RunService
from core.models import Run, RunConfig

@pytest.fixture
def mock_repositories():
    return {
        "run_repo": AsyncMock(),
        "artifact_repo": AsyncMock(),
        "analysis_svc": AsyncMock(),
    }

@pytest.fixture
def run_service(mock_repositories):
    return RunService(**mock_repositories)

@pytest.mark.asyncio
async def test_create_run_validates_input(run_service, mock_repositories):
    """Service should validate before persisting"""
    invalid_config = RunConfig()  # Missing required fields
    
    with pytest.raises(ValueError):
        await run_service.create_run(invalid_config)
    
    # Repository was never called
    mock_repositories["run_repo"].save.assert_not_called()


@pytest.mark.asyncio
async def test_create_run_persists_and_executes(run_service, mock_repositories):
    """Service should persist and execute"""
    config = RunConfig(city_id="boston", planning_mode="greening")
    
    # Mock repository returns saved run
    expected_run = Run(id="run123", config=config, status="queued")
    mock_repositories["run_repo"].save.return_value = expected_run
    
    # Execute
    result = await run_service.create_run(config)
    
    # Verify
    assert result.id == "run123"
    mock_repositories["run_repo"].save.assert_called()
    mock_repositories["analysis_svc"].execute_pipeline.assert_called()
```

### Integration Tests

```python
# tests/integration/test_run_service_integration.py

import pytest
from pathlib import Path
from api.services import RunService
from api.repositories import RunRepository

@pytest.fixture
def temp_db(tmp_path):
    """Create temporary database for testing"""
    return tmp_path / "test.db"

@pytest.mark.asyncio
async def test_create_run_end_to_end(temp_db):
    """Full integration: service + repository + database"""
    # Create real repository
    repo = RunRepository(temp_db)
    
    # Create service with real repo
    service = RunService(
        run_repo=repo,
        artifact_repo=AsyncMock(),
        analysis_svc=MockAnalysisService(),
    )
    
    # Create run
    config = RunConfig(city_id="boston")
    run = await service.create_run(config)
    
    # Verify persisted to database
    retrieved = await repo.get(run.id)
    assert retrieved.id == run.id
    assert retrieved.status == "completed"
```

### Contract Tests (OpenAPI)

```python
# tests/contract/test_runs_contract.py

import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_create_run_response_matches_schema():
    """Response should match RunResponse schema"""
    response = client.post("/runs/", json={
        "city_id": "boston",
        "planning_mode": "greening",
    })
    
    assert response.status_code == 201
    
    # This validates against RunResponse Pydantic model
    from api.schemas import RunResponse
    RunResponse.parse_obj(response.json())  # Raises if invalid


def test_list_runs_response_matches_schema():
    """List response should match RunListResponse schema"""
    response = client.get("/runs/")
    
    assert response.status_code == 200
    
    from api.schemas import RunListResponse
    RunListResponse.parse_obj(response.json())
```

---

## 5. Migration Checklist

### Before Merge
- [ ] All service tests pass
- [ ] All repository tests pass
- [ ] Contract tests validate responses
- [ ] Integration tests with real database
- [ ] No breaking API changes (backward compatible)
- [ ] Documentation updated

### After Merge
- [ ] Monitor production errors
- [ ] Check performance metrics
- [ ] User feedback on new structure
- [ ] Type coverage verified (mypy passes)

### Success Criteria
- [ ] `api/main.py` < 150 lines
- [ ] All routers < 100 lines
- [ ] All services < 300 lines
- [ ] No circular imports
- [ ] 100% type coverage
- [ ] All tests pass

---

## 6. Example: Refactoring One Endpoint

### Before (Current State)

```python
# In api/main.py, 50+ lines
@app.post("/runs")
def create_run(config: RunConfig, background_tasks: BackgroundTasks):
    # Validation
    if not config.city_id or not config.planning_mode:
        raise HTTPException(status_code=400)
    
    # Load city data
    city_path = f"./data/cities/{config.city_id}.json"
    if not Path(city_path).exists():
        raise HTTPException(status_code=404, detail="City not found")
    
    with open(city_path) as f:
        city_data = json.load(f)
    
    # Create database entry
    db = get_db()
    run_id = str(uuid4())
    db.execute("""
        INSERT INTO runs (id, city_id, config, status)
        VALUES (?, ?, ?, ?)
    """, (run_id, config.city_id, config.json(), "queued"))
    db.commit()
    
    # Queue analysis
    def analyze():
        from core.pipeline import Pipeline
        pipeline = Pipeline(city_data)
        result = pipeline.execute(config)
        
        db = get_db()
        db.execute(
            "UPDATE runs SET status = ?, result = ? WHERE id = ?",
            ("completed", result.json(), run_id)
        )
        db.commit()
    
    background_tasks.add_task(analyze)
    
    # Format response
    return {
        "id": run_id,
        "city_id": config.city_id,
        "status": "queued"
    }
```

### After (Service Layer)

```python
# api/routers/runs.py (10 lines)
@router.post("/")
async def create_run(
    config: RunConfig,
    service: RunService = Depends(get_run_service),
) -> RunResponse:
    """Create and execute run"""
    return await service.create_run(config)


# api/services/run_service.py (service handles everything)
async def create_run(self, config: RunConfig) -> Run:
    """Create and queue run"""
    # Validation
    await self.validate(config)
    
    # Create entity
    run = Run(id=uuid4(), city_id=config.city_id, config=config)
    
    # Persist
    await self.run_repo.save(run)
    
    # Execute (async via background worker)
    result = await self.analysis_svc.execute_pipeline(config)
    run.result = result
    run.status = "completed"
    await self.run_repo.save(run)
    
    return run
```

**Benefits:**
- ✅ Endpoint code is 10 lines (was 50+)
- ✅ Service is testable in isolation
- ✅ Repository is swappable (mock for tests, real for production)
- ✅ Clear separation of concerns
- ✅ Easy to understand, modify, test

---

## 7. Timeline & Effort

| Task | Days | Effort | Owner |
|------|------|--------|-------|
| Create service contracts | 1 | 4-6 hrs | Architect |
| Create repositories | 1 | 4-6 hrs | Backend Dev |
| Setup DI container | 1 | 2-3 hrs | Backend Dev |
| Create routers | 1 | 3-4 hrs | Backend Dev |
| Refactor main.py | 1 | 2-3 hrs | Backend Dev |
| Write tests | 2 | 8-10 hrs | QA/Backend |
| Integration & merge | 1 | 4-6 hrs | Architect |

**Total: 1-2 weeks for complete backend refactoring**

---

## 8. Success Signals

After this refactoring:

✅ **Code clarity** - New developer can understand `/runs` endpoint in 15 minutes
✅ **Testing** - Can write service tests in 10 minutes without full app
✅ **Extension** - Adding new API endpoint takes 20 minutes (router + service)
✅ **Maintenance** - Fixing bug takes 30 minutes, not 2 hours searching god module
✅ **Performance** - Same or better (cleaner code, easier to profile/optimize)
✅ **Confidence** - Can refactor with safety net of comprehensive tests

---

This is a comprehensive, proven refactoring strategy that transforms unmaintainable code into world-class architecture.
