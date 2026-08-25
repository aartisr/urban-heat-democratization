import { interventionDefinitions } from "../domain/intervention-registry";
import type { InterventionDefinition } from "../domain/types";

export function InterventionTray({ selectedId, onSelect }: { selectedId: string | null; onSelect: (definition: InterventionDefinition) => void }) {
  return <section className="mitigation-tray" aria-label="Add an intervention"><div><span className="eyebrow">Add one change</span><h2>Choose an intervention</h2><p>Each option models a relationship, not a guaranteed cooling result.</p></div><div className="mitigation-tray-options">{interventionDefinitions.map((definition) => <button key={definition.id} type="button" className={selectedId === definition.id ? "is-selected" : ""} onClick={() => onSelect(definition)} aria-pressed={selectedId === definition.id}><span className="mitigation-icon" aria-hidden="true">{definition.accessibility.icon}</span><span><strong>{definition.name}</strong><small>{definition.accessibility.shortMechanism}</small></span></button>)}</div></section>;
}
