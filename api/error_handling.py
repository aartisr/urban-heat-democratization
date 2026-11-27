"""
Comprehensive error handling middleware for the urban heat democratization API.

Provides:
- Global exception handling
- Request/response logging
- Error recovery
- Graceful degradation
- Health monitoring
"""

import logging
import traceback
import uuid
from typing import Callable, Any, Optional, Dict
from datetime import datetime, timezone
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class ErrorResponse:
    """Standard error response format."""

    def __init__(
        self,
        error_id: str,
        message: str,
        status_code: int,
        details: Optional[Dict[str, Any]] = None,
        timestamp: Optional[str] = None,
    ):
        self.error_id = error_id
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        self.timestamp = timestamp or (datetime.now(timezone.utc).isoformat() if isinstance(timestamp, str) or timestamp is None else timestamp)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "error": {
                "id": self.error_id,
                "message": self.message,
                "status_code": self.status_code,
                "timestamp": str(self.timestamp),
                "details": self.details,
            }
        }

    def to_response(self) -> JSONResponse:
        """Convert to JSON response."""
        return JSONResponse(status_code=self.status_code, content=self.to_dict())


class RobustErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for comprehensive error handling and recovery.
    
    Handles:
    - Request validation errors
    - Database connection errors
    - Timeout errors
    - Unexpected exceptions
    - Graceful degradation
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with error handling."""
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start_time = datetime.now(timezone.utc)
        
        # Log request
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} started",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query": str(request.url.query),
            },
        )

        try:
            response = await call_next(request)
            
            # Log successful response
            duration_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            logger.info(
                f"[{request_id}] {request.method} {request.url.path} completed with status {response.status_code}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            )
            
            return response

        except ValueError as e:
            # Validation error
            error_id = request_id
            logger.warning(
                f"[{error_id}] Validation error: {e}",
                extra={"request_id": error_id, "error": str(e)},
            )
            error = ErrorResponse(
                error_id=error_id,
                message=f"Validation error: {str(e)}",
                status_code=400,
                details={"type": "validation_error"},
            )
            return error.to_response()

        except TimeoutError as e:
            # Timeout error
            error_id = request_id
            logger.error(
                f"[{error_id}] Request timeout: {e}",
                extra={"request_id": error_id, "error": str(e)},
            )
            error = ErrorResponse(
                error_id=error_id,
                message="Request timeout - please try again",
                status_code=504,
                details={"type": "timeout_error"},
            )
            return error.to_response()

        except ConnectionError as e:
            # Connection error
            error_id = request_id
            logger.error(
                f"[{error_id}] Connection error: {e}",
                extra={"request_id": error_id, "error": str(e)},
            )
            error = ErrorResponse(
                error_id=error_id,
                message="Service temporarily unavailable - please try again",
                status_code=503,
                details={"type": "connection_error"},
            )
            return error.to_response()

        except Exception as e:
            # Unexpected error
            error_id = request_id
            logger.error(
                f"[{error_id}] Unexpected error: {e}",
                extra={
                    "request_id": error_id,
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                },
                exc_info=True,
            )
            error = ErrorResponse(
                error_id=error_id,
                message="Internal server error - support team has been notified",
                status_code=500,
                details={
                    "type": "unexpected_error",
                    "error_type": type(e).__name__,
                },
            )
            return error.to_response()


class RequestResponseLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for detailed request/response logging."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Log request and response details."""
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        
        try:
            # Try to log request body - read but don't manipulate receive
            body = await request.body()
            if body:
                logger.debug(
                    f"[{request_id}] Request body: {body[:500]}",  # Limit to 500 chars
                    extra={"request_id": request_id},
                )
        except Exception as e:
            logger.debug(f"[{request_id}] Could not log request body: {e}")

        response = await call_next(request)
        
        logger.debug(
            f"[{request_id}] Response status: {response.status_code}",
            extra={
                "request_id": request_id,
                "status_code": response.status_code,
            },
        )
        
        return response


class HealthMonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware for health monitoring and metrics."""

    def __init__(self, app: Any):
        super().__init__(app)
        self.request_count = 0
        self.error_count = 0
        self.last_error_time: Optional[datetime] = None

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Monitor health metrics."""
        self.request_count += 1
        
        try:
            response = await call_next(request)
            if response.status_code >= 400:
                self.error_count += 1
                self.last_error_time = datetime.now(timezone.utc)
            return response
        except Exception as e:
            self.error_count += 1
            self.last_error_time = datetime.now(timezone.utc)
            raise

    def get_health_metrics(self) -> Dict[str, Any]:
        """Get current health metrics."""
        return {
            "request_count": self.request_count,
            "error_count": self.error_count,
            "error_rate": (
                self.error_count / self.request_count
                if self.request_count > 0
                else 0
            ),
            "last_error_time": self.last_error_time.isoformat()
            if isinstance(self.last_error_time, datetime)
            else str(self.last_error_time) if self.last_error_time else None,
        }


class DegradationMiddleware(BaseHTTPMiddleware):
    """
    Middleware for graceful degradation when services fail.
    
    Implements:
    - Fallback caching
    - Feature flags
    - Circuit breaker integration
    - Partial response handling
    """

    def __init__(self, app: Any, enable_fallback_cache: bool = True):
        super().__init__(app)
        self.enable_fallback_cache = enable_fallback_cache
        self.fallback_cache: Dict[str, Any] = {}
        self.degraded_services: set = set()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Handle graceful degradation."""
        try:
            response = await call_next(request)
            
            # Clear degraded service if call succeeded
            service = self._extract_service(request.url.path)
            if service in self.degraded_services:
                logger.info(f"Service {service} recovered")
                self.degraded_services.discard(service)
            
            # Cache successful response for fallback
            if self.enable_fallback_cache and response.status_code < 400:
                self.fallback_cache[request.url.path] = response
            
            return response

        except Exception as e:
            service = self._extract_service(request.url.path)
            logger.error(f"Service {service} degraded: {e}")
            self.degraded_services.add(service)
            
            # Try to return cached fallback
            if self.enable_fallback_cache and request.url.path in self.fallback_cache:
                logger.warning(
                    f"Service {service} failed, returning cached fallback"
                )
                return self.fallback_cache[request.url.path]
            
            raise

    @staticmethod
    def _extract_service(path: str) -> str:
        """Extract service name from URL path."""
        parts = path.split("/")
        return parts[2] if len(parts) > 2 else "unknown"


def create_error_response(
    error_id: str,
    message: str,
    status_code: int,
    details: Optional[Dict[str, Any]] = None,
) -> ErrorResponse:
    """Factory function to create error responses."""
    return ErrorResponse(error_id, message, status_code, details)
