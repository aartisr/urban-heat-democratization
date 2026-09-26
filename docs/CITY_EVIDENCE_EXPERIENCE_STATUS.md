# City Evidence Experience: Delivery Status

> Canonical implementation status for
> [City Evidence Experience: Implementation Plan](CITY_EVIDENCE_EXPERIENCE_IMPLEMENTATION_PLAN.md).  
> Delivery rule: complete one phase, run its exit checks, notify the product
> owner with a test checklist, then begin the next phase.

## Overall status

| Phase | Status | Product-owner test required | Notes |
| --- | --- | --- | --- |
| 0. Evidence and content inventory | Complete | Review only | Generic city contract and baseline content allocation are recorded below. No live UI changes in this phase. |
| 1. Information architecture and interaction design | Ready for product-owner test | Yes | Generic Read / Explore / Audit shell and URL state are implemented; the production build passes. |
| 2. Usability research and content calibration | Ready for product-owner test | Yes | A generic guided-brief prototype and moderated research protocol are available; the production build passes. Formal participant sessions remain a required external gate. |
| 3. Design system and accessibility specification | Repository implementation complete | Yes | Added responsive guided/evidence-ledger behavior, visible focus states, semantic evidence labels, reduced-motion treatment, and city-route CSS splitting. Contrast and CSS-budget checks pass; manual assistive-technology and zoom review remain required before pilot sign-off. |
| 4. Technical architecture and implementation | Repository work complete | Yes | Added reusable guided brief, evidence ledger, URL state, consent-safe measurement, and Playwright coverage. Production build and the local Chromium suite pass; the live-backend map test remains an intentional opt-in check. |
| 5. Pilot release, measurement, and iteration | Pilot-ready; externally gated | Yes | Release checklist and privacy-safe measurement are in place. Deployment, owner approvals, and moderated research cannot be completed from the repository alone. |

## Phase 0 — completed baseline

### Reusable product contract

Every city must render from the same city-experience contract, with an honest
readiness state. The UI must never use the presence of a city profile, boundary,
or starter configuration as evidence that local heat findings are available.

| Readiness state | Default experience | Permitted claims | Unsupported features |
| --- | --- | --- | --- |
| `bundled-validated` | Read, Explore, Audit | Approved local findings with source and limitation | None, except explicitly documented dataset limits |
| `bundled-partial` | Read, constrained Explore, Audit | Only supported findings and visible data-gap explanation | Missing layers, rankings, or scenario handoffs |
| `upload-first` | Onboarding-first Read, constrained Explore, Audit | City context and required study inputs | Local findings, rankings, or heat claims before data validation |
| `processing` | Progress/Onboarding Read, constrained Explore, Audit | Submitted inputs, processing state, and next evidence gate | Results that have not completed validation |

The implementation model must provide these fields for every city:

- identity and boundary context;
- readiness/evidence availability and the reason for unavailability;
- approved headline finding or approved onboarding promise;
- a maximum of three sourced proof facts;
- ordered guided lenses, each with finding, limitation, source, and non-map
  equivalent;
- observed/derived/planning evidence ledger entries;
- valid Explore layers, filters, selected-area behavior, and scenario handoff;
- Audit methods, validation, provenance, packages, and downloads; and
- onboarding requirements when evidence is not ready.

### Baseline implementation inventory

| Existing surface | Current implementation location | Target experience | Phase 1 decision |
| --- | --- | --- | --- |
| Hero, metrics, live cue, journey cards | `city-intelligence-overview.tsx` and `city-detail-config.tsx` | Read | Reduce first view to one answer, three facts, and two actions |
| Atlas activation and shell | `city-atlas-shell.tsx`, `city-detail.tsx` | Read + Explore | Guided entry must be distinct from full workbench entry |
| Map overlays, hover, selection, controls | `city-heat-map.tsx` | Explore | Preserve analytical capability; avoid implicit tooltip/selection state |
| Scientific explanation and formula | `city-science-spotlight.tsx` | Read + Audit | Use plain-language summary in Read; full derivation in Audit |
| Evidence/honesty cards | `city-detail-config.tsx` | Read + Audit | Consolidate into a compact evidence ledger |
| Snapshot, readiness, and workflow grids | `city-detail-config.tsx`, `city-detail-section-grid.tsx` | Read + Onboarding | Replace page-wide equal-priority card treatment with editorial sequencing |
| Robustness, trust, provenance, downloads | route queries and detail sections | Audit | Keep directly reachable from related claims |
| Scenario handoff | `buildScenarioSearch` and route links | Consider/action bridge | Show only after evidence interpretation; pass explicit selected context only |
| Local data registration | `city-detail.tsx` | Onboarding | Keep for upload-first cities; do not show as a failure state for bundled studies |

### Phase 0 acceptance checks

- [x] The design is generic: Boston is a pilot, not a special-case template.
- [x] Bundled, partial, upload-first, and processing states have distinct,
      honest behavior.
- [x] Every current major city-page surface has a planned destination.
- [x] The plan preserves methods, provenance, downloads, and advanced map work.
- [x] No production UI behavior or scientific claim changed in Phase 0.

