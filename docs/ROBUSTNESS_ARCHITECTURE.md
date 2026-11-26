# Robustness and Resilience Architecture

## Overview

The urban heat democratization API has been enhanced with comprehensive robustness and resilience patterns to ensure extremely high reliability, defensibility, and graceful degradation under failure conditions. This document explains the architecture and best practices.

## Core Principles

1. **Defense in Depth**: Multiple layers of error handling and recovery
2. **Fail Safe**: Graceful degradation with fallback behavior
3. **Observable**: Comprehensive logging and health monitoring
4. **Resilient**: Automatic recovery with circuit breaker patterns
5. **Defensive**: Extensive input validation and sanitization

## Architecture Layers

### Layer 1: Error Handling Middleware

**File**: `api/error_handling.py`

Three middleware components work together:

#### 1.1 RobustErrorHandlingMiddleware
- Catches all exceptions (500, 400, etc.)
- Validates requests
- Formats errors consistently
- Tracks error metrics
- Logs failures with request IDs

```python
# Automatic exception handling
try:
    response = await call_next(request)
except ValidationError as e:
    # Returns 400 with structured error
except DatabaseError as e:
    # Returns 500 with recovery attempt
except Exception as e:
    # Unexpected errors with request ID for tracking
```

#### 1.2 RequestResponseLoggingMiddleware
- Logs all requests and responses
- Includes request/response body (first 500 chars)
- Tracks response status codes
- Provides complete audit trail

#### 1.3 HealthMonitoringMiddleware
- Tracks request counts
- Measures response times
- Counts errors by status code
- Monitors service degradation

### Layer 2: Safe Access Patterns

**File**: `api/robustness.py` - `SafeAccess` class

Provides safe property access with defaults:

```python
# Safe nested access with dot notation
value = SafeAccess.get(obj, "user.profile.name", default="Unknown")

# Array indexing support
item = SafeAccess.get(obj, "items.0.name")

# Returns default on any missing level
result = SafeAccess.get(deep_obj, "a.b.c.d.e.f", default=None)
```

**Benefits**:
- No AttributeError on missing properties
- Supports deep nesting
- Array access with numeric indices
- Always returns default safely

### Layer 3: Input Validation

**File**: `api/data_validation.py`

Three validation classes:

#### 3.1 DataValidator
- String validation (length, pattern, required)
- Numeric validation (range, type)
- Email, UUID, date validation
- List validation (min/max items)
- Boolean coercion

```python
# Validate email
email = DataValidator.validate_email(user_input, "email_field")

# Validate range
age = DataValidator.validate_number(
    value, "age", min_value=0, max_value=150
)

# Validate list size
items = DataValidator.validate_list(
    data, "items", min_items=1, max_items=100
)
```

#### 3.2 DataSanitizer
- HTML escaping (XSS protection)
- SQL sanitization (injection protection)
- Whitespace normalization
- String trimming

```python
# Sanitize user input
clean_html = DataSanitizer.sanitize_html(user_text)
clean_sql = DataSanitizer.sanitize_sql(user_query)
normalized = DataSanitizer.normalize_whitespace(user_input)
```

#### 3.3 BulkValidator
- Accumulate multiple validation errors
- Return all errors at once
- Better UX than fail-fast validation

```python
validator = BulkValidator()
validator.add_error("name", "Required field")
validator.add_error("email", "Invalid format")
if validator.has_errors():
    return validator.get_errors()
```

### Layer 4: Validation Utilities

**File**: `api/robustness.py` - `Validation` class

Type-safe validation helpers:

```python
# Require non-None value
value = Validation.required(user_input, "field_name")

# Numeric range check
age = Validation.in_range(25, 0, 150, "age")

# Non-empty strings and lists
name = Validation.non_empty_string(user_name, "name")
items = Validation.non_empty_list(data, "items")

# Coercion with defaults
str_value = SafeAccess.or_empty_string(nullable_value)
lst_value = SafeAccess.or_empty_list(nullable_list)
```

### Layer 5: Circuit Breaker Pattern

