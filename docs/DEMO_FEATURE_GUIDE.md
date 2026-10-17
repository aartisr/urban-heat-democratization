# Urban Heat Democratization: Demo Feature Guide

Use this guide to demonstrate the app as an **evidence-to-action workspace**:
it makes urban-heat evidence visible, explains what it means, enables bounded
planning conversations, and preserves the trail needed to question the result.

## The one-minute product story

> Urban Heat Democratization turns an otherwise technical urban-heat workflow
> into something a resident, educator, planner, or researcher can inspect
> together. Start with a city and its evidence, explore the map without hiding
> the method, compare bounded intervention scenarios, and carry the source
> trail into a run record or export. The platform is valuable precisely because
> it shows both the opportunity and the limit of each signal.

The strongest live path is **Overview → Boston → Explore the atlas → Audit the
evidence → Scenarios → Exports**. For a hands-on teaching moment, add the
**Mitigation lab** or **Robustness lab**. Boston is the bundled study city;
other city starters are onboarding workspaces, not pre-existing local studies.

## Demo feature inventory

| Feature | Where to show it | Value added | Credible demo line |
| --- | --- | --- | --- |
| Calm, public-interest overview | `/` | Gives non-specialists a purposeful entry point: observe, understand, act. | “This begins with a civic question, not a black-box score.” |
| Persona paths | `/modes` | Reframes one evidence base for educators, students, planners, researchers, and community advocates without changing the underlying facts. | “Different audiences get the right doorway, not a different truth.” |
| City catalog and readiness | `/cities` | Separates immediately usable bundled evidence from upload-first city setup, preventing a city name from being mistaken for a city analysis. | “The system makes readiness visible before it makes a local claim.” |
| City onboarding | `/cities` | Lets a local team create a reusable study workspace from a boundary GeoJSON and progressively register inputs and overlays. | “A new city starts with its actual geography and earns richer analysis as evidence arrives.” |
| Guided city brief | `/cities/boston` in **Read** | Explains context, signal, and a responsible next step in plain language before asking users to interpret a map. | “We teach users what the evidence supports before we ask them to act on it.” |
| City intelligence and readiness cards | `/cities/:cityId` in **Read** | Combines study status, next actions, scenario links, run handoff, and data-registration state in one city-specific workflow. | “This is the bridge from a map to an accountable work plan.” |
| Interactive city atlas | `/cities/boston?view=explore` → **Open atlas** | Makes heat-priority, cooling-access, source, boundary, corridor, and planning layers inspectable rather than burying them in a report. The heavy map loads only when requested. | “People can see where the model asks us to look closer, then turn layers on and off to challenge that story.” |
| Layer controls and provenance | Full-screen atlas → **Layers and evidence** | Pairs each visual layer with source, method, date/scale, and limitations so visual emphasis is not confused with certainty. | “Every layer has a reason to exist and a stated limit.” |
| Advanced spatial-pattern preview | Boston atlas → full-screen → **Layers and evidence** → **Fine-tune individual layers** → **Spatial pattern preview** | Exposes a derived, FDR-adjusted Local Moran/LISA pattern as an inspectable preview through a generic map-layer contract. | “This is a computationally verified single-scene pattern preview—not a hotspot declaration or a property finding.” |
| Evidence ledger and audit view | `/cities/boston?view=audit` | Classifies material as observed, derived, estimated, or illustrative, with method and limitation side by side. | “Instead of asking users to trust the map, we show what supports it.” |
| Science, reproducibility, and trust audit | City **Audit** view | Connects the visible city story to benchmark checks, package contracts, provenance, and reproducibility context. | “The proof trail is a first-class feature, not an appendix.” |
| Transparent what-if scenarios | `/scenarios` | Compares intervention packages under stated budgets, planning modes, evidence labels, allocation coverage, and benchmark gaps. | “It makes tradeoffs discussable without pretending to be a procurement-ready optimizer.” |
| Scenario comparison visuals | `/scenarios` | Uses comparative map, allocation ledger, Pareto-style comparison, packed-bubble, Sankey, and sunburst views to show how a budget becomes a package of actions. | “The question is not ‘what is the answer?’ but ‘what changes when we make this assumption or spend this amount?’” |
| Scenario-to-run handoff | City **Read** view or `/scenarios` → queue run; `/runs` | Preserves the selected city, scenario, execution state, artifacts, and source notes in a run registry. | “A recommendation can be traced back to the scenario and evidence that produced it.” |
| Run history and detail | `/runs` and `/runs/:runId` | Makes execution progress, status, artifacts, logs, and scenario trace inspectable rather than ephemeral. | “This creates an audit trail for analysis work.” |
| Downloadable evidence packages | `/exports` | Provides study guides, GeoJSON/GeoTIFF and other artifacts, package-contract checks, and cost-source anchors for use outside the app. | “The work can leave the dashboard without losing its evidence context.” |
| Upload-city artifact area | `/exports` | Shows whether an upload-first city has registered thermal inputs, an artifact bundle, bottleneck overlay, and cooling overlay. | “Progress toward local readiness is visible; missing inputs are not concealed.” |
| Privacy-first cooling action plan | `/address-plan` | Offers role-matched heat-safety, site-investigation, and collective-action prompts without geocoding, storing, transmitting, or mapping the place label. | “Useful guidance is available now without turning someone’s home into a data record.” |
| Address-level evidence gate | `/address-plan` | Shows city-wide context while deliberately withholding an unsupported address-level spectral answer. Common street-address-like entries and coordinates are rejected client-side. | “The honest no-result is a feature: precision is not claimed until the evidence and privacy gates are met.” |
| Mitigation lab | `/mitigation-lab` | Lets users alter a synthetic neighborhood’s bounded interventions and inspect modeled graph-metric changes, intervention applicability, and explanations. | “This is a safe place to learn how assumptions change a planning model—not a local temperature forecast.” |
| Robustness lab | `/robustness` | Demonstrates spectral connectivity, backup links, Monte Carlo reliability, and percolation on a transparent nine-node teaching district linked to the method family. | “It makes structural fragility intuitive: when one corridor is stressed, do modeled alternate connections help?” |
| Evidence-to-Action Suite | `/solution-suite` | Groups seven practical workflow tools around the next task: city import, sensor validation, complex geography, grant brief, language, GIS API, and contribution review. | “The product does not stop at a map; it supports the work needed to make evidence usable.” |
| OSM city-input workspace | Solution Suite → **Import a city map** | Helps frame a boundary and street-network foundation for a city analysis. | “Good analysis starts with explicit geography.” |
| Sensor validation bench | Solution Suite → **Validate with sensors** | Helps compare modeled patterns with observed readings, residuals, and stated limits before relying on a finding. | “The app makes room for field evidence to disagree with the model.” |
| Component-aware geography tool | Solution Suite → **Test complex geography** | Keeps islands, coasts, barriers, and disconnected components from being silently treated as one connected graph. | “Complex geography changes the question; this tool makes that assumption inspectable.” |
| Grant brief generator | Solution Suite → **Create a grant brief** | Packages a concise evidence, source, and caveat narrative for decision review. | “It turns the work into a reviewable public-interest brief.” |
| Multilingual and plain-language workspace | Solution Suite → **Translate the story** | Helps make the same evidence understandable across language and literacy contexts. | “Access to the evidence should not depend on technical vocabulary.” |
| GIS API workspace | Solution Suite → **Publish GIS data** | Demonstrates reusable geographic outputs, open formats, and provenance for downstream tools. | “The evidence can connect to existing GIS practice instead of becoming a closed dashboard.” |
| Contribution/review workspace | Solution Suite → **Contribute an improvement** | Makes improvement proposals and review context visible, supporting accountable iteration. | “The platform is designed to be questioned and improved in public.” |
| Learning library and collaboration path | Home → **Research library, methods, and participation**; `/contact` | Links methods, responsible-use guidance, civic participation, and partner collaboration to the live product. | “The map is a starting point for learning and joint problem-solving.” |
| Responsive, accessible workspace shell | All routes | Provides lazy route loading, responsive navigation, keyboard-friendly controls, visible labels, and a user-adjustable sidebar. | “The evidence workspace is designed to remain usable beyond a single expert at a desktop GIS station.” |
| Consent-aware analytics and install controls | App shell / supported browsers | Supports opt-in measurement and progressive-web-app controls without making analytics a condition of access. | “We can improve the experience while respecting user choice.” |

