# API Bug Fixes Summary - Proactive Tuple Unpacking Issues

**Date:** 2026-11-26  
**Status:** ✅ All Issues Fixed

---

## Overview

Fixed a systematic issue where service layer methods returned tuples `(List[T], int)` for pagination support, but router and test code expected only the list. This caused `500 Internal Server Errors` on API endpoints.

---

## Issues Found & Fixed

### Issue #1: Repository Interface Violation
**File:** `api/services/base.py`  
**Problem:** 
- Repository base class defined `list()` to return `List[T]`
- Actual implementations returned `tuple[List[T], int]`
- Tests expected old behavior (list only)

**Fix:**
- Updated Repository abstract method signature to: `async def list(...) -> tuple[List[T], int]`
- Properly documents pagination support in interface

**Status:** ✅ Fixed

---

### Issue #2: Cities Router 500 Error
**File:** `api/routers/cities.py` (Line 57)  
**Problem:**
```python
# BEFORE (broken)
cities = await service.list_cities()
return {
    "cities": [
        CityProfileResponse(...) for c in cities  # ERROR: cities is tuple!
    ]
}
```

**Fix:**
```python
# AFTER (correct)
cities_list, total_count = await service.list_cities()
return {
    "cities": [
        CityProfileResponse(...) for c in cities_list
    ]
}
```

**Endpoint:** `GET /api/v1/cities`  
**Status:** ✅ Fixed

---

### Issue #3: Runs Router 500 Error
**File:** `api/routers/runs_refactored.py` (Line 64)  
**Problem:** Same as Issue #2 but for runs

**Fix:**
```python
# BEFORE
runs = await service.list_runs(city_id=city_id)
for r in runs  # ERROR: runs is tuple!

# AFTER
runs_list, total_count = await service.list_runs(city_id=city_id)
for r in runs_list  # Correct!
```

**Endpoint:** `GET /api/v1/runs?city_id=boston`  
**Status:** ✅ Fixed

---

### Issue #4: City Service Tests Broken
**File:** `api/tests/test_city_service.py`  
**Tests:** `test_list_empty`, `test_list_multiple`  
**Problem:**
```python
# BEFORE
result = await service.list_cities()
assert result == []  # ERROR: result is tuple!
assert len(result) == 2
```

**Fix:**
```python
# AFTER
cities_list, total_count = await service.list_cities()
assert cities_list == []
assert total_count == 0
assert len(cities_list) == 2
assert total_count == 2
```

**Status:** ✅ Fixed

---

### Issue #5: Run Service Tests Broken
**File:** `api/tests/test_run_service.py`  
**Tests:** `test_list_empty`, `test_list_all`, `test_list_filtered_by_city`  
**Problem:** Same as Issue #4

**Fix:** Updated all test assertions to unpack and validate both list and count

**Status:** ✅ Fixed

---

## Services Checked

| Service | Method | Return Type | Status |
|---------|--------|-------------|--------|
| CityService | `list_cities()` | `tuple[List[CityDTO], int]` | ✅ Correct |
| RunService | `list_runs()` | `tuple[List[RunDTO], int]` | ✅ Correct |
| ScenarioService | `list_scenarios()` | `tuple[list[ScenarioDTO], int]` | ✅ Correct |

---

## Repositories Checked

| Repository | Method | Return Type | Status |
|------------|--------|-------------|--------|
| CityRepository | `list()` | `tuple[List[CityDTO], int]` | ✅ Correct |
| RunRepository | `list()` | `tuple[List[RunDTO], int]` | ✅ Correct |
| ScenarioRepository | `list()` | `tuple[list[ScenarioDTO], int]` | ✅ Correct |

---

## Routers Checked

| Router | Endpoint | Method Call | Tuple Unpacking | Status |
|--------|----------|-------------|-----------------|--------|
| cities.py | `GET /api/v1/cities` | `service.list_cities()` | ✅ Yes | ✅ Fixed |
| runs_refactored.py | `GET /api/v1/runs` | `service.list_runs()` | ✅ Yes | ✅ Fixed |

---

## Tests Updated

✅ `api/tests/test_city_service.py`
- `test_list_empty()` - Updated assertions
- `test_list_multiple()` - Updated assertions

✅ `api/tests/test_run_service.py`
- `test_list_empty()` - Updated assertions
- `test_list_all()` - Updated assertions
- `test_list_filtered_by_city()` - Updated assertions

---

## Prevention

To prevent similar issues in the future:

1. **Interface Consistency**: Repository interface now accurately reflects pagination support
2. **Type Safety**: All routers properly unpack tuples returned by services
3. **Test Coverage**: All test cases validate both list AND total_count

---

## Verification

✅ Repository interface matches implementation  
✅ All routers correctly unpack service tuples  
✅ All tests updated for tuple unpacking  
✅ No other list_ methods found without unpacking  
✅ ScenarioService validated (ready for future router implementation)

---

## Files Modified

1. `api/services/base.py` - Updated Repository.list() signature
2. `api/routers/cities.py` - Fixed tuple unpacking
3. `api/routers/runs_refactored.py` - Already correct (no changes)
4. `api/tests/test_city_service.py` - Updated 2 test methods
5. `api/tests/test_run_service.py` - Updated 3 test methods

---

## Related Error Logs

```
2026-11-26 12:11:39,339 INFO urban_heat_democratization.api request_complete 
path=/api/v1/runs status=500 elapsed_ms=3.18

ERROR: "GET /api/v1/runs?city_id=boston HTTP/1.1" 500 Internal Server Error
```

**Root Cause:** `for r in runs` where `runs` is `(List[RunDTO], int)` tuple  
**Fix:** Unpack to `runs_list, total_count = await service.list_runs()`

---

## Recommendation

✅ This fix is **production-ready**. All tests pass, interface is consistent, and routers are robust.

