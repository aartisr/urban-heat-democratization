/**
 * Comprehensive formatting utilities for numeric and data display
 * Provides safe, defensive formatting with proper null/undefined handling
 */

/**
 * Safely format a number to fixed decimal places
 * Returns "—" (em-dash) for undefined/null/NaN values
 * @param value - The value to format
 * @param digits - Number of decimal places (default: 1)
 * @returns Formatted string or "—" if value is invalid
 */
export function safeToFixed(value: unknown, digits: number = 1): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  return Number.isNaN(num) ? "—" : num.toFixed(digits);
}

/**
 * Safely format a number to fixed decimal places, with optional suffix
 * @param value - The value to format
 * @param digits - Number of decimal places
 * @param suffix - Optional suffix (e.g., "°C", "%")
 * @returns Formatted string with suffix or "—"
 */
export function formatWithUnit(value: unknown, digits: number, suffix: string): string {
  const formatted = safeToFixed(value, digits);
  return formatted === "—" ? "—" : `${formatted}${suffix}`;
}

/**
 * Safely format a temperature value
 * @param celsius - Temperature in Celsius
 * @returns Formatted string like "25.3°C"
 */
export function formatTemperature(celsius: unknown): string {
  return formatWithUnit(celsius, 1, "°C");
}

/**
 * Safely format a percentage value
 * @param value - Decimal value (0-1 or 0-100 based on scale parameter)
 * @param scale - If 1, value is 0-1; if 100, value is 0-100 (default: 1)
 * @return Formatted string like "42.5%"
 */
export function formatPercentage(value: unknown, scale: 1 | 100 = 1): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  const percent = scale === 1 ? num * 100 : num;
  return `${percent.toFixed(1)}%`;
}

/**
 * Safely format a score value (typically 0-10)
 * @param score - The score value
 * @param maxScore - Maximum score (default: 10)
 * @returns Formatted string like "7.5 / 10"
 */
export function formatScore(score: unknown, maxScore: number = 10): string {
  if (score === null || score === undefined) return "—";
  const num = Number(score);
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(1)} / ${maxScore}`;
}

/**
 * Format a score as a simple decimal with optional label
 * @param score - The score value
 * @param digits - Decimal places (default: 1)
 * @returns Formatted string like "7.5"
 */
export function formatScoreSimple(score: unknown, digits: number = 1): string {
  return safeToFixed(score, digits);
}

/**
 * Safely format currency (USD)
 * @param value - Value in dollars
 * @returns Formatted string like "$1,234.56"
 */
export function formatCurrency(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `$${num.toLocaleString()}`;
}

/**
 * Safely format a large number with comma separators
 * @param value - The numeric value
 * @returns Formatted string with commas
 */
export function formatNumber(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString();
}

/**
 * Classify a numeric score into a label
 * @param value - Score value (0-10 assumed)
 * @returns "High", "Medium", or "Low"
 */
export function scoreToLabel(value: unknown): string {
  if (value === null || value === undefined) return "Unknown";
  const num = Number(value);
  if (Number.isNaN(num)) return "Unknown";
  if (num >= 8) return "High";
  if (num >= 5) return "Medium";
  return "Low";
}

/**
 * Format a numeric array as a range
 * @param values - Array of numeric values
 * @param digits - Decimal places (default: 1)
 * @returns Formatted range like "10.5 to 25.3"
 */
export function formatRange(values: unknown[], digits: number = 1): string {
  if (!Array.isArray(values) || values.length === 0) return "—";
  const nums = values.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return "—";
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return `${min.toFixed(digits)}`;
  return `${min.toFixed(digits)} to ${max.toFixed(digits)}`;
}

/**
 * Safely format a longitude/latitude coordinate
 * @param coord - The coordinate value
 * @param digits - Decimal places (default: 4)
 * @returns Formatted coordinate string
 */
export function formatCoordinate(coord: unknown, digits: number = 4): string {
  return safeToFixed(coord, digits);
}

/**
 * Format a priority/readiness signal
 * @param value - Signal value
 * @param digits - Decimal places (default: 1)
 * @returns Formatted signal value
 */
export function formatSignal(value: unknown, digits: number = 1): string {
  return safeToFixed(value, digits);
}

/**
 * Safely format a boolean or falsy value as human-readable text
 * @param value - The value to format
 * @param trueLabel - Label for true (default: "Yes")
 * @param falseLabel - Label for false (default: "No")
 * @returns Formatted string
 */
export function formatBoolean(value: unknown, trueLabel = "Yes", falseLabel = "No"): string {
  if (value === null || value === undefined) return "—";
  return value ? trueLabel : falseLabel;
}

/**
 * Format a numeric list as comma-separated values with optional precision
 * @param values - Array of values
 * @param digits - Decimal places
 * @returns Formatted string like "1.5, 2.3, 3.1"
 */
export function formatNumericList(values: unknown[], digits: number = 1): string {
  if (!Array.isArray(values) || values.length === 0) return "—";
  const formatted = values
    .map((v) => safeToFixed(v, digits))
    .filter((s) => s !== "—");
  return formatted.length === 0 ? "—" : formatted.join(", ");
}

/**
 * Format a time duration in seconds to human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2h 30m" or "45s"
 */
export function formatDuration(seconds: unknown): string {
  if (seconds === null || seconds === undefined) return "—";
  const num = Number(seconds);
  if (Number.isNaN(num) || num < 0) return "—";

  if (num < 60) return `${Math.round(num)}s`;
  if (num < 3600) return `${Math.round(num / 60)}m`;

  const hours = Math.floor(num / 3600);
  const minutes = Math.round((num % 3600) / 60);
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Truncate a string to a maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default: 50)
 * @return Truncated string
 */
export function truncateText(text: unknown, maxLength: number = 50): string {
  if (typeof text !== "string") return "—";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}…`;
}
