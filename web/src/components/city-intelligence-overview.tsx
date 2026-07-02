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
}: CityIntelligenceOverviewProps) {
  return (
    <>
      <header className="hero-card city-hero premium-city-hero">
        <div className="city-hero-copy">
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{narrative}</p>
          <div className="quick-links">
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

      <article className="panel-card premium-section-card">
        <div className="journey-grid">
          {journeyCards.map((card) => (
            <div key={card.title} className="panel-card nested-card journey-card premium-journey-card">
              <div className="eyebrow">{card.eyebrow}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      </article>

      <div className="panel-grid two-col">
        <article className="panel-card premium-section-card">
          <h2>{whyTitle}</h2>
          <p>{whyBody}</p>
          <div className="info-list">
            {whyCards.map((card) => (
              <div key={card.title}>
                <strong>{card.title}</strong>
                <span>{card.body}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel-card premium-section-card">
          <h2>{nextTitle}</h2>
          <p>{nextBody}</p>
          <div className="info-list">
            {nextCards.map((card) => (
              <div key={card.title}>
                <strong>{card.title}</strong>
                <span>{card.body}</span>
              </div>
            ))}
          </div>
          {nextAction ? (
            <div className="quick-links">
              <Link
                to={nextAction.to}
                search={nextAction.search}
                className={nextAction.className ?? "button-link"}
              >
                {nextAction.label}
              </Link>
            </div>
          ) : null}
        </article>
      </div>
    </>
  );
}
