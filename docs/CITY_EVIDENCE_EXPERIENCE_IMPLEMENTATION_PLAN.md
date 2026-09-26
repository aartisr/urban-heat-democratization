# City Evidence Experience: Implementation Plan

> Status: proposed implementation plan  
> Scope: every city experience, including bundled studies and upload-first cities  
> Product intent: make the public experience calm, legible, scientifically
> rigorous, and useful without removing any evidence, planning, or audit detail.

Boston is the initial pilot because it is the current bundled study. It is not
the design's special case. The resulting system must render any city from the
same contract, adapting honestly to its available evidence and readiness.

## Executive decision

Redesign each city page from a single, vertically stacked analytical dashboard
into three connected experiences:

```text
Read (default)  →  Explore (full atlas)  →  Audit (methods and provenance)
      │                   │                       │
      └──────→ Consider an action / scenario ←────┘
```

The default **Read** experience is an evidence-led civic briefing. It answers
one question at a time and guides a first-time visitor through the main signal.
**Explore** preserves the current map's analytical power. **Audit** preserves
all formulae, validation, source, download, and reproducibility material.

This is progressive disclosure, not simplification by removal. A person must
be able to reach any important detail from the relevant finding, within one or
two deliberate interactions.

The research basis is:

- Shneiderman's sequence: overview first, then zoom/filter, then details on
  demand: <https://drum.lib.umd.edu/items/155a868e-fb83-4115-9899-9187ea8c0498>.
- Segel and Heer's narrative-visualization research: guide readers through a
  coherent introduction, then permit free exploration:
  <https://homes.cs.washington.edu/~jheer/files/narrative.pdf>.
- W3C cognitive accessibility guidance on clear layouts, short blocks,
  summaries, and explicit meaning:
  <https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/>.
- CDC map guidance: classification and visual emphasis affect the data story;
  maps need clear legends and supporting context:
  <https://www.cdc.gov/cove/data-visualization-types/general-map-guidance.html>.

## Design principles and non-negotiables

1. **One question per moment.** The visitor must never have to infer which of
   several equal-looking cards or controls matters first.
2. **Evidence before intervention.** The experience explains the signal and
   its limits before inviting a planning action.
3. **Observed, derived, and planning information are distinct.** These states
   must have persistent labels and must not be communicated by colour alone.
4. **No hidden caveats.** A short limitation is visible beside every headline
   insight; the full limitation and method are directly reachable.
5. **No accidental map state.** A cell is selected only after an explicit user
   action. Tooltips appear on hover or keyboard focus, not as permanent map
   furniture. The highest-ranked bottleneck is explained outside the grid and
   can be deliberately located on the map.
6. **The map is a tool, not the page's only explanation.** Every map finding
   has an equivalent text/table representation.
7. **Rigor is calm.** The visual language should feel like a public scientific
   briefing: precise typography, whitespace, modest motion, direct language,
   and candid uncertainty—not a dense control room.
8. **Do not overclaim.** A priority area is a reason to inspect further; it is
   not a temperature forecast, a diagnosis of harm, or an automatic policy
   recommendation.

## Current-state diagnosis

The present page contains valuable material, but several distinct narratives
compete at once:

- The hero combines purpose, metrics, live status, two primary actions, and a
  three-step journey.
- The map is introduced as both the first explanation and a full technical
  workspace.
- Scientific explanation, snapshot metrics, evidence/trust, readiness,
  workflow, robustness, and reproducibility are all rendered as similarly
  weighted card sections.
- Concepts recur in more than one place, so visitors must decide whether two
  cards are complementary, repeated, or contradictory.

The implementation should solve hierarchy and sequencing first. It should not
attempt to solve overload by hiding material arbitrarily or by adding more
tooltips.

## Target information architecture

### Read: City Evidence Brief (default)

The default page is a short, scannable briefing with five editorial sections.

1. **Context strip**
   - Breadcrumb: `Cities / {City name}`.
   - Dataset/study status, latest evidence date, and quiet links to methods and
     downloads.
   - No large operational-status treatment unless the status changes a user's
     interpretation.

