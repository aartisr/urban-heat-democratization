/**
 * Spectral Urbanism: Urban Thermal Math Library
 * Pure TypeScript mathematical routines implementing Urban Heat Island (UHI),
 * Surface Energy Balance (SEB), Radiation Budget, Canyon Sky View Factor (SVF),
 * and Thermal Inertia physics.
 */

import {
  BasicUHIParams,
  BasicUHIResult,
  RadiationParams,
  RadiationResult,
  EnergyBalanceParams,
  EnergyBalanceResult,
  ThermalInertiaParams,
  ThermalInertiaResult,
  DiurnalPoint,
  CanyonParams,
  CanyonResult,
  ProgressiveStepLog,
  ToyCalculatorInput,
  MaterialThermalProps
} from '../types';

export const STEFAN_BOLTZMANN = 5.670374419e-8; // W/(m^2·K^4)

// Material Presets for Urban Surfaces
export const MATERIAL_PRESETS: Record<string, MaterialThermalProps> = {
  asphalt: {
    name: 'Standard Dark Asphalt',
    density: 2300, // kg/m^3
    specificHeat: 920, // J/(kg·K)
    thermalConductivity: 0.75, // W/(m·K)
    albedo: 0.10,
    emissivity: 0.93
  },
  concrete: {
    name: 'Urban Paving Concrete',
    density: 2200,
    specificHeat: 880,
    thermalConductivity: 1.30,
    albedo: 0.30,
    emissivity: 0.90
  },
  coolRoof: {
    name: 'High-Albedo Cool Roof Coating',
    density: 1400,
    specificHeat: 1050,
    thermalConductivity: 0.20,
    albedo: 0.75,
    emissivity: 0.92
  },
  drySoil: {
    name: 'Dry Soil / Bare Ground',
    density: 1600,
    specificHeat: 800,
    thermalConductivity: 0.40,
    albedo: 0.20,
    emissivity: 0.92
  },
  vegetatedSoil: {
    name: 'Moist Vegetated Soil (Grass/Park)',
    density: 1400,
    specificHeat: 1400,
    thermalConductivity: 1.10,
    albedo: 0.23,
    emissivity: 0.96
  }
};

/**
 * Step 1: Basic UHI Anomaly & Oke Canyon Model Calculation
 */
export function calculateBasicUHI(params: BasicUHIParams): BasicUHIResult {
  const { aspectRatio, vegetationFraction, imperviousFraction, anthropogenicHeat, skyViewFactor, ruralBaselineTemp } = params;

  // Oke's Maximum Canopy UHI Formula: ΔT_max = 7.54 * log10(H/W) + 3.73
  const validAspectRatio = Math.max(0.1, aspectRatio);
  const okeMaxDeltaT = 7.54 * Math.log10(validAspectRatio) + 3.73;

  // Empirical Multi-Factor Urban Thermal Model:
  // ΔT = a*(1-FVC) + b*I + c*Q_F + d*(1-SVF) + e*(H/W - 0.5)
  const vegetationCooling = -4.2 * vegetationFraction; // FVC reduces temp up to -4.2°C
  const imperviousHeating = 3.5 * imperviousFraction; // Impervious surfaces add up to +3.5°C
  const anthropogenicHeating = 0.035 * anthropogenicHeat; // 100 W/m^2 adds +3.5°C
  const skyTrappingHeating = 2.8 * (1 - skyViewFactor); // Low SVF traps longwave heat up to +2.8°C
  const aspectRatioImpact = 1.4 * (validAspectRatio - 0.5);

  const rawDeltaT = vegetationCooling + imperviousHeating + anthropogenicHeating + skyTrappingHeating + aspectRatioImpact;
  const deltaTUHI = Math.max(0, Math.round(rawDeltaT * 100) / 100);
  const urbanTemp = Math.round((ruralBaselineTemp + deltaTUHI) * 100) / 100;

  let urbanHeatCategory: 'Minimal' | 'Moderate' | 'Severe' | 'Extreme' = 'Minimal';
  if (deltaTUHI > 6.0) urbanHeatCategory = 'Extreme';
  else if (deltaTUHI > 3.5) urbanHeatCategory = 'Severe';
  else if (deltaTUHI > 1.5) urbanHeatCategory = 'Moderate';

  return {
    deltaTUHI,
    urbanTemp,
    okeMaxDeltaT: Math.round(okeMaxDeltaT * 100) / 100,
    contributions: {
      aspectRatioImpact: Math.round(aspectRatioImpact * 100) / 100,
      vegetationCooling: Math.round(vegetationCooling * 100) / 100,
      imperviousHeating: Math.round(imperviousHeating * 100) / 100,
      anthropogenicHeating: Math.round(anthropogenicHeating * 100) / 100,
      skyTrappingHeating: Math.round(skyTrappingHeating * 100) / 100
    },
    urbanHeatCategory
  };
}

