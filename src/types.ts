/**
 * Spectral Urbanism: Urban Thermal Math Lab Types
 */

export type LabStepId = 
  | 'overview'
  | 'lab1-basic-uhi'
  | 'lab2-radiation'
  | 'lab3-energy-balance'
  | 'lab4-thermal-inertia'
  | 'lab5-canyon-svf'
  | 'lab6-gmrf-spatial'
  | 'toy-calculator'
  | 'scenario-sandbox';

export interface LabStepInfo {
  id: LabStepId;
  title: string;
  shortTitle: string;
  stepNumber: number;
  description: string;
  badge: string;
  equationSummary: string;
}

// Lab 1: Basic UHI
export interface BasicUHIParams {
  aspectRatio: number; // H/W canyon aspect ratio (e.g. 0.2 to 3.0)
  vegetationFraction: number; // FVC [0..1]
  imperviousFraction: number; // I [0..1]
  anthropogenicHeat: number; // Q_F [W/m^2] (0 to 150)
  skyViewFactor: number; // SVF [0..1]
  ruralBaselineTemp: number; // T_rural [°C]
}

export interface BasicUHIResult {
  deltaTUHI: number; // ΔT_UHI [°C]
  urbanTemp: number; // T_urban [°C]
  okeMaxDeltaT: number; // Oke formula max anomaly [°C]
  contributions: {
    aspectRatioImpact: number;
    vegetationCooling: number;
    imperviousHeating: number;
    anthropogenicHeating: number;
    skyTrappingHeating: number;
  };
  urbanHeatCategory: 'Minimal' | 'Moderate' | 'Severe' | 'Extreme';
}

// Lab 2: Radiation Budget
export interface RadiationParams {
  timeOfDay: number; // Hour [0..24]
  solarInsolationMax: number; // K_down max [W/m^2] (e.g. 1000)
  albedo: number; // α [0..1]
  emissivity: number; // ε [0..1]
  ambientAirTemp: number; // T_a [°C]
  surfaceTemp: number; // T_s [°C]
  atmosphericEmissivity: number; // ε_atm [0..1] ~0.75
}

export interface RadiationResult {
  shortwaveDown: number; // K_down [W/m^2]
  shortwaveReflected: number; // K_up [W/m^2]
  shortwaveNet: number; // K_net [W/m^2]
  longwaveDown: number; // L_down [W/m^2]
  longwaveUp: number; // L_up [W/m^2]
  longwaveNet: number; // L_net [W/m^2]
  netRadiation: number; // R_n [W/m^2]
}

// Lab 3: Energy Balance & Flux Partitioning
export interface EnergyBalanceParams {
  netRadiation: number; // R_n [W/m^2]
  anthropogenicHeat: number; // Q_F [W/m^2]
  vegetationFraction: number; // FVC [0..1]
  aerodynamicResistance: number; // r_a [s/m]
  soilMoistureFraction: number; // [0..1]
  surfaceTemp: number; // T_s [°C]
  airTemp: number; // T_a [°C]
}

export interface EnergyBalanceResult {
  totalInputEnergy: number; // R_n + Q_F [W/m^2]
  sensibleHeat: number; // H [W/m^2]
  latentHeat: number; // LE [W/m^2]
  groundStorageHeat: number; // G [W/m^2]
  bowenRatio: number; // β = H / LE
  energyBalanceClosureError: number; // Residual [W/m^2]
  evapotranspirationRate: number; // mm/day
}

// Lab 4: Thermal Inertia & Nighttime Heat
export interface MaterialThermalProps {
  name: string;
  density: number; // ρ [kg/m^3]
  specificHeat: number; // c_p [J/(kg·K)]
  thermalConductivity: number; // k [W/(m·K)]
  albedo: number; // α
  emissivity: number; // ε
}

export interface ThermalInertiaParams {
  material: MaterialThermalProps;
  thickness: number; // d [m]
  ambientAirTempDay: number; // °C
  ambientAirTempNight: number; // °C
  peakSolarInsolation: number; // W/m^2
}

export interface ThermalInertiaResult {
  volumetricHeatCapacity: number; // C_v [J/(m^3·K)]
  thermalInertiaP: number; // P = sqrt(k * ρ * c_p) [J/(m^2·s^0.5·K)]
  dampingDepth: number; // d_e [m]
  phaseLagHours: number; // Lag in hours
  diurnalTempRange: number; // ΔT_s [°C]
}

export interface DiurnalPoint {
  hour: number;
  solarInsolation: number; // W/m^2
  airTemp: number; // °C
  asphaltSurfaceTemp: number; // °C
  coolRoofSurfaceTemp: number; // °C
  vegetatedSurfaceTemp: number; // °C
  netRadiation: number; // W/m^2
}

// Lab 5: Urban Canyon Geometry & SVF
export interface CanyonParams {
  buildingHeight: number; // H [m]
  streetWidth: number; // W [m]
  surfaceTemp: number; // T_s [°C]
  wallEmissivity: number; // ε_w
  roadEmissivity: number; // ε_r
  solarElevationAngle: number; // Degrees [0..90]
}

export interface CanyonResult {
  aspectRatio: number; // H/W
  skyViewFactor: number; // SVF [0..1]
  wallViewFactor: number; // F_wall [0..1]
  radiationTrappingFactor: number; // 1 - SVF
  trappedLongwaveFlux: number; // W/m^2
  effectiveAlbedo: number; // Cavity reflection albedo
  shadingFraction: number; // Fraction of road shaded [0..1]
}

// Lab 6: GMRF Spatial Thermal Field
export type LandCoverType = 'asphalt' | 'concrete' | 'building' | 'grass' | 'tree' | 'cool_roof' | 'water';

export interface GridCell {
  id: string;
  x: number;
  y: number;
  landCover: LandCoverType;
  elevation: number;
  vegetationDensity: number; // [0..1]
  albedo: number;
  anthropogenicHeat: number; // W/m^2
  baselineTemp: number; // °C
  inferredTemp: number; // °C
  variance: number; // Thermal uncertainty
}

export interface GMRFResult {
  grid: GridCell[][];
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  thermalDisparity: number; // Max - Min
  spectralResilience: number; // λ2 algebraic connectivity metric
}

// Toy Calculator Progressive Execution Steps
export interface ProgressiveStepLog {
  stepNumber: number;
  stepName: string;
  formulaTex: string;
  formulaDescription: string;
  codeSnippet: string;
  calculatedValues: Record<string, number | string>;
  explanation: string;
}

export interface ToyCalculatorInput {
  solarInsolation: number; // W/m^2
  albedo: number; // [0..1]
  emissivity: number; // [0..1]
  airTemp: number; // °C
  windSpeed: number; // m/s
  vegetationCover: number; // [0..1]
  buildingHeight: number; // m
  streetWidth: number; // m
  anthropogenicHeat: number; // W/m^2
}

// Scenario Mitigation Sandbox
export interface ScenarioIntervention {
  coolRoofsPercentage: number; // 0..100%
  urbanTreeCanopyPercentage: number; // 0..100%
  permeablePavementPercentage: number; // 0..100%
  evReductionPercentage: number; // 0..100%
}

export interface ScenarioResult {
  baselineAvgTemp: number;
  mitigatedAvgTemp: number;
  tempReduction: number;
  heatStressHoursSaved: number;
  carbonOffsetEquiv: number;
  breakdownByIntervention: {
    coolRoofs: number;
    treeCanopy: number;
    permeablePavements: number;
    evReduction: number;
  };
}
