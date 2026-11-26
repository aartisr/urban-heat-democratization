# Design Patterns & Principles

## Overview

The Urban Heat Democratization application implements industry-standard design patterns and software engineering principles to ensure maintainability, scalability, and testability.

## Patterns Implemented

### 1. Layered Architecture

**Definition**: Application is organized into horizontal layers, each with specific responsibilities.

**Layers in Our Application**:
1. **HTTP Router Layer**: Handles HTTP requests/responses
2. **Service Layer**: Implements business logic
3. **Repository Layer**: Abstracts data access
4. **Domain Layer**: Core entities and interfaces

**Benefits**:
- Clear separation of concerns
- Easy to test each layer independently
- Simple to swap implementations (e.g., replace in-memory with database)
- Developers can focus on one layer at a time

**Usage**:
```
HTTP Request → Router → Service → Repository → Data Store
```

---

### 2. Dependency Injection (DI)

**Definition**: Dependencies are provided to objects rather than objects creating them.

**Implementation**: `api/di_container.py`

```python
def create_city_service(city_store: dict | None = None) -> CityService:
    repository = CityRepository(store=city_store)
    return CityService(repository=repository)
```

**Benefits**:
- Decouples components
- Enables testing with mock objects
- Configuration is centralized
- Easy to swap implementations

**Example Usage**:
```python
# Production
service = create_city_service(city_store=production_db)

# Testing
mock_store = {"city_1": {...}}
service = create_city_service(city_store=mock_store)
```

---

### 3. Repository Pattern

**Definition**: Abstracts data access behind a generic interface.

**Interface**: `api/domain/__init__.py`

```python
class Repository(Generic[T]):
    async def get(id: str) -> Optional[T]
    async def list(...) -> Tuple[List[T], int]
    async def create(item: T) -> T
    async def update(item: T) -> Optional[T]
    async def delete(id: str) -> bool
```

**Current Implementation**:
- `CityRepository(Repository[CityDTO])` - In-memory dict store
- `RunRepository(Repository[RunDTO])` - In-memory list-to-dict adapter

**Future Implementations**:
- `SQLiteCityRepository`
- `PostgresRunRepository`
- `MongoRunRepository`

**Benefits**:
- Change data store without changing service code
- Easy to mock repositories for testing
- Consistent interface across data sources
- Future-proof against technology changes

**Migration Path**:
```python
# Today: In-memory
repository = CityRepository(store=in_memory_dict)

# Tomorrow: PostgreSQL (no service code changes needed!)
repository = PostgresRepository(connection_string=db_url)
```

---

### 4. Data Transfer Objects (DTOs)

**Definition**: Objects that carry data between layers without business logic.

**DTOs in Our Application**:
- `CityDTO`: Represents city data
- `RunDTO`: Represents run data

**Example**:
```python
@dataclass
class CityDTO:
    id: str
    name: str
    latitude: float
    longitude: float
    population: int
    region: str
```

**Benefits**:
- Clear API contracts
- Separation of internal/external representations
- Type safety across layers
- Easy serialization to/from JSON

**Usage**:
```python
# Service receives and returns DTOs
city_dto = await service.get_city(city_id)

# Not internal entities
# (This would violate layering)
# city = await service.get_city_entity(city_id)
```

---

### 5. Factory Pattern

**Definition**: Encapsulates object creation logic.

**Implementation**: `api/di_container.py`

```python
def create_city_service(...) -> CityService:
    # Factory handles all configuration
    repository = CityRepository(store=city_store)
    return CityService(repository=repository)
```

**Benefits**:
- Centralizes complex object creation
- Encapsulates configuration details
- Makes testing easier
- Simplifies main application code

**Usage**:
```python
# Main code is clean
service = create_city_service(city_store=_CITY_STORE)

# Instead of
service = CityService(
    repository=CityRepository(
        store=_CITY_STORE,
        cache=_CACHE,
        logger=_LOGGER,
        # ... many dependencies
    )
)
```

---

### 6. Adapter Pattern

**Definition**: Converts between incompatible interfaces.

**Usage in RunRepository**:
```python
def _convert_list_to_dict_store(store):
    """Adapt list-based store to dict-based interface."""
    if isinstance(store, list):
        return {str(item.get("id", "")): item for item in store}
    return store
```

**Purpose**: 
- Maintains backward compatibility with list-based run storage
- Repository expects dict interface
- Conversion happens transparently in DI container

---

### 7. Async/Await for I/O

**Definition**: Non-blocking I/O operations for scalability.

**Implementation**:
```python
class Repository(Generic[T]):
    async def get(id: str) -> Optional[T]
    async def list(...) -> Tuple[List[T], int]
    async def create(item: T) -> T
```

**Benefits**:
- Handle many concurrent requests
- Minimal resource usage
- Ready for database I/O scaling
- Better performance under load

**Current State**:
- In-memory operations are very fast
- Async structure future-proofs for real I/O

---

## Software Engineering Principles

### SOLID Principles

#### **S - Single Responsibility Principle**

Each class has one reason to change.

**Good**:
```python
class CityService:  # Single responsibility: city business logic
    async def list_cities(self) -> ...
    async def get_city(self, id: str) -> ...

class CityRepository:  # Single responsibility: city data access
    async def list(self) -> ...
    async def get(self, id: str) -> ...
```

**Bad**:
```python
class CityManager:  # Too many responsibilities
    async def list_cities(self) -> ...
    async def get_city(self, id: str) -> ...
    async def save_to_database(self) -> ...
    async def send_email_notifications(self) -> ...
    async def handle_http_requests(self) -> ...
```

#### **O - Open/Closed Principle**

Classes should be open for extension, closed for modification.