/**
 * Step 2: Radiation Budget Calculation
 */
export function calculateRadiationBudget(params: RadiationParams): RadiationResult {
  const { timeOfDay, solarInsolationMax, albedo, emissivity, ambientAirTemp, surfaceTemp, atmosphericEmissivity } = params;

  // Solar zenith / solar elevation modeling based on time of day (peak at 12:00)
  const hourAngle = ((timeOfDay - 12) * Math.PI) / 12; // -PI at midnight, 0 at noon
  const solarElevation = Math.max(0, Math.cos(hourAngle)); // 0 to 1

  const shortwaveDown = Math.round(solarInsolationMax * Math.pow(solarElevation, 1.1) * 10) / 10;
  const shortwaveReflected = Math.round(shortwaveDown * albedo * 10) / 10;
  const shortwaveNet = Math.round((shortwaveDown - shortwaveReflected) * 10) / 10;

  // Longwave Radiation (Kelvin conversion)
  const T_air_K = ambientAirTemp + 273.15;
  const T_surf_K = surfaceTemp + 273.15;

  const longwaveDown = Math.round(atmosphericEmissivity * STEFAN_BOLTZMANN * Math.pow(T_air_K, 4) * 10) / 10;
  
  // L_up = ε_s * σ * T_s^4 + (1 - ε_s) * L_down
  const emittedLongwave = emissivity * STEFAN_BOLTZMANN * Math.pow(T_surf_K, 4);
  const reflectedLongwave = (1 - emissivity) * longwaveDown;
  const longwaveUp = Math.round((emittedLongwave + reflectedLongwave) * 10) / 10;

  const longwaveNet = Math.round((longwaveDown - longwaveUp) * 10) / 10;
  const netRadiation = Math.round((shortwaveNet + longwaveNet) * 10) / 10;

  return {
    shortwaveDown,
    shortwaveReflected,
    shortwaveNet,
    longwaveDown,
    longwaveUp,
    longwaveNet,
    netRadiation
  };
}

/**
 * Step 3: Surface Energy Balance (SEB) & Flux Partitioning
 */
export function calculateEnergyBalance(params: EnergyBalanceParams): EnergyBalanceResult {
  const { netRadiation, anthropogenicHeat, vegetationFraction, soilMoistureFraction, surfaceTemp, airTemp } = params;

  const totalInputEnergy = netRadiation + anthropogenicHeat;

  // Latent heat flux LE is driven by vegetation cover & soil moisture
  // Maximum possible LE fraction is ~65% under full vegetation & moist soil
  const leFraction = 0.65 * vegetationFraction * Math.max(0.1, soilMoistureFraction);
  const latentHeat = Math.round(Math.max(0, totalInputEnergy * leFraction) * 10) / 10;

  // Ground storage flux G depends on impervious surfaces (1 - FVC)
  // Higher storage in built surfaces (~30% of input energy during day)
  const gFraction = (0.35 - 0.25 * vegetationFraction);
  const groundStorageHeat = Math.round(totalInputEnergy * gFraction * 10) / 10;

  // Sensible heat H is residual energy heating air: H = (R_n + Q_F) - LE - G
  const sensibleHeat = Math.round((totalInputEnergy - latentHeat - groundStorageHeat) * 10) / 10;

  // Bowen Ratio β = H / LE
  const bowenRatio = latentHeat > 0.5 
    ? Math.round((sensibleHeat / latentHeat) * 100) / 100
    : 99.9; // Arbitrary high value for zero vegetation

  // Closure residual check
  const closureError = Math.round((totalInputEnergy - (sensibleHeat + latentHeat + groundStorageHeat)) * 10) / 10;

  // Evapotranspiration rate in mm/day (2.45 MJ/kg latent heat of vaporization)
  // LE W/m^2 * 86400 s/day / 2,450,000 J/kg -> mm/day
  const evapotranspirationRate = Math.round((Math.max(0, latentHeat) * 0.03525) * 100) / 100;

  return {
    totalInputEnergy: Math.round(totalInputEnergy * 10) / 10,
    sensibleHeat,
    latentHeat,
    groundStorageHeat,
    bowenRatio,
    energyBalanceClosureError: closureError,
    evapotranspirationRate
  };
}

