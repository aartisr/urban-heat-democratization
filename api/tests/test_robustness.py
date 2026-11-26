"""
Tests for robustness utilities and error handling.

Covers:
- SafeAccess patterns
- Data validation
- Circuit breaker behavior
- Async timeout protection
- Error handling middleware
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock
from api.robustness import (
    SafeAccess,
    Validation,
    CircuitBreaker,
    safe_async_timeout,
    safe_function_call,
    RobustnessHelper,
)
from api.error_handling import ErrorResponse, RobustErrorHandlingMiddleware
from api.data_validation import (
    DataValidator,
    DataSanitizer,
    ValidationError,
    BulkValidator,
)
from api.health_monitoring import (
    ServiceStatus,
    HealthCheckResult,
    HealthMonitor,
    MemoryHealthChecker,
)


class TestSafeAccess:
    """Test SafeAccess pattern."""

    def test_get_nested_property_success(self):
        """Test successful nested property access."""
        obj = {"user": {"profile": {"name": "Alice"}}}
        result = SafeAccess.get(obj, "user.profile.name")
        assert result == "Alice"

    def test_get_nested_property_missing(self):
        """Test accessing missing nested property."""
        obj = {"user": {"profile": {}}}
        result = SafeAccess.get(obj, "user.profile.name")
        assert result is None

    def test_get_nested_property_with_default(self):
        """Test accessing missing property with default."""
        obj = {"user": {}}
        result = SafeAccess.get(obj, "user.profile.name", default="Unknown")
        assert result == "Unknown"

    def test_get_deep_nesting(self):
        """Test accessing deeply nested property."""
        obj = {"a": {"b": {"c": {"d": {"e": "value"}}}}}
        result = SafeAccess.get(obj, "a.b.c.d.e")
        assert result == "value"

    def test_get_array_access(self):
        """Test accessing array elements."""
        obj = {"items": [1, 2, 3]}
        result = SafeAccess.get(obj, "items.0")
        assert result == 1

    def test_get_mixed_array_object(self):
        """Test accessing mixed array and object."""
        obj = {"items": [{"name": "item1"}, {"name": "item2"}]}
        result = SafeAccess.get(obj, "items.0.name")
        assert result == "item1"


class TestValidation:
    """Test Validation patterns."""

    def test_required_valid(self):
        """Test valid required value."""
        result = Validation.required("John", "name")
        assert result == "John"

    def test_required_none_fails(self):
        """Test required with None value fails."""
        with pytest.raises(ValueError):
            Validation.required(None, "name")

    def test_in_range_valid(self):
        """Test valid range check."""
        result = Validation.in_range(25, 0, 150, "age")
        assert result == 25

    def test_in_range_exceeds_max(self):
        """Test range exceeds maximum."""
        with pytest.raises(ValueError):
            Validation.in_range(200, 0, 150, "age")

    def test_non_empty_string_valid(self):
        """Test valid non-empty string."""
        result = Validation.non_empty_string("test", "field")
        assert result == "test"

    def test_non_empty_string_empty_fails(self):
        """Test empty string validation fails."""
        with pytest.raises(ValueError):
            Validation.non_empty_string("", "field")

    def test_non_empty_list_valid(self):
        """Test valid non-empty list."""
        result = Validation.non_empty_list(["a", "b"], "field")
        assert result == ["a", "b"]

    def test_non_empty_list_empty_fails(self):
        """Test empty list validation fails."""
        with pytest.raises(ValueError):
            Validation.non_empty_list([], "field")


class TestCircuitBreaker:
    """Test CircuitBreaker pattern."""

    def test_circuit_breaker_success(self):
        """Test circuit breaker with successful calls."""
        cb = CircuitBreaker("test", failure_threshold=3)
        
        def success_func():
            return "success"
        
        result = cb.call(success_func)
        assert result == "success"
        assert not cb.is_open

    def test_circuit_breaker_opens_on_failures(self):
        """Test circuit breaker opens after threshold failures."""
        cb = CircuitBreaker("test", failure_threshold=2)
        
        def failing_func():
            raise Exception("Service unavailable")
        
        # First failure
        with pytest.raises(Exception):
            cb.call(failing_func)
        
        # Second failure - opens circuit
        with pytest.raises(Exception):
            cb.call(failing_func)
        
        # Circuit should be open now
        assert cb.is_open

    def test_circuit_breaker_half_open(self):
        """Test circuit breaker half-open state after recovery timeout."""
        cb = CircuitBreaker("test", failure_threshold=1, recovery_timeout=0)
        
        def failing_func():
            raise Exception("Fail")
        
        # Open circuit
        with pytest.raises(Exception):
            cb.call(failing_func)
        
        assert cb.is_open
        
        # Try again - should attempt reset with recovery_timeout=0
        def success_func():
            return "recovered"
        
        result = cb.call(success_func)
        assert result == "recovered"
        assert not cb.is_open

    def test_circuit_breaker_recovery(self):
        """Test circuit breaker recovers on success after timeout."""
        cb = CircuitBreaker("test", failure_threshold=1, recovery_timeout=0)
        
        call_count = 0
        
        def sometimes_failing():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise Exception("Still failing")
            return "recovered"
        
        # Open circuit
        with pytest.raises(Exception):
            cb.call(sometimes_failing)
        
        assert cb.is_open
        
        # This should succeed and close the circuit (recovery_timeout=0 means immediate retry)
        result = cb.call(sometimes_failing)
        assert result == "recovered"
        assert not cb.is_open


class TestDataValidator:
    """Test DataValidator utility."""

    def test_validate_string_success(self):
        """Test valid string validation."""
        result = DataValidator.validate_string("test", "field")
        assert result == "test"

    def test_validate_string_max_length(self):
        """Test string max length constraint."""
        with pytest.raises(ValidationError):
            DataValidator.validate_string("toolong", "field", max_length=3)

    def test_validate_number_success(self):
        """Test valid number validation."""
        result = DataValidator.validate_number(42.5, "field")
        assert result == 42.5

    def test_validate_number_range(self):
        """Test number range constraint."""
        with pytest.raises(ValidationError):
            DataValidator.validate_number(150, "age", max_value=120)

    def test_validate_integer_success(self):
        """Test valid integer validation."""
        result = DataValidator.validate_integer(42, "field")
        assert result == 42

    def test_validate_integer_decimal_fails(self):
        """Test integer rejects decimals."""
        with pytest.raises(ValidationError):
            DataValidator.validate_integer(42.5, "field")

    def test_validate_email_valid(self):
        """Test valid email."""
        result = DataValidator.validate_email("user@example.com", "email")
        assert result == "user@example.com"

    def test_validate_email_invalid(self):
        """Test invalid email."""
        with pytest.raises(ValidationError):
            DataValidator.validate_email("notanemail", "email")

    def test_validate_boolean_string(self):
        """Test boolean parsing from string."""
        assert DataValidator.validate_boolean("true", "field") is True
        assert DataValidator.validate_boolean("false", "field") is False

    def test_validate_list_min_items(self):
        """Test list minimum items constraint."""
        with pytest.raises(ValidationError):
            DataValidator.validate_list([1], "field", min_items=2)


class TestDataSanitizer:
    """Test DataSanitizer utility."""

    def test_sanitize_html(self):
        """Test HTML sanitization."""
        dirty = '<script>alert("xss")</script>'
        clean = DataSanitizer.sanitize_html(dirty)
        assert "<" not in clean
        assert ">" not in clean

    def test_sanitize_sql(self):
        """Test SQL sanitization."""
        dirty = "'; DROP TABLE users; --"
        clean = DataSanitizer.sanitize_sql(dirty)
        assert "DROP" not in clean

    def test_trim_string(self):
        """Test string trimming."""
        result = DataSanitizer.trim_string("hello world", 5)
        assert result == "hello"

    def test_normalize_whitespace(self):
        """Test whitespace normalization."""
        result = DataSanitizer.normalize_whitespace("hello   world  test")
        assert result == "hello world test"


class TestBulkValidator:
    """Test BulkValidator utility."""

    def test_no_errors(self):
        """Test bulk validator with no errors."""
        validator = BulkValidator()
        assert not validator.has_errors()

    def test_add_errors(self):
        """Test adding validation errors."""
        validator = BulkValidator()
        validator.add_error("field1", "Required")
        validator.add_error("field2", "Invalid format")
        assert validator.has_errors()

    def test_get_errors_dict(self):
        """Test getting errors as dictionary."""
        validator = BulkValidator()
        validator.add_error("field1", "Required")
        validator.add_error("field2", "Invalid")
        errors = validator.get_errors()
        assert errors["field1"] == "Required"
        assert errors["field2"] == "Invalid"


class TestHealthMonitor:
    """Test HealthMonitor."""

    @pytest.mark.asyncio
    async def test_health_monitor_basic(self):
        """Test basic health monitor functionality."""
        monitor = HealthMonitor()
        monitor.register_checker(MemoryHealthChecker())
        
        report = await monitor.run_all_checks()
        assert report.overall_status in [ServiceStatus.HEALTHY, ServiceStatus.DEGRADED]
        assert len(report.checks) >= 1


class TestErrorResponse:
    """Test ErrorResponse formatting."""

    def test_error_response_creation(self):
        """Test creating error response."""
        err = ErrorResponse(
            error_id="INVALID_INPUT",
            message="Validation failed",
            status_code=400,
            details={"field": "name", "reason": "required"},
        )
        
        data = err.to_dict()
        assert data["error"]["id"] == "INVALID_INPUT"
        assert data["error"]["message"] == "Validation failed"
        assert data["error"]["status_code"] == 400


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