2. **One-answer opening**
   - Heading framed as a city-specific question, for example: *Where should
     {City name} look closer first?*
   - One plain-language answer, one sentence describing scope, and a visible
     `What this cannot tell us` link.
   - At most three proof facts: study coverage, number of priority areas, and
     evidence status.
   - Actions: **Start guided reading** and **Explore the atlas**. The scenario
     action appears after the evidence story.

3. **Guided evidence story**
   - A three-step sequence: **See → Understand → Consider**.
   - One map lens per step; one question, one finding, one limitation, and one
     next action per lens.
   - Desktop: a sticky map stage with accompanying editorial text. Mobile: a
     vertical story with a focused map after each explanation.

4. **Decision bridge**
   - Concise statement of what the evidence supports, what remains uncertain,
     and what a responsible next step could be.
   - Link to scenario planning with the relevant city and, where explicitly
     chosen, selected area context.

5. **Evidence ledger and research entry**
   - A compact table of observed, derived, and planning inputs.
   - Source, time period, geographic resolution, key limitation, and links to
     full provenance/downloads.
   - Clear entries into Audit; no page-long methodology wall for first-time
     visitors.

### Explore: Atlas Workbench

Explore is the analytical workspace for people who want to investigate.

- Start with a question-based lens picker, not every control exposed at once:
  - Where should we inspect more closely?
  - What did the source observe?
  - Where may cooling access be constrained?
- Render one active lens by default. Advanced layers, filters, boundaries, and
  research controls live in a labelled drawer.
- Hover or keyboard focus provides a short tooltip. Clicking/tapping opens a
  persistent evidence panel with `Clear selection` and `Back to overview`.
- The selected-area panel distinguishes input data, derived result, source,
  limitation, and suitable follow-up.
- Provide an equivalent ranked list/table and a downloadable data route.
- Present the highest-ranked bottleneck as a small explanatory callout outside
  the map. Its `View on map` action pans/zooms; it must not silently select or
  outline a grid cell.

### Audit: Research, methods, and reproducibility

Audit is a scholarly reference surface, not a lower-priority afterthought.

- Method overview in plain language, with full formulae available in context.
- Data lineage: source, collection/processing date, version, licensing, and
  geographic coverage.
- Validation, robustness, trust audit, assumptions, and known limitations.
- Package manifests, reproducibility instructions, download links, and
  machine-readable exports where available.
- Persistent language distinguishing computational validation from real-world
  intervention evidence.

## Content allocation matrix

| Current material | New primary home | Secondary access |
| --- | --- | --- |
| Hero narrative | Read: one-answer opening | City summary metadata |
| Hero metrics | Read: three proof facts | Evidence ledger |
| Journey cards | Read: guided-story progress | Persistent Read navigation |
| City heat map | Explore; focused lenses in Read | Direct deep links by lens |
| Science spotlight/formula | Read: short explanation | Audit: full method |
| Evidence and honesty cards | Read: evidence ledger | Audit: full provenance |
| Snapshot/readiness cards | Read: decision bridge | Audit or city summary |
| Guided workflow | Read: guided story and decision bridge | Explore presets |
| Robustness/trust/reproducibility | Audit | Relevant Read/Explore caveat links |
| Scenario entry | Decision bridge | Explore selection panel |

## Generic city contract and readiness behavior

The experience must be driven by a city configuration/data contract, not
Boston-specific copy, routes, layer names, or assumptions. The contract should
support these categories:

| City state | Read behavior | Explore behavior | Audit behavior |
| --- | --- | --- | --- |
| Bundled study with validated local evidence | Show the full guided evidence brief | Enable supported lenses and area inspection | Show full lineage, validation, packages, and downloads |
| Bundled study with partial evidence | State precisely what is available; omit unsupported claims | Expose only valid layers; label gaps/constraints | Show data gaps and readiness conditions |
| Upload-first or starter city | Explain how to begin a local study; do not manufacture city findings | Show boundary/input orientation only where supported | Show requirements, validation status, and onboarding guidance |
| City with processing in progress | Explain status, inputs, and what will become available | Disable unavailable analyses with a reason, not an empty control | Show run/provenance status and expected next evidence gate |

