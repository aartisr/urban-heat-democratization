import { MathBlock } from "./math-block";

export function ScienceDemocratizationBanner() {
  return (
    <article className="panel-card premium-section-card science-banner">
      <div className="science-banner-head">
        <div>
          <div className="eyebrow">Math + science mission</div>
          <h2>Rigorous urban heat science, democratized for public decisions</h2>
          <p className="muted">We make the reasoning visible: what the map observes, what the model derives, and what people still need to verify together.</p>
        </div>
        <p className="science-banner-promise"><strong>See the logic.</strong><span>Question the result.</span><span>Decide with context.</span></p>
      </div>
      <div className="science-banner-grid">
        <article className="science-banner-card science-banner-card--model">
          <span className="science-banner-step">01</span>
          <p className="science-banner-kicker">Model the relationships</p>
          <h3>A city becomes a network.</h3>
          <p>Nearby places are connected only through declared, inspectable assumptions—not hidden intuition.</p>
          <details><summary>View the graph model</summary><MathBlock tex={String.raw`L_{\mathrm{norm}} = I - D^{-1/2} A D^{-1/2}`} className="science-banner-formula" /></details>
        </article>
        <article className="science-banner-card science-banner-card--bottleneck">
          <span className="science-banner-step">02</span>
          <p className="science-banner-kicker">Find the weak links</p>
          <h3>Look for a pinch point.</h3>
          <p>The model highlights where cooling continuity may be fragile, giving local reviewers a precise place to inspect.</p>
          <details>
            <summary>View the conductance formula</summary>
            <MathBlock tex={String.raw`\phi(S) = \frac{\operatorname{cut}(S, V \setminus S)}{\min(\operatorname{vol}(S), \operatorname{vol}(V \setminus S))}`} className="science-banner-formula" />
            <p className="science-banner-plain-formula"><em>Conductance</em> = connections crossing the boundary ÷ the size of the smaller side.</p>
          </details>
        </article>
        <article className="science-banner-card science-banner-card--decision">
          <span className="science-banner-step">03</span>
          <p className="science-banner-kicker">Make tradeoffs visible</p>
          <h3>Keep choices explainable.</h3>
          <p>Evidence, feasibility, and local priorities stay separate so a recommendation can be challenged and improved.</p>
          <div className="science-banner-factors" aria-label="Decision inputs"><span>Evidence</span><b>×</b><span>Feasibility</span><b>×</b><span>Local priority</span></div>
          <details>
            <summary>View the decision formula</summary>
            <MathBlock tex={String.raw`\Delta T_{\mathrm{proxy}} = \alpha \cdot R \cdot \sum_i \left(w_{\mathrm{budget},i} \cdot w_{\mathrm{evidence},i} \cdot w_{\mathrm{priority},i} \cdot w_{\mathrm{layer},i}\right)`} className="science-banner-formula" />
            <p className="science-banner-plain-formula">This is an auditable planning proxy—not a guaranteed temperature reduction.</p>
          </details>
        </article>
      </div>
    </article>
  );
}
