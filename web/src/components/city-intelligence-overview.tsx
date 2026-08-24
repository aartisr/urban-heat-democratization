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
  nextAction,
  onOpenAtlas,
}: CityIntelligenceOverviewProps) {
  const primaryJourney = journeyCards.slice(0, 3);
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

      <nav className="city-journey-nav" aria-label="How to use this city page">
        {primaryJourney.map((card, index) => {
          const action = index === 0
            ? <button type="button" onClick={onOpenAtlas}>Open the atlas</button>
            : index === 1
              ? <a href="#evidence">Read the evidence</a>
              : nextAction
                ? <Link to={nextAction.to} search={nextAction.search}>Test a scenario</Link>
                : null;
          return (
            <div key={card.title} className="city-journey-nav-step">
              <span>{card.eyebrow}</span>
              <div><strong>{card.title}</strong><p>{card.description}</p></div>
              {action}
            </div>
          );
        })}
      </nav>
    </>
  );
}
