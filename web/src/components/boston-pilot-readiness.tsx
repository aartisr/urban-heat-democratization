import { Link } from "@tanstack/react-router";

const readiness = [
  ["Local steward", "Pending", "A community or public partner must be named before any pilot begins."],
  ["Ground truth", "Pending", "Local observation must be designed before a graph signal is interpreted."],
  ["Equity review", "Pending", "A reviewer must check for burden, exclusion, stigma, and adverse use."],
];

export function BostonPilotReadiness() {
  return (
    <section className="boston-pilot-readiness" aria-labelledby="boston-pilot-title">
      <div>
        <p className="eyebrow">Boston pilot · preparation only</p>
        <h2 id="boston-pilot-title">A local partner decides whether this becomes a pilot.</h2>
        <p>This workspace can prepare a clear question and evidence record. It cannot choose a community’s priorities or validate a place without local review.</p>
      </div>
      <div className="boston-pilot-gates">
        {readiness.map(([title, status, detail]) => <article key={title}><span>{status}</span><strong>{title}</strong><p>{detail}</p></article>)}
      </div>
      <div className="quick-links">
        <a className="button-link secondary" href="https://github.com/aartisr/urban-heat-democratization/blob/main/docs/BOSTON_PILOT_READINESS.md">Read the pilot protocol</a>
        <Link className="button-link secondary" to="/contact">Bring a bounded Boston question</Link>
      </div>
    </section>
  );
}
