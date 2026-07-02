import { Link } from "@tanstack/react-router";

import {
  modeProgress,
  personaModeProfiles,
  type AppFlowRoute,
  type PersonaModeId,
} from "../lib/persona-modes";

type PersonaFlowRailProps = {
  activeModeId: PersonaModeId;
  currentRoute: AppFlowRoute;
};

const routeLabels: Record<AppFlowRoute, string> = {
  "/": "Overview",
  "/cities": "Cities",
  "/scenarios": "Scenarios",
  "/exports": "Exports",
  "/runs": "Runs",
  "/modes": "Modes",
};

export function PersonaFlowRail({ activeModeId, currentRoute }: PersonaFlowRailProps) {
  const mode = personaModeProfiles[activeModeId];
  const progress = modeProgress(activeModeId, currentRoute);

  return (
    <article className="panel-card premium-section-card persona-flow-rail">
      <div className="persona-flow-rail-head">
        <div>
          <div className="eyebrow">Mode in focus</div>
          <h2>{mode.label}: {mode.title}</h2>
          <p className="muted">{mode.valuePromise}</p>
        </div>
        <div className="persona-flow-next">
          <span>Next best step</span>
          {progress.next ? (
            <Link to={progress.next} className="button-link secondary">Open {routeLabels[progress.next]}</Link>
          ) : (
            <Link to="/exports" className="button-link secondary">Publish this story</Link>
          )}
        </div>
      </div>

      <div className="persona-flow-steps">
        {progress.orderedRoutes.map((route) => {
          const state = route === progress.active ? "active" : progress.completed.includes(route) ? "done" : "todo";
          return (
            <Link key={route} to={route} className={`persona-flow-step ${state}`}>
              <span>{routeLabels[route]}</span>
            </Link>
          );
        })}
      </div>

      <p className="persona-flow-science">Science anchor: {mode.scienceAnchor}</p>
      <p className="persona-flow-question">Key question: {mode.keyQuestion}</p>
    </article>
  );
}
