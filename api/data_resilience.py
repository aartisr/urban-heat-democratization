"""
Data Resilience & Normalization Layer

Provides reusable, proactive utilities for:
1. Normalizing data to match expected schemas
2. Ensuring required fields are always present
3. Providing sensible defaults for missing data
4. Validating data integrity at API boundaries
5. Handling type mismatches gracefully

This layer prevents cascading errors from incomplete or malformed data
propagating through the application stack.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, TypeVar, Generic, Callable, Optional
from functools import wraps
import logging

logger = logging.getLogger(__name__)

T = TypeVar("T")


class DataSchema(Generic[T]):
    """Base schema for normalizing and validating data against expected structure."""

    def __init__(self, name: str, required_fields: dict[str, Any], defaults: dict[str, Any]):
        self.name = name
        self.required_fields = required_fields  # Field name -> type
        self.defaults = defaults  # Field name -> default value

    def normalize(self, record: dict[str, Any]) -> dict[str, Any]:
        """Normalize a record to match schema, ensuring all required fields exist."""
        normalized = {}

        for field_name, field_type in self.required_fields.items():
            value = record.get(field_name)

            # If field is missing, use default
            if value is None:
                default = self.defaults.get(field_name)
                normalized[field_name] = self._apply_default(default, field_type)
                if default is None:
                    logger.warning(
                        f"[{self.name}] Field '{field_name}' missing from record (id={record.get('id', 'unknown')}), "
                        f"using default: {normalized[field_name]}"
                    )
            else:
                # Validate and coerce type
                normalized[field_name] = self._coerce_type(value, field_type, field_name, record.get("id", "unknown"))

        # Preserve any extra fields not in schema
        for key, value in record.items():
            if key not in normalized:
                normalized[key] = value

        return normalized

    @staticmethod
    def _coerce_type(value: Any, expected_type: type, field_name: str, record_id: str) -> Any:
        """Coerce value to expected type, with safety guards."""
        if value is None:
            return value

        # String coercion
        if expected_type == str:
            if isinstance(value, str):
                return value
            # Safety: Convert to string if not already
            try:
                return str(value)
            except Exception as e:
                logger.error(f"Failed to coerce field '{field_name}' to str in record {record_id}: {e}")
                return ""

        # List coercion
        elif expected_type == list:
            if isinstance(value, list):
                return value
            elif value is None:
                return []
            else:
                # Try to make it a list
                try:
                    return [value] if value else []
                except Exception:
                    logger.warning(f"Failed to coerce field '{field_name}' to list in record {record_id}")
                    return []

        # Numeric coercion
        elif expected_type in (int, float):
            if isinstance(value, (int, float)):
                return value
            try:
                return expected_type(value)
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to coerce field '{field_name}' to {expected_type.__name__} in record {record_id}: {e}")
                return 0 if expected_type == int else 0.0

        # Boolean coercion
        elif expected_type == bool:
            if isinstance(value, bool):
                return value
            return bool(value)

        # Dict coercion
        elif expected_type == dict:
            if isinstance(value, dict):
                return value
            return {}

        # Already correct type
        return value

    @staticmethod
    def _apply_default(default: Any, field_type: type) -> Any:
        """Apply default value, calling it if it's a callable."""
        if callable(default):
            return default()
        return default


# Predefined schemas for common data types

RUN_RECORD_SCHEMA = DataSchema(
    name="RunRecord",
    required_fields={
        "id": str,
        "cityId": str,
        "scenario": str,
        "queueJobId": str,
        "status": str,
        "progress": int,
        "updatedAt": str,
        "outputs": list,
        "summary": str,
        "outputArtifactIds": list,
        "logs": list,
    },
    defaults={
        "id": "",
        "cityId": "",
        "scenario": "",
        "queueJobId": None,
        "status": "queued",
        "progress": 0,
        "updatedAt": lambda: datetime.now(timezone.utc).isoformat(),
        "outputs": [],
        "summary": "",
        "outputArtifactIds": [],
        "logs": [],
    },
)

SCENARIO_RECORD_SCHEMA = DataSchema(
    name="ScenarioRecord",
    required_fields={
        "id": str,
        "cityId": str,
        "name": str,
        "description": str,
        "createdAt": str,
        "updatedAt": str,
        "interventions": list,
    },
    defaults={
        "id": "",
        "cityId": "",
        "name": "",
        "description": "",
        "createdAt": lambda: datetime.now(timezone.utc).isoformat(),
        "updatedAt": lambda: datetime.now(timezone.utc).isoformat(),
        "interventions": [],
    },
)

