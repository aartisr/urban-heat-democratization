import type { InterventionDefinition } from "../domain/types";
import { InterventionIcon } from "./InterventionIcon";
import "./quick-intervention-palette.css";

type Props = {
  definitions: InterventionDefinition[];
  selectedId: string | null;
  onSelect: (definition: InterventionDefinition) => void;
};

export function QuickInterventionPalette({ definitions, selectedId, onSelect }: Props) {
  const descriptions: Record<string, string> = {
    "tree-canopy": "Trees and shade",
    "shade-structure": "Built shade",
    "cool-surface": "Lighter ground surface",
    "cool-roof": "Lighter roof surface",
    "cool-pavement": "Cooler walking route",
    "permeable-paving": "Water-friendly paving",
    "cooling-access-node": "Access to a cool place",
  };
  return <div className="mitigation-quick-palette" role="toolbar" aria-label="Quick intervention picker">
    <div className="mitigation-quick-palette-heading"><strong>Choose a cooling action</strong><span>Then click the map to place it.</span></div>
    <div className="mitigation-intervention-options">
      {definitions.map((definition) => <button key={definition.id} type="button" className={selectedId === definition.id ? "is-selected" : ""} onClick={() => onSelect(definition)} aria-pressed={selectedId === definition.id} aria-label={`${definition.name}: ${descriptions[definition.id] ?? definition.accessibility.shortMechanism}`}>
        <InterventionIcon interventionId={definition.id} fallback={definition.accessibility.icon} className="mitigation-intervention-icon" />
        <span className="mitigation-intervention-copy"><strong>{definition.name}</strong><small>{descriptions[definition.id] ?? definition.accessibility.shortMechanism}</small></span>
      </button>)}
    </div>
  </div>;
}
