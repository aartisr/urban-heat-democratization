/**
 * Overlay Domain Service
 * Manages overlay layers, scoring, filtering, and operations
 * Abstracts overlay-specific business logic from UI components
 */

import type { CityMapOverlay, OverlayEntry } from "../../lib/types";
import { formatScoreSimple, scoreToLabel } from "../../lib/formatting";
import { OVERLAY_TYPES, SCORE_RANGES } from "../../lib/constants";

export type OverlayType = (typeof OVERLAY_TYPES)[keyof typeof OVERLAY_TYPES];
export type SeverityFilter = "all" | "high" | "medium" | "low";

/**
 * Overlay service for managing overlay business logic
 */
export class OverlayService {
  /**
   * Classify score into severity level
   */
  static getSeverity(score: number): "high" | "medium" | "low" {
    if (score >= SCORE_RANGES.HIGH_THRESHOLD) return "high";
    if (score >= SCORE_RANGES.MEDIUM_THRESHOLD) return "medium";
    return "low";
  }

  /**
   * Check if overlay matches severity filter
   */
  static matchesSeverityFilter(overlay: CityMapOverlay, filter: SeverityFilter): boolean {
    if (filter === "all") return true;
    const severity = this.getSeverity(overlay.score);
    return severity === filter;
  }

  /**
   * Check if overlay is ranked (has valid score variance)
   */
  static isRanked(overlay: CityMapOverlay): boolean {
    return typeof overlay.score === "number" && !Number.isNaN(overlay.score) && overlay.score > 0;
  }

  /**
   * Check if overlay is flagged (exists but not ranked)
   */
  static isFlagged(overlay: CityMapOverlay): boolean {
    return !this.isRanked(overlay);
  }

  /**
   * Get display label for overlay ranking status
   */
  static getRankingLabel(overlay: CityMapOverlay): string {
    return this.isRanked(overlay) ? "Priority" : "Flagged";
  }

  /**
   * Validate overlay data integrity
   */
  static isValid(overlay: CityMapOverlay | null): boolean {
    if (!overlay) return false;
    return !!(
      overlay.id &&
      overlay.label &&
      overlay.scoreClass &&
      (typeof overlay.score === "number" || overlay.score === null) &&
      overlay.properties
    );
  }

  /**
   * Check if overlay has complete metadata
   */
  static hasCompleteMetadata(overlay: CityMapOverlay): boolean {
    return !!(overlay.id && overlay.label && overlay.scoreClass && overlay.properties && Object.keys(overlay.properties).length > 0);
  }

  /**
   * Get narrative description for overlay
   */
  static getNarrative(overlay: CityMapOverlay, layerLabel: string, isRanked: boolean): string {
    if (!isRanked) {
      return `${layerLabel} polygon flagged as ${overlay.scoreClass.toLowerCase()}. The bundled analysis identifies this as a low-access condition, but does not provide enough variation to rank it against other flagged zones.`;
    }
    return `${layerLabel} polygon with ${overlay.scoreClass.toLowerCase()} severity and score ${formatScoreSimple(overlay.score, 1)}.`;
  }

  /**
   * Filter overlays by severity
   */
  static filterBySeverity(overlays: CityMapOverlay[], filter: SeverityFilter): CityMapOverlay[] {
    return overlays.filter((overlay) => this.matchesSeverityFilter(overlay, filter));
  }

  /**
   * Filter overlays by ranking status
   */
  static filterByRanking(overlays: CityMapOverlay[], ranked: boolean): CityMapOverlay[] {
    return overlays.filter((overlay) => this.isRanked(overlay) === ranked);
  }

  /**
   * Sort overlays by score descending
   */
  static sortByScore(overlays: CityMapOverlay[]): CityMapOverlay[] {
    return [...overlays].sort((a, b) => {
      const scoreA = this.isRanked(a) ? a.score : -1;
      const scoreB = this.isRanked(b) ? b.score : -1;
      return (scoreB as number) - (scoreA as number);
    });
  }

  /**
   * Group overlays by severity
   */
  static groupBySeverity(overlays: CityMapOverlay[]): Map<SeverityFilter, CityMapOverlay[]> {
    const groups = new Map<SeverityFilter, CityMapOverlay[]>();
    groups.set("high", []);
    groups.set("medium", []);
    groups.set("low", []);

    for (const overlay of overlays) {
      const severity = this.getSeverity(overlay.score);
      groups.get(severity as SeverityFilter)?.push(overlay);
    }

    return groups;
  }

  /**
   * Get overlay statistics
   */
  static getStats(overlays: CityMapOverlay[]): {
    total: number;
    ranked: number;
    flagged: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    avgScore: number;
  } {
    const ranked = overlays.filter((o) => this.isRanked(o));
    const groups = this.groupBySeverity(overlays);
    const scores = ranked.map((o) => o.score as number);

    return {
      total: overlays.length,
      ranked: ranked.length,
      flagged: overlays.length - ranked.length,
      highSeverity: groups.get("high")?.length ?? 0,
      mediumSeverity: groups.get("medium")?.length ?? 0,
      lowSeverity: groups.get("low")?.length ?? 0,
      avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    };
  }

  /**
   * Get top N overlays by score
   */
  static getTopByScore(overlays: CityMapOverlay[], count: number = 10): CityMapOverlay[] {
    return this.sortByScore(overlays).slice(0, count);
  }

  /**
   * Check if overlay centroid can be computed
   */
  static hasCentroid(overlay: CityMapOverlay): boolean {
    const props = overlay.properties;
    return !!(props?.centroid_lng !== undefined && props?.centroid_lat !== undefined);
  }

  /**
   * Get overlay centroid
   */
  static getCentroid(overlay: CityMapOverlay): { lng: number; lat: number } | null {
    const props = overlay.properties;
    if (!props || !this.hasCentroid(overlay)) return null;
    return {
      lng: (props.centroid_lng as number) || 0,
      lat: (props.centroid_lat as number) || 0,
    };
  }

  /**
   * Check if two overlays are the same
   */
  static areEqual(overlay1: CityMapOverlay | null, overlay2: CityMapOverlay | null): boolean {
    if (!overlay1 || !overlay2) return overlay1 === overlay2;
    return overlay1.id === overlay2.id;
  }

  /**
   * Normalize score class string
   */
  static normalizeScoreClass(value: string): string {
    return value.trim().toLowerCase();
  }

  /**
   * Get display class for score
   */
  static getScoreClass(score: number): "high" | "medium" | "low" {
    return this.getSeverity(score);
  }

  /**
   * Check if overlay type is valid
   */
  static isValidType(type: unknown): type is OverlayType {
    return type === OVERLAY_TYPES.HEAT || type === OVERLAY_TYPES.COOLING;
  }

  /**
   * Get label for overlay type
   */
  static getTypeLabel(type: OverlayType): string {
    return type === OVERLAY_TYPES.HEAT ? "Heat bottleneck" : "Cooling gap";
  }
}
