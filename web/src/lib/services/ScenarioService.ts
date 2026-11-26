/**
 * Scenario Domain Service
 * Manages scenario planning, scoring, and operations
 * Abstracts scenario-specific business logic from UI components
 */

import type { ScenarioRecord, ScenarioAction, ScenarioPlacementAnchor, ScenarioPlacementScore } from "../../lib/types";
import { formatTemperature, formatWithUnit, safeToFixed } from "../../lib/formatting";
import { SCENARIO_CONFIG } from "../../lib/constants";

/**
 * Scenario service for managing scenario business logic
 */
export class ScenarioService {
  /**
   * Validate scenario data
   */
  static isValid(scenario: ScenarioRecord | null): boolean {
    if (!scenario) return false;
    return !!(
      scenario.id &&
      scenario.planningMode &&
      Array.isArray(scenario.recommendedActions) &&
      (typeof scenario.estimatedCostUsd === "number" || scenario.estimatedCostUsd === null) &&
      (typeof scenario.heatReductionC === "number" || scenario.heatReductionC === null) &&
      (typeof scenario.equityScore === "number" || scenario.equityScore === null)
    );
  }

  /**
   * Check if scenario is complete (all required fields populated)
   */
  static isComplete(scenario: ScenarioRecord): boolean {
    return !!(
      scenario.id &&
      scenario.planningMode &&
      scenario.recommendedActions.length > 0 &&
      typeof scenario.estimatedCostUsd === "number" &&
      typeof scenario.heatReductionC === "number" &&
      typeof scenario.equityScore === "number"
    );
  }

  /**
   * Get scenario summary
   */
  static getSummary(scenario: ScenarioRecord): string {
    return `${scenario.planningMode} scenario with ${scenario.recommendedActions.length} interventions. ` +
      `Estimated cost: ${scenario.estimatedCostUsd ? `$${scenario.estimatedCostUsd.toLocaleString()}` : "TBD"}. ` +
      `Heat reduction: ${scenario.heatReductionC ? formatTemperature(scenario.heatReductionC) : "TBD"}. ` +
      `Equity score: ${scenario.equityScore ? safeToFixed(scenario.equityScore, 1) : "TBD"}`;
  }

  /**
   * Validate placement anchor
   */
  static isValidAnchor(anchor: ScenarioPlacementAnchor): boolean {
    return !!(
      anchor.layer &&
      typeof anchor.lng === "number" &&
      typeof anchor.lat === "number" &&
      !Number.isNaN(anchor.lng) &&
      !Number.isNaN(anchor.lat) &&
      anchor.lng >= -180 &&
      anchor.lng <= 180 &&
      anchor.lat >= -90 &&
      anchor.lat <= 90
    );
  }

  /**
   * Calculate distance between two anchors
   */
  static calculateAnchorDistance(anchor1: ScenarioPlacementAnchor, anchor2: ScenarioPlacementAnchor): number {
    const dLng = anchor2.lng - anchor1.lng;
    const dLat = anchor2.lat - anchor1.lat;
    return Math.sqrt(dLng * dLng + dLat * dLat);
  }

  /**
   * Check if anchors are too close together
   */
  static areAnchorsConflicting(anchor1: ScenarioPlacementAnchor, anchor2: ScenarioPlacementAnchor, minDistance: number = 0.001): boolean {
    return this.calculateAnchorDistance(anchor1, anchor2) < minDistance;
  }

  /**
   * Validate placement score
   */
  static isValidPlacementScore(score: ScenarioPlacementScore): boolean {
    return !!(
      typeof score.total === "number" &&
      typeof score.evidence === "number" &&
      typeof score.priority === "number" &&
      typeof score.layerFit === "number" &&
      typeof score.separation === "number" &&
      !Number.isNaN(score.total) &&
      !Number.isNaN(score.evidence) &&
      !Number.isNaN(score.priority) &&
      !Number.isNaN(score.layerFit) &&
      !Number.isNaN(score.separation)
    );
  }

