import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type { CitySpectral } from "../lib/types";
import { captureAnalyticsEvent } from "../lib/analytics";

type GuidedStep = {
  id: "context" | "signal" | "next";
  label: string;
  title: string;
  summary: string;
  meaning: string;
  limitation: string;
};

type CityGuidedEvidenceBriefProps = {
  cityName: string;
  bundled: boolean;
  readinessLabel?: string;
  spectral: CitySpectral | undefined;
  scenarioSearch: {
    cityId: string;
    budgetUsd: number;
    focus: undefined;
    sourceLayer: undefined;
    selectedLabel: undefined;
  };
  onOpenAtlas: () => void;
};

function buildSteps(cityName: string, bundled: boolean, readinessLabel: string | undefined, spectral: CitySpectral | undefined): GuidedStep[] {
  const hasStudySignal = bundled && Boolean(spectral);
  const unavailableEvidenceDescription = bundled
    ? `${cityName} has a bundled city profile, but a local study signal is not available in this view yet. The page can describe current readiness without presenting an unsupported local finding.`
    : `${cityName} is an upload-first city. Its page can describe readiness and guide local inputs, but it does not present a local heat finding until evidence is registered and validated.`;
  const unavailableEvidenceMeaning = bundled
    ? `The next useful step is to inspect the stated readiness conditions${readinessLabel ? ` (${readinessLabel})` : ""}, rather than infer a result from partial data.`
    : "The useful next step is to register a boundary and the documented local inputs—not to infer a result from the city profile alone.";
  const priorityCount = spectral?.cheegerFeatureCount ?? 0;
  const coolingCount = spectral?.coolingZoneCount ?? 0;

  return [
    {
      id: "context",
      label: "1. Context",
      title: hasStudySignal ? `What evidence is available for ${cityName}?` : `What is needed to study ${cityName}?`,
      summary: hasStudySignal
        ? `${cityName} has a bundled study package with ${priorityCount} derived priority area${priorityCount === 1 ? "" : "s"} and ${coolingCount} cooling-access area${coolingCount === 1 ? "" : "s"} available for inspection.`
        : unavailableEvidenceDescription,
      meaning: hasStudySignal
        ? "You can inspect the study layers, their source context, and their stated assumptions."
        : unavailableEvidenceMeaning,
      limitation: hasStudySignal
        ? "A bundled study is bounded by its sources, dates, resolution, and methods. It is not a real-time citywide temperature forecast."
        : "A city name, boundary, or starter configuration is not local heat evidence.",
    },
    {
      id: "signal",
      label: "2. Signal",
      title: hasStudySignal ? "What does the current study indicate?" : "How will a future city signal be explained?",
      summary: hasStudySignal
        ? spectral?.summary ?? "The available study signal is loading."
        : "When supported inputs are available, the city brief will distinguish observed inputs, derived analysis, and planning assumptions before presenting an area for inspection.",
      meaning: hasStudySignal
        ? "Higher-priority areas are prompts for closer local investigation. Cooling-access constraints are a separate decision lens and should not be silently combined with a bottleneck score."
        : "The same evidence rules will apply to this city: source, method, scale, and limitation must be visible with every important claim.",
      limitation: "A derived priority is not a diagnosis of harm, a temperature measurement, or an automatic policy recommendation.",
    },
    {
      id: "next",
      label: "3. Next step",
      title: hasStudySignal ? "What is a responsible next step?" : "What should happen before planning?",
      summary: hasStudySignal
        ? "Open the Atlas to inspect an area and its evidence context. Only then decide whether a transparent what-if scenario is useful."
        : "Complete local data readiness first. Scenario work should be explicit about whether it uses local evidence, a benchmark, or a teaching assumption.",
      meaning: hasStudySignal
        ? "Use the map to form a question, then use scenarios to compare stated assumptions—not to claim a predicted local outcome."
        : "A clear readiness path is more useful and more trustworthy than a simulated city conclusion.",
      limitation: "Planning outputs remain bounded decision aids; they do not substitute for local validation, engineering review, or community knowledge.",
    },
  ];
}

export function CityGuidedEvidenceBrief({ cityName, bundled, readinessLabel, spectral, scenarioSearch, onOpenAtlas }: CityGuidedEvidenceBriefProps) {
  const steps = buildSteps(cityName, bundled, readinessLabel, spectral);
  const [activeId, setActiveId] = useState<GuidedStep["id"]>("context");
  const activeStep = steps.find((step) => step.id === activeId) ?? steps[0];
  const activeIndex = steps.findIndex((step) => step.id === activeStep.id);
  const hasStudySignal = bundled && Boolean(spectral);

  useEffect(() => {
    captureAnalyticsEvent("city_guided_brief_step_viewed", { step: activeId });
  }, [activeId]);

  return (
    <article className="panel-card city-guided-brief" aria-labelledby="city-guided-brief-title">
      <div className="city-guided-brief-heading">
        <div>
          <div className="eyebrow">Guided city brief</div>
          <h2 id="city-guided-brief-title">One question at a time.</h2>
          <p className="muted">This short reading path separates what is available, what it can mean, and what a responsible next step looks like.</p>
        </div>
        <span className="city-guided-brief-progress">Step {activeIndex + 1} of {steps.length}</span>
      </div>

      <div className="city-guided-brief-steps" aria-label="Guided city brief steps">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            className={step.id === activeStep.id ? "active" : undefined}
            aria-pressed={step.id === activeStep.id}
            onClick={() => setActiveId(step.id)}
          >
            {step.label}
          </button>
        ))}
      </div>

      <section className="city-guided-brief-answer" aria-live="polite">
        <div>
          <span className="eyebrow">{activeStep.label}</span>
          <h3>{activeStep.title}</h3>
          <p>{activeStep.summary}</p>
        </div>
        <dl>
          <div>
            <dt>What this means</dt>
            <dd>{activeStep.meaning}</dd>
          </div>
          <div>
            <dt>Important limit</dt>
            <dd>{activeStep.limitation}</dd>
          </div>
        </dl>
      </section>

      <div className="quick-links city-guided-brief-actions">
        {activeId !== "next" ? (
          <button type="button" className="button-link secondary" onClick={() => setActiveId(steps[activeIndex + 1]?.id ?? "next")}>
            Continue reading
          </button>
        ) : null}
        {hasStudySignal ? <button type="button" className="button-link" onClick={onOpenAtlas}>Inspect the Atlas</button> : null}
        <Link to="/scenarios" search={scenarioSearch} className="button-link secondary">{hasStudySignal ? "Open what-if scenarios" : "Review planning options"}</Link>
      </div>
    </article>
  );
}
