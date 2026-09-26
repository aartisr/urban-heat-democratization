import type { ScenarioRecord } from "../../../lib/types";
import { buildAllocationLedger, createAllocationLedgerExport } from "../domain/allocation";

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function stateLabel(state: ReturnType<typeof buildAllocationLedger>["lines"][number]["state"]) {
  if (state === "costed_quantity") return "Costed quantity";
  if (state === "ranked_envelope") return "Ranked envelope";
  if (state === "benchmark_envelope") return "Benchmark envelope";
  return "Unallocated";
}

function downloadLedger(scenario: ScenarioRecord) {
  const blob = new Blob([`${JSON.stringify(createAllocationLedgerExport(scenario), null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `urban-heat-allocation-ledger-${scenario.cityId}-${scenario.budgetUsd}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AllocationLedger({ scenario }: { scenario: ScenarioRecord | null }) {
  if (!scenario) return null;
  const ledger = buildAllocationLedger(scenario);
  return (
    <section className="allocation-ledger panel-card" aria-labelledby="allocation-ledger-title">
      <div className="allocation-ledger-head"><div><span className="eyebrow">Stage 2 · budget ledger</span><h2 id="allocation-ledger-title">What this budget is allowed to fund</h2><p>Every dollar is separated into a costed quantity, a provisional planning envelope, or an unallocated balance. No installation quantity is inferred from ranking alone.</p></div><div className="allocation-ledger-actions"><span className="truth-badge derived">Auditable allocation</span><button type="button" onClick={() => downloadLedger(scenario)}>Export ledger</button></div></div>
      <dl className="allocation-ledger-summary">
        <div><dt>Scenario budget</dt><dd>{money(ledger.budgetUsd)}</dd></div>
        <div><dt>Costed quantities</dt><dd>{money(ledger.committedUsd)}</dd></div>
        <div><dt>Provisional envelopes</dt><dd>{money(ledger.provisionalUsd)}</dd></div>
        <div><dt>Unallocated / remainder</dt><dd>{money(ledger.unallocatedUsd)}</dd></div>
      </dl>
      {ledger.lines.length ? <div className="allocation-ledger-lines" role="table" aria-label="Scenario budget ledger">
        <div className="allocation-ledger-row allocation-ledger-row-head" role="row"><span role="columnheader">Action</span><span role="columnheader">Evidence state</span><span role="columnheader">Budget treatment</span><span role="columnheader">Supported quantity</span></div>
        {ledger.lines.map((line) => <div className="allocation-ledger-row" role="row" key={line.id}><div role="cell"><strong>{line.label}</strong><small>{line.explanation}</small></div><div role="cell"><span className={`allocation-ledger-state is-${line.state}`}>{stateLabel(line.state)}</span><small>{line.evidenceLabel}</small></div><div role="cell"><strong>{money(line.allocatedUsd)}</strong>{line.residualUsd > 0 ? <small>{money(line.residualUsd)} retained as remainder</small> : null}</div><div role="cell">{line.quantity == null ? <><strong>Not stated</strong><small>Evidence does not support a quantity</small></> : <><strong>{line.quantity.toLocaleString()} {line.measurementUnit ?? "units"}</strong><small>{money(line.committedUsd)} costed</small></>}</div></div>)}
      </div> : <p className="allocation-ledger-empty">This scenario contains no structured actions yet. Its full budget remains unallocated until source-backed actions are attached.</p>}
      {ledger.unallocatedUsd > ledger.budgetUsd * 0.10 ? <p className="allocation-ledger-reconciliation">This saved scenario leaves more than 10% of its budget unallocated. <a href="#scenario-generator">Re-run this budget with the current allocation rules</a>; this ledger will never conceal the remaining balance.</p> : null}
      {ledger.reconciliationUsd > 0 ? <p className="allocation-ledger-reconciliation">{money(ledger.reconciliationUsd)} is retained as unallocated because the scenario summary does not attach it to an action.</p> : null}
      <p className="allocation-ledger-boundary">A provisional envelope records a planning intent and evidence state. It is not a procurement commitment, installed quantity, or mapped project site.</p>
    </section>
  );
}
