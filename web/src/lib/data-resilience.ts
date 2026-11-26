/**
 * Frontend Data Resilience & Normalization Layer
 * 
 * Provides reusable utilities for:
 * 1. Safe string comparisons (prevents "Cannot read properties of undefined" errors)
 * 2. Safe sorting with null/undefined handling
 * 3. Safe property access with defaults
 * 4. Type coercion and validation
 * 5. Defensive data normalization
 */

/**
 * Safely compare two values using localeCompare.
 * Returns a number suitable for use in sort functions.
 * 
 * @param a - First value (string or possibly undefined)
 * @param b - Second value (string or possibly undefined)
 * @param fallback - Fallback value if comparison fails (default: "")
 * @returns Number for sort comparison (-1, 0, or 1)
 */
export function safeLocaleCompare(
  a: string | undefined | null,
  b: string | undefined | null,
  fallback = ""
): number {
  const aStr = typeof a === "string" ? a : fallback;
  const bStr = typeof b === "string" ? b : fallback;
  try {
    return bStr.localeCompare(aStr);
  } catch (error) {
    console.warn(`Error in safeLocaleCompare: comparing "${aStr}" and "${bStr}"`, error);
    return 0;
  }
}

/**
 * Safely compare two values using localeCompare (reversed).
 * Useful for reverse sorting.
 * 
 * @param a - First value
 * @param b - Second value
 * @param fallback - Fallback value if comparison fails
 * @returns Number for sort comparison
 */
export function safeLocaleCompareReverse(
  a: string | undefined | null,
  b: string | undefined | null,
  fallback = ""
): number {
  return safeLocaleCompare(b, a, fallback);
}

/**
 * Safely sort an array of objects by a string property.
 * Handles undefined/null values gracefully.
 * 
 * @param items - Array to sort
 * @param keyFn - Function to extract sort key from item
 * @param reverse - Sort in reverse (default: false)
 * @returns Sorted array
 */
export function safeSortByString<T>(
  items: T[],
  keyFn: (item: T) => string | undefined | null,
  reverse = false
): T[] {
  if (!items || items.length === 0) return items;

  try {
    return [...items].sort((a, b) => {
      const aVal = keyFn(a);
      const bVal = keyFn(b);

      const aStr = typeof aVal === "string" ? aVal : "";
      const bStr = typeof bVal === "string" ? bVal : "";

      const result = bStr.localeCompare(aStr);
      return reverse ? -result : result;
    });
  } catch (error) {
    console.error("Error sorting items by string", error);
    return items;
  }
}

/**
 * Safely sort an array of objects by a numeric property.
 * Handles undefined/null values gracefully.
 * 
 * @param items - Array to sort
 * @param keyFn - Function to extract sort key from item
 * @param reverse - Sort in reverse (default: false)
 * @returns Sorted array
 */
export function safeSortByNumber<T>(
  items: T[],
  keyFn: (item: T) => number | undefined | null,
  reverse = false
): T[] {
  if (!items || items.length === 0) return items;

  try {
    return [...items].sort((a, b) => {
      const aVal = keyFn(a) ?? 0;
      const bVal = keyFn(b) ?? 0;
      const result = bVal - aVal;
      return reverse ? -result : result;
    });
  } catch (error) {
    console.error("Error sorting items by number", error);
    return items;
  }
}

/**
 * Safely get a property from an object with a default fallback.
 * 
 * @param obj - Object to get from
 * @param key - Property key
 * @param defaultValue - Default if undefined/null
 * @returns Property value or default
 */
export function safeGet<T, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  defaultValue: T[K] | null = null
): T[K] | null {
  if (!obj || typeof obj !== "object") return defaultValue;
  const value = obj[key];
  return value ?? defaultValue;
}

/**
 * Safely get a nested property using dot notation.
 * 
 * @param obj - Object to get from
 * @param path - Dot-separated path (e.g., "user.profile.name")
 * @param defaultValue - Default if path doesn't exist
 * @returns Property value or default
 */
export function safeGetNested(
  obj: any,
  path: string,
  defaultValue: any = null
): any {
  try {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current == null || typeof current !== "object") {
        return defaultValue;
      }
      current = current[key];
    }

    return current ?? defaultValue;
  } catch (error) {
    console.warn(`Error accessing nested property "${path}"`, error);
    return defaultValue;
  }
}

/**
 * Ensure a value is of the expected type, with coercion if needed.
 * 
 * @param value - Value to validate
 * @param expectedType - Expected type ("string", "number", "boolean", "array", "object")
 * @param fieldName - Field name for logging
 * @param defaultValue - Default if coercion fails
 * @returns Value of expected type or default
 */
export function ensureType(
  value: any,
  expectedType: "string" | "number" | "boolean" | "array" | "object",
  fieldName = "unknown",
  defaultValue: any = null
): any {
  if (value == null) {
    return defaultValue;
  }

  try {
    switch (expectedType) {
      case "string":
        if (typeof value === "string") return value;
        return String(value);

      case "number":
        if (typeof value === "number") return value;
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;

      case "boolean":
        if (typeof value === "boolean") return value;
        return Boolean(value);

      case "array":
        if (Array.isArray(value)) return value;
        return [];

      case "object":
        if (typeof value === "object" && !Array.isArray(value)) return value;
        return {};

      default:
        return value;
    }
  } catch (error) {
    console.warn(`Error ensuring type for field "${fieldName}":`, error);
    return defaultValue;
  }
}