### Required city-experience model

Each city should provide a normalized configuration/model with at least:

- `cityIdentity`: name, route slug, geography, boundary status, and optional
  local public context;
- `readiness`: city state, evidence availability, source freshness, and the
  authoritative reason an analysis is unavailable;
- `headline`: approved finding or, for upload-first cities, approved onboarding
  promise; never fabricate a finding from missing data;
- `proofFacts`: a maximum of three first-view facts, each with source and
  evidence state;
- `guidedLenses`: ordered story steps with question, finding, caveat, source,
  supported map configuration, and non-map equivalent;
- `evidenceLedger`: observed, derived, and planning rows with source, version,
  resolution, licensing, limitation, and downloadable artifact where available;
- `explore`: valid map layers, filters, ranked lists, selection behavior, and
  scenario handoff rules;
- `audit`: methods, trust/validation references, packages, and reproducibility
  material; and
- `onboarding`: requirements and calls to action when a city is not ready for
  study-level claims.

This contract is the guardrail against template drift: the interface changes
with a city's readiness, but it never changes the meaning of available data or
fills absent evidence with decorative content.

## Delivery phases

## Phase 0 — Evidence and content inventory

**Objective:** establish one authoritative model for every claim before
rearranging the interface.

### Work

- Inventory every text block, metric, map layer, control, caveat, source,
  download, and call to action across the current city routes, beginning with
  the bundled Boston study and including upload-first/starter pathways.
- For each item, record: audience, importance, evidence state, source/version,
  primary home, and whether it is safe to summarize.
- Identify duplicates across the hero, science spotlight, snapshot, readiness,
  workflow, robustness, and trust sections.
- Write approved public-language definitions for technical terms, including
  `Cheeger bottleneck`. Example: **Modeled connectivity break** as the public
  label, with the technical term retained in Audit.
- Agree on the city-contract fields, supported readiness states, and the
  approval process for each city-level headline claim and caveat.

### Deliverables

- Content inventory spreadsheet or Markdown registry.
- Claim-to-source matrix.
- Controlled vocabulary for observed/derived/planning states.
- Approved plain-language copy for the three guided story steps.
- Generic city-experience schema and an explicit readiness-state matrix.

### Exit criteria

- Every current item has a destination in Read, Explore, Audit, Onboarding, or
  an explicit reason to retire it.
- No headline claim lacks a source and limitation.
- The team agrees that no summary changes the scientific meaning of a result.

## Phase 1 — Information architecture and interaction design

**Objective:** validate the narrative and navigation before building the full
interface.

### Work

- Produce desktop and mobile wireframes for Read, Explore, and Audit.
- Create two clickable prototype alternatives:
  1. the recommended three-mode model; and
  2. a single route with strongly separated progressive-disclosure sections.
- Define route/query behavior, for example:
  - `/cities/:citySlug`
  - `/cities/:citySlug?view=explore&lens=:lensId`
  - `/cities/:citySlug?view=audit&section=:sectionId`
- Design state transitions: start guided reading, change lens, hover/focus,
  select area, clear selection, enter scenario, and return to reading.
- Specify the non-map equivalent for each key map action.
- Decide what must be server-loaded at first paint versus deferred until the
  visitor starts the guided map or opens Explore.

### Deliverables

- Approved information architecture.
- Desktop/mobile annotated wireframes.
- Interaction/state diagram.
- URL/deep-link contract.
- Copy deck for the brief and the map lenses.

### Exit criteria

- A first-time visitor has one obvious next action.
- An advanced user can reach the full map within one interaction.
- Every critical caveat is visible in the same context as its associated
  finding.

## Phase 2 — Usability research and content calibration

**Objective:** test comprehension before committing to production design.

### Participants

