/**
 * Validation Utilities Service
 * Provides comprehensive data validation for all domain entities
 * Ensures data integrity and type safety
 */

import type { CityMapData, CityMapOverlay, ThermalSource, ScenarioRecord } from "../../lib/types";
import { VALIDATION } from "../../lib/constants";

/**
 * Result of validation operation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validation service for data integrity checks
 */
export class ValidationService {
  /**
   * Validate coordinate values
   */
  static validateCoordinate(lng: unknown, lat: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof lng !== "number" || Number.isNaN(lng)) {
      errors.push("Longitude must be a valid number");
    } else if (lng < VALIDATION.MIN_LONGITUDE || lng > VALIDATION.MAX_LONGITUDE) {
      errors.push(`Longitude must be between ${VALIDATION.MIN_LONGITUDE} and ${VALIDATION.MAX_LONGITUDE}`);
    }

    if (typeof lat !== "number" || Number.isNaN(lat)) {
      errors.push("Latitude must be a valid number");
    } else if (lat < VALIDATION.MIN_LATITUDE || lat > VALIDATION.MAX_LATITUDE) {
      errors.push(`Latitude must be between ${VALIDATION.MIN_LATITUDE} and ${VALIDATION.MAX_LATITUDE}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate temperature value
   */
  static validateTemperature(value: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push("Temperature must be a valid number");
    } else {
      if (value < VALIDATION.MIN_TEMPERATURE) {
        warnings.push(`Temperature ${value}°C is unusually cold`);
      }
      if (value > VALIDATION.MAX_TEMPERATURE) {
        warnings.push(`Temperature ${value}°C is unusually hot`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate score value
   */
  static validateScore(value: unknown, min: number = VALIDATION.MIN_SCORE, max: number = VALIDATION.MAX_SCORE): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (value !== null && value !== undefined) {
      if (typeof value !== "number" || Number.isNaN(value)) {
        errors.push("Score must be a valid number");
      } else if (value < min || value > max) {
        errors.push(`Score must be between ${min} and ${max}`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate overlay object
   */
  static validateOverlay(overlay: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof overlay !== "object" || overlay === null) {
      errors.push("Overlay must be an object");
      return { valid: false, errors, warnings };
    }

    const obj = overlay as Record<string, unknown>;

    if (!obj.id || typeof obj.id !== "string") {
      errors.push("Overlay must have a valid ID");
    }

    if (!obj.label || typeof obj.label !== "string") {
      errors.push("Overlay must have a valid label");
    }

    if (!obj.scoreClass || typeof obj.scoreClass !== "string") {
      errors.push("Overlay must have a valid score class");
    }

    if (obj.score !== null && obj.score !== undefined) {
      const scoreValidation = this.validateScore(obj.score);
      errors.push(...scoreValidation.errors);
      warnings.push(...scoreValidation.warnings);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate thermal source object
   */
  static validateThermalSource(source: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof source !== "object" || source === null) {
      errors.push("Thermal source must be an object");
      return { valid: false, errors, warnings };
    }

    const obj = source as Record<string, unknown>;

    if (!obj.id || typeof obj.id !== "string") {
      errors.push("Thermal source must have a valid ID");
    }

    if (!obj.sourceName || typeof obj.sourceName !== "string") {
      errors.push("Thermal source must have a valid name");
    }

    // Validate temperatures
    const tempValidations = {
      meanTempC: this.validateTemperature(obj.meanTempC),
      minTempC: this.validateTemperature(obj.minTempC),
      maxTempC: this.validateTemperature(obj.maxTempC),
      thresholdTempC: this.validateTemperature(obj.thresholdTempC),
    };

    for (const [key, validation] of Object.entries(tempValidations)) {
      errors.push(...validation.errors.map((e) => `${key}: ${e}`));
      warnings.push(...validation.warnings.map((w) => `${key}: ${w}`));
    }

    // Check temperature ordering
    if (typeof obj.minTempC === "number" && typeof obj.meanTempC === "number" && typeof obj.maxTempC === "number") {
      if (obj.minTempC > obj.meanTempC) {
        errors.push("Minimum temperature cannot be greater than mean temperature");
      }
      if (obj.meanTempC > obj.maxTempC) {
        errors.push("Mean temperature cannot be greater than maximum temperature");
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate scenario object
   */
  static validateScenario(scenario: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof scenario !== "object" || scenario === null) {
      errors.push("Scenario must be an object");
      return { valid: false, errors, warnings };
    }

    const obj = scenario as Record<string, unknown>;

    if (!obj.id || typeof obj.id !== "string") {
      errors.push("Scenario must have a valid ID");
    }

    if (!obj.planningMode || typeof obj.planningMode !== "string") {
      errors.push("Scenario must have a valid planning mode");
    }

    if (!Array.isArray(obj.actions)) {
      errors.push("Scenario must have an actions array");
    }

    // Validate cost if present
    if (obj.estimatedCostUsd !== null && obj.estimatedCostUsd !== undefined) {
      if (typeof obj.estimatedCostUsd !== "number" || Number.isNaN(obj.estimatedCostUsd)) {
        errors.push("Estimated cost must be a valid number");
      } else if (obj.estimatedCostUsd < 0) {
        errors.push("Estimated cost cannot be negative");
      }
    }

    // Validate heat reduction if present
    if (obj.heatReductionC !== null && obj.heatReductionC !== undefined) {
      const reduction = this.validateTemperature(obj.heatReductionC);
      errors.push(...reduction.errors.map((e) => `Heat reduction: ${e}`));
      if (typeof obj.heatReductionC === "number" && obj.heatReductionC < 0) {
        errors.push("Heat reduction cannot be negative");
      }
    }

    // Validate equity score if present
    if (obj.equityScore !== null && obj.equityScore !== undefined) {
      const scoreValidation = this.validateScore(obj.equityScore);
      errors.push(...scoreValidation.errors.map((e) => `Equity score: ${e}`));
      warnings.push(...scoreValidation.warnings.map((w) => `Equity score: ${w}`));
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate CityMapData
   */
  static validateCityMapData(data: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof data !== "object" || data === null) {
      errors.push("City map data must be an object");
      return { valid: false, errors, warnings };
    }

    const obj = data as Record<string, unknown>;

    if (!Array.isArray(obj.overlays)) {
      errors.push("City map data must have overlays array");
    } else {
      for (let i = 0; i < (obj.overlays as unknown[]).length; i++) {
        const overlayValidation = this.validateOverlay((obj.overlays as unknown[])[i]);
        if (!overlayValidation.valid) {
          errors.push(`Overlay ${i}: ${overlayValidation.errors.join(", ")}`);
        }
        warnings.push(...overlayValidation.warnings.map((w) => `Overlay ${i}: ${w}`));
      }
    }

    if (!Array.isArray(obj.thermalSources)) {
      errors.push("City map data must have thermal sources array");
    } else {
      for (let i = 0; i < (obj.thermalSources as unknown[]).length; i++) {
        const sourceValidation = this.validateThermalSource((obj.thermalSources as unknown[])[i]);
        if (!sourceValidation.valid) {
          errors.push(`Thermal source ${i}: ${sourceValidation.errors.join(", ")}`);
        }
        warnings.push(...sourceValidation.warnings.map((w) => `Thermal source ${i}: ${w}`));
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Check if validation result indicates success
   */
  static isSuccess(result: ValidationResult): boolean {
    return result.valid && result.errors.length === 0;
  }

  /**
   * Check if validation has only warnings (data is usable)
   */
  static isUsable(result: ValidationResult): boolean {
    return result.valid;
  }

  /**
   * Get validation status as string
   */
  static getStatusString(result: ValidationResult): string {
    if (result.valid && result.warnings.length === 0) return "Valid";
    if (result.valid && result.warnings.length > 0) return "Valid with warnings";
    return "Invalid";
  }

  /**
   * Merge multiple validation results
   */
  static merge(...results: ValidationResult[]): ValidationResult {
    return {
      valid: results.every((r) => r.valid),
      errors: results.flatMap((r) => r.errors),
      warnings: results.flatMap((r) => r.warnings),
    };
  }
}
