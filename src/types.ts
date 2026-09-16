export interface Metric {
  id: string;
  name: string;
  score: number;
  weight: number;
  description: string;
  details: string[];
}

export interface GlossaryItem {
  term: string;
  definition: string;
  context: string;
}

export interface SubCriterion {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  commentary: string;
  verdict: 'exceptional' | 'proficient' | 'adequate' | 'developing' | 'strong' | string;
}

export interface DimensionScore {
  id: string;
  category: string;
  title: string;
  score: number;
  weight: number;
  icon: string;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  recommendation: string;
  subCriteria: SubCriterion[];
}

export interface PlatformBenchmark {
  name: string;
  url: string;
  focus: string;
  openScienceScore: number;
  uxSimplicityScore: number;
  localActionScore: number;
  equityFocusScore: number;
  overallScore: number;
  comparisonNote: string;
}

export interface PersonaProfile {
  id: string;
  title: string;
  icon: string;
  description: string;
  weights: {
    mission_equity?: number;
    scientific_rigor?: number;
    interactive_lab?: number;
    ux_design?: number;
    open_science?: number;
    actionability?: number;
    [key: string]: number | undefined;
  };
}

export interface SWOTItem {
  id: string;
  category: 'strength' | 'weakness' | 'opportunity' | 'threat';
  title: string;
  detail: string;
  impact: 'Critical' | 'High' | 'Moderate' | 'Medium' | string;
}

export interface MitigationScenario {
  id: string;
  name: string;
  canopyIncreasePct: number;
  coolRoofAlbedoPct: number;
  shadeStructuresSqM: number;
  greenCorridorCount: number;
  surfaceTempReductionC: number;
  ambientTempReductionC: number;
  coolingEquityImpact: number;
  costEfficiency: string;
  notes: string;
}

export interface GroundTruthSensor {
  id: string;
  stationName: string;
  network: 'NOAA_ISD' | 'MASSPORT' | 'BOSTON_CIVIC' | 'COMMUNITY_MESH';
  lat: number;
  lon: number;
  neighborhood: string;
  measuredAirTempC: number;
  satelliteLST_C: number;
  gmrfPosteriorC: number;
  baselineModelC: number;
  sensorElevationM: number;
  timestamp: string;
  qualityFlag: 'VERIFIED_GOLD' | 'CALIBRATED' | 'PROVISIONAL';
}

export interface MathematicalTheorem {
  id: string;
  title: string;
  type: 'Definition' | 'Theorem' | 'Lemma' | 'Proposition' | 'Corollary';
  statement: string;
  formulaLatex: string;
  explanation: string;
  proofSketch: string;
  paperSection: string;
  workbenchToolId?: string;
  repoCodeReference: string;
}

export interface VerificationCitation {
  id: string;
  paperClaim: string;
  mathematicalObject: string;
  codeFile: string;
  lineNumberOrFunction: string;
  repoUrl: string;
  empiricalAnchor: string;
  status: '100% Verified' | 'Reproducible';
}