- Community/civic users with no specialist map or graph-method background.
- City or planning practitioners.
- Educators, researchers, or policy analysts.

Run moderated think-aloud sessions of roughly 30–60 minutes. Test 5–6 people
per qualitative round, revise, then repeat; this is a practical established
cadence for qualitative usability testing:
<https://www.gov.uk/guidance/usability-testing-qualitative-studies>.

### Tasks

- Explain the city's main signal, or the honest onboarding state where no
  local signal exists, and its limitation after viewing the opening.
- Tell observed information from derived information.
- Find why one area is worth closer investigation.
- Locate source, date, resolution, and limitation for a map finding.
- Use the map without creating accidental persistent state.
- Begin a scenario only after explaining what the page does and does not
  support.
- Find full methods and a download.

### Measures

- Task completion and time.
- Incorrect interpretation and reversal rate.
- Confidence calibration: whether confidence matches what the evidence can
  support, not merely whether the participant reports liking the page.
- Perceived workload and number of moments requiring help.
- Accessibility issues observed with keyboard, screen reader, zoom, and touch.

### Exit criteria

- The chosen structure performs materially better than the current page on
  comprehension and task completion.
- Participants do not interpret a priority result as a temperature forecast or
  automatic policy recommendation.
- The content owner signs off on all simplified public language.

## Phase 3 — Design system and accessibility specification

**Objective:** create reusable visual and interaction rules before component
implementation.

### Work

- Define semantic tokens for observed evidence, derived evidence, planning
  input, uncertainty, and unavailable data.
- Pair every colour state with visible text/icon/pattern; test contrast and
  colour-blind legibility.
- Define typography scale: editorial display headings only; highly legible sans
  serif for body, controls, data, and tables.
- Define content widths, spacing rhythm, card limits, and responsive behavior.
- Establish map visual rules: quiet basemap at first view, clear legend,
  restrained boundary/grid treatment, contextual source/date label, and no
  unexplained outline.
- Define focus, keyboard, touch, error, empty, loading, reduced-motion, and
  high-zoom states.

### Accessibility acceptance criteria

- Full keyboard access to navigation, lens selection, map alternatives,
  selected-area information, and dismissal/clear actions.
- No meaning depends on colour alone.
- Readable and operable at narrow mobile widths and 400% zoom.
- Focus indicators remain visible and are never hidden by sticky controls.
- Touch targets and focus behavior follow WCAG 2.2 guidance:
  <https://www.w3.org/TR/WCAG/>.
- Map findings remain available as text/table content.

## Phase 4 — Technical architecture and implementation

**Objective:** build the new experience without weakening the current data
contract or research capability.

### Recommended component changes

- Refactor `web/src/routes/city-detail.tsx` into a composition of the new
  experiences rather than a long stack of equally weighted sections.
- Evolve `web/src/lib/city-detail-config.tsx` into one source of truth for the
  generic city-experience model: headline/onboarding promise, proof facts,
  readiness, caveats, guided-map steps, evidence-ledger rows, and audit links.
- Replace the current top-level layout with components such as:
  - `CityEvidenceBrief`
  - `GuidedAtlasStory`
  - `AtlasWorkbench`
  - `EvidenceLedger`
  - `DecisionBridge`
  - `ResearchAudit`
- Update `web/src/components/city-atlas-shell.tsx` to support guided and
  free-exploration entry states, with explicit activation rather than an
  unexplained default map interaction.
- Split the large `web/src/components/city-heat-map.tsx` into separately
  testable responsibilities, for example map stage, lens selector, selection
  controller, evidence panel, and non-map results list.
- Reframe `city-science-spotlight.tsx`: retain a concise public explanation in
  Read and place full derivation/method material in Audit.
- Retain `city-detail-section-grid.tsx` only where a true comparable set of
  secondary facts needs it; do not use it as the page-wide visual grammar.

### Performance work

- Render the calm Read shell and evidence summary before loading the full
  MapLibre workbench.
- Defer heavyweight map code and advanced controls until guided-map start or
  Explore entry, while preserving deep links.
