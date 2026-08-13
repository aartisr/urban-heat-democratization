import { lazy, Suspense, useState } from "react";

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
};

export function CityAtlasShell({ data, scenarios, cityName, loading, summary, onActivate, onMapRefresh }: CityAtlasShellProps) {
  const [activated, setActivated] = useState(false);

  return (
    <article className="panel-card premium-section-card premium-atlas-shell-card">
      <div className="atlas-shell">
        <div className="atlas-shell-intro">
          <div className="atlas-shell-copy">
            <div className="eyebrow">Interactive atlas</div>
            <h2>{cityName} map analysis</h2>
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
                Load interactive atlas
              </button>
              <p className="muted">This delays the heaviest map assets until you actually open the atlas.</p>
            </div>
          ) : (
            <div className="atlas-shell-state">
              <strong>Atlas mode is active.</strong>
              <p className="muted">Start with the spectral rail, then inspect the map, selected polygon, and mitigation story below it.</p>
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
              <summary>How the atlas works</summary>
              <p>Start with the map, inspect a selected area, then open a scenario only when you are ready to compare options. The atlas keeps observed inputs, derived analysis, and planning simplifications distinct.</p>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}
