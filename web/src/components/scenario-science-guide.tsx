import { MathBlock } from "./math-block";
import type { RobustnessLab, ScenarioRecord } from "../lib/types";

type ScenarioScienceGuideProps = {
  scenario?: ScenarioRecord;
  robustness?: RobustnessLab;
};

export function ScenarioScienceGuide({ scenario, robustness }: ScenarioScienceGuideProps) {
  const coverage = scenario ? Math.round(scenario.allocationSummary.allocationCoveragePct * 100) : 0;
  const evidenceReady = scenario?.evidenceSummary.readinessLabel ?? "Loading";
  const lambdaGain = robustness ? robustness.lambda2Intervention - robustness.lambda2Baseline : null;

  return (
    <section className="scenario-science-guide" aria-labelledby="scenario-science-guide-title">
      <div className="scenario-science-guide-intro">
        <div className="eyebrow">A guide for the room</div>
        <h2 id="scenario-science-guide-title">Turn a budget conversation into a science conversation.</h2>
        <p>
          A scenario is not a promise. It is a transparent way to compare choices: what the evidence supports, what the budget can reach, and where uncertainty remains.
        </p>
        <details className="scenario-presenter-notes">
          <summary>Presenter notes: a 60-second walkthrough</summary>
          <ol>
            <li><strong>Point to the evidence.</strong> “We begin with patterns in heat and cooling access, not an intervention wish list.”</li>
            <li><strong>Set the constraint.</strong> “This is what this budget can cover; the number is not a procurement quote.”</li>
            <li><strong>Read the uncertainty.</strong> “The result is strongest where the evidence is strongest—and the page shows the difference.”</li>
          </ol>
        </details>
      </div>

      <div className="scenario-science-guide-steps">
        <article>
          <span>01 · Evidence</span>
          <strong>{evidenceReady}</strong>
          <p>Observed and derived layers establish where a choice has a defensible reason.</p>
        </article>
        <article>
          <span>02 · Budget</span>
          <strong>{coverage}% covered</strong>
          <p>Allocation shows what is funded, what remains, and the tradeoff the group is making.</p>
        </article>
        <article>
          <span>03 · Structure</span>
          <strong>{lambdaGain == null ? "Loading" : `${lambdaGain >= 0 ? "+" : ""}${lambdaGain.toFixed(3)} λ₂`}</strong>
          <p>Graph structure tests whether the action package improves connection to cooling opportunity.</p>
        </article>
      </div>

      <div className="scenario-science-equation">
        <span>The decision model, without the black box</span>
        <MathBlock tex="\\Delta T_{\\mathrm{proxy}} = \\alpha \\cdot R \\cdot \\sum_i (w_{\\mathrm{budget},i}w_{\\mathrm{evidence},i}w_{\\mathrm{priority},i}w_{\\mathrm{layer},i})" className="scenario-science-equation-formula" />
        <p>Each proposed action is weighted by the money available, quality of evidence, priority, and relationship to the mapped condition. The page always labels this as a modeled proxy, not a measured temperature outcome.</p>
      </div>
    </section>
  );
}
