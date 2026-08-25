import definitionsJson from "../../../../../data/mitigation_lab/intervention-definitions.json";
import type { InterventionDefinition } from "./types";

type Manifest = { schemaVersion: number; definitions: InterventionDefinition[] };
const manifest = definitionsJson as Manifest;

function validDefinition(definition: InterventionDefinition) {
  return Boolean(definition.id && definition.version && definition.name && definition.geometry.length && definition.mechanisms.length && definition.accessibility?.shortMechanism);
}

export const interventionDefinitions = manifest.definitions.filter(validDefinition);
export function interventionById(id: string) { return interventionDefinitions.find((definition) => definition.id === id); }