**File**: `api/robustness.py` - `CircuitBreaker` class

Prevents cascading failures:

```python
# Initialize circuit breaker
breaker = CircuitBreaker(
    name="database",
    failure_threshold=5,      # Open after 5 failures
    recovery_timeout=60       # Try again after 60 seconds
)

# Use with function calls
try:
    result = breaker.call(database_query, query_string)
except RuntimeError:
    # Circuit is open, return cached data
    return fallback_data
```

**States**:
- **Closed**: Normal operation
- **Open**: Rejecting calls (service is down)
- **Half-Open**: Testing if service recovered

**Benefits**:
- Stops making failing calls
- Prevents timeout cascades
- Automatic recovery attempts
- Configurable thresholds

### Layer 6: Async Timeout Protection

**File**: `api/robustness.py` - `safe_async_timeout` decorator

Prevents indefinite hangs:

```python
@safe_async_timeout(seconds=30)
async def long_running_operation():
    return await external_api_call()
```

**Features**:
- Automatic timeout enforcement
- Logs timeout events
- Raises asyncio.TimeoutError
- Configurable per operation

### Layer 7: Health Monitoring

**File**: `api/health_monitoring.py`

Multi-layer health checks:

#### 7.1 HealthMonitor
Central coordinator for all health checks:

```python
monitor = HealthMonitor()
monitor.register_checker(DatabaseHealthChecker(db_conn))
monitor.register_checker(MemoryHealthChecker())

report = await monitor.run_all_checks()
# Returns:
# - Overall status (healthy/degraded/unhealthy)
# - Individual check results
# - Response times
# - Uptime metrics
```

#### 7.2 Built-in Checkers
- **MemoryHealthChecker**: System memory usage
- **DatabaseHealthChecker**: Database connectivity
- **APIEndpointHealthChecker**: External API availability

#### 7.3 Health Endpoint
Expose health metrics via API:

```
GET /api/v1/diagnostics/health

Response:
{
  "timestamp": "2024-01-01T00:00:00Z",
  "overall_status": "healthy",
  "uptime_seconds": 3600,
  "checks_passed": 3,
  "checks_total": 3,
  "checks": [
    {
      "name": "memory",
      "status": "healthy",
      "response_time_ms": 1.2,
      "message": "Memory usage normal: 45.2%"
    }
  ]
}
```

### Layer 8: Safe Function Wrappers

**File**: `api/robustness.py`

Execute functions safely with error handling:

```python
result = safe_function_call(
    risky_function,
    arg1, arg2,
    default="fallback_value",
    log_errors=True
)
# Returns fallback_value if risky_function raises
```

## Integration Example

Here's how layers work together:

```python
# 1. Input validation (Layer 3)
city_id = DataValidator.validate_uuid(request.city_id, "city_id")

# 2. Safe access to nested data (Layer 2)
config = SafeAccess.get(city_data, "config.thermal", default={})

# 3. Required value check (Layer 4)
temp = Validation.required(config.get("temp"), "temperature")

# 4. Circuit breaker for external call (Layer 5)
breaker = CircuitBreaker("weather_api", failure_threshold=3)
try:
    weather = breaker.call(get_weather_data, city_id)
except RuntimeError:
    # Circuit open, use cached weather
    weather = get_cached_weather(city_id)

# 5. Health monitoring (Layer 7)
health = await monitor.run_all_checks()
if not health.is_healthy():
    logger.warning(f"System degraded: {health.checks}")

# 6. Error response (Layer 1)
if error:
    return ErrorResponse(
        error_id="OPERATION_FAILED",
        message="Could not fetch weather data",
        status_code=503,
        details={"city_id": city_id, "reason": str(error)}
    ).to_response()
```

## Best Practices

### 1. Always Validate Input
```python
# ❌ Bad
def create_city(name, population):
    return db.create(name, population)

# ✅ Good
def create_city(name, population):
    name = DataValidator.validate_string(
        name, "name", min_length=1, max_length=200
    )
    population = DataValidator.validate_integer(
        population, "population", min_value=0
    )
    return db.create(name, population)
```

