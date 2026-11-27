> **Historical snapshot.** This record may contain obsolete links or unverified completion, quality, or deployment claims. Use the [documentation guide](../README.md) and [capability status](../IMPLEMENTATION_STATUS.md) for current information.

# Branch Comparison Analysis: main vs main-old

**Comparison Date**: 2026-11-26  
**main-old Commit**: 54efd86 (Improve discoverability and author attribution)  
**main Commit**: 0d16419 (docs: Add comprehensive status report for all phases complete)  
**Commits Difference**: main is 15 commits ahead

---

## 🎯 EXECUTIVE SUMMARY

The `main` branch includes **significant new code** (services, repositories, domain layer) but **does NOT integrate it into the main application**. The original endpoints and core functionality remain untouched and functional.

**Key Finding**: ⚠️ The refactoring created new modular components but left them **disconnected from the main application**.

---

## 📊 QUANTITATIVE COMPARISON

### File Structure

| Metric | main-old | main | Change |
|--------|----------|------|--------|
| **Total API files** | 7 | 30 | +23 files |
| **Total documentation** | 55 | ~90 | +35 docs |
| **Core modules** | 18 | 18 | No change |
| **Main.py lines** | 3,316 | 3,316 | **IDENTICAL** |
| **Router implementations** | 3 | 5 | +2 new routers |
| **Services** | 0 | 7 | +7 new services |
| **Repositories** | 0 | 4 | +4 new repositories |

### Documentation Changes

**Files REMOVED** (43 total):
- ADDRESS_LEVEL_SPECTRAL_URBANISM_ADVICE.md
- ADVANCED_THERMAL_MATH_AND_MAP_LAYERS_IMPLEMENTATION_PLAN.md
- ANALYTICS_SETUP.md
- ARTIFACT_STRATEGY.md
- BOSTON_CLASSROOM_GUIDE.md
- BOSTON_PILOT_READINESS.md
- BOSTON_STUDY_GUIDE.md
- CITY_EVIDENCE_EXPERIENCE_IMPLEMENTATION_PLAN.md
- CITY_EVIDENCE_EXPERIENCE_PILOT_RELEASE_CHECKLIST.md
- CITY_EVIDENCE_EXPERIENCE_RESEARCH_PROTOCOL.md
- CITY_EVIDENCE_EXPERIENCE_STATUS.md
- CITY_ONBOARDING_RECIPES.md
- CITY_PAGE_PATTERN_SYNTHESIS.md
- DEMO_FEATURE_GUIDE.md
- DESIGN_ACCESSIBILITY_SYSTEM.md
- FIVE_PERSONA_FLOW_AUDIT_AND_REVAMP.md
- FUTURE_COMPUTATIONAL_URBAN_THERMAL_RESEARCH.md
- IMPACT_EVIDENCE_PROTOCOL.md
- IMPLEMENTATION_STATUS.md
- INTERACTIVE_MITIGATION_LAB_CALIBRATION_GATE.md
- INTERACTIVE_MITIGATION_LAB_FACILITATION_GUIDE.md
- INTERACTIVE_MITIGATION_LAB_METHOD.md
- INTERACTIVE_MITIGATION_LAB_PLAN.md
- INTERVENTION_UNIT_COSTS.md
- LIVE_PROVIDER_BRIDGES.md
- LIVE_THERMAL_SETUP.md
- MAP_STACK_EVALUATION.md
- MATH_INNOVATION_ACCOUNTABILITY.md
- MOBILE_MAP_EXPERIENCE_RESEARCH.md
- PHASE_4_PRIVATE_REPORT_READINESS.md
- PHASE_5_CONTRIBUTION_NETWORK_READINESS.md
- QUICK_REFERENCE.md
- RESPONSIVE_USABILITY_AUDIT.md
- SCENARIO_MAP_COMPARISON_IMPLEMENTATION_PLAN.md
- SCENARIO_MAP_COMPARISON_STATUS.md
- SCENARIO_VISUAL_BENCHMARK_MATRIX.md
- SCREENSHOT_GALLERY.md
- SCREEN_TOUR.md
- TOP_25_CITY_ANALYSIS_REFERENCES.md
- Urban_Thermal_Math_Deep_Dive.md
- VERCEL_DEPLOYMENT.md
- urban_thermal_math_the_complete_guide.md
- verified_cost_sources.md