**Good**:
```python
# Can extend Repository for new types without modifying existing code
class Repository(Generic[T]):
    async def get(id: str) -> Optional[T]
    # ...

class CityRepository(Repository[CityDTO]):  # Extends without modifying Repository
    pass
```

#### **L - Liskov Substitution Principle**

Subtypes must be substitutable for their base types.

**Good**:
```python
# Can swap implementations without breaking code
def setup_service(repository: Repository[CityDTO]) -> CityService:
    return CityService(repository=repository)

# Works with any Repository implementation
setup_service(CityRepository())  # In-memory
setup_service(PostgresRepository())  # PostgreSQL
```

#### **I - Interface Segregation Principle**

Classes should depend on focused interfaces.

**Good**:
```python
class CityService:
    def __init__(self, repository: Repository[CityDTO]):
        # Only depends on Repository interface
        # Doesn't depend on CityRepository implementation details
        self.repository = repository
```

#### **D - Dependency Inversion Principle**

Depend on abstractions, not concretions.

**Good**:
```python
# Service depends on Repository abstraction
class CityService:
    def __init__(self, repository: Repository[CityDTO]):  # Abstract!
        self.repository = repository
```

**Bad**:
```python
# Service depends on concrete implementation
class CityService:
    def __init__(self, repository: CityRepository):  # Concrete!
        self.repository = repository
```

---

### DRY - Don't Repeat Yourself

Eliminate code duplication through abstraction.

**Good**:
```python
# Generic Repository interface prevents duplication
class Repository(Generic[T]):
    async def get(id: str) -> Optional[T]
    async def list(...) -> Tuple[List[T], int]

# Reuse for all entity types
class CityRepository(Repository[CityDTO]): pass
class RunRepository(Repository[RunDTO]): pass
```

**Bad**:
```python
# Duplicate code for each entity
class CityRepository:
    async def get_city(self, id: str) -> Optional[CityDTO]: ...
    async def list_cities(self, offset: int = 0, limit: int = 10): ...

class RunRepository:
    async def get_run(self, id: str) -> Optional[RunDTO]: ...  # Duplicate!
    async def list_runs(self, offset: int = 0, limit: int = 10): ...  # Duplicate!
```

---

### KISS - Keep It Simple, Stupid

Favor simplicity over complexity.

**Good**:
```python
# Simple, clear intention
async def get_city(self, city_id: str) -> Optional[CityDTO]:
    return self._store.get(city_id)
```

**Bad**:
```python
# Over-engineered
async def get_city(self, city_id: str) -> Optional[CityDTO]:
    try:
        with self._lock:
            if city_id not in self._cache:
                result = self._store.get(city_id)
                if result:
                    self._cache[city_id] = result
                    self._metrics.inc('cache_miss')
                return result
            else:
                self._metrics.inc('cache_hit')
                return self._cache[city_id]
    except Exception as e:
        self._logger.error(f"Failed to get city {city_id}: {e}")
        raise
```

---

### Type Safety

Use Python type hints for clarity and IDE support.

**Good**:
```python
async def list_cities(
    self,
    offset: int = 0,
    limit: int = 10
) -> Tuple[List[CityDTO], int]:
    # Clear types for inputs and outputs
    pass
```

**Bad**:
```python
async def list_cities(self, offset=0, limit=10):
    # Unclear what types are expected
    pass
```

---

### Composition Over Inheritance

Favor object composition over class inheritance.

**Good**:
```python
class CityService:
    def __init__(self, repository: Repository[CityDTO]):
        self.repository = repository  # Composition
```

**Bad**:
```python
class CityService(Repository[CityDTO]):
    # Inheritance creates tight coupling
    pass
```

---

## Anti-Patterns to Avoid

### 1. God Objects

A class that does too much.

**Problem**:
```python
class Application:  # Violates Single Responsibility
    def handle_http_requests(self): ...
    def execute_business_logic(self): ...
    def save_to_database(self): ...
    def send_emails(self): ...
```

**Solution**:
```python
class HttpRouter: ...
class CityService: ...
class CityRepository: ...
class EmailService: ...
```

### 2. Tight Coupling

Classes that depend too much on each other.

**Problem**:
```python
class CityService:
    def __init__(self):
        self.repository = CityRepository(db_connection_string)  # Tightly coupled
```

**Solution**:
```python
class CityService:
    def __init__(self, repository: Repository[CityDTO]):  # Loosely coupled
        self.repository = repository
```

### 3. Magic Numbers/Strings

Unexplained hardcoded values.

**Problem**:
```python
limit = 10  # What is 10?
timeout = 5000  # Milliseconds? Seconds?
```

**Solution**:
```python
DEFAULT_PAGE_SIZE = 10
REQUEST_TIMEOUT_MS = 5000
```

### 4. Poor Error Handling

Silencing exceptions or unclear error reporting.

**Problem**:
```python
try:
    city = await repository.get(city_id)
except:
    pass  # What error? Silent failure!
```

**Solution**:
```python
try:
    city = await repository.get(city_id)
except KeyError:
    raise NotFoundError(f"City {city_id} not found")
except DatabaseError as e:
    raise ServerError(f"Database error: {e}")
```

---

## Checklist for Code Review

- [ ] Single responsibility per class?
- [ ] Minimal dependencies?
- [ ] Type hints present?
- [ ] Docstrings for public methods?
- [ ] No code duplication?
- [ ] Testable with mocks?
- [ ] Clear variable/function names?
- [ ] No magic numbers/strings?
- [ ] Proper error handling?
- [ ] Follows async/await patterns?

---

## References

- **SOLID Principles**: https://en.wikipedia.org/wiki/SOLID
- **Design Patterns**: Gang of Four (Gamma, Helm, Johnson, Vlissides)
- **Clean Code**: Robert C. Martin
- **Domain-Driven Design**: Eric Evans
