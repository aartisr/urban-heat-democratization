import { Link } from "@tanstack/react-router";

export type HeroAction = {
  label: string;
  to: "/scenarios" | "/exports" | "/runs";
  className?: string;
  search?: {
    cityId?: string | undefined;
    budgetUsd?: number | undefined;
    focus?: string | undefined;
    sourceLayer?: string | undefined;
    selectedLabel?: string | undefined;
  };
};

export type HeroMetric = {
  value: string;
  label: string;
};

export type JourneyCard = {
  eyebrow: string;
  title: string;
  description: string;
};

export type InfoCard = {
  title: string;
  body: string;
};

export type LiveOverviewCue = {
  tone: "live" | "ready" | "backup";
  badge: string;
  summary: string;
  detail: string;
  refreshed: string;
  cadence: string;
};

export type CityIntelligenceOverviewProps = {
  eyebrow: string;
  title: string;
  narrative: string;
  heroActions: HeroAction[];
  heroMetrics: HeroMetric[];
  liveCue?: LiveOverviewCue | null;
  journeyCards: JourneyCard[];
  whyTitle: string;
  whyBody: string;
  whyCards: InfoCard[];
  nextTitle: string;
  nextBody: string;
  nextCards: InfoCard[];
  nextAction?: HeroAction | null;
  onOpenAtlas?: () => void;
};

export function CityIntelligenceOverview({
  eyebrow,
  title,
  narrative,
  heroActions,
  heroMetrics,
  liveCue,
  journeyCards,
  whyTitle,
  whyBody,
  whyCards,
  nextTitle,
  nextBody,
  nextCards,
  nextAction,
  onOpenAtlas,
}: CityIntelligenceOverviewProps) {
  return (
    <>
      <header className="hero-card city-hero premium-city-hero">
        <div className="city-hero-copy">
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{narrative}</p>
          <div className="quick-links">
            {onOpenAtlas ? (
              <button type="button" className="button-link" onClick={onOpenAtlas}>
                See where heat needs attention
              </button>
            ) : null}
            {heroActions.map((action) => (
              <Link
                key={`${action.to}-${action.label}`}
                to={action.to}
                search={action.search}
                className={action.className ?? "button-link"}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hero-card-stats">
          {heroMetrics.map((metric) => (
            <div key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
          {liveCue ? (
            <div className={`premium-live-cue ${liveCue.tone}`}>
              <div className="premium-live-cue-badge">{liveCue.badge}</div>
              <div className="premium-live-cue-head">
                <span className="premium-live-dot" />
                <strong>{liveCue.summary}</strong>
              </div>
              <p>{liveCue.detail}</p>
              <span className="premium-live-cue-meta">{liveCue.refreshed}</span>
              <span>{liveCue.cadence}</span>
            </div>
          ) : null}
        </div>
      </header>

      <section className="city-value-brief" aria-labelledby="city-value-title">
        <div className="city-value-brief-intro">
          <span className="eyebrow">Why this city matters</span>
          <h2 id="city-value-title">From a city-wide signal to a clear next conversation.</h2>
          <p>Start with one visible pattern. Then decide whether to inspect the evidence, compare a budget, or bring the story into a meeting.</p>
        </div>
        <div className="city-value-brief-steps">
          {journeyCards.map((card) => (
            <article key={card.title} className="city-value-step">
              <span>{card.eyebrow}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <details className="progressive-details panel-card premium-section-card">
        <summary>Understand the evidence behind this city</summary>
        <div className="progressive-details-content">
          <div className="journey-grid">
            {journeyCards.map((card) => (
              <div key={card.title} className="panel-card nested-card journey-card premium-journey-card">
                <div className="eyebrow">{card.eyebrow}</div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            ))}
          </div>

          <div className="panel-grid two-col">
            <article className="panel-card premium-section-card">
              <h2>{whyTitle}</h2>
              <p>{whyBody}</p>
              <div className="info-list">
                {whyCards.map((card) => <div key={card.title}><strong>{card.title}</strong><span>{card.body}</span></div>)}
              </div>
            </article>
            <article className="panel-card premium-section-card">
              <h2>{nextTitle}</h2>
              <p>{nextBody}</p>
              <div className="info-list">
                {nextCards.map((card) => <div key={card.title}><strong>{card.title}</strong><span>{card.body}</span></div>)}
              </div>
              {nextAction ? (
                <div className="quick-links">
                  <Link to={nextAction.to} search={nextAction.search} className={nextAction.className ?? "button-link"}>{nextAction.label}</Link>
                </div>
              ) : null}
            </article>
          </div>
        </div>
      </details>
    </>
  );
}
