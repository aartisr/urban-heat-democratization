# Nobel Prize-Caliber Refactoring Plan

**Objective**: Transform urban_heat_democratization into world-class, Nobel Prize-winning software through systematic refactoring.

**Status**: In Progress  
**Last Updated**: November 26, 2024

---

## 🎯 Quality Target

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Modularity Score** | A+ | B+ | 📋 |
| **Design Pattern Compliance** | 100% | 60% | 📋 |
| **Code Reuse** | 95%+ | 75% | 📋 |
| **Test Coverage** | 100% | 71% | 📋 |
| **Type Safety** | mypy --strict | mypy | ⚠️ |
| **Performance** | <50ms avg | <100ms avg | 📋 |
| **Maintainability Index** | 85+ | 72 | 📋 |

---

## 📋 Audit Findings Summary

### Critical Issues (Must Fix)
1. **Parallel implementations** - Runs have dual implementations (runs.py + runs_refactored.py)
2. **Inconsistent error contracts** - Repositories document NotFoundError but raise KeyError
3. **Broad exception catching** - Leaks internal details to clients
4. **In-memory persistence** - Not durable or concurrency-safe, claims thread-safety falsely

### High Priority (Should Fix)
5. **Code duplication** - CRUD and DTO mapping repeated across repositories
6. **Incomplete dependency injection** - In-memory stores with no production adapter strategy
7. **Inefficient queries** - Full list loads then in-memory filtering
8. **Layer violation** - Repositories import DTOs from services (wrong direction)

