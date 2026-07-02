import type { ReactNode } from "react";

export type SectionCard = {
  eyebrow?: string;
  title: string;
  body?: string;
  tone?: string | null;
  children?: ReactNode;
};

export type CityDetailSectionGridProps = {
  title: string;
  description?: string;
  cards: SectionCard[];
  actions?: ReactNode;
};

export function CityDetailSectionGrid({ title, description, cards, actions }: CityDetailSectionGridProps) {
  return (
    <article className="panel-card premium-section-card">
      <h2>{title}</h2>
      {description ? <p className="muted">{description}</p> : null}
      <div className="panel-grid two-col">
        {cards.map((card) => (
          <div key={`${card.eyebrow ?? ""}-${card.title}`} className="panel-card nested-card premium-detail-card">
            {card.eyebrow ? <div className="eyebrow">{card.eyebrow}</div> : null}
            {card.tone ? <div className={`truth-badge ${card.tone}`}>{card.tone}</div> : null}
            <h3>{card.title}</h3>
            {card.body ? <p>{card.body}</p> : null}
            {card.children}
          </div>
        ))}
      </div>
      {actions ? <div className="quick-links">{actions}</div> : null}
    </article>
  );
}
