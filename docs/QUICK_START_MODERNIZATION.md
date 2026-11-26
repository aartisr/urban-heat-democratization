# Quick Start: Begin Modernization Today

This guide gets you started on the Nobel-caliber modernization in **30 minutes**.

---

## 🎬 Before You Start: Prerequisites Check (5 minutes)

```bash
# 1. Verify Python environment
python3 --version          # Should be 3.11+
pip list | grep mypy       # Should be installed
pip list | grep pytest     # Should be installed

# 2. Verify Node environment
node --version             # Should be 18+
npm list -g typescript     # Should be installed
npm list -g eslint         # Should be installed

# 3. Clone/navigate to repo
cd /Users/rraviku2/aarti/urban_heat_democratization
git status                 # Verify clean working directory
```

**If anything missing:** Run `./scripts/setup-dev.sh` (create if doesn't exist)

---

## 📚 Read These First (10 minutes)

In this order:

1. **MODERNIZATION_PLAN.md** (master plan)
   - Read Part 2 (Target Architecture) - 5 min
   - Understand 5 layers: Presentation → API → Services → Domain → Repositories

2. **ARCHITECTURE_DECISION_RECORDS.md** (design decisions)
   - Read ADR-001 (Layered Architecture) - 3 min
   - Understand why we're doing this

3. **IMPLEMENTATION_ROADMAP.md** (detailed execution)
   - Skim the 8-week roadmap - 2 min
   - Understand overall timeline

---

## 🏁 Today's Task: Setup & First Refactor (25 minutes)

### Step 1: Create Backend Directory Structure (3 minutes)

```bash
# Navigate to repo
cd /Users/rraviku2/aarti/urban_heat_democratization

# Create new directories
mkdir -p api/services
mkdir -p api/repositories
mkdir -p tests/unit/services
mkdir -p tests/unit/repositories

# Create __init__.py files
touch api/services/__init__.py
touch api/repositories/__init__.py
touch tests/unit/services/__init__.py
touch tests/unit/repositories/__init__.py
```

### Step 2: Create Base Service Class (5 minutes)

Create **`api/services/base.py`**:

```python
"""Base service class for all application services."""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic

T = TypeVar("T")

class ServiceError(Exception):
    """Base exception for service errors."""
    pass

class NotFoundError(ServiceError):
    """Raised when a requested resource is not found."""
    pass

class AbstractService(ABC):
    """Base class for all services.
    
    Services handle business logic and coordinate operations
    between repositories and domain models.
    """
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Verify service is healthy and ready."""
        pass
```

**Save this file now.**

### Step 3: Create Base Repository Class (5 minutes)

Create **`api/repositories/base.py`**:

```python
"""Generic repository pattern for data persistence."""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic, List, Optional

T = TypeVar("T")

class Repository(ABC, Generic[T]):
    """Generic repository for CRUD operations.
    
    This interface ensures all repositories implement
    the same contract, making them swappable.
    """
    
    @abstractmethod
    async def get(self, id: str) -> Optional[T]:
        """Get single item by ID."""
        pass
    
    @abstractmethod
    async def list(self) -> List[T]:
        """List all items."""
        pass
    
    @abstractmethod
    async def create(self, item: T) -> T:
        """Create new item."""
        pass
    
    @abstractmethod
    async def update(self, id: str, item: T) -> T:
        """Update existing item."""
        pass
    
    @abstractmethod
    async def delete(self, id: str) -> bool:
        """Delete item by ID."""
        pass
```

**Save this file now.**

### Step 4: Create First Service (10 minutes)

Create **`api/services/city_service.py`**:

```python
"""City service for city-related operations."""

from typing import List, Optional
from api.services.base import AbstractService, NotFoundError

# TODO: Import actual City model once available
# from core.models import City

class CityService(AbstractService):
    """Handles all city-related business logic.
    
    This service orchestrates city operations between the
    API layer and data persistence layer.
    
    Responsibilities:
    - Get/list/create cities
    - Validate city data
    - Handle city imports
    
    Single responsibility: All city operations.
    """
    
    def __init__(self, repository):
        """Initialize with injected repository.
        
        Args:
            repository: CityRepository instance for persistence
        """
        self.repository = repository
    
    async def health_check(self) -> bool:
        """Verify service is healthy."""
        try:
            # Try to list cities (doesn't require success)
            await self.repository.list()
            return True
        except Exception:
            return False
    
    async def get_city(self, city_id: str):
        """Get city by ID.
        
        Args:
            city_id: Unique city identifier
            
        Returns:
            City object
            
        Raises:
            NotFoundError: If city not found
        """
        city = await self.repository.get(city_id)
        if city is None:
            raise NotFoundError(f"City {city_id} not found")
        return city
    
    async def list_cities(self) -> List:
        """Get all cities.
        
        Returns:
            List of City objects
        """
        return await self.repository.list()
    
    async def import_city(self, config: dict):
        """Import a new city from configuration.
        
        Args:
            config: City configuration dictionary
            
        Returns:
            Created City object
            
        Raises:
            ValueError: If configuration invalid
        """
        if not config.get("name"):
            raise ValueError("City name required")
        
        # TODO: Create City model from config
        city = {}  # Placeholder
        return await self.repository.create(city)
```

**Save this file now.**

### Step 5: Understand What You Just Built (2 minutes)

You've created the foundation for clean architecture:

```
Request → Router → Service → Repository → Database
           ↑                                  ↓
           └──────────── Dependency Injection ────┘
```

**Key points:**
- Service (`CityService`) only knows about repository interface
- Repository (`Repository[T]`) can be mocked for testing
- No FastAPI code in service (framework-agnostic)
- Fully type-hinted and documented

---

## ✅ Verification (3 minutes)

Run these commands to verify setup:

```bash
# 1. Check files exist
ls -la api/services/base.py      # Should exist
ls -la api/services/city_service.py
ls -la api/repositories/base.py

# 2. Check Python syntax
python3 -m py_compile api/services/base.py
python3 -m py_compile api/services/city_service.py
python3 -m py_compile api/repositories/base.py

# 3. Check type hints (if mypy installed)
mypy api/services/base.py --strict 2>&1 | head -20

echo "✅ Setup complete!"
```

---

## 📋 Next Steps (Do This Next Session)

1. **Week 1, Day 2-3: Repository Layer**
   - Follow instructions in IMPLEMENTATION_ROADMAP.md, Week 1-2
   - Implement CityRepository, RunRepository, ArtifactRepository
   - Each implements the Repository[T] interface

2. **Week 1, Day 4-5: Remaining Services**
   - Implement RunService, ScenarioService
   - Follow same pattern as CityService

3. **Week 1, Day 6-7: DI Container & Refactor Routes**
   - Create api/di_container.py
   - Refactor api/routers/ to thin delegation layer
   - Delete old api/main.py logic, keep only router registration

---

## 🎓 Learning Resources

If unfamiliar with these patterns:

**Dependency Injection:**
- Concept: Constructor argument instead of `import Service()`
- Benefit: Easy to mock for testing
- Example: `service = CityService(mock_repository)`

**Repository Pattern:**
- Concept: Abstraction over data persistence
- Benefit: Swap databases (SQLite → PostgreSQL) without changing services
- Example: `service.repository.get(id)` works with any repository

**Service Layer:**
- Concept: Coordinator between HTTP and database
- Benefit: Reusable across different frontends (REST, GraphQL, CLI)
- Example: Same service used by web API and mobile app

**Clean Architecture:**
- Concept: Concentric layers with dependencies pointing inward
- Benefit: Independent testing, easy to understand, easy to modify
- Read: "Clean Architecture" by Robert C. Martin

---

## 🆘 Troubleshooting

**"Module not found" error:**
```bash
# Make sure you're in the right directory
cd /Users/rraviku2/aarti/urban_heat_democratization
python3 -c "import api.services.base; print('OK')"
```

**"Type error in mypy":**
- This is good! mypy found issues
- Fix by adding proper type hints
- Reference: Python typing docs, PEP 484

**"Service doesn't work with existing router":**
- Don't integrate yet, finish Week 1 first
- Then integrate in Week 1, Day 6-7
- Follow IMPLEMENTATION_ROADMAP.md exactly

---

## 🏆 Success Checkpoint

After completing today's task, you should have:

- ✅ 3 new Python files created (base.py, city_service.py, base.py)
- ✅ All files type-hinted and documented
- ✅ No breaking changes to existing code
- ✅ Foundation ready for Week 1 implementation

**Celebration:** You've started the journey to Nobel-caliber architecture! 🎉

---

## 📞 Questions?

1. **"Why do this refactoring?"**
   - Current api/main.py is 3,316 LOC (god module)
   - After refactoring: <150 LOC (pure orchestration)
   - Each concern isolated and testable independently

2. **"Will this break existing code?"**
   - Not if done correctly (backward compatible)
   - API contracts unchanged
   - Only internal architecture changes

3. **"How long will this take?"**
   - 8 weeks for complete modernization
   - Benefits: Faster development, fewer bugs, easier to onboard

4. **"Can we do this gradually?"**
   - Yes, follow the 8-week plan
   - Each week adds more value
   - After Week 2: Backend fully refactored
   - After Week 5: Frontend fully refactored

---

**Ready to start?** Begin with Week 1, Day 1 from IMPLEMENTATION_ROADMAP.md.

Good luck! This is going to be amazing. 🚀