### Product-owner review checklist

This phase has no interactive UI to test. Please review the following decisions
before Phase 1 begins:

1. The top-level experiences are **Read**, **Explore**, and **Audit**;
   **Onboarding** replaces Read's evidence story when local evidence is not
   ready.
2. A city with incomplete data must show a useful next step, not simulated
   findings.
3. Every headline finding must visibly link to its limitation and source.
4. Boston is the first visual pilot, but the components and data contract must
   support all cities from the outset.

## Change log

| Date | Phase | Change | Verification |
| --- | --- | --- | --- |
| 2026-09-26 | 0 | Added generic implementation plan and this status register; recorded city states and current-surface allocation. | Documentation review; no runtime change. |
| 2026-09-26 | 1 | Added generic Read / Explore / Audit navigation, URL state, explicit atlas activation, and separated the existing city surfaces into those modes. | Production build passed after corporate-registry dependency restore. |
| 2026-09-26 | 2 | Added a generic three-step guided city brief with an explicit limitation at every step, plus a moderated research protocol. | Production build passed. Formal usability sessions have not yet been run. |
| 2026-09-26 | 3 | Added responsive/keyboard-visible guided controls, an accessible evidence ledger, mobile table reflow, reduced-motion behavior, semantic evidence-state labels, and city-route CSS splitting. | Contrast and CSS-budget checks pass: the initial application CSS is 219.7 KiB against the 220 KiB budget. Manual screen-reader/400% zoom review remains required. |
| 2026-09-26 | 4 | Added generic Audit evidence-ledger architecture, consent-safe experience/step events, route-level Playwright coverage for Read, Explore, and Audit, and narrow-phone overflow coverage. | Node 22 production build, performance/contrast gates, and the local Chromium suite passed (11 passed; one live-backend test is intentionally skipped without `E2E_LIVE_BACKEND=1`). |
| 2026-09-26 | 5 | Added pilot-release checklist and documented measurement constraints/rollback procedure. | Ready for preview deployment; participant research and named owner approvals are external gates. |

## Next phase gate

Repository implementation is complete through Phase 5. Before a production
pilot, complete every unchecked item in the
[pilot release checklist](CITY_EVIDENCE_EXPERIENCE_PILOT_RELEASE_CHECKLIST.md).
Do not mark the experience validated until the required moderated research and
owner approvals are complete.

## Phase 1 — product-owner browser test

Use any bundled city and at least one upload-first/starter city.

1. Open `/cities/boston`. Confirm **Read** is active and the full map does not
   load until **Explore** is chosen or `Start with the guided atlas` is used.
2. Select **Explore**. Confirm the URL becomes
   `/cities/boston?view=explore`, the atlas opens, and the map retains its
   existing hover/click behavior.
3. Select **Audit**. Confirm the URL becomes
   `/cities/boston?view=audit`, and scientific explanation, evidence, planning
   robustness, and validation/reproducibility appear without the full map
   workspace taking over the page.
4. Use the browser Back/Forward buttons. Confirm the selected experience
   changes with the URL.
5. Open an upload-first/starter city. Confirm the same navigation exists and
   the Read experience shows readiness/onboarding rather than a fabricated
   local finding.
6. At a narrow mobile width, confirm the mode choices remain readable and
   tappable; at keyboard focus, confirm each choice has a visible focus ring.

### Verification note

On 2026-09-26, `npm ci` completed successfully using the authenticated corporate
Artifactory registry supplied by the product owner, without altering committed
`.npmrc` or lockfile registry references. `npm run build` then passed:
TypeScript completed with no errors and Vite produced `web/dist`.

Node `22.19.0` is installed at `/opt/homebrew/bin/node` and is selected by the
interactive zsh configuration. Non-interactive shells skip `.zshrc` and can
resolve the older `/usr/local/bin/node` (`20.15.1`) instead. A second production
build was verified through interactive zsh on Node `22.19.0`.

## Phase 2 — product-owner browser test

1. Open `/cities/boston` and use the **Guided city brief**. Confirm it presents
   one step at a time: Context, Signal, then Next step.
2. At every step, read **What this means** and **Important limit**. Confirm the
   language is scientifically accurate and does not imply a forecast, diagnosis,
   or automatic policy decision.
3. Select the steps in a non-linear order, then use **Continue reading**.
   Confirm the step counter and displayed explanation update correctly.
4. Choose **Inspect the Atlas** from the final step. Confirm it opens Explore
   with the correct city in the URL.
5. Open an upload-first/starter city. Confirm the Context step says the city is
   awaiting validated local inputs and does not make a local heat claim.
6. Use keyboard Tab and Enter/Space. Confirm each step can be reached and
   operated, and visible focus is retained.

The formal next action is to run the moderator tasks in
[the research protocol](CITY_EVIDENCE_EXPERIENCE_RESEARCH_PROTOCOL.md) with
representative participants. Product-owner review can proceed before that
external research is scheduled, but research results are required before
calling the wording validated.
