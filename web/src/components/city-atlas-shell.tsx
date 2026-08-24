import { lazy, Suspense, useEffect, useState } from "react";

import type { CityMapData, ScenarioRecord } from "../lib/types";

const CityHeatMap = lazy(() => import("../components/city-heat-map").then((module) => ({ default: module.CityHeatMap })));

type CityAtlasShellProps = {
  data: CityMapData | undefined;
  scenarios?: ScenarioRecord[];
  cityName: string;
  loading: boolean;
  summary: string;
  onActivate: () => void;
  onMapRefresh: () => void;
  forceActivated?: boolean;
};

export function CityAtlasShell({ data, scenarios, cityName, loading, summary, onActivate, onMapRefresh, forceActivated = false }: CityAtlasShellProps) {
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (forceActivated) {
      setActivated(true);
    }
  }, [forceActivated]);

  return (
    <article id="city-atlas" className="panel-card premium-section-card premium-atlas-shell-card">
      <div className="atlas-shell">
        <div className="atlas-shell-intro">
          <div className="atlas-shell-copy">
            <div className="eyebrow">Your first answer</div>
            <h2>Where should {cityName} look closer?</h2>
            <p className="muted">{summary}</p>
          </div>
          {!activated ? (
            <div className="atlas-shell-actions">
              <button
                type="button"
                className="button-link"
                onClick={() => {
                  setActivated(true);
                  onActivate();
                }}
              >
                Show the city atlas
              </button>
              <p className="muted">The map opens only when you ask for it, so this page stays fast and focused.</p>
            </div>
          ) : (
            <div className="atlas-shell-state">
              <strong>Start with the highlighted areas.</strong>
              <p className="muted">Choose a layer, inspect one area, then decide if a scenario is worth exploring.</p>
            </div>
          )}
        </div>
        <div className="atlas-shell-body">
          {loading && activated ? (
            <p className="muted">Loading geographic city atlas...</p>
          ) : data && activated ? (
            <Suspense fallback={<p className="muted">Loading geographic city atlas...</p>}>
              <CityHeatMap data={data} scenarios={scenarios} onMapRefresh={onMapRefresh} />
            </Suspense>
          ) : activated ? (
            <p className="muted">Map data is not available for this city yet.</p>
          ) : (
            <details className="atlas-shell-preview">
              <summary>What you will learn from the atlas</summary>
              <p>Which areas combine heat and weak cooling access, what evidence supports that signal, and what you can explore next. The atlas keeps observed inputs, derived analysis, and planning simplifications distinct.</p>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}
