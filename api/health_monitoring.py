"""
Health monitoring and diagnostics for the urban heat democratization API.

Provides:
- Service health checks
- Dependency monitoring
- Performance metrics
- Alerting capabilities
"""

import logging
from typing import Dict, List, Any, Optional, Callable, Awaitable
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio

logger = logging.getLogger(__name__)


class ServiceStatus(str, Enum):
    """Service status indicators."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class HealthCheckResult:
    """Result of a health check."""
    name: str
    status: ServiceStatus
    response_time_ms: float
    message: str
    details: Dict[str, Any]
    timestamp: datetime

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "status": self.status.value,
            "response_time_ms": self.response_time_ms,
            "message": self.message,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else str(self.timestamp),
        }

    def is_healthy(self) -> bool:
        """Check if healthy."""
        return self.status == ServiceStatus.HEALTHY


@dataclass
class SystemHealthReport:
    """Overall system health report."""
    timestamp: datetime
    overall_status: ServiceStatus
    checks: List[HealthCheckResult]
    uptime_seconds: float
    checks_passed: int
    checks_total: int

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "timestamp": self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else str(self.timestamp),
            "overall_status": self.overall_status.value,
            "uptime_seconds": self.uptime_seconds,
            "checks_passed": self.checks_passed,
            "checks_total": self.checks_total,
            "checks": [check.to_dict() for check in self.checks],
        }

    def is_healthy(self) -> bool:
        """Check if system is healthy."""
        return self.overall_status == ServiceStatus.HEALTHY


class HealthChecker:
    """Base health checker."""

    def __init__(self, name: str, timeout_seconds: int = 5):
        self.name = name
        self.timeout_seconds = timeout_seconds
        self.last_check: Optional[HealthCheckResult] = None

    async def check(self) -> HealthCheckResult:
        """
        Perform health check.
        
        Should be overridden by subclasses.
        """
        raise NotImplementedError

    async def check_with_timeout(self) -> HealthCheckResult:
        """Perform health check with timeout."""
        try:
            return await asyncio.wait_for(
                self.check(), timeout=self.timeout_seconds
            )
        except asyncio.TimeoutError:
            result = HealthCheckResult(
                name=self.name,
                status=ServiceStatus.UNHEALTHY,
                response_time_ms=self.timeout_seconds * 1000,
                message=f"Health check timed out after {self.timeout_seconds}s",
                details={"error_type": "timeout"},
                timestamp=datetime.utcnow(),
            )
            self.last_check = result
            return result
        except Exception as e:
            result = HealthCheckResult(
                name=self.name,
                status=ServiceStatus.UNHEALTHY,
                response_time_ms=0,
                message=f"Health check failed: {str(e)}",
                details={"error_type": type(e).__name__, "error": str(e)},
                timestamp=datetime.utcnow(),
            )
            self.last_check = result
            return result


class DatabaseHealthChecker(HealthChecker):
    """Check database connectivity."""

    def __init__(self, db_connection_func: Callable[[], Awaitable[bool]]):
        super().__init__("database")
        self.db_connection_func = db_connection_func

    async def check(self) -> HealthCheckResult:
        """Check database connectivity."""
        import time
        start = time.time()
        
        try:
            is_connected = await self.db_connection_func()
            response_time = (time.time() - start) * 1000
            
            if is_connected:
                result = HealthCheckResult(
                    name=self.name,
                    status=ServiceStatus.HEALTHY,
                    response_time_ms=response_time,
                    message="Database connection healthy",
                    details={"connected": True},
                    timestamp=datetime.utcnow(),
                )
            else:
                result = HealthCheckResult(
                    name=self.name,
                    status=ServiceStatus.UNHEALTHY,
                    response_time_ms=response_time,
                    message="Database connection failed",
                    details={"connected": False},
                    timestamp=datetime.utcnow(),
                )
            
            self.last_check = result
            return result
        except Exception as e:
            response_time = (time.time() - start) * 1000
            result = HealthCheckResult(
                name=self.name,
                status=ServiceStatus.UNHEALTHY,
                response_time_ms=response_time,
                message=f"Database check error: {str(e)}",
                details={"error": str(e)},
                timestamp=datetime.utcnow(),
            )
            self.last_check = result
            return result


class APIEndpointHealthChecker(HealthChecker):
    """Check API endpoint availability."""

    def __init__(self, endpoint_name: str, endpoint_url: str, http_client_func: Callable):
        super().__init__(f"endpoint_{endpoint_name}")
        self.endpoint_name = endpoint_name
        self.endpoint_url = endpoint_url
        self.http_client_func = http_client_func

    async def check(self) -> HealthCheckResult:
        """Check endpoint availability."""
        import time
        start = time.time()
        
        try:
            response = await self.http_client_func("GET", self.endpoint_url)
            response_time = (time.time() - start) * 1000
            
            if 200 <= response.status_code < 300:
                result = HealthCheckResult(
                    name=self.name,
                    status=ServiceStatus.HEALTHY,
                    response_time_ms=response_time,
                    message=f"Endpoint responding normally",
                    details={"status_code": response.status_code},
                    timestamp=datetime.utcnow(),
                )
            elif 500 <= response.status_code < 600:
                result = HealthCheckResult(
                    name=self.name,
                    status=ServiceStatus.UNHEALTHY,
                    response_time_ms=response_time,
                    message=f"Endpoint returned server error: {response.status_code}",
                    details={"status_code": response.status_code},
                    timestamp=datetime.utcnow(),
                )
            else:
                result = HealthCheckResult(
                    name=self.name,
                    status=ServiceStatus.DEGRADED,
                    response_time_ms=response_time,
                    message=f"Endpoint returned unusual status: {response.status_code}",
                    details={"status_code": response.status_code},
                    timestamp=datetime.utcnow(),
                )
            
            self.last_check = result
            return result
        except Exception as e:
            response_time = (time.time() - start) * 1000
            result = HealthCheckResult(
                name=self.name,
                status=ServiceStatus.UNHEALTHY,
                response_time_ms=response_time,
                message=f"Endpoint check error: {str(e)}",
                details={"error": str(e)},
                timestamp=datetime.utcnow(),
            )
            self.last_check = result
            return result


class MemoryHealthChecker(HealthChecker):
    """Check system memory usage."""

    def __init__(self, threshold_percent: float = 80.0):
        super().__init__("memory")
        self.threshold_percent = threshold_percent

    async def check(self) -> HealthCheckResult:
        """Check memory usage."""
        try:
            import psutil
            memory = psutil.virtual_memory()
            percent = memory.percent
            
            if percent > self.threshold_percent:
                status = ServiceStatus.UNHEALTHY
                message = f"Memory usage critically high: {percent:.1f}%"
            elif percent > self.threshold_percent * 0.8:
                status = ServiceStatus.DEGRADED
                message = f"Memory usage elevated: {percent:.1f}%"
            else:
                status = ServiceStatus.HEALTHY
                message = f"Memory usage normal: {percent:.1f}%"
            
            result = HealthCheckResult(
                name=self.name,
                status=status,
                response_time_ms=0,
                message=message,
                details={
                    "percent": percent,
                    "available_mb": memory.available / (1024 * 1024),
                    "total_mb": memory.total / (1024 * 1024),
                },
                timestamp=datetime.utcnow(),
            )
            self.last_check = result
            return result
        except ImportError:
            logger.warning("psutil not available for memory checks")
            result = HealthCheckResult(
                name=self.name,
                status=ServiceStatus.UNKNOWN,
                response_time_ms=0,
                message="Memory check unavailable",
                details={"reason": "psutil not installed"},
                timestamp=datetime.utcnow(),
            )
            self.last_check = result
            return result


class HealthMonitor:
    """Central health monitoring system."""

    def __init__(self):
        self.checkers: Dict[str, HealthChecker] = {}
        self.start_time = datetime.utcnow()

    def register_checker(self, checker: HealthChecker) -> None:
        """Register a health checker."""
        self.checkers[checker.name] = checker
        logger.info(f"Registered health checker: {checker.name}")

    async def run_all_checks(self) -> SystemHealthReport:
        """Run all registered health checks."""
        checks: List[HealthCheckResult] = []
        
        for checker in self.checkers.values():
            check = await checker.check_with_timeout()
            checks.append(check)

        # Determine overall status
        if all(check.is_healthy() for check in checks):
            overall_status = ServiceStatus.HEALTHY
        elif any(check.status == ServiceStatus.UNHEALTHY for check in checks):
            overall_status = ServiceStatus.UNHEALTHY
        else:
            overall_status = ServiceStatus.DEGRADED

        uptime = (datetime.utcnow() - self.start_time).total_seconds()
        checks_passed = sum(1 for check in checks if check.is_healthy())

        report = SystemHealthReport(
            timestamp=datetime.utcnow(),
            overall_status=overall_status,
            checks=checks,
            uptime_seconds=uptime,
            checks_passed=checks_passed,
            checks_total=len(checks),
        )

        return report

    def get_last_check(self, name: str) -> Optional[HealthCheckResult]:
        """Get last check result for a specific checker."""
        checker = self.checkers.get(name)
        return checker.last_check if checker else None


class PerformanceMetrics:
    """Track performance metrics."""

    def __init__(self):
        self.metrics: Dict[str, List[float]] = {}
        self.max_samples = 1000

    def record(self, metric_name: str, value: float) -> None:
        """Record a metric value."""
        if metric_name not in self.metrics:
            self.metrics[metric_name] = []
        
        self.metrics[metric_name].append(value)
        
        # Keep only last N samples
        if len(self.metrics[metric_name]) > self.max_samples:
            self.metrics[metric_name] = self.metrics[metric_name][-self.max_samples:]

    def get_average(self, metric_name: str) -> float:
        """Get average value for a metric."""
        values = self.metrics.get(metric_name, [])
        return sum(values) / len(values) if values else 0.0

    def get_min(self, metric_name: str) -> float:
        """Get minimum value for a metric."""
        values = self.metrics.get(metric_name, [])
        return min(values) if values else 0.0

    def get_max(self, metric_name: str) -> float:
        """Get maximum value for a metric."""
        values = self.metrics.get(metric_name, [])
        return max(values) if values else 0.0

    def get_summary(self, metric_name: str) -> Dict[str, float]:
        """Get summary statistics for a metric."""
        values = self.metrics.get(metric_name, [])
        if not values:
            return {}
        
        return {
            "count": len(values),
            "min": min(values),
            "max": max(values),
            "average": sum(values) / len(values),
        }
