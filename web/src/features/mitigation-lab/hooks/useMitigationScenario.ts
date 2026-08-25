import { useMemo, useReducer, useRef, useState } from "react";
import { reduceScenario, type ScenarioAction } from "../domain/scenario-reducer";
import type { MitigationScenario } from "../domain/types";

const initialScenario: MitigationScenario = { schemaVersion: 1, id: "synthetic-lab", baselineId: "synthetic-irregular-neighborhood", evidenceState: "illustrative", interventions: [], seed: 20260825, createdAt: "2026-08-25T00:00:00.000Z" };
export function useMitigationScenario(restoredScenario?: MitigationScenario | null) {
  const [scenario, dispatch] = useReducer(reduceScenario, restoredScenario ?? initialScenario);
  const history = useRef<MitigationScenario[]>([]);
  const [revision, setRevision] = useState(0);
  const act = (action: ScenarioAction) => { history.current.push(scenario); dispatch(action); setRevision((value) => value + 1); };
  const undo = () => { const prior = history.current.pop(); if (prior) { dispatch({ type: "replace", scenario: prior }); setRevision((value) => value + 1); } };
  const reset = () => { history.current.push(scenario); dispatch({ type: "replace", scenario: initialScenario }); setRevision((value) => value + 1); };
  return useMemo(() => ({ scenario, act, undo, reset, canUndo: history.current.length > 0, revision }), [scenario, revision]);
}
