import { Link } from "@tanstack/react-router";

export type CityExperienceView = "read" | "explore" | "audit";

type CityExperienceNavigationProps = {
  cityId: string;
  cityName: string;
  view: CityExperienceView;
  isBundled: boolean;
};

const items: Array<{ view: CityExperienceView; label: string; description: string }> = [
  { view: "read", label: "Read", description: "A guided city evidence brief" },
  { view: "explore", label: "Explore", description: "Inspect supported map layers and areas" },
  { view: "audit", label: "Audit", description: "Review methods, limits, and provenance" },
];

export function CityExperienceNavigation({ cityId, cityName, view, isBundled }: CityExperienceNavigationProps) {
  const context = isBundled
    ? `${cityName} has a bundled study package. Start with the brief or open the workspace directly.`
    : `${cityName} is an upload-first city. The available evidence and next data step are stated in each view.`;

  return (
    <nav className="city-experience-navigation" aria-label={`${cityName} evidence experience`}>
      <div className="city-experience-navigation-copy">
        <span className="eyebrow">City evidence experience</span>
        <p>{context}</p>
      </div>
      <div className="city-experience-navigation-tabs" aria-label="Choose how to use this city evidence">
        {items.map((item) => (
          <Link
            key={item.view}
            to="/cities/$cityId"
            params={{ cityId }}
            search={{ view: item.view }}
            aria-current={view === item.view ? "page" : undefined}
            className={view === item.view ? "active" : undefined}
          >
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
