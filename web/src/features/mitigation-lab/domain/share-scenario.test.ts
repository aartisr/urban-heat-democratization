import { describe, expect, it } from "vitest";
import { decodeShareScenario, encodeShareScenario } from "./share-scenario";
import type { MitigationScenario } from "./types";
const scenario: MitigationScenario = { schemaVersion: 1, id: "test", baselineId: "synthetic-irregular-neighborhood", evidenceState: "illustrative", interventions: [], seed: 1, createdAt: "2026-08-25T00:00:00.000Z" };
describe("public scenario links", () => {
  it("round-trips versioned public scenario payloads", () => expect(decodeShareScenario(encodeShareScenario(scenario))).toEqual(scenario));
  it("rejects malformed payloads", () => expect(decodeShareScenario("not-a-payload")).toBeNull());
});
