"""Unified error contracts for the entire application.

All exceptions in the application inherit from DomainError and are
organized by semantic meaning, not technical layer. This ensures
consistent error handling across all layers.

Design principles:
- Exceptions represent domain errors, not framework details
- Each exception is specific to a use case outcome
- Exceptions never leak internal implementation details
- Logging is decoupled from exception types
"""


class DomainError(Exception):
    """Base exception for all application errors.

    All domain and application errors inherit from this. Use specific
    subclasses to represent distinct error conditions.

    Attributes:
        message: Human-readable error description
        code: Machine-readable error code for API responses
        details: Optional additional context (not exposed to clients)
    """

    def __init__(
        self,
        message: str,
        code: str = "DOMAIN_ERROR",
        details: str | None = None,
    ) -> None:
        """Initialize domain error.

        Args:
            message: Error description shown to client
            code: Machine-readable error code for API
            details: Optional context (logged, not exposed)
        """
        self.message = message
        self.code = code
        self.details = details
        super().__init__(message)

    def to_dict(self) -> dict[str, str]:
        """Convert to API response dict.

        Returns:
            Dict with 'message' and 'code' (safe for clients)
        """
        return {"message": self.message, "code": self.code}


class NotFoundError(DomainError):
    """Resource does not exist.

    Use when an operation requested a resource that could not be located.
    This always maps to HTTP 404.
    """

    def __init__(self, message: str, details: str | None = None) -> None:
        super().__init__(message, code="NOT_FOUND", details=details)


class ValidationError(DomainError):
    """Input data fails validation.

    Use when input validation fails. All details about what validation
    failed should be in the message (this is shown to the client).
    Maps to HTTP 400.
    """

    def __init__(self, message: str, details: str | None = None) -> None:
        super().__init__(message, code="VALIDATION_ERROR", details=details)


class ConflictError(DomainError):
    """State conflict prevents operation.

    Use when operation cannot proceed due to conflicting state; e.g.,
    trying to delete a resource that is in use. Maps to HTTP 409.
    """

    def __init__(self, message: str, details: str | None = None) -> None:
        super().__init__(message, code="CONFLICT", details=details)


class UnauthorizedError(DomainError):
    """User lacks permission.

    Use when user does not have permission for an operation.
    Maps to HTTP 401 or 403 depending on context.
    """

    def __init__(self, message: str, details: str | None = None) -> None:
        super().__init__(message, code="UNAUTHORIZED", details=details)


class RepositoryError(DomainError):
    """Storage/persistence error.

    Use for infrastructure errors (database connection, transaction failed, etc.).
    Should not be exposed directly to clients; wrap in a generic server error.
    """

    def __init__(self, message: str, details: str | None = None) -> None:
        super().__init__(message, code="STORAGE_ERROR", details=details)


class TimeoutError(DomainError):
    """Operation exceeded time limit.

    Use for operations that exceeded configured timeouts.
    Maps to HTTP 408 or 504.
    """

    def __init__(self, message: str, details: str | None = None) -> None:
        super().__init__(message, code="TIMEOUT", details=details)
