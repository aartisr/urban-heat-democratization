import { interventionById } from "../domain/intervention-registry";
import type { LabBaseline, LabResult, MitigationScenario } from "../domain/types";
import { composeInfluences } from "./compose-influences";
import { explainShift } from "./explain";
import { coolingContinuity } from "./graph-adapter";
import { radialInfluence } from "./rasterize";

export function calculateScenario(baseline: LabBaseline, scenario: MitigationScenario): LabResult {
  const fields = scenario.interventions.flatMap((placed) => {
    const definition = interventionById(placed.definitionId);
    if (!definition) return [];
    const strength = placed.parameters.strength ?? definition.defaultParameters.strength ?? 0;
    const radius = placed.parameters.radius ?? definition.defaultParameters.radius ?? 0.1;
    return [radialInfluence(baseline.width, baseline.height, placed.geometry, strength, radius)];
  });
  const influence = composeInfluences(fields);
  const priority = new Float32Array(baseline.priority.length);
  let changedCells = 0;
  let totalShift = 0;
  for (let index = 0; index < priority.length; index += 1) {
    const shift = (influence[index] ?? 0) * 0.62;
    priority[index] = baseline.priority[index] * (1 - shift);
    if (shift > 0.02) { changedCells += 1; totalShift += shift; }
  }
  const averagePriorityShift = changedCells ? totalShift / changedCells : 0;
  return { priority, changedCells, averagePriorityShift, connectedShare: coolingContinuity(priority, baseline.width, baseline.height), explanation: explainShift(changedCells, averagePriorityShift, scenario.interventions.length), isDeterministic: true };
}
