# Urban Heat Democratization - Architecture

## Overview

The Urban Heat Democratization application employs a **Layered Architecture** pattern with clean separation of concerns. This design enables maintainability, testability, and extensibility.

## Layered Architecture

```
┌─────────────────────────────────────────┐
│          FastAPI Application            │
│       (api/main.py)                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          HTTP Routers Layer             │
│  • Cities Router (api/routers/cities.py)│
│  • Runs Router   (api/routers/...)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Service Layer                  │
│  • CityService (api/services/city.py)   │
│  • RunService  (api/services/run.py)    │
│  Business logic and orchestration       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Repository Layer                 │
│  • CityRepository                       │
│  • RunRepository                        │
│  Data access abstraction                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Data Layer                     │
│  • In-Memory Stores (dict/list)         │
│  • Future: SQLite, PostgreSQL, etc.     │
└─────────────────────────────────────────┘
```

## Domain Layer

The domain layer defines core business entities and interfaces:

**File**: `api/domain/__init__.py`

### Key Types

- **`Repository[T]`**: Generic interface for data access
  - `async def get(id: str) -> Optional[T]`
  - `async def list(...) -> Tuple[List[T], int]`
  - `async def create(item: T) -> T`
  - `async def update(item: T) -> Optional[T]`
  - `async def delete(id: str) -> bool`

- **`CityDTO`**: Data Transfer Object for cities
  - Represents a city entity with geographic and climatic data
  - Used for API responses and service communication

- **`RunDTO`**: Data Transfer Object for simulation runs
  - Represents a simulation run result
  - Contains city reference and scenario parameters

- **`NotFoundError`**: Custom exception for missing entities

## Service Layer

The service layer contains business logic and coordinates operations across repositories.

### CityService
**File**: `api/services/city.py`

```python
class CityService:
    async def list_cities(offset: int = 0, limit: int = 10) -> Tuple[List[CityDTO], int]
    async def get_city(city_id: str) -> Optional[CityDTO]
    async def create_city(city: CityDTO) -> CityDTO
    async def health_check() -> Dict[str, str]
```

**Responsibilities**:
- Retrieve cities with pagination
- Validate city data
- Coordinate with repository layer

### RunService
**File**: `api/services/run.py`

```python
class RunService:
    async def list_runs(city_id: str = "", offset: int = 0, limit: int = 10) -> Tuple[List[RunDTO], int]
    async def get_run(run_id: str) -> Optional[RunDTO]
    async def create_run(run: RunDTO) -> RunDTO
    async def health_check() -> Dict[str, str]
```

**Responsibilities**:
- Manage simulation runs
- Filter runs by city
- Validate run parameters
- Track run status

## Repository Layer

The repository layer abstracts data access, allowing swapping storage backends.

### CityRepository
**File**: `api/repositories/city.py`

- Implements `Repository[CityDTO]`
- Current implementation: In-memory dict store
- Supports filtering and pagination

### RunRepository
**File**: `api/repositories/run.py`

- Implements `Repository[RunDTO]`
- Current implementation: In-memory list-to-dict adapter
- Supports city-based filtering

## Dependency Injection Container

**File**: `api/di_container.py`

Factory functions create properly configured service instances:

```python
def create_city_service(city_store: dict | None = None) -> CityService
def create_run_service(run_store: list | dict | None = None) -> RunService
```

**Key Feature**: Automatically converts list-based run stores to dict format for repository compatibility.

## Data Flow

### Request → Response Flow

```
HTTP Request
    ↓
FastAPI Router (api/routers/*)
    ↓
Service Layer (CityService/RunService)
    ↓
Repository Layer (CityRepository/RunRepository)
    ↓
Data Store (_CITY_STORE / _RUN_STORE)
    ↓
Response ← (Service transforms to DTO) ← (Repository retrieves)
```

### Example: GET /api/v1/cities

1. **Request**: `GET /api/v1/cities?offset=0&limit=10`
2. **Router**: Receives request, calls `service.list_cities(offset=0, limit=10)`
3. **Service**: Calls `repository.list(offset=0, limit=10)`
4. **Repository**: Queries `_CITY_STORE`, returns list of CityDTO
5. **Service**: Wraps in response object
6. **Router**: Returns JSON response

## Design Patterns

### 1. Dependency Injection
Services receive dependencies (repositories) via constructor injection, enabling:
- Testability: Mock repositories in tests
- Flexibility: Swap implementations without changing service code

### 2. Repository Pattern
Data access is abstracted behind generic `Repository[T]` interface:
- Current: In-memory stores
- Future: Pluggable SQL/NoSQL backends

### 3. Data Transfer Objects (DTOs)
Services communicate using DTOs (CityDTO, RunDTO) rather than raw entities:
- Clear API contracts
- Separation of internal/external representations

### 4. Factory Pattern
`di_container.py` uses factory functions to create configured services:
- Centralized configuration
- Testable service creation

### 5. Layered Architecture
Clear separation of concerns:
- Routers: HTTP concerns
- Services: Business logic
- Repositories: Data access
- Domain: Core entities and interfaces

## Backward Compatibility

The application maintains dual-layer compatibility:

**Old Monolithic Layer** (api/main.py):
- Original endpoint implementations
- Direct database access
- Remains unchanged

**New Clean Architecture Layer**:
- Service-based endpoints
- Dependency injection
- Repository pattern

Both layers coexist, allowing gradual migration without breaking existing code.

## Extensibility

To add a new entity (e.g., `Scenario`):

1. **Define Domain**: Add `ScenarioDTO` to `api/domain/__init__.py`
2. **Create Repository**: Implement `ScenarioRepository(Repository[ScenarioDTO])`
3. **Create Service**: Implement `ScenarioService` with business logic
4. **Create Router**: Implement `create_scenarios_router(service)` in `api/routers/scenarios.py`
5. **Wire in DI**: Add factory in `api/di_container.py`
6. **Register in Main**: Include router in `api/main.py`

## Performance Characteristics

- **Service Instantiation**: <1ms
- **Import Chain**: ~16-20ms
- **Repository Query**: <1ms (in-memory)
- **Average Endpoint Response**: <50ms

For production, replace in-memory stores with optimized database backends.

## Testing Strategy

- **Unit Tests**: Test individual services and repositories with mock data
- **Integration Tests**: Test full request → response cycle with real HTTP calls
- **Regression Tests**: Compare current vs. previous versions to detect breaks
- **Performance Tests**: Monitor response times and resource usage

## Future Enhancements

1. **Database Backend**: Replace in-memory stores with PostgreSQL/SQLite
2. **Caching Layer**: Add Redis for frequently accessed data
3. **API Versioning**: Support multiple API versions (v1, v2, etc.)
4. **Authentication**: Add JWT or OAuth2 security
5. **Async Processing**: Background tasks for long-running simulations
6. **API Documentation**: Auto-generated OpenAPI/Swagger docs