/**
 * Normalize a data record to ensure required fields are present.
 * 
 * @param record - Record to normalize
 * @param schema - Schema defining required fields and types
 * @returns Normalized record
 */
export function normalizeRecord<T>(
  record: any,
  schema: Record<string, { type: string; default: any }>
): T {
  if (!record || typeof record !== "object") {
    return {} as T;
  }

  const normalized: any = { ...record };

  for (const [fieldName, { type, default: defaultValue }] of Object.entries(schema)) {
    if (!(fieldName in normalized) || normalized[fieldName] == null) {
      normalized[fieldName] = typeof defaultValue === "function" ? defaultValue() : defaultValue;
    } else {
      // Type coercion
      normalized[fieldName] = ensureType(normalized[fieldName], type as "string" | "number" | "boolean" | "array" | "object", fieldName, defaultValue);
    }
  }

  return normalized as T;
}

/**
 * Safely filter an array.
 * Returns empty array if input is null/undefined or not an array.
 * 
 * @param items - Array to filter
 * @param predicate - Filter predicate
 * @returns Filtered array
 */
export function safeFilter<T>(
  items: T[] | undefined | null,
  predicate: (item: T) => boolean
): T[] {
  if (!Array.isArray(items)) return [];
  try {
    return items.filter(predicate);
  } catch (error) {
    console.error("Error filtering items", error);
    return items ?? [];
  }
}

/**
 * Safely map an array.
 * Returns empty array if input is null/undefined or not an array.
 * 
 * @param items - Array to map
 * @param mapFn - Mapping function
 * @returns Mapped array
 */
export function safeMap<T, U>(
  items: T[] | undefined | null,
  mapFn: (item: T, index: number) => U
): U[] {
  if (!Array.isArray(items)) return [];
  try {
    return items.map(mapFn);
  } catch (error) {
    console.error("Error mapping items", error);
    return [];
  }
}

/**
 * Safely reduce an array.
 * Returns initial value if input is null/undefined or not an array.
 * 
 * @param items - Array to reduce
 * @param reduceFn - Reduce function
 * @param initialValue - Initial value
 * @returns Reduced value
 */
export function safeReduce<T, U>(
  items: T[] | undefined | null,
  reduceFn: (acc: U, item: T, index: number) => U,
  initialValue: U
): U {
  if (!Array.isArray(items)) return initialValue;
  try {
    return items.reduce(reduceFn, initialValue);
  } catch (error) {
    console.error("Error reducing items", error);
    return initialValue;
  }
}

/**
 * Safely parse JSON.
 * Returns default value if parsing fails.
 * 
 * @param json - JSON string to parse
 * @param defaultValue - Default if parsing fails
 * @returns Parsed object or default
 */
export function safeParseJSON<T>(json: string | undefined | null, defaultValue: T): T {
  if (!json || typeof json !== "string") return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn("Error parsing JSON", error);
    return defaultValue;
  }
}

/**
 * Safely stringify to JSON.
 * Returns empty string if stringification fails.
 * 
 * @param obj - Object to stringify
 * @returns JSON string or empty string
 */
export function safeStringifyJSON(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error("Error stringifying to JSON", error);
    return "";
  }
}

/**
 * Run a function with error handling and logging.
 * 
 * @param fn - Function to run
 * @param context - Context for error logging
 * @param defaultReturn - Default return value if function throws
 * @returns Result or default
 */
export function tryCatch<T>(
  fn: () => T,
  context = "Unknown operation",
  defaultReturn: T | null = null
): T | null {
  try {
    return fn();
  } catch (error) {
    console.error(`Error in ${context}:`, error);
    return defaultReturn;
  }
}

/**
 * Async version of tryCatch.
 * 
 * @param fn - Async function to run
 * @param context - Context for error logging
 * @param defaultReturn - Default return value if function throws
 * @returns Result or default
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  context = "Unknown operation",
  defaultReturn: T | null = null
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Error in ${context}:`, error);
    return defaultReturn;
  }
}

/**
 * Schema for RunRecord
 */
export const RUN_RECORD_SCHEMA = {
  id: { type: "string" as const, default: "" },
  cityId: { type: "string" as const, default: "" },
  scenario: { type: "string" as const, default: "" },
  queueJobId: { type: "string" as const, default: null },
  status: { type: "string" as const, default: "queued" },
  progress: { type: "number" as const, default: 0 },
  updatedAt: { type: "string" as const, default: () => new Date().toISOString() },
  outputs: { type: "array" as const, default: [] },
  summary: { type: "string" as const, default: "" },
  outputArtifactIds: { type: "array" as const, default: [] },
  logs: { type: "array" as const, default: [] },
};

/**
 * Schema for ScenarioRecord
 */
export const SCENARIO_RECORD_SCHEMA = {
  id: { type: "string" as const, default: "" },
  cityId: { type: "string" as const, default: "" },
  name: { type: "string" as const, default: "" },
  description: { type: "string" as const, default: "" },
  createdAt: { type: "string" as const, default: () => new Date().toISOString() },
  updatedAt: { type: "string" as const, default: () => new Date().toISOString() },
  interventions: { type: "array" as const, default: [] },
};
