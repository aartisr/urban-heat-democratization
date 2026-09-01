import OsmPlayground from "./OsmPlayground";
import SensorValidationBench from "./SensorValidationBench";
import SpectralGraphFilter from "./SpectralGraphFilter";
import GrantPdfGenerator from "./GrantPdfGenerator";
import MultilingualLocalization from "./MultilingualLocalization";
import GisApiPlayground from "./GisApiPlayground";
import PullRequestSuite from "./PullRequestSuite";

type SuiteTool = {
  id: string;
  number: string;
  title: string;
  outcome: string;
  description: string;
  detail: string;
};

const suiteTools: SuiteTool[] = [
  { id: "city-input", number: "01", title: "Import a city map", outcome: "Start with a boundary and street network.", description: "Create the geographic foundation for a city analysis from OpenStreetMap data.", detail: "Boundary · street network · analysis context" },
  { id: "ground-truth", number: "02", title: "Validate with sensors", outcome: "Check the model against observed conditions.", description: "Compare modeled heat stress with field and sensor readings before relying on a finding.", detail: "Observed readings · residuals · limits" },
  { id: "connected-geography", number: "03", title: "Test complex geography", outcome: "Keep coasts and islands interpretable.", description: "Use component-aware graph methods when disconnected places affect the analysis.", detail: "Connected components · access barriers · assumptions" },
  { id: "brief", number: "04", title: "Create a grant brief", outcome: "Package a decision-ready story.", description: "Generate a concise policy brief with the evidence and context needed for review.", detail: "Brief · source trail · caveats" },
  { id: "language", number: "05", title: "Translate the story", outcome: "Make the evidence understandable.", description: "Prepare plain-language and multilingual explanations around the same underlying evidence.", detail: "Plain language · local context · access" },
  { id: "api", number: "06", title: "Publish GIS data", outcome: "Connect evidence to other tools.", description: "Explore and reuse documented geographic outputs through the GIS API workspace.", detail: "Open formats · provenance · reusable layers" },
  { id: "review", number: "07", title: "Contribute an improvement", outcome: "Make the platform more trustworthy.", description: "Review and prepare upstream changes with a visible record of what improves and why.", detail: "Peer review · changes · accountable iteration" },
];

type UpgradeToTenProps = { activeTool: string; onChooseTool: (id: string) => void };

function ToolWorkspace({ toolId }: { toolId: string }) {
  switch (toolId) {
    case "city-input": return <OsmPlayground />;
    case "ground-truth": return <SensorValidationBench />;
    case "connected-geography": return <SpectralGraphFilter />;
    case "brief": return <GrantPdfGenerator />;
    case "language": return <MultilingualLocalization />;
    case "api": return <GisApiPlayground />;
    case "review": return <PullRequestSuite />;
    default: return null;
  }
}

export default function UpgradeToTen({ activeTool, onChooseTool }: UpgradeToTenProps) {
  const selectedTool = suiteTools.find((tool) => tool.id === activeTool) ?? suiteTools[0];

  return (
    <section className="solution-suite" aria-labelledby="solution-suite-title">
      <header className="solution-suite-hero">
        <div className="solution-suite-hero-copy">
          <p className="eyebrow">Evidence-to-action suite</p>
          <h1 id="solution-suite-title">One clear tool<br /><em>for the next step.</em></h1>
          <p>Choose what you need to do. The relevant workspace opens below, with the original method and controls intact.</p>
          <a className="button-link" href="#solution-suite-path">Choose a tool</a>
        </div>
      </header>

      <section className="solution-suite-path" id="solution-suite-path" aria-labelledby="suite-path-title">
        <div className="solution-suite-heading">
          <p className="eyebrow">Choose a tool</p>
          <h2 id="suite-path-title">What do you need to do?</h2>
          <p>Pick one. You can change tools at any time.</p>
        </div>
        <div className="solution-suite-tools" role="list">
          {suiteTools.map((tool) => {
            const isActive = selectedTool.id === tool.id;
            return (
              <button key={tool.id} type="button" className={`solution-suite-tool ${isActive ? "is-active" : ""}`} onClick={() => onChooseTool(tool.id)} aria-pressed={isActive} aria-controls="tool-workspace" role="listitem">
                <span className="solution-suite-tool-number">{tool.number}</span>
                <span className="solution-suite-tool-copy"><strong>{tool.title}</strong><small>{tool.outcome}</small></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="solution-suite-selection" aria-live="polite">
        <div className="solution-suite-selection-number" aria-hidden="true">{selectedTool.number}</div>
        <div><p className="eyebrow">Selected tool</p><h2>{selectedTool.title}</h2><p>{selectedTool.description}</p><p className="solution-suite-detail">{selectedTool.detail}</p></div>
        <a className="button-link solution-suite-action" href="#tool-workspace">Open workspace <span aria-hidden="true">↓</span></a>
      </section>

      <section className="solution-suite-workspace" id="tool-workspace" aria-label={`${selectedTool.title} workspace`}>
        <div className="solution-suite-workspace-heading"><p className="eyebrow">Workspace</p><p>{selectedTool.title}</p></div>
        <ToolWorkspace toolId={selectedTool.id} />
      </section>
    </section>
  );
}
