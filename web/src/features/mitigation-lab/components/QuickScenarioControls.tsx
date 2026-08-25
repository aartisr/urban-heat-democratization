import "./quick-intervention-palette.css";

type Action = { id: string; icon: string; label: string; disabled: boolean; onClick: () => void };
type Props = { canUndo: boolean; hasInterventions: boolean; onUndo: () => void; onReset: () => void; onCopy: () => void; onExport: () => void };

export function QuickScenarioControls({ canUndo, hasInterventions, onUndo, onReset, onCopy, onExport }: Props) {
  const actions: Action[] = [
    { id: "undo", icon: "↶", label: "Undo last change", disabled: !canUndo, onClick: onUndo },
    { id: "reset", icon: "↺", label: "Reset this sketch", disabled: !hasInterventions, onClick: onReset },
    { id: "copy", icon: "↗", label: "Copy share link", disabled: !hasInterventions, onClick: onCopy },
    { id: "export", icon: "⇩", label: "Export planning sketch", disabled: !hasInterventions, onClick: onExport },
  ];
  return <div className="mitigation-quick-palette mitigation-quick-controls" role="toolbar" aria-label="Scenario controls"><span>Sketch controls</span><div>{actions.map((action) => <button key={action.id} type="button" onClick={action.onClick} disabled={action.disabled} aria-label={action.label} data-tooltip={action.label}><span aria-hidden="true">{action.icon}</span></button>)}</div></div>;
}
