import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { MathBlock } from "../components/math-block";
import { PersonaFlowRail } from "../components/persona-flow-rail";
import { ScienceDemocratizationBanner } from "../components/science-democratization-banner";
import { StoryJourneyStrip } from "../components/story-journey-strip";
import { artifactDownloadUrl, getCitySpectral, listCities, listCityExperiences, listCostSources, listRuns } from "../lib/api";
import { personaModeProfiles, type PersonaModeId } from "../lib/persona-modes";
import { useActivePersonaMode } from "../lib/use-active-persona-mode";

export function HomePage() {
  const { activeModeId, setMode } = useActivePersonaMode();
  const activeMode = personaModeProfiles[activeModeId];
  const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: () => listCities() });
  const runsQuery = useQuery({ queryKey: ["runs"], queryFn: () => listRuns() });
  const experiencesQuery = useQuery({ queryKey: ["city-experiences"], queryFn: listCityExperiences });
  const costSourcesQuery = useQuery({ queryKey: ["cost-sources"], queryFn: listCostSources });
  const featuredExperience = (experiencesQuery.data ?? []).find((experience) => experience.bundled) ?? experiencesQuery.data?.[0];
  const spectralQuery = useQuery({
    queryKey: ["city-spectral", featuredExperience?.cityId],
    queryFn: () => getCitySpectral(featuredExperience?.cityId ?? "custom"),
    enabled: Boolean(featuredExperience?.cityId),
  });

  return (
    <section className="page-stack home-page">
      <header className="hero-card premium-hero-card">
        <div className="premium-hero-copy">
          <div className="eyebrow">Urban heat planning for everyone</div>
          <h1>Turn heat data into a plan people can trust.</h1>
          <p>
            A civic-research cockpit for educators, planners, students, and researchers. Rigorous spectral math sits underneath a calm decision flow, so the evidence trail stays visible from map to scenario to export.
          </p>
          <div className="persona-strip">
            {(Object.keys(personaModeProfiles) as PersonaModeId[]).map((modeId) => (
              <button
                key={modeId}
                type="button"
                className={`persona-chip ${modeId === activeModeId ? "active" : ""}`}
                onClick={() => setMode(modeId)}
              >
                {personaModeProfiles[modeId].label}
              </button>
            ))}
          </div>
          <p className="muted">Active mode: {activeMode.label}. {activeMode.valuePromise}</p>
          <div className="quick-links">
            <Link to="/modes" className="button-link">Choose your mode</Link>
            <Link to="/cities" className="button-link secondary">Browse cities</Link>
            <Link to="/scenarios" search={{ cityId: undefined, budgetUsd: undefined, focus: undefined, sourceLayer: undefined, selectedLabel: undefined }} className="button-link secondary">Test scenarios</Link>
            <Link to="/exports" className="button-link secondary">View exports</Link>
            <Link to="/runs" className="button-link secondary">See runs</Link>
          </div>
          <div className="premium-badge-cloud">
            <span className="premium-badge">Spectral graph-theory analysis</span>
            <span className="premium-badge">Cheeger bottleneck science</span>
            <span className="premium-badge">Open evidence trail for communities</span>
          </div>
        </div>
        <div className="premium-hero-aside">
          <div className="premium-kpi-grid">
            <div className="premium-kpi">
              <span>Study cities</span>
              <strong>{citiesQuery.data?.length ?? 0}</strong>
              <p>Bundled and upload-first city workflows available now.</p>
            </div>
            <div className="premium-kpi">
              <span>Indexed runs</span>
              <strong>{runsQuery.data?.length ?? 0}</strong>
              <p>Track benchmark scenarios, artifacts, and runtime history.</p>
            </div>
            <div className="premium-kpi">
              <span>Cheeger zones</span>
              <strong>{spectralQuery.data?.cheegerFeatureCount ?? 0}</strong>
              <p>Decision-grade bottlenecks already surfaced in the flagship study city.</p>
            </div>
          </div>
          <div className="premium-hero-highlights">
            <div>
              <strong>One clean story</strong>
              <span>Move from heat evidence to scenario choice to export without re-learning the interface.</span>
            </div>
            <div>
              <strong>One evidence standard</strong>
              <span>Observed, derived, and estimated claims remain visually distinct so trust stays intact.</span>
            </div>
            <div>
              <strong>One next step</strong>
              <span>Every page points toward the same path: cities, scenarios, exports, and runs.</span>
            </div>
          </div>
          <div className="premium-hero-callout">
            <div className="eyebrow">What makes it compelling</div>
            <strong>It turns spectral analysis into a decision story people can follow.</strong>
            <p>
              The interface does not bury the evidence. It keeps the map, the provenance, the budget tradeoffs, and the exportable record in the same line of sight.
            </p>
          </div>
          <div className="premium-hero-callout">
            <div className="eyebrow">Source trail</div>
            <strong>Every cost claim points back to a source.</strong>
            <p>
              Verified seed costs, benchmark anchors, and comparative ranking sources appear as supporting evidence rather than hidden assumptions.
            </p>
            <div className="premium-source-trail-grid">
              {(costSourcesQuery.data ?? []).slice(0, 2).map((source) => (
                <div key={source.id} className="premium-source-trail-item">
                  <div className="premium-source-trail-meta">
                    <span>{source.estimatedCostUsd == null ? "Comparative source" : "Cost anchor"}</span>
                    <strong>{source.name}</strong>
                  </div>
                  <span>{source.sourceNote}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <StoryJourneyStrip
        title="From evidence to civic action"
        subtitle="This platform tells one coherent story from thermal signals to decision-ready tradeoffs with a visible audit trail."
        items={[
          { label: "Observe", detail: "Start with map evidence and city context before any budget assumptions." },
          { label: "Interpret", detail: "Translate spectral math into bottlenecks and practical intervention families." },
          { label: "Decide", detail: "Test scenario budgets with explicit evidence confidence and uncertainty ranges." },
          { label: "Share", detail: "Export artifacts and run history so public decisions remain inspectable." },
        ]}
      />

      <PersonaFlowRail activeModeId={activeModeId} currentRoute="/" />

      <ScienceDemocratizationBanner />

      <section className="premium-story-grid">
        <article className="panel-card premium-card-stack">
          <h2>Mathematical backbone, public transparency</h2>
          <p className="muted">
            The system starts with weighted urban graphs, normalized Laplacians, Cheeger bottleneck sweeps, and robustness-derived impact proxies. The same equations that power ranking and allocation are exposed in plain language so the science is inspectable by non-specialists.
          </p>
          <div className="step-stack">
            <div>
              <strong>Graph core</strong>
              <MathBlock tex="L_{\\mathrm{norm}} = D^{-1/2}(D-A)D^{-1/2}" className="step-stack-formula" />
              <span>Structures heat-risk connectivity with normalized, scale-aware graph geometry.</span>
            </div>
            <div>
              <strong>Bottleneck logic</strong>
              <MathBlock tex="\\phi(S)=\\frac{\\operatorname{cut}(S, V\\setminus S)}{\\min(\\operatorname{vol}(S), \\operatorname{vol}(V\\setminus S))}" className="step-stack-formula" />
              <span>Cheeger sweeps surface where mitigation unlocks network-wide cooling access.</span>
            </div>
            <div>
              <strong>Decision proxy</strong>
              <MathBlock tex="\\Delta T_{\\mathrm{proxy}} = \\alpha \\cdot R \\cdot \\sum_i \\Bigl(w_{\\mathrm{budget},i} \\cdot w_{\\mathrm{evidence},i} \\cdot w_{\\mathrm{priority},i} \\cdot w_{\\mathrm{layer},i}\\Bigr)" className="step-stack-formula" />
              <span>Keeps the evidence weighting explicit in every scenario recommendation.</span>
            </div>
          </div>
        </article>
        <article className="panel-card premium-card-stack">
          <h2>How it works</h2>
          <div className="step-stack">
            <div>
              <strong>1. Observe</strong>
              <span>Open a city and see where heat burden, cooling access, and evidence overlap.</span>
            </div>
            <div>
              <strong>2. Prove</strong>
              <span>Use scenarios to compare budgets while unsupported claims stay visibly unfilled.</span>
            </div>
            <div>
              <strong>3. Share</strong>
              <span>Export the package, keep the run history, and hand people a record they can audit.</span>
            </div>
          </div>
        </article>
        <article className="panel-card premium-card-stack">
          <h2>Why it feels simple</h2>
          <p className="muted">
            The interface stays intentionally short: observe, prove, share. Extra detail lives inside the workflow pages instead of crowding the top level with too many destinations.
          </p>
          <div className="info-list">
            <div>
              <strong>Observe</strong>
              <span>Start with the city atlas and the smallest useful evidence summary.</span>
            </div>
            <div>
              <strong>Plan</strong>
              <span>Use one scenario page for budget testing, comparison, and cost reading.</span>
            </div>
            <div>
              <strong>Export</strong>
              <span>When the plan is ready, export it and keep the run record alongside the evidence trail.</span>
            </div>
            <div>
              <strong>Calibrate only when needed</strong>
              <span>City readiness and cost assumptions live inside the city and scenario flows, not as separate pages.</span>
            </div>
          </div>
        </article>
      </section>

      <section className="premium-story-grid">
        <article className="panel-card premium-card-stack">
          <h2>Why this is convincing</h2>
          <div className="story-points">
            <div>
              <strong>Evidence-first</strong>
              <span>The app separates observed inputs, derived workflows, and estimated planning math so users can see what is real at a glance.</span>
            </div>
            <div>
              <strong>Decision-ready</strong>
              <span>The same city can move from map to scenario to export without changing the mental model or the evidence standard.</span>
            </div>
            <div>
              <strong>Audience-aware</strong>
              <span>Modes reshape the workflow for educators, planners, students, researchers, and community advocates.</span>
            </div>
          </div>
        </article>
        <article className="panel-card premium-card-stack">
          <h2>Recommended path</h2>
          <div className="info-list">
            <div>
              <strong>1. Cities</strong>
              <span>Choose or onboard a city that matches the conversation you want to have.</span>
            </div>
            <div>
              <strong>2. Scenarios</strong>
              <span>Set a budget and compare options with source-linked cost logic.</span>
            </div>
            <div>
              <strong>3. Exports</strong>
              <span>Download the package and keep the record with the evidence trail intact.</span>
            </div>
          </div>
        </article>
      </section>

      <article className="panel-card premium-feature-card">
        <div className="feature-callout-grid">
          <div>
            <div className="eyebrow">Featured study city</div>
            <h2>{featuredExperience?.cityName ?? "Start with a city"}</h2>
            <p className="muted">
              {featuredExperience?.summary
                ?? "Start with a real bundled city, then deepen it by registering local boundaries and artifacts."}
            </p>
          </div>
          <div className="quick-links">
            {featuredExperience ? (
              <Link to="/cities/$cityId" params={{ cityId: featuredExperience.cityId }} className="button-link">
                Study {featuredExperience.cityName}
              </Link>
            ) : null}
            <Link to="/scenarios" search={{ cityId: undefined, budgetUsd: undefined, focus: undefined, sourceLayer: undefined, selectedLabel: undefined }} className="button-link secondary">Run what-if</Link>
            {featuredExperience?.studyGuideArtifactId ? (
              <a href={artifactDownloadUrl(featuredExperience.studyGuideArtifactId)} className="button-link secondary">Open study guide</a>
            ) : null}
          </div>
        </div>
      </article>

      <article className="panel-card premium-section-card">
        <h2>Who are you using this for?</h2>
        <div className="persona-strip">
          <Link to="/modes" className="persona-chip">Educator</Link>
          <Link to="/modes" className="persona-chip">Student</Link>
          <Link to="/modes" className="persona-chip">Planner</Link>
          <Link to="/modes" className="persona-chip">Researcher</Link>
          <Link to="/modes" className="persona-chip">Community advocate</Link>
        </div>
        <p className="muted">
          Persona modes guide people toward the workflows that fit their job: classroom exploration, neighborhood storytelling, decision support, or research audit.
        </p>
      </article>
    </section>
  );
}
