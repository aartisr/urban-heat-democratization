import { MathBlock } from "./math-block";

export function ScienceDemocratizationBanner() {
  return (
    <article className="panel-card premium-section-card science-banner">
      <div className="science-banner-head">
        <div>
          <div className="eyebrow">Math + science mission</div>
          <h2>Rigorous urban heat science, democratized for public decisions</h2>
          <p className="muted">
            Every screen stays anchored to spectral graph methods, explicit uncertainty, and open evidence provenance so technical rigor remains legible for planners, educators, researchers, and neighborhoods.
          </p>
        </div>
      </div>
      <div className="science-banner-grid">
        <div>
          <strong>Graph rigor</strong>
          <MathBlock tex="L_{\\mathrm{norm}} = D^{-1/2}(D-A)D^{-1/2}" className="science-banner-formula" />
          <span>Structure-aware heat connectivity in weighted urban graphs.</span>
        </div>
        <div>
          <strong>Bottleneck detection</strong>
          <MathBlock tex="\\phi(S)=\\frac{\\operatorname{cut}(S, V\\setminus S)}{\\min(\\operatorname{vol}(S), \\operatorname{vol}(V\\setminus S))}" className="science-banner-formula" />
          <span>Finds mitigation leverage zones by minimizing conductance.</span>
        </div>
        <div>
          <strong>Transparent decisions</strong>
          <MathBlock tex="\\Delta T_{\\mathrm{proxy}} = \\alpha \\cdot R \\cdot \\sum_i \\Bigl(w_{\\mathrm{budget},i} \\cdot w_{\\mathrm{evidence},i} \\cdot w_{\\mathrm{priority},i} \\cdot w_{\\mathrm{layer},i}\\Bigr)" className="science-banner-formula" />
          <span>Evidence-weighted impact proxy remains visible and auditable.</span>
        </div>
      </div>
    </article>
  );
}
