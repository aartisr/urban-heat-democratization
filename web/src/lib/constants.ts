/**
 * Shared constants across the application
 * Centralizes magic numbers and configuration values
 */

// === Map & Layer Configuration ===
export const MAP_CONFIG = {
  defaultZoom: 10,
  minZoom: 8,
  maxZoom: 16,
  defaultPitch: 0,
  defaultBearing: 0,
} as const;

export const LAYER_IDS = {
  HEAT: "heat",
  COOLING: "cooling",
  THERMAL_SOURCE: "thermal-source",
  SCENARIO: "scenario",
  ACTION_READINESS: "action-readiness",
  STUDY_AREA: "study-area",
  INTERVENTION: "intervention",
} as const;

export const OVERLAY_TYPES = {
  HEAT: "heat" as const,
  COOLING: "cooling" as const,
} as const;

export const SEVERITY_FILTERS = {
  ALL: "all" as const,
  HIGH: "high" as const,
  MEDIUM: "medium" as const,
  LOW: "low" as const,
} as const;

// === Score Configuration ===
export const SCORE_RANGES = {
  HIGH_THRESHOLD: 80,
  MEDIUM_THRESHOLD: 50,
  LOW_THRESHOLD: 0,
} as const;

export const SCORE_DECIMALS = {
  PRECISION: 1,
  DETAIL: 2,
  COORDINATE: 4,
  PERCENTAGE: 1,
} as const;

export const SCORE_MAX = {
  STANDARD: 10,
  PERCENTAGE: 100,
  PROBABILITY: 1,
} as const;

// === Temperature Configuration ===
export const TEMPERATURE_CONFIG = {
  FAHRENHEIT_TO_CELSIUS: (f: number) => (f - 32) * (5 / 9),
  CELSIUS_TO_FAHRENHEIT: (c: number) => c * (9 / 5) + 32,
  DISPLAY_DECIMALS: 1,
} as const;

export const THERMAL_SOURCE_CONFIG = {
  OPACITY_MIN: 0.05,
  OPACITY_MAX: 0.42,
  OPACITY_STEP: 0.01,
  DEFAULT_OPACITY: 0.25,
  THRESHOLD_DECIMALS: 1,
} as const;

// === Intervention & Mitigation ===
export const INTERVENTION_PACKAGES = {
  CANOPY: "canopy" as const,
  COOL_ROOF: "cool-roof" as const,
  GREEN_INFRASTRUCTURE: "green-infrastructure" as const,
} as const;

export const INTERVENTION_COSTS = {
  [INTERVENTION_PACKAGES.CANOPY]: 24,
  [INTERVENTION_PACKAGES.COOL_ROOF]: 18,
  [INTERVENTION_PACKAGES.GREEN_INFRASTRUCTURE]: 38,
} as const;

export const INTERVENTION_COOLING = {
  CANOPY_COOLING_C: 0.13,
  ALBEDO_COOLING_C: 0.065,
  SHADE_COOLING_PER_SQM: 0.00055,
  CORRIDOR_COOLING_C: 0.35,
  AMBIENT_MULTIPLIER: 0.42,
  F_CONVERSION: 1.8,
} as const;

// === Equity & Impact ===
export const EQUITY_CONFIG = {
  BASE_SCORE: 3.2,
  CANOPY_WEIGHT: 0.12,
  COOL_ALBEDO_WEIGHT: 0.04,
  SHADE_WEIGHT: 0.0008,
  CORRIDORS_WEIGHT: 0.3,
  DECIMALS: 1,
} as const;

// === Scenario Planning ===
export const SCENARIO_CONFIG = {
  MIN_PLACEMENT_DISTANCE_KM: 0.5,
  DIAGONAL_THRESHOLD: 0.001,
  PLACEMENT_SCORE_DECIMALS: 2,
} as const;

