import type { MitigationScenario, PlacedIntervention } from "./types";

export type ScenarioAction =
  | { type: "add"; intervention: PlacedIntervention }
  | { type: "update"; intervention: PlacedIntervention }
  | { type: "remove"; id: string }
  | { type: "replace"; scenario: MitigationScenario };

export function reduceScenario(scenario: MitigationScenario, action: ScenarioAction): MitigationScenario {
  if (action.type === "add") return { ...scenario, interventions: [...scenario.interventions, action.intervention] };
  if (action.type === "update") return { ...scenario, interventions: scenario.interventions.map((item) => item.id === action.intervention.id ? action.intervention : item) };
  if (action.type === "remove") return { ...scenario, interventions: scenario.interventions.filter((item) => item.id !== action.id) };
  return action.scenario;
}

export function scenarioFingerprint(scenario: MitigationScenario) {
  return JSON.stringify({ baselineId: scenario.baselineId, seed: scenario.seed, interventions: scenario.interventions });
}
