"""
Robustness and resilience utilities for the urban heat democratization API.

Provides:
- Safe property access patterns
- Validation utilities
- Error handling helpers
- Circuit breaker patterns
- Timeout management
- Graceful degradation
- Health check utilities
"""

import logging
import functools
import asyncio
from typing import TypeVar, Callable, Any, Optional, Dict, List, cast
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger(__name__)

T = TypeVar("T")
E = TypeVar("E", bound=Exception)


class HealthStatus(str, Enum):
    """Health status indicators."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class HealthCheck:
    """Health check result."""
    status: HealthStatus
    timestamp: datetime
    component: str
    details: Dict[str, Any]
    errors: List[str]

    def is_healthy(self) -> bool:
        """Check if component is healthy."""
        return self.status == HealthStatus.HEALTHY

    def is_degraded(self) -> bool:
        """Check if component is degraded."""
        return self.status == HealthStatus.DEGRADED


class SafeAccess:
    """Safe property access utilities."""

    @staticmethod
    def get(obj: Optional[Any], key: str, default: Any = None) -> Any:
        """
        Safely get a nested property from an object.
        
        Args:
            obj: Object to access
            key: Dot-separated key path (e.g., "user.profile.name" or "items.0.name")
            default: Default value if key not found or object is None
            
        Returns:
            Property value or default
        """
        if obj is None:
            return default

        try:
            keys = key.split(".")
            current = obj
            for k in keys:
                # Try to treat as array index
                if k.isdigit():
                    try:
                        current = current[int(k)]
                    except (IndexError, KeyError, TypeError):
                        return default
                elif isinstance(current, dict):
                    current = current.get(k)
                else:
                    current = getattr(current, k, None)
                if current is None:
                    return default
            return current
        except (AttributeError, KeyError, TypeError, IndexError):
            return default

    @staticmethod
    def chain(obj: Optional[Any], *keys: str, default: Any = None) -> Any:
        """
        Safely chain multiple property accesses.
        
        Args:
            obj: Object to start with
            *keys: Properties to access in order
            default: Default value if any step fails
            
        Returns:
            Final value or default
        """
        current = obj
        for key in keys:
            current = SafeAccess.get(current, key)
            if current is None:
                return default
        return current

    @staticmethod
    def or_zero(value: Optional[float]) -> float:
        """Get value or 0 if None or falsy."""
        return float(value) if value is not None else 0.0

    @staticmethod
    def or_empty(value: Optional[str]) -> str:
        """Get value or empty string if None."""
        return str(value) if value is not None else ""

    @staticmethod
    def or_empty_list(value: Optional[List[T]]) -> List[T]:
        """Get value or empty list if None."""
        return value if isinstance(value, list) else []

    @staticmethod
    def or_empty_dict(value: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Get value or empty dict if None."""
        return value if isinstance(value, dict) else {}


class Validation:
    """Data validation utilities."""

    @staticmethod
    def required(value: Optional[Any], field_name: str) -> Any:
        """
        Validate that a value is not None.
        
        Args:
            value: Value to validate
            field_name: Field name for error message
            
        Returns:
            The value if valid
            
        Raises:
            ValueError: If value is None
        """
        if value is None:
            raise ValueError(f"Required field '{field_name}' is None")
        return value

    @staticmethod
    def in_range(value: float, min_val: float, max_val: float, field_name: str) -> float:
        """
        Validate that a numeric value is in range.
        
        Args:
            value: Value to validate
            min_val: Minimum value (inclusive)
            max_val: Maximum value (inclusive)
            field_name: Field name for error message
            
        Returns:
            The value if valid
            
        Raises:
            ValueError: If value is out of range
        """
        if not min_val <= value <= max_val:
            raise ValueError(
                f"Field '{field_name}' value {value} is out of range [{min_val}, {max_val}]"
            )
        return value

    @staticmethod
    def non_empty_string(value: Optional[str], field_name: str) -> str:
        """
        Validate that a string is non-empty.
        
        Args:
            value: Value to validate
            field_name: Field name for error message
            
        Returns:
            The value if valid
            
        Raises:
            ValueError: If value is None or empty
        """
        if not value:
            raise ValueError(f"Required string field '{field_name}' is empty")
        return value

    @staticmethod
    def non_empty_list(value: Optional[List[T]], field_name: str) -> List[T]:
        """
        Validate that a list is non-empty.
        
        Args:
            value: Value to validate
            field_name: Field name for error message
            
        Returns:
            The value if valid
            
        Raises:
            ValueError: If value is None or empty
        """
        if not value:
            raise ValueError(f"Required list field '{field_name}' is empty")
        return value