  /**
   * Format placement explanation
   */
  static formatPlacementExplanation(score: ScenarioPlacementScore, anchorLabel: string): string {
    return `evidence-placement score ${safeToFixed(score.total, 2)} = ` +
      `${safeToFixed(score.evidence, 2)} evidence + ` +
      `${safeToFixed(score.priority, 2)} action rank + ` +
      `${safeToFixed(score.layerFit, 2)} evidence fit + ` +
      `${safeToFixed(score.separation, 2)} distribution, ` +
      `anchored to ${anchorLabel}`;
  }

  /**
   * Check if action is valid
   */
  static isValidAction(action: ScenarioAction): boolean {
    return !!(
      action.interventionId &&
      action.name &&
      action.allocatedBudgetUsd !== null
    );
  }

  /**
   * Get action description
   */
  static getActionDescription(action: ScenarioAction): string {
    return `${action.name} intervention (${action.category}). Cost: ${action.allocatedBudgetUsd ? `$${action.allocatedBudgetUsd.toLocaleString()}` : "TBD"}`;
  }

  /**
   * Calculate total cost for scenario
   */
  static calculateTotalCost(scenario: ScenarioRecord): number {
    if (scenario.estimatedCostUsd !== null && typeof scenario.estimatedCostUsd === "number") {
      return scenario.estimatedCostUsd;
    }
    return 0;
  }

  /**
   * Calculate cost per action
   */
  static calculateCostPerAction(scenario: ScenarioRecord): number {
    const totalCost = this.calculateTotalCost(scenario);
    const actionCount = scenario.recommendedActions.length;
    return actionCount > 0 ? totalCost / actionCount : 0;
  }

  /**
   * Check if scenario has valid cost estimate
   */
  static hasCostEstimate(scenario: ScenarioRecord): boolean {
    return typeof scenario.estimatedCostUsd === "number" && scenario.estimatedCostUsd > 0;
  }

  /**
   * Check if scenario has heat reduction estimate
   */
  static hasHeatReductionEstimate(scenario: ScenarioRecord): boolean {
    return typeof scenario.heatReductionC === "number" && scenario.heatReductionC > 0;
  }

  /**
   * Check if scenario has equity score
   */
  static hasEquityScore(scenario: ScenarioRecord): boolean {
    return typeof scenario.equityScore === "number" && scenario.equityScore >= 0;
  }

  /**
   * Format scenario ID for display
   */
  static formatId(scenarioId: string): string {
    return scenarioId.substring(0, 8).toUpperCase();
  }

  /**
   * Sort scenarios by estimated cost descending
   */
  static sortByCost(scenarios: ScenarioRecord[]): ScenarioRecord[] {
    return [...scenarios].sort((a, b) => {
      const costA = a.estimatedCostUsd ?? 0;
      const costB = b.estimatedCostUsd ?? 0;
      return costB - costA;
    });
  }

  /**
   * Sort scenarios by heat reduction descending
   */
  static sortByHeatReduction(scenarios: ScenarioRecord[]): ScenarioRecord[] {
    return [...scenarios].sort((a, b) => {
      const heatA = a.heatReductionC ?? 0;
      const heatB = b.heatReductionC ?? 0;
      return heatB - heatA;
    });
  }

  /**
   * Sort scenarios by equity score descending
   */
  static sortByEquity(scenarios: ScenarioRecord[]): ScenarioRecord[] {
    return [...scenarios].sort((a, b) => {
      const equityA = a.equityScore ?? 0;
      const equityB = b.equityScore ?? 0;
      return equityB - equityA;
    });
  }

  /**
   * Filter scenarios by planning mode
   */
  static filterByPlanningMode(scenarios: ScenarioRecord[], mode: string): ScenarioRecord[] {
    return scenarios.filter((s) => s.planningMode === mode);
  }

  /**
   * Check if two scenarios are equivalent
   */
  static areEqual(scenario1: ScenarioRecord | null, scenario2: ScenarioRecord | null): boolean {
    if (!scenario1 || !scenario2) return scenario1 === scenario2;
    return scenario1.id === scenario2.id;
  }

  /**
   * Clone scenario (create a copy)
   */
  static clone(scenario: ScenarioRecord): ScenarioRecord {
    return JSON.parse(JSON.stringify(scenario));
  }
}