## The value architecture to emphasize

```text
Observe                 Understand                    Act responsibly
City layers       →     Evidence ledger         →     Bounded scenarios
Atlas             →     Method + limitations    →     Runs and exports
Local context     →     Robustness teaching     →     Community / partner handoff
```

This sequence is the product’s key differentiator. Many map products stop at
visualization; many planners hide assumptions in a spreadsheet. This app keeps
the spatial signal, explanation, planning comparison, and audit trail connected
without collapsing them into a single unsupported score.

## A persuasive seven-minute live demo

1. **Set the purpose (30 seconds):** Open `/`. Say that the platform makes
   heat evidence visible and actionable while keeping its uncertainty visible.

2. **Establish the boundary (45 seconds):** Open `/cities`. Point out that
   Boston is bundled, while New York City, Chicago, Los Angeles, and Houston
   are upload-first starters. This earns trust before the visual demo.

3. **Tell the Boston story (90 seconds):** Open `/cities/boston` in **Read**.
   Use the three-step guided brief: evidence, signal, next step. Open the
   readiness detail only if the audience needs governance context.

4. **Make the map inspectable (90 seconds):** Choose **Explore the atlas**;
   enter full-screen mode; open **Layers and evidence**. Toggle heat-priority
   and cooling-access layers separately, then open the provenance/detail area.
   If the audience is technical, enable the hidden **Spatial pattern preview**
   and say it is a gated LISA preview, not a public finding.

