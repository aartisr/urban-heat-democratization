import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { getCityBenchmarkSuite } from "../lib/api";
import { defaultStudyCityId, defaultStudyCityLabel } from "../lib/study-city";
import { type PersonaModeId } from "../lib/persona-modes";
import { useActivePersonaMode } from "../lib/use-active-persona-mode";
import type { BenchmarkSuiteCase } from "../lib/types";

type PersonaMode = {
  id: PersonaModeId;
  audience: string;
  title: string;
  summary: string;
  bestFor: string;
  promise: string;
  outcome: string;
  startingRoutes: Array<{ label: string; to: "/" | "/cities" | "/scenarios" | "/exports" | "/runs" }>;
  focusPoints: string[];
  accent: "teal" | "blue" | "amber" | "slate" | "green";
};

const personaModes: PersonaMode[] = [
  {
    id: "educator",
    audience: "Educator",
    title: "Teach the city like a living climate diagram",
    summary: "Use the bundled study city as a classroom-ready case study, then move learners from heat signals to bottlenecks to policy tradeoffs.",
    bestFor: "Classrooms, workshops, and public demos",
    promise: "Start with the map, explain the science in plain language, and finish with a compare-and-contrast scenario discussion.",
    outcome: "Learners leave with a clear mental model of why the city overheats and what a plausible response looks like.",
    startingRoutes: [
      { label: "Open overview", to: "/" },
      { label: "Explore cities", to: "/cities" },
      { label: "Review exports", to: "/exports" },
    ],
    focusPoints: [
      "Use spectral outputs as annotated examples, not black-box answers.",
      "Translate each recommendation into a plain-English classroom question.",
      "Export artifacts as lesson handouts and discussion prompts.",
    ],
    accent: "teal",
  },
  {
    id: "student",
    audience: "Student",
    title: "Learn by asking why a place stays hot",
    summary: "Follow a guided path from city overview to scenario testing so each layer answers one simple question at a time.",
    bestFor: "Self-guided study, labs, and project work",
    promise: "Start with observation, then move to interventions and budget tradeoffs without specialist language up front.",
    outcome: "You get a crisp learning path that connects spatial evidence to decisions without jargon overload.",
    startingRoutes: [
      { label: "Start at overview", to: "/" },
      { label: "Inspect a city", to: "/cities" },
      { label: "Try scenarios", to: "/scenarios" },
    ],
    focusPoints: [
      "Look for bottlenecks and low cooling access before touching budgets.",
      "Use scenario readiness labels to learn what the evidence can and cannot support yet.",
      "Compare ranked actions instead of assuming every intervention is equally proven.",
    ],
    accent: "blue",
  },
  {
    id: "planner",
    audience: "City planner",
    title: "Turn a budget into a defensible first-pass action package",
    summary: "Use the scenario engine as a transparent benchmark planner while the city-specific optimizer is still being built.",
    bestFor: "Budget framing, briefings, and early-stage decision support",
    promise: "See ranked interventions, allocation coverage, and the gap to a coarse whole-city benchmark in one place.",
    outcome: "You can defend a first-pass package without pretending the model is more mature than it is.",
    startingRoutes: [
      { label: "Open scenarios", to: "/scenarios" },
      { label: "Inspect city layers", to: "/cities" },
      { label: "Review exports", to: "/exports" },
    ],
    focusPoints: [
      "Treat benchmark-share allocations as planning scaffolds, not procurement-ready estimates.",
      "Use the benchmark gap to explain how far a budget is from a large-scale package.",
      "Check evidence-readiness before presenting a scenario as decision support.",
    ],
    accent: "amber",
  },
  {
    id: "researcher",
    audience: "Researcher",
    title: "Audit provenance, assumptions, and robustness before conclusions",
    summary: "Use the app as a front door into exported artifacts, runtime records, and robustness math.",
    bestFor: "Methods review, reproducibility checks, and evidence tracing",
    promise: "Move quickly from UI summaries to traceable evidence, explicit assumptions, and the current model limits.",
    outcome: "You can inspect what is observed, what is derived, and what is still only an estimate.",
    startingRoutes: [
      { label: "Open overview", to: "/" },
      { label: "Review runs", to: "/runs" },
      { label: "Download artifacts", to: "/exports" },
    ],
    focusPoints: [
      "Use scenario evidence summaries to separate ranking evidence from costable actions.",
      "Inspect artifact exports and runtime history before interpreting a recommendation as stable.",
      "Treat the current scenario engine as a reproducible benchmark layer, not yet a validated optimizer.",
    ],
    accent: "slate",
  },
  {
    id: "community-advocate",
    audience: "Community advocate",
    title: "Translate technical outputs into neighborhood-facing stories",
    summary: "Use readable maps and action cards to talk about fairness, heat burden, and what a budget can realistically do.",
    bestFor: "Public meetings, neighborhood briefings, and coalition work",
    promise: "Start with visible heat traps, connect them to plain-language interventions, and end with shareable exports.",
    outcome: "You leave with a story people can understand, question, and use in a real conversation.",
    startingRoutes: [
      { label: "Browse cities", to: "/cities" },
      { label: "Review scenarios", to: "/scenarios" },
      { label: "Download exports", to: "/exports" },
    ],
    focusPoints: [
      "Prioritize outputs that explain impact and uncertainty together.",
      "Use scenario cards to distinguish 'promising' from 'proven and costed.'",
      "Carry exportable artifacts into meetings without losing the science trail.",
    ],
    accent: "green",
  },
];

