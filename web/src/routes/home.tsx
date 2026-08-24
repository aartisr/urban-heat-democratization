import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";

import { artifactDownloadUrl, listCityExperiences } from "../lib/api";
import urbanHeatHeroUrl from "../assets/urban-heat-hero-civic-atlas.jpg";

export function HomePage() {
  const experiencesQuery = useQuery({ queryKey: ["city-experiences"], queryFn: listCityExperiences });
  const featuredExperience = (experiencesQuery.data ?? []).find((experience) => experience.bundled) ?? experiencesQuery.data?.[0];

  return (
    <section className="page-stack home-page calm-home-page">
      <header className="hero-card premium-hero-card calm-hero-card" style={{ "--urban-hero-image": `url(${urbanHeatHeroUrl})` } as CSSProperties}>
        <div className="premium-hero-copy">
          <div className="hero-kicker"><span className="hero-kicker-orb" aria-hidden="true" />A public-interest climate observatory</div>
          <h1><span>Make heat</span><span className="hero-title-emphasis">visible.</span><span>Make action</span><span className="hero-title-emphasis hero-title-emphasis--cool">possible.</span></h1>
          <p>
            A public-interest workspace for seeing local heat patterns, understanding the evidence, and helping shape thoughtful action on cooling, shade, and public investment.
          </p>
          <div className="quick-links">
            {featuredExperience ? (
              <Link to="/cities/$cityId" params={{ cityId: featuredExperience.cityId }} preload="intent" className="button-link">
                Explore {featuredExperience.cityName}
              </Link>
            ) : (
              <Link to="/cities" preload="intent" className="button-link">Explore a city</Link>
            )}
            <Link to="/modes" preload="intent" className="quiet-link">Not sure where to begin? Choose a path.</Link>
          </div>
          <p className="muted calm-hero-note">Start with the map. Technical detail appears when you ask for it.</p>
        </div>
        <aside className="hero-climate-portrait" aria-label="A visual metaphor for turning heat evidence into cooling action">
          <div className="hero-portrait-atmosphere" aria-hidden="true">
            <span className="hero-sun" />
            <span className="hero-heat-field hero-heat-field--one" />
            <span className="hero-heat-field hero-heat-field--two" />
            <span className="hero-cooling-field" />
            <span className="hero-route hero-route--one" />
            <span className="hero-route hero-route--two" />
            <span className="hero-node hero-node--one" />
            <span className="hero-node hero-node--two" />
            <span className="hero-node hero-node--three" />
            <span className="hero-cityline" />
          </div>
          <div className="hero-portrait-caption">
            <span>From signal to shared action</span>
            <strong>Evidence people can see, question, and use.</strong>
          </div>
          <div className="hero-portrait-metrics" aria-label="Platform principles">
            <div><strong>Observe</strong><span>See patterns</span></div>
            <div><strong>Understand</strong><span>Read evidence</span></div>
            <div><strong>Act</strong><span>Shape response</span></div>
          </div>
        </aside>
      </header>

      <section className="premium-story-grid calm-home-grid">
        <article className="panel-card premium-card-stack">
          <div className="eyebrow">What you can do here</div>
          <h2>Begin with a question, not a dashboard.</h2>
          <div className="info-list">
            <div><strong>Where should we look closer?</strong><span>Inspect heat and cooling-access layers with their source context.</span></div>
            <div><strong>What could we explore?</strong><span>Compare benchmark scenarios with clearly labeled assumptions.</span></div>
            <div><strong>What is missing?</strong><span>Bring local knowledge to the evidence instead of treating the map as the final word.</span></div>
          </div>
        </article>
        <article className="panel-card premium-card-stack">
          <div className="eyebrow">Evidence standard</div>
          <h2>Clear about what is known.</h2>
          <p className="muted">
            Boston is the real bundled study city. Scenario outputs are benchmark-based exploration aids, not city-calibrated engineering predictions. The platform keeps those distinctions visible so people can participate with confidence and care.
          </p>
          <div className="quick-links">
            <Link to="/cities" preload="intent" className="button-link secondary">See city readiness</Link>
            <Link to="/scenarios" search={{ cityId: undefined, budgetUsd: undefined, focus: undefined, sourceLayer: undefined, selectedLabel: undefined }} preload="intent" className="button-link secondary">Explore scenarios</Link>
          </div>
        </article>
      </section>

      <article className="panel-card premium-feature-card">
        <div className="feature-callout-grid">
          <div>
            <div className="eyebrow">Featured study city</div>
            <h2>{featuredExperience?.cityName ?? "Choose a city"}</h2>
            <p className="muted">{featuredExperience?.summary ?? "Open a city to inspect available evidence and begin a guided analysis."}</p>
          </div>
          <div className="quick-links">
            {featuredExperience ? <Link to="/cities/$cityId" params={{ cityId: featuredExperience.cityId }} preload="intent" className="button-link">Open atlas</Link> : null}
            {featuredExperience?.studyGuideArtifactId ? <a href={artifactDownloadUrl(featuredExperience.studyGuideArtifactId)} className="button-link secondary">Read the guide</a> : null}
          </div>
        </div>
      </article>

      <section className="panel-card premium-feature-card" aria-labelledby="wiki-resources-title">
        <div className="feature-callout-grid">
          <div>
            <div className="eyebrow">Open learning library</div>
            <h2 id="wiki-resources-title">Read the Urban Heat Democratization Wiki</h2>
            <p className="muted">The project wiki explains the mission, methods, evidence standards, city onboarding, governance, and technical terms behind the atlas.</p>
          </div>
          <div className="quick-links">
            <a className="button-link" href="https://aartisr.github.io/urban-heat-democratization/wiki/">Open the research Wiki</a>
            <a className="button-link secondary" href="https://aartisr.github.io/urban-heat-democratization/wiki/math/">Mathematical foundations</a>
          </div>
        </div>
        <div className="info-list">
          <div><strong><a href="https://aartisr.github.io/urban-heat-democratization/wiki/interpretation/">Evidence and responsible use</a></strong><span>See the limits, provenance expectations, and interpretation safeguards.</span></div>
          <div><strong><a href="https://aartisr.github.io/urban-heat-democratization/wiki/technical/">Technical reference</a></strong><span>Trace public-facing claims to source modules, tests, and method artifacts.</span></div>
          <div><strong><a href="https://github.com/aartisr/urban-heat-democratization/blob/main/docs/wiki/05-city-onboarding-and-partnership.md">City onboarding and partnership</a></strong><span>Learn how a new city can contribute local evidence responsibly.</span></div>
        </div>
      </section>

      <section className="panel-card premium-feature-card" aria-labelledby="urban-heat-faq-title">
        <div className="eyebrow">Clear answers</div>
        <h2 id="urban-heat-faq-title">Urban heat planning, explained without the black box.</h2>
        <div className="info-list">
          <div><strong>What is Urban Heat Democratization?</strong><span>An open, public-interest platform for examining urban heat patterns, cooling access, evidence sources, and transparent mitigation scenarios.</span></div>
          <div><strong>What can the Boston study tell me?</strong><span>It makes documented local layers available for learning and investigation. It is a starting point for local validation—not a complete risk assessment or a decision by itself.</span></div>
          <div><strong>Are the scenarios forecasts?</strong><span>No. They are benchmark-based exploratory tools that make assumptions and tradeoffs visible; they are not city-calibrated engineering predictions.</span></div>
          <div><strong>Where can I verify the methods?</strong><span>Read the <a href="https://aartisr.github.io/urban-heat-democratization/wiki/math/">mathematical foundations</a> and the <a href="https://aartisr.github.io/urban-heat-democratization/wiki/technical/">technical reference</a>, then inspect the linked source artifacts.</span></div>
        </div>
      </section>
    </section>
  );
}
