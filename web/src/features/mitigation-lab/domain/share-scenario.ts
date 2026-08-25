import type { MitigationScenario } from "./types";

const MAX_PAYLOAD_LENGTH = 1800;
const SHARE_VERSION = 1;
function encodeBase64(value: string) { return btoa(unescape(encodeURIComponent(value))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function decodeBase64(value: string) { const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4); return decodeURIComponent(escape(atob(padded))); }

export function encodeShareScenario(scenario: MitigationScenario) {
  const payload = encodeBase64(JSON.stringify({ v: SHARE_VERSION, scenario }));
  if (payload.length > MAX_PAYLOAD_LENGTH) throw new Error("This sketch is too large for a share link. Export JSON instead.");
  return payload;
}
export function decodeShareScenario(value: string): MitigationScenario | null {
  try {
    const parsed = JSON.parse(decodeBase64(value)) as { v: number; scenario: MitigationScenario };
    if (parsed.v !== SHARE_VERSION || parsed.scenario?.schemaVersion !== 1 || !Array.isArray(parsed.scenario.interventions)) return null;
    return parsed.scenario;
  } catch { return null; }
}
