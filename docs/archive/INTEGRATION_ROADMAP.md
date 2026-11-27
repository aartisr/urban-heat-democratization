> **Historical snapshot.** This document records earlier work and unverified status claims. Use the [documentation guide](../README.md) and [capability status](../IMPLEMENTATION_STATUS.md) for current information.

# Integration Completion Roadmap

**Current Status**: Phase 1 Complete ✅  
**Remaining Phases**: 5 (Phases 2-6)  
**Estimated Time**: 3-6 hours  
**Start Date**: 2026-11-26  
**Branch**: main (ahead of main-old)  

---

## Phase 2: Integration Testing (Estimated: 1 hour)

**Objective**: Verify that services are properly instantiated and routers are correctly wired.

### Tasks

- [ ] **2.1 Verify Service Instances**
  - [ ] Check _CITY_SERVICE is not None
  - [ ] Check _RUN_SERVICE is not None
  - [ ] Verify services have repository access
  - [ ] Confirm DI container is working
  - File: `api/main.py` lines 2665-2668

- [ ] **2.2 Verify Router Registration**
  - [ ] Check cities_router is registered with app
  - [ ] Check runs_refactored_router is registered with app
  - [ ] Verify routers have service injection
  - [ ] Confirm no duplicate route definitions
  - File: `api/main.py` lines 2776-2778

- [ ] **2.3 Integration Test Cases**
  - [ ] Import api.main without errors
  - [ ] Verify app.routes contains new routers
  - [ ] Check for route conflicts
  - [ ] Verify service methods are callable

- [ ] **2.4 Data Flow Verification**
  - [ ] Test: Request → Router → Service → Repository → Store
  - [ ] Verify data store updates propagate correctly
  - [ ] Check in-memory repository functionality
  - [ ] Verify no data isolation issues

**Success Criteria**:
- ✅ All services instantiate without error
- ✅ All routers register without error
- ✅ No route conflicts detected
- ✅ Data flows correctly through layers

**Commands to Run**:
```bash
pytest tests/test_city_strategies.py -v
pytest tests/test_run_service_phase3.py -v
pytest tests/test_scenario_service_phase3.py -v
```

---

## Phase 3: Endpoint Accessibility (Estimated: 1 hour)

**Objective**: Verify that all new endpoints are accessible and return correct responses.

### Tasks

- [ ] **3.1 Cities Endpoints**
  - [ ] GET /api/v1/cities → Returns city list
  - [ ] GET /api/v1/cities/{city_id} → Returns city detail
  - [ ] Verify response schema matches CityProfileResponse
  - [ ] Verify data integrity in responses
  - File: `api/routers/cities.py`

- [ ] **3.2 Runs Endpoints**
  - [ ] GET /api/v1/runs → Returns run list
  - [ ] GET /api/v1/runs?city_id=X → Filters by city
  - [ ] GET /api/v1/runs/{run_id} → Returns run detail
  - [ ] Verify response schema matches RunResponse
  - [ ] Verify data integrity in responses
  - File: `api/routers/runs_refactored.py`

- [ ] **3.3 Backward Compatibility**
  - [ ] Existing /api/v1/cities still works
  - [ ] Existing /api/v1/runs still works
  - [ ] Old endpoints unchanged
  - [ ] No conflicts between old and new routers
  - Files: `api/routers/runs.py` (old, should still work)

- [ ] **3.4 Error Handling**
  - [ ] Test 404 responses for non-existent resources
  - [ ] Test 400 responses for invalid input
  - [ ] Test 500 responses for server errors
  - [ ] Verify error messages are informative

- [ ] **3.5 HTTP Status Codes**
  - [ ] Success: 200 OK
  - [ ] Not Found: 404
  - [ ] Bad Request: 400
  - [ ] Server Error: 500

**Success Criteria**:
- ✅ All cities endpoints respond
- ✅ All runs endpoints respond
- ✅ Responses have correct schema
- ✅ Responses contain correct data
- ✅ Backward compatibility maintained
- ✅ Error handling works correctly