CITY_PROFILE_SCHEMA = DataSchema(
    name="CityProfile",
    required_fields={
        "id": str,
        "name": str,
        "region": str,
        "population": int,
        "baseline_temp_c": float,
        "canopy_coverage": float,
    },
    defaults={
        "id": "",
        "name": "Unknown City",
        "region": "Unknown Region",
        "population": 0,
        "baseline_temp_c": 20.0,
        "canopy_coverage": 0.0,
    },
)

COST_SOURCE_SCHEMA = DataSchema(
    name="CostSource",
    required_fields={
        "id": str,
        "name": str,
        "costPerUnit": float,
        "unit": str,
        "category": str,
    },
    defaults={
        "id": "",
        "name": "Unknown Cost Source",
        "costPerUnit": 0.0,
        "unit": "unit",
        "category": "other",
    },
)

INTERVENTION_SCHEMA = DataSchema(
    name="InterventionRecord",
    required_fields={
        "id": str,
        "name": str,
        "description": str,
        "costSourceId": str,
        "unitsPerHectare": float,
        "costPerUnit": float,
    },
    defaults={
        "id": "",
        "name": "Unknown Intervention",
        "description": "",
        "costSourceId": "",
        "unitsPerHectare": 0.0,
        "costPerUnit": 0.0,
    },
)


def normalize_records(records: list[dict[str, Any]], schema: DataSchema) -> list[dict[str, Any]]:
    """Normalize a list of records against a schema."""
    return [schema.normalize(record) for record in records]


def normalize_response(schema: DataSchema) -> Callable:
    """Decorator to normalize endpoint response against a schema."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            result = await func(*args, **kwargs)
            if isinstance(result, list):
                return normalize_records(result, schema)
            elif isinstance(result, dict):
                # Check if it's a wrapped response like {runs: [...]}
                for key, value in result.items():
                    if isinstance(value, list) and value and isinstance(value[0], dict):
                        result[key] = normalize_records(value, schema)
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            result = func(*args, **kwargs)
            if isinstance(result, list):
                return normalize_records(result, schema)
            elif isinstance(result, dict):
                for key, value in result.items():
                    if isinstance(value, list) and value and isinstance(value[0], dict):
                        result[key] = normalize_records(value, schema)
            return result

        # Determine if original function is async
        import inspect

        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def ensure_field(record: dict[str, Any], field: str, default: Any = None, coerce_type: type | None = None) -> Any:
    """Safely get a field from a record with optional type coercion."""
    value = record.get(field, default)
    if coerce_type and value is not None:
        return DataSchema._coerce_type(value, coerce_type, field, record.get("id", "unknown"))
    return value


def ensure_fields(record: dict[str, Any], fields: dict[str, tuple[Any, type | None]]) -> dict[str, Any]:
    """Safely get multiple fields from a record."""
    result = {}
    for field_name, (default, coerce_type) in fields.items():
        result[field_name] = ensure_field(record, field_name, default, coerce_type)
    return result


def safe_sort(
    items: list[Any], key_func: Callable[[Any], Any], reverse: bool = False, fallback_value: Any = None
) -> list[Any]:
    """
    Safely sort items, handling None/missing values gracefully.

    Args:
        items: List to sort
        key_func: Function to extract sort key from each item
        reverse: Sort in reverse order
        fallback_value: Value to use if key_func returns None (defaults to empty string)

    Returns:
        Sorted list
    """
    if fallback_value is None:
        fallback_value = ""

    def safe_key(item: Any) -> Any:
        try:
            value = key_func(item)
            if value is None:
                return fallback_value
            return value
        except Exception as e:
            logger.warning(f"Error extracting sort key from {item}: {e}")
            return fallback_value

    try:
        return sorted(items, key=safe_key, reverse=reverse)
    except Exception as e:
        logger.error(f"Error sorting items: {e}")
        return items


def validate_string_comparison(value: str | None, default: str = "") -> str:
    """
    Validate that a value is a string suitable for comparison operations.

    This prevents errors like "Cannot read properties of undefined (reading 'localeCompare')".
    """
    if value is None or not isinstance(value, str):
        logger.warning(f"Expected string for comparison, got {type(value).__name__}: {value}")
        return default
    return value
