export type EvidenceState = "illustrative" | "planning" | "observed" | "causal";
export type GeometryKind = "point" | "line" | "polygon";
export type MitigationMechanism = "canopy_shade" | "surface_albedo" | "evapotranspiration" | "route_shade" | "cooling_access";

export type ParameterDefinition = { key: string; label: string; min: number; max: number; step: number };
export type EvidenceReference = { title: string; url: string; context: string };
export type ResponseEnvelope = { lowLabel: string; highLabel: string; context: string };
export type InterventionDefinition = {
  id: string; version: string; name: string; category: string; geometry: GeometryKind[];
  mechanisms: MitigationMechanism[]; defaultParameters: Record<string, number>; parameterSchema: ParameterDefinition[];
  costStatus: "ranking_only" | "verified" | "benchmark_only"; evidenceState: EvidenceState;
  accessibility: { label: string; shortMechanism: string; icon: string }; limitation: string;
  evidence: EvidenceReference[]; responseEnvelope: ResponseEnvelope; applicabilityPrompts: string[];
};
export type LabPoint = { x: number; y: number };
export type LabGeometry = { kind: GeometryKind; points: LabPoint[] };
export type PlacedIntervention = { id: string; definitionId: string; definitionVersion: string; geometry: LabGeometry; parameters: Record<string, number> };
export type MitigationScenario = { schemaVersion: 1; id: string; baselineId: string; evidenceState: EvidenceState; interventions: PlacedIntervention[]; seed: number; createdAt: string };
export type LabBaseline = { id: string; version: string; name: string; width: number; height: number; priority: Float32Array; limitations: string[] };
export type LabResult = { priority: Float32Array; changedCells: number; averagePriorityShift: number; connectedShare: number; explanation: string; isDeterministic: true };
