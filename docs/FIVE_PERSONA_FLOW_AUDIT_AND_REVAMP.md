# Five-Persona Flow Audit And Revamp

## Scope

This audit evaluates the end-to-end product flow for five user modes:

- Educator
- Student
- City planner
- Researcher
- Community advocate

The goal is to improve:

- path clarity
- progression continuity between routes
- trust and evidence visibility
- conversion to meaningful outcomes (scenario creation, exports, and run follow-through)

## Research Inputs (Top Service Website Pattern Scan)

Research signals were collected from high-traffic products where content was accessible in the current environment. Key observed pattern sources include:

- Stripe: business model segmentation, personalized pathing, trust metrics, clear conversion CTAs.
- Figma: one workspace with multiple role outcomes, social proof, pathway-oriented product taxonomy.
- Coursera: role and goal selection, outcome framing, confidence and employability proofs.
- Shopify: persona/scale segmentation, guided setup funnel, operator and developer tracks.
- Asana: human-agent workflow framing, shared context and governance language.
- Linear: lifecycle stages from intake to monitor with clear operational progression.
- GitHub: single platform serving multiple jobs-to-be-done with proof and workflow continuity.
- Uber: multi-audience product entry points (rider/driver/business) with route-specific next actions.
- Canva: broad audience support through use-case-first entry and template-guided starts.
- OpenAI: product audience segmentation (consumer/business/developer) with progressive trust surfaces.

Some websites were blocked or restricted by policy in this environment; patterns were synthesized from reachable sources.

## Common Patterns That Recurred

1. Persona-first entry: let users self-identify quickly and avoid generic first screens.
2. Persistent context: keep selected audience mode visible and active across pages.
3. Guided next action: always provide a single best next step for the current workflow stage.
4. Stage progression: show progress chips/steps so users know where they are in the journey.
5. Trust surfaces in-line: keep evidence level, confidence, and provenance visible where decisions happen.
6. Conversion continuity: every page can move users to the next high-value action without dead ends.

## Five-Persona Flow Evaluation

### 1) Educator

Current needs:

- explain concepts clearly
- move from map evidence to teachable outputs
- preserve scientific integrity while simplifying language

Before revamp gaps:

- mode messaging existed but route continuity was weak
- handoff from mode selection to workflow actions depended on user guesswork

Revamp impact:

- persistent educator mode across pages
- rail-led progression with explicit next step
- map-to-export teaching journey now visible as a guided sequence

### 2) Student

Current needs:

- low-friction exploration
- controlled complexity
- clear hypothesis-testing path

Before revamp gaps:

- scenarios and cities were discoverable but not strongly sequenced by mode

Revamp impact:

- student mode remains active from home into cities and scenarios
- progression chips create a learn-by-doing loop
- key question prompt keeps focus on budget-impact hypothesis testing

### 3) City Planner

Current needs:

- defensible first-pass packages
- budget tradeoff clarity
- auditability in briefings

Before revamp gaps:

- planner workflows existed but did not remain context-locked across pages

Revamp impact:

- planner mode persistence from home to scenarios to exports
- guided next-step CTA accelerates plan-to-brief transitions
- benchmark and evidence surfaces remain present in scenario workflow

### 4) Researcher

Current needs:

- provenance tracing
- runtime and method transparency
- reproducible interpretation boundaries

Before revamp gaps:

- runs page was operational but not mode-connected to downstream actions

Revamp impact:

- researcher mode keeps flow anchored to runs and exports
- flow rail provides deterministic pathing between analysis and evidence publication
- key question keeps distinction between observed vs derived vs estimated claims

### 5) Community Advocate

Current needs:

- public-facing clarity
- neighborhood storytelling with uncertainty disclosure
- meeting-ready outputs

Before revamp gaps:

- advocacy framing existed but lacked persistent journey cues and transitions

Revamp impact:

- mode persistence and route guidance support narrative continuity
- cities-to-scenarios-to-exports path is explicit and repeatable
- key question framing encourages plain-language communication with evidence honesty

## UX Changes Implemented In This Revamp

1. Persistent mode state

- Added local-storage backed active mode state, available globally to route pages.
- Users select a mode once and keep it while navigating.

1. Shared persona flow rail component

- Added a reusable guided rail that appears in Home, Modes, Cities, Scenarios, Exports, and Runs.
- Rail includes:

  - active mode value proposition
  - stage chips with done/active/todo states
  - single best next-step CTA
  - role-specific key question

1. Actionable mode selection

- Modes page now supports setting active mode directly from persona cards.
- Home page includes mode chips for quick context switch without navigation overhead.

1. Continuity-oriented route framing

- Flow now feels like one connected lifecycle rather than disconnected pages.
- High-value pages keep contextual next-step prompts to reduce drop-off.

## Why This Is Better For Product Quality

- Reduces cognitive switching costs between pages.
- Improves role fit without fragmenting the app into separate products.
- Preserves scientific trust while improving usability.
- Increases completion likelihood for high-value outcomes (scenario generation, exports, run review).

## Recommended Next Iteration

1. Add mode-aware default filters/presets on Scenarios (budget, planning mode, and evidence thresholds).
2. Add mode-specific onboarding checklists with completion tracking.
3. Expand Playwright coverage to include full five-persona route transitions and persistence checks.
4. Add analytics events for mode selection, step completion, and export conversion by persona.
