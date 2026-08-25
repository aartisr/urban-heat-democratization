import { describe, expect, it } from "vitest";
import { composeInfluences } from "./compose-influences";
import { calculateScenario } from "./calculate";
import { createSyntheticBaseline } from "../fixtures/synthetic-neighborhood";
import type { MitigationScenario } from "../domain/types";

const empty: MitigationScenario = { schemaVersion: 1, id: "test", baselineId: "synthetic-irregular-neighborhood", evidenceState: "illustrative", interventions: [], seed: 1, createdAt: "2026-08-25T00:00:00.000Z" };
describe("mitigation calculation", () => {
  it("saturates overlapping bounded fields", () => {
    expect(composeInfluences([new Float32Array([.8]), new Float32Array([.8])])[0]).toBeCloseTo(.96);
  });
  it("is deterministic and cannot increase priority", () => {
    const baseline = createSyntheticBaseline(8, 8);
    const scenario: MitigationScenario = { ...empty, interventions: [{ id: "one", definitionId: "tree-canopy", definitionVersion: "1.0.0", geometry: { kind: "point", points: [{ x: .5, y: .5 }] }, parameters: { strength: .65, radius: .12 } }] };
    const first = calculateScenario(baseline, scenario); const second = calculateScenario(baseline, scenario);
    expect([...first.priority]).toEqual([...second.priority]);
    first.priority.forEach((value, index) => expect(value).toBeLessThanOrEqual(baseline.priority[index]));
    expect(first.changedCells).toBeGreaterThan(0);
  });
});