function formatCoverage(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatBudget(value: number) {
  return `$${value.toLocaleString()}`;
}

function ModeSuiteCard({ item }: { item: BenchmarkSuiteCase }) {
  return (
      <article className={`mode-suite-card tone-${item.planningMode}`}>
        <div className="eyebrow">{item.label}</div>
        <h3>{formatBudget(item.budgetUsd)}</h3>
        <p>{item.summary}</p>
      <div className="mode-suite-stats">
        <div>
          <span>Mode</span>
          <strong>{item.planningMode.replaceAll("_", " ")}</strong>
        </div>
        <div>
          <span>Actions</span>
          <strong>{item.actionCount}</strong>
        </div>
        <div>
          <span>Coverage</span>
          <strong>{formatCoverage(item.allocationCoveragePct)}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{item.confidence == null ? "Not set" : `${Math.round(item.confidence * 100)}%`}</strong>
        </div>
      </div>
      <div className={`truth-badge ${item.exhaustiveAvailable ? "observed" : "estimated"}`}>
        {item.exhaustiveAvailable ? "exhaustive math ready" : "exhaustive math partial"}
      </div>
      <p className="muted">{item.benchmarkLabel}</p>
      <p className="muted">{item.sourceNote}</p>
    </article>
  );
}

export function ModesPage() {
  const { activeModeId, setMode } = useActivePersonaMode();
  const benchmarkSuiteQuery = useQuery({ queryKey: ["city-benchmark-suite", defaultStudyCityId], queryFn: () => getCityBenchmarkSuite(defaultStudyCityId) });
  const modeAnchors = useMemo(
    () => [
      { label: "Educator", to: "#educator" },
      { label: "Student", to: "#student" },
      { label: "Planner", to: "#planner" },
      { label: "Researcher", to: "#researcher" },
      { label: "Advocate", to: "#community-advocate" },
    ],
    [],
  );

  return (
    <section className="page-stack modes-page">
      <header className="hero-card modes-hero premium-city-hero">
        <div className="city-hero-copy modes-hero-copy">
          <div className="eyebrow">Persona modes</div>
          <h1>Choose the doorway that matches the decision you need to make.</h1>
          <p>
            Same evidence base, different emphasis. The app stays calm and defensible while each mode lifts the part of the story that matters most.
          </p>
          <div className="quick-links">
            <Link to="/" className="button-link">Open overview</Link>
            <Link
              to="/scenarios"
              search={{
                cityId: defaultStudyCityId,
                budgetUsd: 250000,
                focus: undefined,
                sourceLayer: undefined,
                selectedLabel: undefined,
              }}
              className="button-link secondary"
            >
              Try scenarios
            </Link>
            <Link to="/exports" className="button-link secondary">See exports</Link>
          </div>
          <div className="mode-anchor-strip">
            {modeAnchors.map((anchor) => (
              <a key={anchor.label} href={anchor.to} className="persona-chip">
                {anchor.label}
              </a>
            ))}
          </div>
        </div>
        <div className="hero-card-stats modes-hero-panel">
          <div className="modes-focus-panel">
            <div className="eyebrow">Why this page exists</div>
            <h2>One product, five intentional entry points.</h2>
            <p>
              These modes keep the same trusted workflow but change the framing so the interface feels clear, calm, and immediately useful.
            </p>
          </div>
          <div className="mode-quick-facts premium-mode-facts">
            <div>
              <strong>Observe</strong>
              <span>Start with the map and the evidence summary.</span>
            </div>
            <div>
              <strong>Plan</strong>
              <span>Use one scenario engine for budget testing and comparison.</span>
            </div>
            <div>
              <strong>Prove</strong>
              <span>Keep the audit trail, benchmarks, and exports visible.</span>
            </div>
          </div>
        </div>
      </header>

      <article className="panel-card premium-section-card modes-summary-card">
        <div className="section-summary">
          <div>
            <div className="eyebrow">How to choose</div>
            <h2>Pick the lens, not a different truth.</h2>
            <p className="muted">
              The strongest workflows are already connected underneath. What changes here is the narrative emphasis, the starting route, and the level of explanation up front.
            </p>
          </div>
          <div className="mode-quick-facts">
            <div>
              <strong>Fastest start</strong>
              <span>Overview for orientation, scenarios for action, exports for proof.</span>
            </div>
            <div>
              <strong>Most polished</strong>
              <span>City-led storytelling with clean benchmark framing.</span>
            </div>
            <div>
              <strong>Most rigorous</strong>
              <span>Provenance, robustness, and reproducibility remain one click away.</span>
            </div>
          </div>
        </div>
      </article>

      <article className="panel-card premium-section-card">
        <div className="mode-suite-header">
          <div>
            <div className="eyebrow">Benchmark suite</div>
            <h2>How the planner behaves across canonical budgets.</h2>
            <p className="muted">
              A compact benchmark surface makes it easier to spot regressions and explain the current planning maturity.
            </p>
          </div>
          <div className="mode-suite-badge">
            <span>City</span>
            <strong>{benchmarkSuiteQuery.data?.cityName ?? defaultStudyCityLabel}</strong>
          </div>
        </div>
        <div className="mode-suite-grid">
          {benchmarkSuiteQuery.data?.cases.map((item) => (
            <ModeSuiteCard key={item.id} item={item} />
          )) ?? (
            <div className="panel-card nested-card premium-mode-empty">
              <p className="muted">Loading benchmark suite...</p>
            </div>
          )}
        </div>
        {benchmarkSuiteQuery.data ? (
          <p className="muted mode-suite-notes">{benchmarkSuiteQuery.data.headline}</p>
        ) : null}
      </article>

      <div className="persona-grid modes-persona-grid">
        {personaModes.map((mode) => (
          <article key={mode.id} id={mode.id} className={`panel-card persona-card premium-persona-card persona-accent-${mode.accent}`}>
            <div className="persona-card-header">
              <div>
                <div className="eyebrow">{mode.audience}</div>
                <h2>{mode.title}</h2>
                <p>{mode.summary}</p>
              </div>
              <div className="persona-best-for">
                <span>Best for</span>
                <strong>{mode.bestFor}</strong>
              </div>
            </div>
            <div className="persona-actions">
              <button
                type="button"
                className={`button-link ${activeModeId === mode.id ? "secondary" : ""}`}
                onClick={() => setMode(mode.id)}
              >
                {activeModeId === mode.id ? "Active mode" : "Set as active mode"}
              </button>
            </div>
            <div className="persona-promise">
              <strong>What this mode gives you</strong>
              <span>{mode.promise}</span>
            </div>
            <p className="persona-outcome">{mode.outcome}</p>
            <div className="persona-actions">
              {mode.startingRoutes.map((route) => (
                <Link key={`${mode.id}-${route.to}`} to={route.to} className="button-link secondary">
                  {route.label}
                </Link>
              ))}
            </div>
            <div className="persona-focus-header">
              <span>Key things to notice</span>
            </div>
            <ul className="bullet-list">
              {mode.focusPoints.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