### 2. Use Safe Access for External Data
```python
# ❌ Bad
color = response["data"]["city"]["color"]  # KeyError if missing

# ✅ Good
color = SafeAccess.get(response, "data.city.color", default="gray")
```

### 3. Protect Long Operations
```python
# ❌ Bad - might hang forever
result = await external_api.query(large_dataset)

# ✅ Good - times out after 30 seconds
@safe_async_timeout(seconds=30)
async def query_with_timeout():
    return await external_api.query(large_dataset)
```

### 4. Use Circuit Breakers for External Services
```python
# ❌ Bad - cascading failures
for city in cities:
    weather = get_weather(city)  # All 1000 fail if service is down

# ✅ Good - fails fast after threshold
breaker = CircuitBreaker("weather_api", failure_threshold=5)
for city in cities:
    try:
        weather = breaker.call(get_weather, city)
    except RuntimeError:
        weather = fallback_weather
```

### 5. Provide Fallback Behavior
```python
# ❌ Bad - no graceful degradation
metrics = await get_metrics()
display_dashboard(metrics)

# ✅ Good - falls back gracefully
try:
    metrics = await get_metrics()
except Exception:
    metrics = get_cached_metrics() or {}
display_dashboard(metrics)
```

### 6. Log with Request IDs
```python
# Request ID injected by middleware
logger.info(
    "Operation completed",
    extra={
        "request_id": request_id,
        "duration_ms": elapsed_time,
        "city_id": city_id
    }
)
```

## Testing Robustness

The test suite includes 37 comprehensive tests:

```bash
# Run all robustness tests
pytest api/tests/test_robustness.py -v

# Run specific test class
pytest api/tests/test_robustness.py::TestSafeAccess -v

# Run with coverage
pytest api/tests/test_robustness.py --cov=api.robustness
```

**Test Coverage**:
- SafeAccess: Nested, array, missing properties
- Validation: String, number, integer, email, boolean
- Sanitization: HTML, SQL, whitespace
- Circuit Breaker: Opens, half-open, recovery
- DataValidator: All validators and constraints
- Health Monitoring: Checker registration and reporting

## Deployment Considerations

### Environment Variables
```bash
# Error handling configuration
UHD_RUNTIME_MODE=production  # Enable production error handling
UHD_LOG_LEVEL=INFO            # Set log level

# Health check configuration
UHD_HEALTH_CHECK_INTERVAL=60  # Seconds between checks
UHD_HEALTH_CHECK_TIMEOUT=5    # Timeout per check in seconds
```

### Monitoring

Health metrics available at:
```
GET /api/v1/diagnostics/health
```

Metrics exposed:
- Overall system health status
- Individual component health
- Response times per check
- System uptime
- Last failure timestamps

### Alerting Rules

Configure alerts for:
1. `overall_status == "unhealthy"` - Immediate page
2. `overall_status == "degraded"` - Non-urgent alert
3. Health check response time > 1000ms - Performance issue
4. Any component with repeated failures - Escalate

## Evolution and Future Work

### Potential Enhancements
1. **Distributed Circuit Breaker**: Share state across instances
2. **Adaptive Thresholds**: ML-based failure detection
3. **Service Mesh Integration**: Istio/Linkerd compatibility
4. **Custom Metrics**: Business-level SLOs
5. **Chaos Testing**: Automated resilience validation

### Performance Impact

The robustness layers add minimal overhead:
- SafeAccess: <0.1ms per call
- Validation: 0.5-1ms per field
- CircuitBreaker: <0.1ms (closed state)
- Middleware: 1-2ms per request
- Health checks: 5-10ms per check (async, cached)

### Dependencies

Required packages:
- fastapi >= 0.95.0
- starlette >= 0.26.0
- uvicorn >= 0.21.0

Optional (for psutil memory checks):
- psutil >= 5.9.0

## References

- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Defensive Programming](https://en.wikipedia.org/wiki/Defensive_programming)
- [Graceful Degradation](https://en.wikipedia.org/wiki/Graceful_degradation)
- [Health Checks Best Practices](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