class CircuitBreaker:
    """Circuit breaker pattern for handling failures gracefully."""

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception,
    ):
        """
        Initialize circuit breaker.
        
        Args:
            name: Circuit breaker name
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before attempting recovery
            expected_exception: Exception type to catch
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = timedelta(seconds=recovery_timeout)
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.is_open = False

    def call(self, func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
        """
        Execute function with circuit breaker protection.
        
        Args:
            func: Function to execute
            *args: Function arguments
            **kwargs: Function keyword arguments
            
        Returns:
            Function result
            
        Raises:
            RuntimeError: If circuit is open
            Exception: Original exception if circuit is closed
        """
        if self.is_open:
            if self._should_attempt_reset():
                self.is_open = False
                self.failure_count = 0
            else:
                raise RuntimeError(f"Circuit breaker '{self.name}' is open")

        try:
            result = func(*args, **kwargs)
            self.failure_count = 0
            return result
        except self.expected_exception as e:
            self.failure_count += 1
            self.last_failure_time = datetime.now()
            if self.failure_count >= self.failure_threshold:
                self.is_open = True
            logger.warning(
                f"Circuit breaker '{self.name}' failure {self.failure_count}/{self.failure_threshold}: {e}"
            )
            raise

    def _should_attempt_reset(self) -> bool:
        """Check if circuit should attempt reset."""
        return (
            self.last_failure_time is not None
            and datetime.now() - self.last_failure_time >= self.recovery_timeout
        )


def safe_async_timeout(seconds: int = 30):
    """
    Decorator for adding timeout protection to async functions.
    
    Args:
        seconds: Timeout in seconds
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return await asyncio.wait_for(func(*args, **kwargs), timeout=seconds)
            except asyncio.TimeoutError:
                logger.error(f"Function {func.__name__} timed out after {seconds}s")
                raise
        return wrapper
    return decorator


def safe_function_call(
    func: Callable[..., T],
    *args: Any,
    default: Optional[T] = None,
    log_errors: bool = True,
    **kwargs: Any,
) -> Optional[T]:
    """
    Execute function safely with error handling.
    
    Args:
        func: Function to execute
        *args: Function arguments
        default: Default value on error
        log_errors: Whether to log errors
        **kwargs: Function keyword arguments
        
    Returns:
        Function result or default on error
    """
    try:
        return func(*args, **kwargs)
    except Exception as e:
        if log_errors:
            logger.error(f"Error in {func.__name__}: {e}", exc_info=True)
        return default


async def safe_async_call(
    coro: Callable[..., Any],
    *args: Any,
    default: Optional[T] = None,
    timeout: int = 30,
    log_errors: bool = True,
    **kwargs: Any,
) -> Optional[T]:
    """
    Execute async function safely with error handling and timeout.
    
    Args:
        coro: Coroutine to execute
        *args: Arguments
        default: Default value on error
        timeout: Timeout in seconds
        log_errors: Whether to log errors
        **kwargs: Keyword arguments
        
    Returns:
        Coroutine result or default on error
    """
    try:
        return await asyncio.wait_for(coro(*args, **kwargs), timeout=timeout)
    except asyncio.TimeoutError:
        if log_errors:
            logger.error(f"Async call {coro.__name__} timed out after {timeout}s")
        return default
    except Exception as e:
        if log_errors:
            logger.error(f"Error in async {coro.__name__}: {e}", exc_info=True)
        return default


class RobustnessHelper:
    """Helper class for common robustness patterns."""

    @staticmethod
    def ensure_list(value: Optional[Any]) -> List[Any]:
        """Ensure value is a list."""
        if isinstance(value, list):
            return value
        if value is None:
            return []
        return [value]

    @staticmethod
    def ensure_dict(value: Optional[Any]) -> Dict[str, Any]:
        """Ensure value is a dict."""
        if isinstance(value, dict):
            return value
        return {}

    @staticmethod
    def ensure_string(value: Optional[Any]) -> str:
        """Ensure value is a string."""
        if isinstance(value, str):
            return value
        if value is None:
            return ""
        return str(value)

    @staticmethod
    def ensure_number(value: Optional[Any], default: float = 0.0) -> float:
        """Ensure value is a number."""
        try:
            if value is None:
                return default
            return float(value)
        except (ValueError, TypeError):
            return default

    @staticmethod
    def clamp(value: float, min_val: float, max_val: float) -> float:
        """Clamp value between min and max."""
        return max(min_val, min(max_val, value))

    @staticmethod
    def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
        """Safely divide two numbers."""
        try:
            if denominator == 0:
                return default
            return numerator / denominator
        except (ValueError, TypeError, ZeroDivisionError):
            return default
