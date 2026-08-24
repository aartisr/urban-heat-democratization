import { Link } from "@tanstack/react-router";

const repositoryUrl = "https://github.com/aartisr/urban-heat-democratization";
const authorUrl = "https://ai-aarti.com/";

export function ContactPage() {
  return (
    <section className="page-stack contact-page">
      <header className="contact-hero" aria-labelledby="contact-title">
        <div className="contact-hero-copy">
          <p className="eyebrow">Collaboration desk</p>
          <h1 id="contact-title">Bring your question.<br /><em>Build the next proof point.</em></h1>
          <p>
            Urban Heat Democratization becomes useful through careful collaboration: local knowledge,
            technical scrutiny, public purpose, and a shared commitment to say exactly what the evidence can support.
          </p>
          <div className="contact-hero-actions">
            <a className="button-link" href={authorUrl}>Contact Aarti S Ravikumar</a>
            <a className="button-link secondary" href={`${repositoryUrl}/issues`}>Open a collaboration issue</a>
          </div>
          <p className="contact-response-note">Start with the path that fits your role. A good first note can be short, specific, and grounded in a real place or question.</p>
        </div>
        <aside className="contact-signal-card" aria-label="Collaboration principles">
          <div className="contact-signal-mark" aria-hidden="true"><span /><span /><span /></div>
          <p className="eyebrow">The working standard</p>
          <strong>Open evidence.<br />Local wisdom.<br />Accountable action.</strong>
          <p>Every contribution should make the work more legible, testable, equitable, or useful in the real world.</p>
        </aside>
      </header>

      <section className="contact-path-section" aria-labelledby="choose-path-title">
        <div className="section-heading">
          <p className="eyebrow">Choose your doorway</p>
          <h2 id="choose-path-title">Three simple ways to begin.</h2>
          <p>You do not need to be a spectral-graph expert to help. Choose the contribution that matches what you know.</p>
        </div>
        <div className="contact-path-grid">
          <article className="contact-path-card contact-path-card--community">
            <span className="contact-path-number">01</span>
            <h3>Share local knowledge</h3>
            <p>For residents, advocates, educators, and local organizations: identify what a map misses, what a neighborhood needs, or what deserves closer investigation.</p>
            <ul>
              <li>Name the place and the question.</li>
              <li>Share a public source or lived-context observation.</li>
              <li>Explain what a responsible response would look like.</li>
            </ul>
            <a href={`${repositoryUrl}/issues/new/choose`}>Share a community insight <span aria-hidden="true">↗</span></a>
          </article>
          <article className="contact-path-card contact-path-card--mentor">
            <span className="contact-path-number">02</span>
            <h3>Mentor or review the method</h3>
            <p>For researchers, mathematicians, public-health professionals, planners, and domain experts: challenge assumptions and improve how uncertainty is explained.</p>
            <ul>
              <li>Review theory, data provenance, or evaluation design.</li>
              <li>Suggest a test, sensitivity analysis, or source.</li>
              <li>Help distinguish a model signal from a field conclusion.</li>
            </ul>
            <a href={`${repositoryUrl}/issues/new/choose`}>Offer technical mentorship <span aria-hidden="true">↗</span></a>
          </article>
          <article className="contact-path-card contact-path-card--pilot">
            <span className="contact-path-number">03</span>
            <h3>Shape a local pilot</h3>
            <p>For public agencies, civic partners, funders, and implementation teams: propose a bounded question that can be reviewed and evaluated in public.</p>
            <ul>
              <li>Choose one geography and public-interest question.</li>
              <li>Identify the local data steward and decision owner.</li>
              <li>Define review, safeguards, and a learning plan before action.</li>
            </ul>
            <a href={authorUrl}>Start a pilot conversation <span aria-hidden="true">↗</span></a>
          </article>
        </div>
      </section>

      <section className="contact-process" aria-labelledby="process-title">
        <div>
          <p className="eyebrow">What happens next</p>
          <h2 id="process-title">A collaboration should leave a trace.</h2>
          <p>There is no black-box intake. The goal is a visible, respectful path from question to evidence to a next decision.</p>
        </div>
        <ol>
          <li><span>1</span><div><strong>Frame</strong><p>State the location, question, and public value.</p></div></li>
          <li><span>2</span><div><strong>Examine</strong><p>Check sources, assumptions, limitations, and affected perspectives.</p></div></li>
          <li><span>3</span><div><strong>Test</strong><p>Use a bounded analysis or pilot with appropriate expert and community review.</p></div></li>
          <li><span>4</span><div><strong>Learn openly</strong><p>Document what held up, what did not, and what should change.</p></div></li>
        </ol>
      </section>

      <section className="contact-clarity-grid" aria-label="Collaboration resources and acknowledgements">
        <article className="contact-resource-card">
          <p className="eyebrow">Before you write</p>
          <h2>Bring one clear question.</h2>
          <p>Useful first messages include the location or population in scope, the decision the work might inform, the evidence already available, and the uncertainty you want help resolving.</p>
          <div className="contact-resource-links">
            <a href="https://aartisr.github.io/urban-heat-democratization/wiki/participate/">Read the operationalization guide</a>
            <a href="https://aartisr.github.io/urban-heat-democratization/wiki/repeatability/">Read the validation standard</a>
            <Link to="/modes">Choose a learning path</Link>
          </div>
        </article>
        <aside className="contact-gratitude-card">
          <div className="gratitude-topline">
            <div className="gratitude-seal" aria-hidden="true"><span>∞</span></div>
            <p className="eyebrow">With gratitude</p>
            <span className="gratitude-line" aria-hidden="true" />
          </div>
          <h2>Every rigorous idea has a human foundation.</h2>
          <blockquote>
            <p>“The most enduring equations begin with someone who helps us believe we can understand them.”</p>
          </blockquote>
          <p>With sincere credit to <strong>Ms. Shukla</strong>, Math Mentor, for nurturing mathematical curiosity and disciplined reasoning.</p>
          <p>And with deep gratitude to Aarti’s parents, whose encouragement and belief supported the idea behind this project.</p>
          <p className="contact-author-credit">Created and authored by <a href={authorUrl}>Aarti S Ravikumar</a>.</p>
        </aside>
      </section>

      <section className="contact-final-callout">
        <p className="eyebrow">The invitation is open</p>
        <h2>Help make heat-resilience decisions more understandable, more contestable, and more humane.</h2>
        <div className="quick-links">
          <a className="button-link" href={authorUrl}>Contact Aarti S Ravikumar</a>
          <a className="button-link secondary" href={`${repositoryUrl}/issues`}>See open collaboration threads</a>
        </div>
      </section>
    </section>
  );
}