**Testing Method**: Manual HTTP requests or Postman/curl
```bash
# Test cities endpoint
curl http://localhost:8000/api/v1/cities

# Test runs endpoint
curl http://localhost:8000/api/v1/runs

# Test filtering
curl "http://localhost:8000/api/v1/runs?city_id=boston"
```

---

## Phase 4: Run Full Test Suite (Estimated: 1 hour)

**Objective**: Execute all tests to verify no regressions and all systems work correctly.

### Tasks

- [ ] **4.1 Setup Test Environment**
  - [ ] Install test dependencies
  - [ ] Configure pytest
  - [ ] Verify test discovery
  - File: `pyproject.toml`, `requirements.txt`

- [ ] **4.2 Run Unit Tests**
  - [ ] pytest tests/ -v
  - [ ] All tests should pass
  - [ ] Check for new failures
  - [ ] Verify no skipped tests (unless intentional)

- [ ] **4.3 Test Coverage Analysis**
  - [ ] Generate coverage report
  - [ ] Check integration layer coverage
  - [ ] Verify service layer tested
  - [ ] Identify any untested code paths

- [ ] **4.4 Performance Tests**
  - [ ] Measure test execution time
  - [ ] Check for performance regressions
  - [ ] Verify startup time
  - [ ] Check memory usage

- [ ] **4.5 Test Verification**
  - [ ] All 71 tests passing
  - [ ] No new failures introduced
  - [ ] No performance degradation
  - [ ] Coverage maintained or improved

**Success Criteria**:
- ✅ 71 tests passing
- ✅ 0 test failures
- ✅ 0 regressions
- ✅ Performance maintained
- ✅ Coverage >= previous level

**Commands to Run**:
```bash
# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=api --cov=core

# Run specific test file
pytest tests/test_sanity.py -v
```

---

## Phase 5: Performance Verification (Estimated: 30 minutes)

**Objective**: Verify that the new services don't negatively impact performance.

### Tasks

- [ ] **5.1 Startup Performance**
  - [ ] Measure app startup time
  - [ ] Compare with baseline (main-old)
  - [ ] Verify no additional delay from service init
  - [ ] Check for startup errors
  - File: `api/main.py` lines 2665-2668

- [ ] **5.2 Memory Usage**
  - [ ] Check memory footprint
  - [ ] Verify no memory leaks
  - [ ] Monitor during service initialization
  - [ ] Compare with baseline
  - Measurement: Track heap size

- [ ] **5.3 Request Performance**
  - [ ] Measure endpoint response time
  - [ ] Cities endpoint: < 100ms
  - [ ] Runs endpoint: < 100ms
  - [ ] Compare with existing endpoints
  - Tool: Use curl with timing or Postman

- [ ] **5.4 Concurrent Load**
  - [ ] Test 10 concurrent requests
  - [ ] Test 50 concurrent requests
  - [ ] Test 100 concurrent requests
  - [ ] Verify no crashes or hangs
  - Tool: Apache Bench, wrk, or similar

- [ ] **5.5 DI Container Performance**
  - [ ] Measure service factory time
  - [ ] Verify instantiation is fast
  - [ ] Check repository creation time
  - [ ] Ensure no bottlenecks

**Success Criteria**:
- ✅ Startup time: Within 10% of baseline
- ✅ Memory usage: Within 10% of baseline
- ✅ Endpoint latency: < 100ms
- ✅ Handles 100+ concurrent requests
- ✅ No memory leaks detected

**Testing Commands**:
```bash
# Start server and measure startup time
time python api/main.py

# Test with curl timing
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/v1/cities

# Load test with Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/v1/cities
```

---

## Phase 6: Documentation Updates (Estimated: 1 hour)

**Objective**: Update all documentation to reflect the new integrated architecture.

### Tasks

