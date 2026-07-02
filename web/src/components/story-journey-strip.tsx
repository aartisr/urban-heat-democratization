type StoryJourneyItem = {
  label: string;
  detail: string;
};

type StoryJourneyStripProps = {
  title: string;
  subtitle: string;
  items: StoryJourneyItem[];
  className?: string;
};

export function StoryJourneyStrip({ title, subtitle, items, className }: StoryJourneyStripProps) {
  return (
    <section className={`story-journey-strip ${className ?? ""}`.trim()} aria-label={title}>
      <div className="story-journey-head">
        <div className="eyebrow">Narrative arc</div>
        <h2>{title}</h2>
        <p className="muted">{subtitle}</p>
      </div>
      <div className="story-journey-grid">
        {items.map((item, index) => (
          <article key={`${item.label}-${index}`} className="story-journey-card">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.label}</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