- Use a lightweight static/semantic preview only if it accurately represents
  the selected initial lens and has an accessible alternative.
- Establish performance budgets for route JS, map activation, interaction
  latency, and mobile rendering.

### Automated tests

- Unit tests for content-state labels, caveat presence, URL lens/view parsing,
  selection clearing, and scenario-context handoff.
- Component tests for keyboard focus, tooltip versus persistent panel behavior,
  map/list equivalence, and reduced motion.
- End-to-end journeys: Read, Explore, selected area, clear selection, Audit,
  methods/download, and scenario transition.
- Regression tests ensuring no selected cell or tooltip appears until explicit
  interaction.

### Exit criteria

- Every existing city data surface remains reachable for the cities that
  support it; unavailable surfaces state the specific readiness reason.
- The route preserves direct-link behavior and browser back/forward semantics.
- Tests prove the critical evidence, caveat, selection, and accessibility
  paths.

## Phase 5 — Pilot release, measurement, and iteration

**Objective:** release safely and improve from evidence, not taste alone.

### Work

- Release behind a feature flag or preview route for review by scientific,
  content, and accessibility owners.
- Conduct an accessibility audit with keyboard-only, screen-reader, zoom, and
  mobile-device checks.
- Add privacy-respecting, consent-appropriate product measurement:
  - time to first meaningful map action;
  - guided-story completion;
  - Explore and Audit entry;
  - selection clear/recovery behavior;
  - scenario transition after evidence review.
- Review support questions, misinterpretations, and research-session findings
  at a fixed cadence.

### Proposed success targets

- A first-time visitor can state the core finding and a key limitation within
  one minute.
- At least 90% of evaluated users can find source/provenance and full methods
  without assistance.
- At least 90% can distinguish observed from derived evidence.
- No tested participant treats a displayed priority as a direct forecast after
  reading the accompanying explanation.
- Advanced users reach the full Atlas in one interaction from the brief.

Targets are hypotheses to validate, not proof of quality before testing.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Simplifying copy changes scientific meaning | Require claim-to-source review and method-owner approval in Phase 0. |
| Hiding detail harms expert workflows | Keep Explore and Audit first-class, deeply linkable experiences. |
| Three modes fragment the experience | Use shared vocabulary, persistent city context, and explicit transitions. |
| Map deferment makes the page feel less map-first | Show a truthful, focused initial lens and make Explore immediate; do not use decorative placeholders. |
| Users overinterpret ranked areas | Repeat a concise limitation beside the finding and test comprehension directly. |
| Visual polish exceeds accessibility | Treat keyboard, zoom, contrast, and non-map alternatives as release gates. |
| Content drift creates contradictory language | Keep all headline/caveat copy in a single city-experience configuration model. |

## Definition of done

The generic city-experience redesign is complete only when:

- Read, Explore, Audit, and the honest Onboarding state are operational,
  responsive, and directly linkable.
- All currently important information is retained and has an intentional home
  for every supported city state.
- The default page presents one coherent evidence story, or one coherent
  onboarding/research-readiness story, rather than an undifferentiated
  dashboard.
- Map tooltips and selected-state visuals appear only after user interaction.
- A visible limitation accompanies each central finding.
- A keyboard user and a user who cannot use the map can complete core
  understanding, provenance, and planning-entry tasks.
- Usability research has been completed for at least two iterative rounds and
  the resulting high-severity issues are resolved or explicitly accepted.
- Scientific, content, and accessibility owners have approved the final
  claims, terminology, and interaction behavior.

## Recommended implementation order

1. Complete Phase 0 inventory, city schema, and readiness contract; approve
   headline/caveat language for the Boston pilot and representative non-Boston
   states.
2. Prototype and test Phase 1 before changing production components.
3. Build the evidence ledger and Read shell first.
4. Refactor the map into guided and workbench modes.
5. Add Audit and deep links.
6. Complete accessibility, performance, and end-to-end gates.
7. Pilot, measure comprehension, and iterate before treating the redesign as
   finished.