/**
 * Step 4: Thermal Inertia & Diurnal Simulation Curve
 */
export function calculateThermalInertia(params: ThermalInertiaParams): ThermalInertiaResult {
  const { material, thickness, peakSolarInsolation } = params;

  // Volumetric Heat Capacity C_v = ρ * c_p [J/(m^3·K)]
  const volumetricHeatCapacity = material.density * material.specificHeat;

  // Thermal Inertia P = sqrt(k * ρ * c_p) [J/(m^2·s^0.5·K)]
  const thermalInertiaP = Math.sqrt(material.thermalConductivity * material.density * material.specificHeat);

  // Diurnal damping depth d_e = sqrt(2*k / (ω * ρ * c_p)) where ω = 2π / 86400 s
  const omega = (2 * Math.PI) / 86400; // Earth's rotation frequency rad/s
  const dampingDepth = Math.sqrt((2 * material.thermalConductivity) / (omega * volumetricHeatCapacity));

  // Phase lag in hours ≈ (thickness / dampingDepth) * (24 / (2π))
  const phaseLagHours = Math.min(8, Math.round(((thickness / Math.max(0.01, dampingDepth)) * 3.82) * 10) / 10);

  // Diurnal surface temperature amplitude ΔT_s = Peak Insolation * (1 - albedo) / P
  const diurnalTempRange = Math.round(((peakSolarInsolation * (1 - material.albedo)) / (thermalInertiaP * 0.012)) * 10) / 10;

  return {
    volumetricHeatCapacity: Math.round(volumetricHeatCapacity),
    thermalInertiaP: Math.round(thermalInertiaP),
    dampingDepth: Math.round(dampingDepth * 1000) / 1000,
    phaseLagHours,
    diurnalTempRange
  };
}

/**
 * 24-Hour Diurnal Temperature Curves Generator
 */
export function generate24hDiurnalSimulation(): DiurnalPoint[] {
  const points: DiurnalPoint[] = [];

  for (let hour = 0; hour <= 24; hour++) {
    // Air temperature curve peaks around 15:00
    const airTemp = 22 + 6 * Math.sin(((hour - 9) * Math.PI) / 12);
    
    // Solar insolation curve (peaks at 12:00)
    const solarInsolation = Math.max(0, 950 * Math.sin(((hour - 6) * Math.PI) / 12));

    // Asphalt surface temp (High absorption, high heat retention, lags solar peak by ~1.5h)
    const asphaltLagHour = hour - 1.5;
    const asphaltSolar = Math.max(0, 950 * Math.sin(((asphaltLagHour - 6) * Math.PI) / 12));
    const asphaltSurfaceTemp = airTemp + (asphaltSolar * (1 - 0.10) * 0.032) + (hour >= 18 || hour <= 6 ? 4.5 : 0);

    // Cool roof surface temp (High albedo 0.75 reflects solar heat, stays close to air)
    const coolRoofSurfaceTemp = airTemp + (solarInsolation * (1 - 0.75) * 0.02) + 0.5;

    // Vegetated surface temp (Evapotranspirative cooling keeps it cooler than air during peak daylight)
    const vegCoolingFactor = solarInsolation > 100 ? -3.5 : 0.5;
    const vegetatedSurfaceTemp = airTemp + vegCoolingFactor;

    // Net radiation
    const netRadiation = (solarInsolation * (1 - 0.20)) - (hour >= 19 || hour <= 5 ? 70 : 0);

    points.push({
      hour,
      solarInsolation: Math.round(solarInsolation),
      airTemp: Math.round(airTemp * 10) / 10,
      asphaltSurfaceTemp: Math.round(asphaltSurfaceTemp * 10) / 10,
      coolRoofSurfaceTemp: Math.round(coolRoofSurfaceTemp * 10) / 10,
      vegetatedSurfaceTemp: Math.round(vegetatedSurfaceTemp * 10) / 10,
      netRadiation: Math.round(netRadiation)
    });
  }

  return points;
}