**Files ADDED** (45+ new):
- .github/CODEBASE_REFACTORING_PLAN.md
- .github/PHASE_A_COMPLETION_SUMMARY.md
- MODERNIZATION_PLAN.md
- MODERNIZATION_START_HERE.md
- docs/00_START_HERE_INDEX.md
- docs/ALL_PHASES_COMPLETE_STATUS.md
- docs/ARCHITECTURE_DECISION_RECORDS.md
- docs/COMPREHENSIVE_STATUS_REPORT_FINAL.md
- docs/CONSOLIDATION_ANALYSIS_SUMMARY.txt
- docs/DOCUMENTATION_INDEX.md
- docs/EXECUTIVE_SUMMARY_ALL_PHASES.md
- Plus 35+ other modernization docs

---

## 🔴 CRITICAL ISSUES - WHAT IS BROKEN

### Issue #1: **New Services Are NOT Integrated** 🚨

**Severity**: CRITICAL  
**Status**: UNRESOLVED

The following new services exist but are **completely disconnected** from the main application:

```
NEW SERVICES (exist but not used):
├── api/services/base.py
├── api/services/city.py           ← NOT IMPORTED IN main.py
├── api/services/run.py            ← NOT IMPORTED IN main.py
├── api/services/scenario.py       ← NOT IMPORTED IN main.py
├── api/services/experience.py     ← NOT IMPORTED IN main.py
└── api/services/mitigation.py     ← NOT IMPORTED IN main.py
```

**Evidence**:
- main.py has **0 imports** from `api.services`
- main.py has **0 imports** from `api.repositories`
- main.py has **0 imports** from `api.di_container`
- New routers (cities.py, runs_refactored.py) are **NOT registered** with the app

**Impact**:
- All 71 tests that supposedly pass are **untested** because they test code not used by the application
- The new CityService, RunService, etc. are **dead code**
- Endpoints still use the old inline logic

---

### Issue #2: **New Routers Are NOT Registered** 🚨

**Severity**: CRITICAL  
**Status**: UNRESOLVED

Two new routers exist but are never registered:

```python
# THESE EXIST BUT ARE NOT USED:
api/routers/cities.py          → NOT app.include_router()'d
api/routers/runs_refactored.py → NOT app.include_router()'d
```

**Evidence**:
```python
# main.py ONLY registers:
app.include_router(create_system_router(...))  # line 2759
app.include_router(create_runs_router(...))    # line 3270

# It DOES NOT register:
# app.include_router(create_cities_router(...))
# app.include_router(create_runs_refactored_router(...))
```

**Impact**:
- GET /api/v1/cities still uses the old monolithic endpoint at line 2769
- Run endpoints still use the old `create_runs_router` from api/routers/runs.py
- The refactored clean architecture endpoints are unreachable

---

### Issue #3: **Dependency Injection Container Not Used** 🚨

**Severity**: CRITICAL  
**Status**: UNRESOLVED

The new DI container exists but is completely unused:

```python
# CREATED BUT NOT USED:
api/di_container.py

# main.py imports:
from api.di_container import ...  ← NOT PRESENT (0 matches)
```

**Evidence**:
- main.py has only 3 matches for "di_container", "DI", or "dependency"
- All are in string comments/documentation, not actual code
- The old inline initialization pattern is still used throughout main.py

**Impact**:
- Cannot swap implementations (in-memory ↔ SQLite ↔ PostgreSQL)
- Testing individual services requires monkeypatching
- Tight coupling still exists between layers

---

### Issue #4: **Duplicate Run Router Implementations** 🚨

**Severity**: HIGH  
**Status**: UNRESOLVED

Two parallel run router implementations exist:

```
api/routers/runs.py               ← OLD (used in main.py)
api/routers/runs_refactored.py    ← NEW (NOT used)
```

**Evidence**:
- main.py includes only `create_runs_router` (from runs.py)
- runs_refactored.py has clean service-based implementation but is dead code
- Both files coexist, but only the old one is active

**Impact**:
- Maintainers might modify the wrong file
- Tests might test the wrong implementation
- Confusion about which is authoritative

---

### Issue #5: **Domain Layer Not Imported** 🚨

**Severity**: CRITICAL  
**Status**: UNRESOLVED

New domain layer exists but is not imported anywhere:

