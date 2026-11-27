import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import { innovationMomentForPath, journeyStepForPath, journeySteps, nextJourneyStep, validJourneyVisits, type JourneyStepId } from "../lib/guided-journey";
import "./guided-journey.css";

const STORAGE_KEY = "uhd.guided-journey.visited.v1";

function readVisits(): JourneyStepId[] {
  if (typeof window === "undefined") return [];
  try { return validJourneyVisits(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")); }
  catch { return []; }
}

/** Navigation history is local to this browser; a check means viewed, not completed. */
export function GuidedJourney({ pathname }: { pathname: string }) {
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const [visited, setVisited] = useState<JourneyStepId[]>(readVisits);
  const currentId = journeyStepForPath(pathname);
  const next = nextJourneyStep(pathname, visited);
  const innovation = innovationMomentForPath(pathname, search);

  useEffect(() => {
    if (!currentId) return;
    setVisited((previous) => previous.includes(currentId) ? previous : [...previous, currentId]);
  }, [currentId]);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visited)); }
    catch { /* Continue without saved progress in restricted browsers. */ }
  }, [visited]);

  useEffect(() => {
    const syncVisits = (event: StorageEvent) => { if (event.key === STORAGE_KEY) setVisited(readVisits()); };
    window.addEventListener("storage", syncVisits);
    return () => window.removeEventListener("storage", syncVisits);
  }, []);

  if (pathname !== "/" && !currentId) return null;

  return (
    <nav className="guided-journey" aria-label="Guided journey">
      <div className="guided-journey-intro">
        <div>
          <span className="guided-journey-kicker">A clear path through the workspace</span>
          <h2>Your journey from heat evidence to action</h2>
          <p>Follow these five stops at your own pace. A check means you opened that page.</p>
        </div>
        <div className="guided-journey-summary">
          <span className="guided-journey-count">{visited.length} of {journeySteps.length} visited</span>
          {next ? <Link to={next.to} className="guided-journey-next">Next: {next.title} <span aria-hidden="true">→</span></Link> : <span className="guided-journey-finish">You reached the sharing step.</span>}
        </div>
      </div>
      <progress className="guided-journey-progress" value={visited.length} max={journeySteps.length} aria-label="Guided journey pages visited" />
      <p className="guided-journey-scroll-hint">Swipe sideways to see all five stops <span aria-hidden="true">→</span></p>
      <ol className="guided-journey-steps">
        {journeySteps.map((step) => {
          const active = step.id === currentId;
          const seen = visited.includes(step.id);
          return <li key={step.id} className={`guided-journey-step${active ? " is-current" : seen ? " is-visited" : ""}`}>
            <Link to={step.to} aria-current={active ? "step" : undefined}>
              <span className="guided-journey-marker" aria-hidden="true">{seen && !active ? "✓" : step.number}</span>
              <span className="guided-journey-step-copy"><strong>{step.title}</strong><small>{step.detail}</small><em>{active ? "Current stop" : seen ? "Visited" : "Ready when you are"}</em></span>
            </Link>
          </li>;
        })}
      </ol>
      <div className="guided-journey-innovation" aria-label="Innovation in action">
        <span className="guided-journey-innovation-mark" aria-hidden="true">✦</span>
        <span className="guided-journey-innovation-copy">
          <small>Innovation in action</small>
          <strong>{innovation.title}</strong>
          <span>{innovation.detail}</span>
        </span>
      </div>
    </nav>
  );
}
