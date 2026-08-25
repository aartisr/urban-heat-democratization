import { useEffect, useRef, useState } from "react";
import { calculateScenario } from "../engine/calculate";
import type { LabBaseline, LabResult, MitigationScenario } from "../domain/types";

export function useLabWorker(baseline: LabBaseline, scenario: MitigationScenario) {
  const [result, setResult] = useState<LabResult>(() => calculateScenario(baseline, scenario));
  const [isCalculating, setIsCalculating] = useState(false);
  const jobId = useRef(0);
  useEffect(() => {
    const id = ++jobId.current;
    if (typeof Worker === "undefined") { setResult(calculateScenario(baseline, scenario)); return; }
    const worker = new Worker(new URL("../engine/worker.ts", import.meta.url), { type: "module" });
    setIsCalculating(true);
    worker.onmessage = (event: MessageEvent<{ id: number; result: Omit<LabResult, "priority"> & { priority: ArrayBuffer } }>) => {
      if (event.data.id === id) setResult({ ...event.data.result, priority: new Float32Array(event.data.result.priority) });
      setIsCalculating(false); worker.terminate();
    };
    worker.onerror = () => {
      if (id === jobId.current) setResult(calculateScenario(baseline, scenario));
      setIsCalculating(false); worker.terminate();
    };
    const priority = baseline.priority.slice().buffer;
    worker.postMessage({ type: "calculate", id, baseline: { ...baseline, priority }, scenario }, [priority]);
    return () => worker.terminate();
  }, [baseline, scenario]);
  return { result, isCalculating };
}