```
api/domain/__init__.py    ← CREATED but NOT USED
api/domain/errors.py      ← 8 error types but NOT USED
api/domain/models.py      ← Shared DTOs but NOT USED
api/domain/repository.py  ← Generic Repository[T] but NOT USED
```

**Evidence**:
- main.py has **0 imports** from `api.domain`
- Old code still raises bare `KeyError`
- No unified error handling

**Impact**:
- Error handling is inconsistent
- No common type safety across layers
- Repository interface is not enforced

---

### Issue #6: **Tests Might Be False Positives** ⚠️

**Severity**: HIGH  
**Status**: QUESTIONABLE

The 71 tests that "pass" test code that:
1. Doesn't exist in api/main.py
2. Isn't integrated into the app
3. Won't be hit by actual requests

**Evidence**:
- Tests import from api.services, api.repositories, api.domain
- These are not used by main.py
- The actual endpoints use different code paths

**Impact**:
- Code coverage is misleading
- Tests don't validate the actual running application
- Regressions in the real code won't be caught by these tests

---

## 🟡 WHAT STILL WORKS (Backward Compatible)

### Core Endpoints - All Functional ✅

The original API endpoints are **100% intact and functional**:

```
✅ GET  /api/v1/cities
✅ GET  /api/v1/cities/{city_id}
✅ GET  /api/v1/city-experiences
✅ GET  /api/v1/bundled-packages
✅ GET  /api/v1/bundled-packages/{package_id}
✅ POST /api/v1/bundled-packages/{package_id}/validate
✅ GET  /api/v1/address-advice/cities/{city_id}
✅ GET  /api/v1/mitigation-lab/baselines/boston-study
✅ GET  /api/v1/mitigation-lab/graph-baseline
✅ POST /api/v1/mitigation-lab/graph-delta
✅ GET  /api/v1/mitigation-lab/calibration-gate
✅ GET  /api/v1/runs
✅ GET  /api/v1/runs/{run_id}
✅ POST /api/v1/runs
✅ Plus 20+ other system endpoints
```

**Why**: main.py lines 1-3316 are **completely unchanged**  
**Risk Level**: ZERO for existing functionality

---

## 🟠 MISSING FEATURES vs main-old

### Features in main-old but NOT CHANGED in main:
- None - all original features intact

### NEW FEATURES that DON'T WORK:
1. ❌ CityService API endpoints
2. ❌ Generic Repository[T] pattern
3. ❌ Unified error handling contracts
4. ❌ RunService with enhanced business logic
5. ❌ ScenarioService with impact calculations
6. ❌ ExperienceService for user analytics
7. ❌ MitigationService with ROI ranking
8. ❌ Dependency injection for testability
9. ❌ Domain layer type safety
10. ❌ Plugin-ready architecture

**All of these are CREATED but NEVER INTEGRATED**

---

## 📋 FILES ADDED IN main (Not Integrated)

### Domain Layer (4 files)
```
api/domain/__init__.py          → NOT IMPORTED
api/domain/errors.py            → NOT IMPORTED (8 error types)
api/domain/models.py            → NOT IMPORTED (shared DTOs)
api/domain/repository.py        → NOT IMPORTED (Repository[T] pattern)
```

### Services (7 files)
```
api/services/__init__.py        → NOT IMPORTED
api/services/base.py            → NOT IMPORTED
api/services/city.py            → NOT IMPORTED
api/services/run.py             → NOT IMPORTED
api/services/scenario.py        → NOT IMPORTED
api/services/experience.py      → NOT IMPORTED
api/services/mitigation.py      → NOT IMPORTED
```

### Repositories (4 files)
```
api/repositories/__init__.py    → NOT IMPORTED
api/repositories/city.py        → NOT IMPORTED
api/repositories/run.py         → NOT IMPORTED
api/repositories/scenario.py    → NOT IMPORTED
```

### Additional Infrastructure
```
api/di_container.py             → NOT IMPORTED (Dependency injection)
api/routers/cities.py           → NOT REGISTERED
api/routers/runs_refactored.py  → NOT REGISTERED
api/tests/__init__.py           → NEW TEST FILES
```

### Tests (New but test unintegrated code)
```
api/tests/test_city_repository.py
api/tests/test_city_service.py
api/tests/test_run_repository.py
api/tests/test_run_service.py
Plus others in /tests
```

---

## 🔧 ROOT CAUSE ANALYSIS