### Medium Priority (Nice to Have)
9. **Missing request validation** - Untyped dicts instead of Pydantic schemas
10. **No plugin/strategy contract** - Hard to extend without central changes
11. **Domain logic disconnected** - core/* operations not wired into services
12. **Unclear production path** - No visible strategy for durable adapters

---

## 🔧 Refactoring Phases

### Phase A: Foundation (High Impact, Low Risk)
**Goal**: Fix dependency direction and create stable contracts

**Files to Create**:
1. ✅ `api/domain/models.py` - Shared domain types (run-independent)
2. ✅ `api/domain/repository.py` - Stable repository interfaces
3. ✅ `api/domain/errors.py` - Unified exception contracts
4. ✅ `api/application/ports.py` - Application-level ports/interfaces

**Files to Refactor**:
- Move DTOs to domain/models.py
- Fix repository imports (import from domain, not services)
- Standardize error handling across all repositories
- Document all contracts

**Risk**: Low (additive changes, no behavior modification)  
**Effort**: 4-6 hours  
**Value**: Enables all future phases

---

### Phase B: Unify Run Implementations (Medium Impact, Medium Risk)
**Goal**: Eliminate parallel implementations, single path for all runs

**Files to Consolidate**:
- `api/routers/runs.py` (old implementation)
- `api/routers/runs_refactored.py` (new service-based)
- `api/services/run.py` (business logic)

**Result**: Single unified router → service → repository path

**Specific Changes**:
1. Move run queue/execution coordination into RunService
2. Move access control check into service layer
3. Consolidate test coverage
4. Keep HTTP concerns in router only

**Risk**: Medium (consolidating existing functionality)  
**Effort**: 6-8 hours  
**Value**: Eliminates DRY violation, easier to maintain

---

### Phase C: Persistent Adapters (High Impact, High Risk)
**Goal**: Enable swappable durable persistence

**New Files**:
1. `api/adapters/repositories/sqlite.py` - SQLite implementation
2. `api/adapters/repositories/postgres.py` - PostgreSQL implementation
3. `api/adapters/config.py` - Adapter selection via environment

**Changes**:
1. Implement Repository interface for SQLite
2. Add query methods to repository for server-side filtering
3. Test same service against in-memory and SQLite
4. Update DI container to select adapter

**Risk**: High (adds infrastructure complexity)  
**Effort**: 12-16 hours  
**Value**: Production readiness, true scalability

---

### Phase D: Request/Response Validation (Medium Impact, Low Risk)
**Goal**: Type-safe API contracts

**Files to Create**:
1. `api/schemas/run.py` - Run request/response schemas
2. `api/schemas/city.py` - City request/response schemas
3. `api/schemas/scenario.py` - Scenario request/response schemas

**Changes**:
1. Create Pydantic models for all HTTP input/output
2. Auto-convert between HTTP schemas and service DTOs
3. Centralize validation at HTTP boundary
4. Remove hand-written DTO conversions

**Risk**: Low (additive, no behavior change)  
**Effort**: 4-6 hours  
**Value**: Discoverable API, better error messages

---

### Phase E: Strategy/Plugin Contracts (Medium Impact, Medium Risk)
**Goal**: Support analysis extensions without central changes

**New Files**:
1. `api/domain/strategies.py` - Analysis strategy interfaces
2. `api/application/strategy_registry.py` - Strategy registration
3. `api/adapters/strategies/` - Built-in implementations

**Result**: Domain-agnostic extension points for new algorithms

**Risk**: Medium (new abstraction layer)  
**Effort**: 8-10 hours  
**Value**: Extensible, Open/Closed principle

---

### Phase F: Domain Logic Integration (High Impact, Medium Risk)
**Goal**: Wire core/* algorithms into service layer

**Changes**:
1. Create analysis service coordinating core/* operations
2. Expose algorithm selection through strategy registry
3. Compose core operations in application layer
4. Test analysis end-to-end

**Risk**: Medium (connecting existing pieces)  
**Effort**: 10-12 hours  
**Value**: Cohesive domain model, discoverable features

---

### Phase G: Performance Optimization (Medium Impact, Medium Risk)
**Goal**: Improve latency, support scale

**Changes**:
1. Add query methods to repositories (pagination, filtering)
2. Implement result caching where appropriate
3. Add database indexes for common queries
4. Benchmark common operations

**Risk**: Medium (affects repository contracts)  
**Effort**: 8-10 hours  
**Value**: <50ms latency, 1000+ req/s capability

---

### Phase H: Error Handling Hardening (Low Impact, Low Risk)
**Goal**: Consistent, safe error contracts

**Changes**:
1. Standardize error handling across all layers
2. Add error middleware for unexpected exceptions
3. Add structured logging
4. Document error codes/contracts

**Risk**: Low (defensive, no behavior change)  
**Effort**: 4-6 hours  
**Value**: Reliability, debuggability

---

## 🗂️ Recommended Execution Order

**Week 1 (Foundation)**:
- Phase A: Create domain layer foundation (4-6h)
- Phase B: Unify run implementations (6-8h)
- **Checkpoint**: All tests pass, single implementation path

**Week 2 (Contracts)**:
- Phase D: Request/response validation (4-6h)
- Phase H: Error handling hardening (4-6h)
- **Checkpoint**: Type-safe API, consistent errors

**Week 3 (Persistence)**:
- Phase C: Persistent adapters (12-16h)
- **Checkpoint**: SQLite works, same tests pass for in-memory and durable

**Week 4 (Extension)**:
- Phase E: Strategy/plugin contracts (8-10h)
- Phase F: Domain logic integration (10-12h)
- **Checkpoint**: New strategies can be added without core changes

**Week 5 (Performance & Polish)**:
- Phase G: Performance optimization (8-10h)
- **Checkpoint**: <50ms latency verified

---

## 🎓 Design Principles Applied

Each phase enforces these principles:

1. **Single Responsibility** - Each component has one reason to change
2. **Open/Closed** - Open for extension, closed for modification
3. **Liskov Substitution** - Implementations are truly interchangeable
4. **Interface Segregation** - Clients depend only on needed interfaces
5. **Dependency Inversion** - High-level code depends on abstractions
6. **DRY** - No duplicated logic or patterns
7. **KISS** - Simplest solution that works
8. **YAGNI** - Don't add features not yet needed

---

## 📊 Success Criteria

✅ **Code Quality**:
- 100% type-safe (mypy --strict)
- 100% test coverage
- 0 duplicated CRUD/DTO patterns
- Clear dependency flow (inward)

✅ **Architecture**:
- Single run implementation path
- Swappable persistent adapters
- Extensible strategy/plugin system
- Domain logic composable in services

✅ **Performance**:
- <50ms average latency
- 1000+ req/s capable
- Pagination support
- Server-side filtering

✅ **Maintainability**:
- Clear contracts at all boundaries
- Minimal coupling between layers
- Easy to understand data flow
- New features addable without core changes

---

## 📝 Change Log

### Session 1 (Nov 26, 2024)
- [x] Conduct comprehensive architecture audit
- [x] Create detailed refactoring plan
- [ ] Phase A: Foundation (domain layer)
- [ ] Phase B: Unify run implementations

---

## 🔗 Related Documents

- [Architecture Decision Records](../docs/ARCHITECTURE_DECISION_RECORDS.md)
- [Production Blueprint](../docs/PRODUCTION_BLUEPRINT.md)
- [00 Start Here Index](../docs/00_START_HERE_INDEX.md)
