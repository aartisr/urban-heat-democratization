import type { InterventionDefinition } from "../domain/types";
import "./quick-intervention-palette.css";

type Props = {
  definitions: InterventionDefinition[];
  selectedId: string | null;
  onSelect: (definition: InterventionDefinition) => void;
};

export function QuickInterventionPalette({ definitions, selectedId, onSelect }: Props) {
  return <div className="mitigation-quick-palette" role="toolbar" aria-label="Quick intervention picker">
    <span>Pick, then place</span>
    <div>
      {definitions.map((definition) => <button key={definition.id} type="button" className={selectedId === definition.id ? "is-selected" : ""} onClick={() => onSelect(definition)} aria-pressed={selectedId === definition.id} aria-label={`${definition.name}: ${definition.accessibility.shortMechanism}`} data-tooltip={`${definition.name} — ${definition.accessibility.shortMechanism}`}>
        <span aria-hidden="true">{definition.accessibility.icon}</span>
      </button>)}
    </div>
  </div>;
}
