import { calculateScenario } from "./calculate";
import type { LabBaseline, MitigationScenario } from "../domain/types";

type Request = { type: "calculate"; id: number; baseline: Omit<LabBaseline, "priority"> & { priority: ArrayBuffer }; scenario: MitigationScenario };
const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<Request>) => void) | null;
  postMessage: (message: unknown, transfer: Transferable[]) => void;
};
workerScope.onmessage = (event: MessageEvent<Request>) => {
  if (event.data.type !== "calculate") return;
  const { id, baseline: rawBaseline, scenario } = event.data;
  const baseline: LabBaseline = { ...rawBaseline, priority: new Float32Array(rawBaseline.priority) };
  const result = calculateScenario(baseline, scenario);
  const priority = result.priority.buffer as ArrayBuffer;
  workerScope.postMessage({ type: "result", id, result: { ...result, priority } }, [priority]);
};
