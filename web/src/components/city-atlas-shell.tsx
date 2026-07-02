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
            <div className="premium-badge-cloud atlas-badge-cloud">
              <span className="premium-badge">Spectral-first decision layer</span>
              <span className="premium-badge">Observed thermal context</span>
              <span className="premium-badge">Plain-language intervention story</span>
            </div>
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
            <div className="atlas-shell-preview">
              <div className="atlas-preview-card">
                <strong>Spectral-first flow</strong>
                <p>Open the atlas to begin with mathematically derived bottlenecks and cooling gaps, then use thermal evidence as supporting context.</p>
              </div>
              <div className="atlas-preview-card">
                <strong>Map-led investigation</strong>
                <p>Select a polygon, see why the math ranked it highly, and move directly into a what-if scenario with carried-over context.</p>
              </div>
              <div className="atlas-preview-card">
                <strong>Honest planning story</strong>
                <p>The atlas separates observed inputs, derived analysis, and planning simplifications so people can trust what is being shown.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