export const SCENARIO_FILTER_LENSES = {
  PRIORITY: "priority" as const,
  EVIDENCE: "evidence" as const,
  ACTION: "action" as const,
  CUSTOM: "custom" as const,
} as const;

// === Visual & UI ===
export const COLOR_SCHEME = {
  HEAT_HIGH: "#ef4444",
  HEAT_MEDIUM: "#f97316",
  HEAT_LOW: "#fbbf24",
  COOLING_HIGH: "#3b82f6",
  COOLING_MEDIUM: "#60a5fa",
  COOLING_LOW: "#93c5fd",
  NEUTRAL: "#6b7280",
  SECONDARY: "#8b5cf6",
} as const;

export const OPACITY = {
  OPAQUE: 1,
  HIGHLIGHTED: 0.9,
  STANDARD: 0.7,
  MUTED: 0.4,
  GHOST: 0.2,
} as const;

export const Z_INDEX = {
  BACKGROUND: 0,
  CONTENT: 10,
  OVERLAY: 20,
  POPUP: 100,
  MODAL: 1000,
  TOOLTIP: 1001,
} as const;

// === Typography & Sizes ===
export const TYPOGRAPHY = {
  BADGE_FONT_SIZE: "11px",
  SMALL_FONT_SIZE: "12px",
  NORMAL_FONT_SIZE: "14px",
  LARGE_FONT_SIZE: "16px",
  HEADING_FONT_SIZE: "24px",
} as const;

// === Breakpoints ===
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
  ULTRA_WIDE: 1920,
} as const;

// === Animation & Timing ===
export const ANIMATION = {
  QUICK: 0.15,
  STANDARD: 0.3,
  SLOW: 0.5,
  VERY_SLOW: 1.0,
} as const;

// === Content & Labels ===
export const LABELS = {
  HEAT_LABEL: "Heat bottleneck",
  COOLING_LABEL: "Cooling gap",
  EVIDENCE_LABEL: "Evidence area",
  ACTION_LABEL: "Intervention area",
  FLAGGED_LABEL: "Flagged",
  RANKED_LABEL: "Priority",
} as const;

// === Default Values ===
export const DEFAULTS = {
  MISSING_VALUE: "—",
  UNKNOWN_VALUE: "Unknown",
  LOADING_VALUE: "Loading…",
  ERROR_VALUE: "Error",
  PLACEHOLDER_VALUE: "—",
} as const;

// === Validation ===
export const VALIDATION = {
  MIN_LATITUDE: -90,
  MAX_LATITUDE: 90,
  MIN_LONGITUDE: -180,
  MAX_LONGITUDE: 180,
  MIN_SCORE: 0,
  MAX_SCORE: 10,
  MIN_TEMPERATURE: -50,
  MAX_TEMPERATURE: 60,
} as const;

// === API & Data ===
export const API_CONFIG = {
  TIMEOUT_MS: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

// === Storage & Persistence ===
export const STORAGE_KEYS = {
  PREFERENCES: "urban-heat:preferences",
  SCENARIOS: "urban-heat:scenarios",
  THERMAL_SOURCES: "urban-heat:thermal-sources",
  CACHE: "urban-heat:cache",
} as const;

// === Method Guide Paths ===
export const METHOD_GUIDES = {
  CHEEGER: "/methods/cheeger-bottlenecks-method",
  COOLING: "/methods/low-cooling-access-method",
  INTERVENTIONS: "/methods/scenario-interventions-method",
} as const;

// === Export Types ===
export type OverlayType = (typeof OVERLAY_TYPES)[keyof typeof OVERLAY_TYPES];
export type SeverityFilter = (typeof SEVERITY_FILTERS)[keyof typeof SEVERITY_FILTERS];
export type InterventionPackage = (typeof INTERVENTION_PACKAGES)[keyof typeof INTERVENTION_PACKAGES];
export type FilterLens = (typeof SCENARIO_FILTER_LENSES)[keyof typeof SCENARIO_FILTER_LENSES];
