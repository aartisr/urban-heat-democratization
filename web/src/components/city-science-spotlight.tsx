import { MathBlock } from "./math-block";
import type { CitySpectral, RobustnessLab, TrustAudit } from "../lib/types";

type CityScienceSpotlightProps = {
  cityName: string;
  spectral?: CitySpectral;
  robustness?: RobustnessLab;
  trustAudit?: TrustAudit;
};

export function CityScienceSpotlight({ cityName, spectral, robustness, trustAudit }: CityScienceSpotlightProps) {
  const reliabilityGain = robustness
    ? robustness.reliabilityIntervention - robustness.reliabilityBaseline
    : null;

  return (
    <section className="city-science-spotlight" aria-labelledby="science-spotlight-title">
      <div className="city-science-spotlight-copy">
        <div className="eyebrow">The science, made inspectable</div>
        <h2 id="science-spotlight-title">A city is more than a hot-coloured map.</h2>
        <p>
          Urban Heat Democratization reads the relationships between places—heat, cooling access, and connection—not just isolated temperatures. The result is a city story people can question, learn from, and use.
        </p>
        <div className="city-science-proof-pills" aria-label={`${cityName} science summary`}>
          <span><strong>{spectral?.cheegerFeatureCount ?? 0}</strong> connected heat patterns</span>
          <span><strong>{spectral?.coolingZoneCount ?? 0}</strong> cooling-access gaps</span>
          <span><strong>{trustAudit?.reproducibilityManifest.length ?? 0}</strong> traceable artifacts</span>
        </div>
      </div>

      <div className="city-science-model">
        <div className="city-science-model-head">
          <span>From relationships to action</span>
          <strong>{reliabilityGain == null ? "Model context loading" : `${reliabilityGain >= 0 ? "+" : ""}${reliabilityGain.toFixed(3)} reliability signal`}</strong>
        </div>
        <MathBlock tex="L_{\\mathrm{norm}} = D^{-1/2}(D-A)D^{-1/2}" className="city-science-formula" />
        <p>The normalized graph Laplacian identifies weak connections in the chosen graph. It can suggest places where a cooling corridor deserves investigation; it does not establish that one intervention will matter more than another in the physical city.</p>
        <details className="city-science-methods">
          <summary className="city-science-method-summary">
            <span>See the method in plain language</span>
            <span className="city-science-method-summary-icon" aria-hidden="true">+</span>
          </summary>
          <div>
            <MathBlock tex="\\phi(S)=\\frac{\\operatorname{cut}(S,V\\setminus S)}{\\min(\\operatorname{vol}(S),\\operatorname{vol}(V\\setminus S))}" className="city-science-formula city-science-formula-small" />
            <p>Conductance tests how easily a subset is separated in the modeled network. Lower values can reveal bottleneck candidates worth examining with local knowledge and domain review.</p>
          </div>
        </details>
      </div>
    </section>
  );
}
