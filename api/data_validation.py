"""
Comprehensive data validation and sanitization for the urban heat democratization API.

Provides:
- Input validation
- Data sanitization
- Type coercion
- Range checking
- Constraint validation
"""

import re
import logging
from typing import Any, Optional, List, Dict, Union, TypeVar, cast
from decimal import Decimal
from datetime import datetime, date

logger = logging.getLogger(__name__)

T = TypeVar("T")


class ValidationError(Exception):
    """Base validation error."""

    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(f"Validation error in '{field}': {message}")


class DataValidator:
    """Comprehensive data validation."""

    @staticmethod
    def validate_string(
        value: Any,
        field_name: str,
        required: bool = True,
        min_length: Optional[int] = None,
        max_length: Optional[int] = None,
        pattern: Optional[str] = None,
    ) -> str:
        """
        Validate string value.
        
        Args:
            value: Value to validate
            field_name: Field name for error messages
            required: Whether value is required
            min_length: Minimum string length
            max_length: Maximum string length
            pattern: Regex pattern to match
            
        Returns:
            Validated string
            
        Raises:
            ValidationError: If validation fails
        """
        if value is None:
            if required:
                raise ValidationError(field_name, "Value is required")
            return ""

        if not isinstance(value, str):
            raise ValidationError(field_name, f"Expected string, got {type(value).__name__}")

        value = value.strip()

        if required and not value:
            raise ValidationError(field_name, "Value cannot be empty")

        if min_length is not None and len(value) < min_length:
            raise ValidationError(
                field_name, f"Value must be at least {min_length} characters"
            )

        if max_length is not None and len(value) > max_length:
            raise ValidationError(
                field_name, f"Value must be at most {max_length} characters"
            )

        if pattern is not None and not re.match(pattern, value):
            raise ValidationError(field_name, f"Value does not match required pattern")

        return value

    @staticmethod
    def validate_number(
        value: Any,
        field_name: str,
        required: bool = True,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        allow_negative: bool = True,
    ) -> float:
        """
        Validate numeric value.
        
        Args:
            value: Value to validate
            field_name: Field name for error messages
            required: Whether value is required
            min_value: Minimum allowed value
            max_value: Maximum allowed value
            allow_negative: Whether negative values are allowed
            
        Returns:
            Validated number
            
        Raises:
            ValidationError: If validation fails
        """
        if value is None:
            if required:
                raise ValidationError(field_name, "Value is required")
            return 0.0

        try:
            num_value = float(value)
        except (ValueError, TypeError):
            raise ValidationError(
                field_name, f"Expected number, got {type(value).__name__}"
            )

        if not allow_negative and num_value < 0:
            raise ValidationError(field_name, "Value cannot be negative")

        if min_value is not None and num_value < min_value:
            raise ValidationError(
                field_name, f"Value must be at least {min_value}"
            )

        if max_value is not None and num_value > max_value:
            raise ValidationError(
                field_name, f"Value must be at most {max_value}"
            )

        return num_value

    @staticmethod
    def validate_integer(
        value: Any,
        field_name: str,
        required: bool = True,
        min_value: Optional[int] = None,
        max_value: Optional[int] = None,
    ) -> int:
        """
        Validate integer value.
        
        Args:
            value: Value to validate
            field_name: Field name for error messages
            required: Whether value is required
            min_value: Minimum allowed value
            max_value: Maximum allowed value
            
        Returns:
            Validated integer
            
        Raises:
            ValidationError: If validation fails
        """
        num = DataValidator.validate_number(
            value, field_name, required, min_value, max_value
        )
        
        if not float(num).is_integer():
            raise ValidationError(field_name, "Value must be an integer")
        
        return int(num)

    @staticmethod
    def validate_boolean(value: Any, field_name: str) -> bool:
        """
        Validate boolean value.
        
        Args:
            value: Value to validate
            field_name: Field name for error messages
            
        Returns:
            Validated boolean
            
        Raises:
            ValidationError: If validation fails
        """
        if isinstance(value, bool):
            return value
        
        if isinstance(value, str):
            if value.lower() in ("true", "yes", "1", "on"):
                return True
            if value.lower() in ("false", "no", "0", "off"):
                return False
        
        if isinstance(value, (int, float)):
            return bool(value)
        
        raise ValidationError(field_name, f"Cannot convert {value} to boolean")

    @staticmethod
    def validate_email(value: Any, field_name: str, required: bool = True) -> str:
        """
        Validate email address.
        
        Args:
            value: Value to validate
            field_name: Field name for error messages
            required: Whether value is required
            
        Returns:
            Validated email
            
        Raises:
            ValidationError: If validation fails
        """
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return DataValidator.validate_string(
            value,
            field_name,
            required=required,
            max_length=254,
            pattern=email_pattern,
        )

    @staticmethod
    def validate_uuid(value: Any, field_name: str, required: bool = True) -> str:
        """
        Validate UUID format.
        
        Args:
            value: Value to validate
            field_name: Field name for error messages
            required: Whether value is required
            
        Returns:
            Validated UUID
            
        Raises:
            ValidationError: If validation fails
        """
        uuid_pattern = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        return DataValidator.validate_string(
            value,
            field_name,
            required=required,
            pattern=uuid_pattern,
        )

    @staticmethod
    def validate_date(value: Any, field_name: str, required: bool = True) -> date:
        """
        Validate date value.
        
        Args:
            value: Value to validate
            field_name: Field name for error messages
            required: Whether value is required
            
        Returns:
            Validated date
            
        Raises:
            ValidationError: If validation fails
        """
        if value is None:
            if required:
                raise ValidationError(field_name, "Date is required")
            return date.today()

        if isinstance(value, date):
            return value

        if isinstance(value, datetime):
            return value.date()

        if isinstance(value, str):
            for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%m-%d-%Y", "%m/%d/%Y"):
                try:
                    return datetime.strptime(value, fmt).date()
                except ValueError:
                    continue
            raise ValidationError(
                field_name, "Date must be in YYYY-MM-DD or similar format"
            )

        raise ValidationError(field_name, f"Cannot convert {type(value).__name__} to date")

    @staticmethod
    def validate_list(
        value: Any,
        field_name: str,
        required: bool = True,
        min_items: Optional[int] = None,
        max_items: Optional[int] = None,
    ) -> list:
        """
        Validate list value.
        
        Args:
            value: Value to validate
            field_name: Field name for error messages
            required: Whether value is required
            min_items: Minimum number of items
            max_items: Maximum number of items
            
        Returns:
            Validated list
            
        Raises:
            ValidationError: If validation fails
        """
        if value is None:
            if required:
                raise ValidationError(field_name, "List is required")
            return []

        if not isinstance(value, list):
            raise ValidationError(field_name, f"Expected list, got {type(value).__name__}")

        if min_items is not None and len(value) < min_items:
            raise ValidationError(
                field_name, f"List must have at least {min_items} items"
            )

        if max_items is not None and len(value) > max_items:
            raise ValidationError(
                field_name, f"List must have at most {max_items} items"
            )

        return value

    @staticmethod
    def validate_enum(
        value: Any,
        field_name: str,
        allowed_values: List[str],
        required: bool = True,
        case_sensitive: bool = True,
    ) -> str:
        """
        Validate enum value.
        
        Args:
            value: Value to validate
            field_name: Field name for error messages
            allowed_values: Allowed values
            required: Whether value is required
            case_sensitive: Whether comparison is case sensitive
            
        Returns:
            Validated value
            
        Raises:
            ValidationError: If validation fails
        """
        if value is None:
            if required:
                raise ValidationError(field_name, "Value is required")
            return allowed_values[0] if allowed_values else ""

        str_value = str(value)
        compare_value = str_value if case_sensitive else str_value.lower()
        compare_allowed = (
            allowed_values
            if case_sensitive
            else [v.lower() for v in allowed_values]
        )

        if compare_value not in compare_allowed:
            raise ValidationError(
                field_name,
                f"Value must be one of: {', '.join(allowed_values)}",
            )

        return str_value