- [ ] **6.1 API Documentation**
  - [ ] Update /docs endpoint description
  - [ ] Document cities service endpoints
  - [ ] Document runs service endpoints
  - [ ] Add endpoint examples
  - Files: Swagger/OpenAPI config

- [ ] **6.2 Architecture Documentation**
  - [ ] Update architecture diagrams
  - [ ] Document service layer
  - [ ] Document dependency injection
  - [ ] Show data flow through services
  - Files: Architecture guides in docs/

- [ ] **6.3 Developer Guide Updates**
  - [ ] Update setup instructions
  - [ ] Document service usage
  - [ ] Explain DI container
  - [ ] Add testing guidance
  - File: docs/DEVELOPER_GUIDE.md

- [ ] **6.4 Integration Summary**
  - [ ] Create integration completion report
  - [ ] Document what was integrated
  - [ ] List new features available
  - [ ] Include performance metrics
  - File: INTEGRATION_COMPLETION_REPORT.md

- [ ] **6.5 Cleanup Documentation**
  - [ ] Remove outdated references
  - [ ] Delete old migration guides
  - [ ] Remove superseded plans
  - [ ] Update status documents
  - Files: Various docs/ files

- [ ] **6.6 Commit Documentation**
  - [ ] Add commit message
  - [ ] Document all changes
  - [ ] Link to related issues
  - [ ] Include migration notes

**Success Criteria**:
- ✅ All docs updated
- ✅ Examples work correctly
- ✅ No broken references
- ✅ Clear and accurate information
- ✅ Reflects current architecture

**Files to Update**:
- docs/ARCHITECTURE.md
- docs/API_REFERENCE.md
- docs/DEVELOPER_GUIDE.md
- README.md
- Create: INTEGRATION_COMPLETION_REPORT.md

---

## Summary Table

| Phase | Task | Status | Time | Priority |
|-------|------|--------|------|----------|
| 1 | Service Wiring | ✅ Complete | 1h | Critical |
| 2 | Integration Testing | ⏳ Pending | 1h | Critical |
| 3 | Endpoint Accessibility | ⏳ Pending | 1h | Critical |
| 4 | Full Test Suite | ⏳ Pending | 1h | High |
| 5 | Performance Verification | ⏳ Pending | 30m | High |
| 6 | Documentation Updates | ⏳ Pending | 1h | Medium |

**Total Time Remaining: 4.5 hours**

---

## Commit Strategy

Each phase will be committed separately:

```
Phase 1: ✅ 8d135ae feat(integration-phase-1): Wire services and register routers
Phase 2: ⏳ test(integration-phase-2): Verify service instantiation
Phase 3: ⏳ test(integration-phase-3): Verify endpoint accessibility
Phase 4: ⏳ test(integration-phase-4): Run full test suite
Phase 5: ⏳ test(integration-phase-5): Performance verification
Phase 6: ⏳ docs(integration-phase-6): Update documentation
```

---

## Success Criteria (All Phases)

✅ **Phase 1-6 Complete** means:
1. ✅ Services instantiated and wired
2. ✅ Routers registered and accessible
3. ✅ All endpoints working
4. ✅ All tests passing
5. ✅ Performance maintained
6. ✅ Documentation updated

**Result: 100% Modernization Complete**

---

## Rollback Plan

If any phase fails:

1. **Quick Rollback**: `git revert <commit-hash>`
2. **Full Rollback**: `git checkout main-old`
3. **Analysis**: Check BRANCH_COMPARISON_ANALYSIS.md
4. **Fix**: Address root cause
5. **Retry**: Re-execute phase

---

## Next Step

**Execute Phase 2: Integration Testing**

Verify that services are properly instantiated and all integration points work correctly.

```bash
cd /Users/rraviku2/aarti/urban_heat_democratization
pytest tests/test_city_strategies.py -v
pytest tests/test_run_service_phase3.py -v
pytest tests/test_scenario_service_phase3.py -v
```

---

**Status: Ready for Phase 2 ✅**