### Why Main Isn't Broken
- **main.py is completely unchanged** (3,316 lines identical)
- **All original endpoints still work**
- **No dependencies deleted**
- **Core modules untouched**

### Why New Features Don't Work
1. **Incomplete integration**: Services created but not wired into main.py
2. **New routers created but not registered**: app.include_router() calls missing
3. **DI container created but unused**: main.py still uses inline initialization
4. **Parallel implementations**: runs.py vs runs_refactored.py (old one still used)
5. **Copy-paste architecture**: New services exist in isolation

### Why Tests Might Be Misleading
1. Tests import from new modules that aren't used by main.py
2. Code paths being tested are different from code paths actually executed
3. No integration tests verify new services work with actual endpoints
4. 71 "passing" tests = 0 integration with the main application

---

## 🎯 WHAT IS LOST COMPARED TO main-old

**Practically Nothing** in terms of functionality:
- ✅ All 40+ original docs removed were non-critical (guides, plans, references)
- ✅ All 40+ original endpoints still work
- ✅ All core modules still function
- ✅ No breaking changes to public API

**However, Opportunity is Lost**:
- ❌ The refactored services are created but not hooked up
- ❌ The domain layer is created but not enforced
- ❌ The DI container is created but not used
- ❌ 71 tests exist but test disconnected code

---

## 🚨 WHAT IS BROKEN IN main

| Issue | Severity | Status | Impact |
|-------|----------|--------|--------|
| Services not integrated | CRITICAL | 🔴 Broken | Dead code |
| New routers not registered | CRITICAL | 🔴 Broken | Unreachable endpoints |
| DI container unused | CRITICAL | 🔴 Broken | No testability improvement |
| Duplicate routers | HIGH | 🟠 Risky | Maintenance confusion |
| Domain layer unused | CRITICAL | 🔴 Broken | No type safety gain |
| Tests test unused code | HIGH | 🟠 Risky | False confidence |

---

## 📝 REMEDIATION STRATEGY

### To Fix main (3-6 hours):

1. **Integrate Services** (1 hour)
   - Import CityService, RunService, ScenarioService in main.py
   - Replace inline logic with service calls

2. **Register New Routers** (1 hour)
   - Add `app.include_router(create_cities_router(service))`
   - Add `app.include_router(create_runs_refactored_router(service))`
   - Remove/deprecate old inline endpoints

3. **Activate DI Container** (1 hour)
   - Import from di_container.py
   - Use DI container to instantiate services
   - Wire dependencies properly

4. **Consolidate Routers** (1 hour)
   - Delete duplicate runs.py implementation
   - Keep only runs_refactored.py
   - Update integration tests

5. **Verify Integration** (1 hour)
   - Run actual 71 tests against running app
   - Verify all endpoints work
   - Check error handling

6. **Update Documentation** (1 hour)
   - Update README to reflect new architecture
   - Add integration guide
   - Remove outdated references

---

## 🎓 LESSONS LEARNED

1. **Code without Integration is Dead Code**
   - New modules created: ✅
   - New modules used: ❌
   - Result: 23 new files adding 0 value

2. **Tests Don't Replace Integration**
   - 71 tests passing: ✅
   - 71 tests actually running in production: ❌
   - Result: False confidence

3. **Main Entry Point is Critical**
   - If main.py doesn't import it: it doesn't exist
   - If main.py doesn't wire it: it doesn't work
   - Result: 7 new services = 0 endpoints

4. **Architecture Without Connection is Decoration**
   - Clean architecture: ✅
   - Clean architecture integrated: ❌
   - Result: Technical debt without benefit

---

## 📊 FINAL VERDICT

### For users of the API:
✅ **ZERO REGRESSIONS** - Everything works exactly as before

### For developers:
⚠️ **RISKY STATE** - New code exists but is unintegrated
- Can't be tested meaningfully
- Can't be used productively
- Doubles codebase without doubling functionality

### For next steps:
🔧 **MUST INTEGRATE** before merging to production
- Either complete the integration (fix the issues)
- Or revert to main-old (clean, working state)
- Current state is worse than either alternative

---

**Status**: 🔴 **INCOMPLETE MODERNIZATION**
**Risk Level**: 🟠 **MEDIUM** (Works but broken architecture)
**Recommendation**: 🔧 **FIX INTEGRATION** before deployment

The refactoring created excellent infrastructure but left it disconnected. Integration is required for the modernization to have any value.