class DataSanitizer:
    """Data sanitization utilities."""

    @staticmethod
    def sanitize_html(value: str) -> str:
        """Remove dangerous HTML characters."""
        dangerous_chars = {
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "&": "&amp;",
        }
        for char, escape in dangerous_chars.items():
            value = value.replace(char, escape)
        return value

    @staticmethod
    def sanitize_sql(value: str) -> str:
        """Remove potentially dangerous SQL characters."""
        # Remove common SQL injection patterns
        dangerous_patterns = [
            r"(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)",
            r"(;|\-\-|/\*|\*/)",
        ]
        sanitized = value
        for pattern in dangerous_patterns:
            sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)
        return sanitized

    @staticmethod
    def trim_string(value: str, max_length: int) -> str:
        """Trim string to max length."""
        return value[:max_length] if len(value) > max_length else value

    @staticmethod
    def normalize_whitespace(value: str) -> str:
        """Normalize whitespace in string."""
        return " ".join(value.split())


class BulkValidator:
    """Validate multiple items at once."""

    def __init__(self):
        self.errors: List[ValidationError] = []

    def add_error(self, field: str, message: str) -> None:
        """Add a validation error."""
        self.errors.append(ValidationError(field, message))

    def has_errors(self) -> bool:
        """Check if there are any errors."""
        return len(self.errors) > 0

    def raise_if_errors(self) -> None:
        """Raise exception if there are errors."""
        if self.has_errors():
            error_messages = {err.field: err.message for err in self.errors}
            raise ValueError(f"Validation errors: {error_messages}")

    def get_errors(self) -> Dict[str, str]:
        """Get all errors as dictionary."""
        return {err.field: err.message for err in self.errors}