/**
 * Step 5: Urban Canyon Geometry & Sky View Factor (SVF)
 */
export function calculateUrbanCanyon(params: CanyonParams): CanyonResult {
  const { buildingHeight, streetWidth, surfaceTemp, solarElevationAngle } = params;

  const validH = Math.max(1, buildingHeight);
  const validW = Math.max(1, streetWidth);
  const aspectRatio = Math.round((validH / validW) * 100) / 100;

  // Sky View Factor for 2D symmetrical infinite canyon:
  // SVF = cos(arctan(2 * H / W))
  const theta = Math.atan((2 * validH) / validW);
  const skyViewFactor = Math.round(Math.cos(theta) * 1000) / 1000;

  // Wall view factor F_wall = (1 - SVF) / 2
  const wallViewFactor = Math.round(((1 - skyViewFactor) / 2) * 1000) / 1000;

  // Radiation trapping factor
  const radiationTrappingFactor = Math.round((1 - skyViewFactor) * 1000) / 1000;

  // Trapped Longwave Flux = (1 - SVF) * ε * σ * T_s^4
  const T_surf_K = surfaceTemp + 273.15;
  const totalEmittedLW = 0.92 * STEFAN_BOLTZMANN * Math.pow(T_surf_K, 4);
  const trappedLongwaveFlux = Math.round(radiationTrappingFactor * totalEmittedLW * 10) / 10;

  // Effective canyon cavity albedo (multiple reflections reduce bulk canyon albedo)
  const baseAlbedo = 0.18;
  const effectiveAlbedo = Math.round((baseAlbedo * skyViewFactor / (1 - (1 - skyViewFactor) * baseAlbedo)) * 1000) / 1000;

  // Shading fraction on street floor from solar angle
  const tanSolar = Math.tan((solarElevationAngle * Math.PI) / 180);
  const shadowLength = tanSolar > 0.05 ? validH / tanSolar : validW;
  const shadingFraction = Math.min(1.0, Math.round((shadowLength / validW) * 100) / 100);

  return {
    aspectRatio,
    skyViewFactor,
    wallViewFactor,
    radiationTrappingFactor,
    trappedLongwaveFlux,
    effectiveAlbedo,
    shadingFraction
  };
}

/**
 * Step 6: Interactive Toy Calculator - Progressive Code Breakdown Evaluator
 */
