/**
 * Thermal Source Domain Service
 * Handles all thermal source operations, queries, and validations
 * Encapsulates business logic for thermal data management
 */

import type { ThermalSource, CityMapData } from "../../lib/types";
import { formatTemperature, formatWithUnit } from "../../lib/formatting";
import { THERMAL_SOURCE_CONFIG } from "../../lib/constants";

/**
 * Thermal source service for domain logic
 */
export class ThermalSourceService {
  /**
   * Find the active thermal source from the data
   */
  static getActiveThermalSource(data: CityMapData | null, activeThermalSourceId: string | null): ThermalSource | null {
    if (!data || !activeThermalSourceId) return null;
    return data.thermalSources.find((source) => source.id === activeThermalSourceId) ?? null;
  }

  /**
   * Get all available thermal sources
   */
  static getAllThermalSources(data: CityMapData | null): ThermalSource[] {
    if (!data) return [];
    return data.thermalSources || [];
  }

  /**
   * Check if thermal source has valid temperature data
   */
  static isValid(source: ThermalSource | null): boolean {
    if (!source) return false;
    return (
      typeof source.meanTempC === "number" &&
      typeof source.minTempC === "number" &&
      typeof source.maxTempC === "number" &&
      !Number.isNaN(source.meanTempC) &&
      !Number.isNaN(source.minTempC) &&
      !Number.isNaN(source.maxTempC)
    );
  }

  /**
   * Validate temperature values for a thermal source
   */
  static validateTemperatures(source: ThermalSource): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof source.meanTempC !== "number" || Number.isNaN(source.meanTempC)) {
      errors.push("Invalid mean temperature");
    }

    if (typeof source.minTempC !== "number" || Number.isNaN(source.minTempC)) {
      errors.push("Invalid minimum temperature");
    }

    if (typeof source.maxTempC !== "number" || Number.isNaN(source.maxTempC)) {
      errors.push("Invalid maximum temperature");
    }

    if (source.minTempC > source.meanTempC || source.meanTempC > source.maxTempC) {
      errors.push("Temperature range is invalid (min > mean or mean > max)");
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate threshold temperature for a thermal source
   */
  static validateThreshold(source: ThermalSource): boolean {
    if (typeof source.thresholdTempC !== "number") return false;
    return source.thresholdTempC >= source.minTempC && source.thresholdTempC <= source.maxTempC;
  }

  /**
   * Check if thermal source data is recent
   */
  static isRecent(source: ThermalSource, maxAgeMs: number = 86400000): boolean {
    // All thermal sources are considered current if they exist
    return !!source;
  }

  /**
   * Get human-readable summary of thermal source
   */
  static getSummary(source: ThermalSource | null): string {
    if (!source) return "No thermal source available";
    return `${source.sourceName} by ${source.provider}. Resolution ${source.resolutionM}m. ` +
      `Temperature range ${formatTemperature(source.minTempC)} to ${formatTemperature(source.maxTempC)}. ` +
      `Corridor threshold: ${formatTemperature(source.thresholdTempC)}`;
  }

  /**
   * Get metadata string for display
   */
  static getMetadataString(source: ThermalSource | null): string {
    if (!source) return "";
    const quantilePercent = Math.round((1 - source.corridorQuantile) * 100);
    return `Corridor threshold ${formatTemperature(source.thresholdTempC)} at the top ${quantilePercent}% hottest cells`;
  }

  /**
   * Check if opacity value is valid
   */
  static isValidOpacity(opacity: number): boolean {
    return opacity >= THERMAL_SOURCE_CONFIG.OPACITY_MIN && opacity <= THERMAL_SOURCE_CONFIG.OPACITY_MAX;
  }

  /**
   * Clamp opacity to valid range
   */
  static clampOpacity(opacity: number): number {
    return Math.max(THERMAL_SOURCE_CONFIG.OPACITY_MIN, Math.min(THERMAL_SOURCE_CONFIG.OPACITY_MAX, opacity));
  }

  /**
   * Format thermal source for display in tooltips
   */
  static formatForTooltip(source: ThermalSource): string {
    return `${source.sourceName} - ${formatTemperature(source.meanTempC)} mean temperature`;
  }

  /**
   * Get temperature range formatted as string
   */
  static getTemperatureRangeString(source: ThermalSource): string {
    return `${formatTemperature(source.minTempC)} to ${formatTemperature(source.maxTempC)}`;
  }

  /**
   * Check if two thermal sources are the same
   */
  static areEqual(source1: ThermalSource | null, source2: ThermalSource | null): boolean {
    if (!source1 || !source2) return source1 === source2;
    return source1.id === source2.id;
  }

  /**
   * Sort thermal sources by name
   */
  static sortByName(sources: ThermalSource[]): ThermalSource[] {
    return [...sources].sort((a, b) => a.sourceName.localeCompare(b.sourceName));
  }

  /**
   * Filter thermal sources by provider
   */
  static filterByProvider(sources: ThermalSource[], provider: string): ThermalSource[] {
    return sources.filter((s) => s.provider === provider);
  }

  /**
   * Get unique providers from thermal sources
   */
  static getUniqueProviders(sources: ThermalSource[]): string[] {
    return [...new Set(sources.map((s) => s.provider))];
  }
}
