import { describe, expect, it } from "vitest";
import type { ScenarioRecord } from "../../../lib/types";
import { selectExactScenario, upsertScenario } from "./selection";

const scenario = (id: string, cityId: string, budgetUsd: number, planningMode: ScenarioRecord["planningMode"]) => ({
  id, cityId, budgetUsd, planningMode,
  evidenceSummary: { readinessLabel: "Partially costable" },
}) as ScenarioRecord;

describe("scenario comparison selection", () => {
  it("shows an exact saved scenario even when its evidence label does not pass a persona browsing filter", () => {
    const records = [
      scenario("other-city", "phoenix", 120000, "benchmark_share"),
      scenario("other-mode", "boston", 120000, "best_under_budget"),
      scenario("exact", "boston", 120000, "benchmark_share"),
    ];
    expect(selectExactScenario(records, { cityId: "boston", budgetUsd: 120000, planningMode: "benchmark_share" })?.id).toBe("exact");
    expect(selectExactScenario(records, { cityId: "boston", budgetUsd: 130000, planningMode: "benchmark_share" })).toBeNull();
  });

  it("puts a newly generated record first without duplicating its id", () => {
    const old = scenario("saved", "boston", 120000, "benchmark_share");
    const updated = { ...old, label: "New result" };
    expect(upsertScenario([old], updated)).toEqual([updated]);
  });
});