export function runProgressiveCalculator(input: ToyCalculatorInput): ProgressiveStepLog[] {
  const steps: ProgressiveStepLog[] = [];

  // Step 1: Net Shortwave Solar Radiation
  const K_down = input.solarInsolation;
  const albedo = input.albedo;
  const K_net = K_down * (1 - albedo);

  steps.push({
    stepNumber: 1,
    stepName: 'Net Shortwave Solar Absorption ($K_{net}$)',
    formulaTex: 'K_{net} = K_{\\downarrow} \\cdot (1 - \\alpha)',
    formulaDescription: 'Calculates solar radiation absorbed by surface after reflection by albedo α.',
    codeSnippet: `const K_down = ${K_down}; // W/m²
const albedo = ${albedo};
const K_net = K_down * (1 - albedo); // ${K_net.toFixed(1)} W/m²`,
    calculatedValues: {
      'Incoming Solar (K_down)': `${K_down} W/m²`,
      'Surface Albedo (α)': albedo,
      'Reflected Solar (K_up)': `${(K_down * albedo).toFixed(1)} W/m²`,
      'Net Absorbed Shortwave (K_net)': `${K_net.toFixed(1)} W/m²`
    },
    explanation: `Out of ${K_down} W/m² solar insolation, an albedo of ${albedo} reflects ${(K_down * albedo).toFixed(1)} W/m² back into the atmosphere, leaving ${K_net.toFixed(1)} W/m² absorbed by urban surfaces.`
  });

  // Step 2: Net Longwave Radiation
  const T_air_K = input.airTemp + 273.15;
  const L_down = 0.78 * STEFAN_BOLTZMANN * Math.pow(T_air_K, 4);
  // Estimate initial surface temp
  const T_surf_est = input.airTemp + (K_net * 0.025);
  const T_surf_K = T_surf_est + 273.15;
  const L_up = input.emissivity * STEFAN_BOLTZMANN * Math.pow(T_surf_K, 4);
  const L_net = L_down - L_up;

  steps.push({
    stepNumber: 2,
    stepName: 'Net Longwave Thermal Exchange ($L_{net}$)',
    formulaTex: 'L_{net} = \\varepsilon_{atm} \\sigma T_{air}^4 - \\varepsilon_s \\sigma T_{surf}^4',
    formulaDescription: 'Exchange of thermal infrared radiation between urban ground and upper sky.',
    codeSnippet: `const L_down = 0.78 * 5.67e-8 * Math.pow(${T_air_K.toFixed(2)}, 4);
const L_up = ${input.emissivity} * 5.67e-8 * Math.pow(${T_surf_K.toFixed(2)}, 4);
const L_net = L_down - L_up; // ${L_net.toFixed(1)} W/m²`,
    calculatedValues: {
      'Downwelling Atmospheric LW (L_down)': `${L_down.toFixed(1)} W/m²`,
      'Upwelling Surface LW (L_up)': `${L_up.toFixed(1)} W/m²`,
      'Net Longwave Radiation (L_net)': `${L_net.toFixed(1)} W/m²`
    },
    explanation: `The warm atmosphere emits ${L_down.toFixed(1)} W/m² down, while the hotter surface re-radiates ${L_up.toFixed(1)} W/m² upward. Net radiative loss to sky is ${Math.abs(L_net).toFixed(1)} W/m².`
  });

  // Step 3: Total Net Radiation & Energy Input
  const R_n = K_net + L_net;
  const Q_F = input.anthropogenicHeat;
  const Total_Energy = R_n + Q_F;

  steps.push({
    stepNumber: 3,
    stepName: 'Net Available Energy ($R_n + Q_F$)',
    formulaTex: 'E_{total} = R_n + Q_F = (K_{net} + L_{net}) + Q_F',
    formulaDescription: 'Combines net radiation with anthropogenic waste heat (HVAC, traffic, industrial).',
    codeSnippet: `const R_n = ${K_net.toFixed(1)} + (${L_net.toFixed(1)}); // Net radiation
const Q_F = ${Q_F}; // Anthropogenic heat
const Total_Energy = R_n + Q_F; // ${Total_Energy.toFixed(1)} W/m²`,
    calculatedValues: {
      'Net Radiation (R_n)': `${R_n.toFixed(1)} W/m²`,
      'Anthropogenic Heat (Q_F)': `${Q_F} W/m²`,
      'Total Input Flux (R_n + Q_F)': `${Total_Energy.toFixed(1)} W/m²`
    },
    explanation: `Total thermal power driving urban surface heat balance is ${Total_Energy.toFixed(1)} W/m², consisting of net solar/sky radiation (${R_n.toFixed(1)} W/m²) plus human waste heat (${Q_F} W/m²).`
  });

  // Step 4: Sky View Factor & Canyon Trapping
  const H_W = input.buildingHeight / Math.max(1, input.streetWidth);
  const SVF = Math.cos(Math.atan(2 * H_W));
  const Trapped_LW = (1 - SVF) * L_up;

  steps.push({
    stepNumber: 4,
    stepName: 'Sky View Factor & Longwave Canyon Trapping',
    formulaTex: '\\text{SVF} = \\cos\\left(\\arctan\\left(\\frac{2H}{W}\\right)\\right), \\quad L_{trapped} = (1 - \\text{SVF}) \\cdot L_{\\uparrow}',
    formulaDescription: 'Geometric obstruction of the open sky by urban building canyons trapping radiation.',
    codeSnippet: `const H_W = ${input.buildingHeight} / ${input.streetWidth}; // ${H_W.toFixed(2)} aspect ratio
const SVF = Math.cos(Math.atan(2 * H_W)); // ${SVF.toFixed(3)}
const Trapped_LW = (1 - SVF) * ${L_up.toFixed(1)}; // ${Trapped_LW.toFixed(1)} W/m²`,
    calculatedValues: {
      'Building Aspect Ratio (H/W)': H_W.toFixed(2),
      'Sky View Factor (SVF)': SVF.toFixed(3),
      'Trapped Heat Ratio (1 - SVF)': `${((1 - SVF) * 100).toFixed(1)}%`,
      'Trapped Longwave Energy': `${Trapped_LW.toFixed(1)} W/m²`
    },
    explanation: `An aspect ratio H/W of ${H_W.toFixed(2)} yields an SVF of ${SVF.toFixed(3)}. ${((1 - SVF) * 100).toFixed(1)}% of emitted surface longwave radiation is trapped inside street canyons rather than escaping into space.`
  });

  // Step 5: Energy Flux Partitioning (H, LE, G) & Bowen Ratio
  const LE = Total_Energy * (0.65 * input.vegetationCover);
  const G = Total_Energy * (0.35 - 0.25 * input.vegetationCover);
  const H = Total_Energy - LE - G;
  const bowen = LE > 0.1 ? H / LE : 99.9;

  steps.push({
    stepNumber: 5,
    stepName: 'Energy Flux Partitioning & Bowen Ratio (\\beta)',
    formulaTex: 'R_n + Q_F = H + LE + G, \\quad \\beta = \\frac{H}{LE}',
    formulaDescription: 'Splits available energy into Sensible Heat H (heating air), Latent Heat LE (evapotranspiration), and Ground Storage G.',
    codeSnippet: `const LE = Total_Energy * (0.65 * ${input.vegetationCover}); // ${LE.toFixed(1)} W/m²
const G = Total_Energy * (0.35 - 0.25 * ${input.vegetationCover}); // ${G.toFixed(1)} W/m²
const H = Total_Energy - LE - G; // ${H.toFixed(1)} W/m²
const bowenRatio = ${bowen > 50 ? 'Infinity (No vegetation)' : bowen.toFixed(2)};`,
    calculatedValues: {
      'Sensible Heat Flux (H)': `${H.toFixed(1)} W/m²`,
      'Latent Evaporative Heat (LE)': `${LE.toFixed(1)} W/m²`,
      'Ground Heat Storage (G)': `${G.toFixed(1)} W/m²`,
      'Bowen Ratio (β = H/LE)': bowen > 50 ? '∞ (Desert/Concrete)' : bowen.toFixed(2)
    },
    explanation: `With ${(input.vegetationCover * 100).toFixed(0)}% vegetation cover, ${LE.toFixed(1)} W/m² goes into harmless water evaporation (LE), while ${H.toFixed(1)} W/m² directly heats ambient air (H) and ${G.toFixed(1)} W/m² is stored in concrete mass (G). Bowen ratio is ${bowen > 50 ? 'extremely high (>10)' : bowen.toFixed(2)}.`
  });

  // Step 6: Final UHI Temperature Anomaly ΔT_UHI Output
  const deltaT = Math.max(0, (H * 0.022) + (Q_F * 0.02) + ((1 - SVF) * 2.5) - (input.vegetationCover * 4.0));
  const finalUrbanTemp = input.airTemp + deltaT;

  steps.push({
    stepNumber: 6,
    stepName: 'Final Urban Heat Island Anomaly (\\Delta T_{UHI})',
    formulaTex: '\\Delta T_{UHI} = f(H, Q_F, \\text{SVF}, \\text{FVC}) \\rightarrow T_{urban} = T_{air} + \\Delta T_{UHI}',
    formulaDescription: 'Derives the final urban thermal anomaly and surface microclimate temperature.',
    codeSnippet: `const deltaT = (H * 0.022) + (Q_F * 0.02) + ((1 - SVF) * 2.5) - (${input.vegetationCover} * 4.0);
const T_urban = ${input.airTemp} + ${deltaT.toFixed(2)}; // ${finalUrbanTemp.toFixed(2)} °C`,
    calculatedValues: {
      'Rural Baseline Air Temp': `${input.airTemp} °C`,
      'Urban Heat Island Anomaly (ΔT_UHI)': `+${deltaT.toFixed(2)} °C`,
      'Final Urban Surface Temp': `${finalUrbanTemp.toFixed(2)} °C`
    },
    explanation: `The cumulative physics yields an Urban Heat Island anomaly of +${deltaT.toFixed(2)} °C over baseline, resulting in an urban microclimate temperature of ${finalUrbanTemp.toFixed(2)} °C.`
  });

  return steps;
}