5. **Prove the honesty layer (60 seconds):** Switch to **Audit**. Show one
   evidence-ledger row and explain the observed/derived/estimated/illustrative
   labels. This is often the most convincing differentiator for a public or
   research audience.

6. **Turn insight into a decision conversation (90 seconds):** Open
   `/scenarios`, choose a budget and planning mode, and compare an action mix.
   Point to evidence labels and allocation coverage before any modeled-benefit
   number. Queue a run only if you want to show the traceability handoff.

7. **Close with portability and safe participation (45 seconds):** Open
   `/exports` to show that the artifacts and validation travel with the story.
   For a resident-oriented close, open `/address-plan` and emphasize that it
   offers useful guidance without collecting a precise location.

## Optional audience-specific endings

| Audience | Best ending | Why it lands |
| --- | --- | --- |
| Public/community group | `/address-plan` → collective-action prompts | Shows immediate value without surveillance or an individualized risk label. |
| Planner or funder | `/scenarios` → `/exports` | Shows transparent tradeoffs plus a shareable evidence package. |
| Researcher or technical reviewer | City **Audit** → `/robustness` → `/runs` | Shows method boundaries, teaching-graph mechanics, and traceability. |
| Educator or student | `/modes` → Boston atlas → `/mitigation-lab` | Moves from intuitive observation to an interactive, bounded model. |
| Data/GIS team | `/solution-suite` → GIS API and city-input workspaces | Shows interoperability and an onboarding path rather than a closed product. |

## Accuracy guardrails for every demo

Use these phrases:

- “The map identifies an area to investigate.”
- “This is a derived, graph-based planning signal.”
- “The evidence ledger shows what was observed versus calculated.”
- “The scenario compares explicit assumptions and budget tradeoffs.”
- “Boston is the current bundled study; other starters require local inputs.”
- “This is a synthetic teaching lab / benchmark-based planning aid.”
- “The address plan is browser-only and deliberately does not return an
  address-level spectral result.”

Avoid these phrases:

- “The platform predicts neighborhood temperature or health risk.”
- “This map proves where heat is trapped or who is exposed.”
- “The scenario is an engineering forecast, procurement plan, or causal
  intervention result.”
- “The LISA preview is a validated hotspot finding.”
- “The app analyzes a user’s home address.”

## Before the demo

- Confirm the API and web app are running; use the health checks in
  [Quick Reference](QUICK_REFERENCE.md).
- Start with Boston, the complete bundled study experience.
- Prepare one budget to select on `/scenarios`; do not lead with an impact
  number before showing its evidence state.
- If showing the atlas, open it before presenting so the lazy-loaded map is
  ready. Full-screen map controls reveal the most complete layer experience.
- If showing a live run, use an existing completed record unless the audience
  specifically needs to watch the queue lifecycle.
- Have the [Mathematical Innovation Accountability Report](MATH_INNOVATION_ACCOUNTABILITY.md)
  and [Address-Level Spectral Urbanism Advice](ADDRESS_LEVEL_SPECTRAL_URBANISM_ADVICE.md)
  available for technical or privacy questions.

## Feature status rule

This is a guide to the application’s surfaced capabilities, not a promise that
all outputs are locally validated. The strongest demonstration is one that
uses the app’s built-in evidence labels and release gates as proof of rigor.
For canonical repository limits, see [Repository Capability
Status](IMPLEMENTATION_STATUS.md).
