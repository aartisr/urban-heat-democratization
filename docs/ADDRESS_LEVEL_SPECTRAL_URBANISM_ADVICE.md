# Address-Level Spectral Urbanism Advice: Value, Limits, and an Operational Blueprint

> Authored by [Aarti S Ravikumar](https://ai-aarti.com) · Last implementation review: 2026-08-25 · Canonical platform: [urban-heat.ai-aarti.com](https://urban-heat.ai-aarti.com/)

> **Status authority.** This is the canonical roadmap and implementation status
> for Address-Level Spectral Urbanism. The Phase 3–5 documents linked below are
> supporting readiness contracts; they do not replace this status record.

## Executive answer

**Yes—but only as an address-informed, evidence-bounded guidance service, not as a personal risk diagnosis or an automated property prescription.** An address can help a person locate their surroundings in a thermal, vegetation, shade, surface, and access-to-relief context. Spectral Urbanism can add a useful structural question: *in the chosen local graph, where are the weak connections between a hot area and modeled cooling features?*

That can generate meaningful next steps: what to inspect on site, which low-regret household actions may be worth exploring, what questions to ask a landlord or city, and where a resident can contribute local knowledge. It cannot establish indoor temperature, medical risk, legal compliance, a property’s energy performance, structural suitability for a roof intervention, a causal cooling benefit, or an intervention’s equity.

## Current delivery status and what remains

| Phase | Current status | What is implemented | What remains before advancing |
| --- | --- | --- | --- |
| 0. Research contract | Complete | Published scope, evidence, privacy, and governance boundaries. | Keep sources and safeguards under review. |
| 1. No-address help | Partial | Browser-only safety, role-matched site, and collective-action prompts are available. | Current official forecast / local-resource integration and accessibility content review. |
| 2. Approximate-place prototype | Technically complete; externally pending | `/address-plan` keeps place text in-browser, blocks street addresses, exposes city-wide provenance, and never returns an unsupported spectral result. | Five-person comprehension study; record findings and revise the interface if needed. |
| 3. One-city co-designed pilot | Preparation only | Boston readiness protocol and in-app readiness context. | Named steward and decision owner; bounded public question; dated/licensed data contract; paid community review; pre-registered ground truth, sensitivity, equity, and publication/suppression protocol. |
| 4. Address-confirmed private report | Not enabled | Browser-only report-preparation flow and provider contract. | Approved provider; affirmative consent and deletion path; zero-retention/redaction implementation; security, privacy, accessibility, and partner reviews; address-perturbation and sensitivity validation. |
| 5. Evaluated contribution network | Preparation only | Browser-only observation draft and registry contract. | Partner-approved intake, moderation, retention, multilingual access, governance, equity/harm monitoring, and published learning reports. |

### Non-negotiable release gate for address-level spectral results

No address-level spectral result may be enabled until all of the following are
complete: supported and licensed coverage; compatible dated layers; a
neighborhood-appropriate resolution claim; documented quality checks; a valid
connected graph and sink definition; sensitivity analysis; independent method,
privacy, accessibility, and local-partner review; and a safe no-result state.
Until then, the product must offer only the browser-only approximate-place plan
and general safety / community guidance.

The most valuable product is therefore a **three-layer service**:

1. **Immediate heat-safety guidance** from authoritative forecast and health sources.
2. **Address-neighborhood context** from date-stamped, resolution-labeled public layers.
3. **Spectral contribution guidance** that turns a graph signal into a cautious, collective action pathway—not a claim that one resident must solve a city-scale heat problem alone.

This document sets the required evidence standard, user experience, data architecture, mathematics, privacy protections, validation plan, and delivery phases.

## What the person should actually receive

The user-facing feature should be called **“Your Address Cooling Action Plan,”** not a risk score. After entering an address (or approximate location), a person should receive a short, useful plan like this:

> **Your cooling opportunity around 123 Example Street**
>
> This block has limited observed vegetation and a nearby modeled gap in cooling continuity. That is a signal to investigate—not proof about your home or health. Start with the actions you control, then join actions that need neighbors or the city.
>
> **This week**
> - Protect any existing shade: do not remove healthy trees; report damaged public trees or missing shade at a transit stop / walking route.
> - Photograph a public shade gap at a safe, non-identifying distance and record time of day; add it to a neighborhood evidence request.
> - During heat events, use official heat guidance and locate public cooling resources.
>
> **At this address, explore**
> - If you rent: ask the landlord about exterior shade, cooling maintenance, window treatments allowed by the lease, and building heat protections.
> - If you own: before planned roof work, obtain a qualified assessment of cool-roof, insulation, and air-sealing options; check local incentives and permits.
> - If there is an unshaded paved area you control: investigate shade trees, permeable planting areas, or shade structures with utility, drainage, ownership, and maintenance checks.
>
> **For the block**
> - Invite neighbors to identify the hottest walk, bus stop, crossing, school route, or public space.
> - Ask the relevant public agency or community organization for a shade / canopy / cooling-access audit.
> - Use the spectral map as an explanation of *where to look together*, then document whether local observation agrees.

The plan must show only actions that match the person’s declared ability to act—**renter, owner, tenant group, school / business, or community organizer**—and it must always separate “do now,” “investigate,” and “requires collective or professional action.”

## 1. What the current project can and cannot do

The public app now includes a first-phase **Your Cooling Action Plan** at `/address-plan`. It accepts a user’s place label and role entirely in the browser, provides role-matched safety, site, and collective-action prompts, and deliberately does not geocode, save, transmit, or map the entered location. The repository does not yet include a geocoding service, parcel model, property record connector, building-energy model, real-time health-alert integration, or address-level spectral endpoint. Its scientific core constructs a weighted graph from valid raster cells, computes a normalized-Laplacian spectral signal and sweep conductance, and uses a modeled least-cost route to inferred cooling sinks. The existing Boston experience is a documented study environment; its scenario outputs are explicitly benchmark-based exploration aids rather than local engineering predictions.

That means an address feature **must not** simply place a pin over the current Boston result and present the result as “advice for your home.” At the current model resolution, a pixel may contain multiple parcels, roofs, streets, trees, and microclimates. USGS notes that Landsat surface-temperature products have constraints including missing data, cloud-related error, temporal limitations, and coarse or blocky behavior over small targets. The product measures **land-surface temperature**, not indoor temperature or personal heat exposure. [USGS: Landsat Collection 2 surface-temperature constraints](https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-temperature)

### The honest product claim

> “This report describes conditions and modeled connections in the surrounding area under stated data dates and assumptions. It offers questions and possible next steps. It does not measure your indoor temperature, determine your health risk, certify your property, or guarantee the impact of any action.”

This language should appear before an address is submitted, beside every result, and in every export.

## 2. The user value proposition

An address entry should answer four distinct questions in the right order.

| User question | Useful answer | Evidence threshold | Never claim |
| --- | --- | --- | --- |
| “What should I do during today’s heat?” | Forecast-linked safety actions, cooling-center / local emergency links, and air-quality context | Authoritative current conditions and official local resources | That the spectral score determines acute medical risk |
| “What does the surrounding area look like?” | Time-stamped neighborhood context: surface-temperature observation, vegetation / canopy proxy, imperviousness, shade / cooling resources where data supports it | Published layer metadata, spatial resolution, coverage and date | Exact conditions at the front door or inside the building |
| “What could I improve?” | A ranked *menu to investigate* matched to tenure, control, building type, local rules, and feasibility questions | User-declared conditions plus authoritative program / code references | A guaranteed savings, cooling degree, or safe construction recommendation |
| “How can I contribute to wider mitigation?” | A small collective pathway: report missing shade, document a corridor barrier, join a local tree / cooling initiative, request public improvements, or support a validated pilot | Transparent evidence and local partner review | That individual action alone solves unequal heat exposure |

The design should make the **collective** path as prominent as the household path. EPA identifies trees and vegetation, green roofs, cool roofs, and cool pavements as major heat-island strategies, but the relevant measure depends on scale, site conditions, maintenance, local policy, and who has authority over the land. [EPA heat-island guide](https://www.epa.gov/heatislands/guide-reducing-heat-islands)

## 3. Product experience: the best-value address journey

### Step 0 — consent and scope before lookup

Use an explicit choice, not a hidden field:

- **Explore an approximate area** — user enters a ZIP code, intersection, or drops a pin rounded to a coarse grid. This should be the default.
- **Explore a specific address** — explain why precision helps, what is retained, and how to delete it.
- **I rent / I own / I represent a community or organization** — determine which actions are feasible to suggest.

Exact location is sensitive. The FTC describes precise geolocation as sensitive personal information because it can reveal a person’s movements and patterns; COPPA also treats geolocation sufficient to identify a street and city as personal information for children. [FTC on geolocation privacy](https://www.ftc.gov/news-events/news/press-releases/2014/06/ftc-testifies-geolocation-privacy), [FTC COPPA geolocation FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)

**Default policy:** geocode in memory, round stored coordinates to a 100–250 m cell or Census block-group-scale reporting geography, retain no raw address in analytics or logs, and do not send it to third parties beyond the selected geocoding provider without separate consent. Disable lookup for a child-directed experience unless the legal and consent design has been independently reviewed.

### Step 1 — always show current safety first

Before a map or score, show the user’s official heat forecast context, advisory links, and a short safety panel. CDC advises staying cool, hydrated, and aware of symptoms; it recommends air-conditioned locations and notes that fans can increase body temperature when indoor temperature exceeds 90°F. [CDC heat and health guidance](https://www.cdc.gov/disasters/extremeheat/)

The panel must state: **“For urgent symptoms or a heat emergency, use emergency services and local public-health guidance; this platform is not medical care.”** It should never collect medical conditions to personalize an algorithmic risk score. A link to CDC’s Heat & Health Tracker / local HeatRisk context is preferable to reimplementing a health forecast.

### Step 2 — show an evidence card, not a single score

Present an “Evidence at and around this location” card with separate, plainly labeled observations:

- geocoding confidence and the **rounded** displayed point;
- observation date, sensor / provider, spatial resolution, and coverage;
- land-surface-temperature percentile within a declared reference area and season;
- vegetation or canopy measure, with date and resolution;
- impervious / roof / pavement context only if source and classification confidence are disclosed;
- known public cooling resources or shade assets, with source date and accessibility caveat;
- a data-quality grade: *sufficient for orientation*, *limited*, or *not available*.

Never blend these into an unexplained red-green “heat safety score.” EPA’s EnviroAtlas explains that national indicators can be derived from 30 m data while higher-resolution data are limited to selected communities and are often summarized at block-group scale; its guidance also cautions that some modeled layers have unknown uncertainty. [EPA EnviroAtlas data scale](https://www.epa.gov/enviroatlas/about-data), [EPA EnviroAtlas FAQ on uncertainty](https://www.epa.gov/enviroatlas/frequently-asked-questions-enviroatlas)

### Step 3 — add the spectral lens only when its data contract passes

The spectral card should be absent—not gray, not implied—when prerequisites are not met. When it appears, it should say:

> “In a graph made from nearby valid cells and the stated weight rule, this location lies [inside / near / outside] a low-conductance candidate region. This is a model of spatial structure, not a measurement of heat movement, personal exposure, or intervention benefit.”

Provide a “Show the reasoning” drawer with the graph extent, adjacency rule, edge-weight formula, sink definition, Fiedler sweep threshold, conductance result, sensitivity range, and source versions. The user should be able to download that record.

### Step 4 — give two action menus, never one imperative

#### A. Near-term, low-regret comfort and safety actions

These are general actions linked to current authoritative guidance: seek air-conditioned space, hydration and pacing, shade / rest planning, neighbor check-ins, and local cooling-center / 211 information. They are available even where local spectral data are weak.

#### B. Site and neighborhood actions to investigate

Use conditional language based on **who controls the site** and **what evidence exists**.

| Observed / declared situation | Offer to investigate | Required caveat |
| --- | --- | --- |
| Renter; little authority over exterior | Window shading permitted by lease, portable cooling plan, building-maintenance / cooling complaint route, tenant organization, nearby respite route | Do not imply renter responsibility for envelope, roof, or public realm |
| Owner-occupied building; roof work planned | Cool-roof / insulation / air-sealing assessment, incentive search, contractor and code questions | Roof options depend on climate, insulation, roof type, structure, code, and winter tradeoffs; recommend qualified assessment |
| Low shade or low vegetation on private site | Existing-tree protection, feasible shade tree / planting-site assessment, soil volume and maintenance inquiry | Avoid promising survival, cooling, or planting feasibility without utilities, ownership, right-of-way, and arborist review |
| Hot hardscape / parking or walking route | Shade structure, pavement, tree canopy, route safety, and public-works request | Reflective / permeable pavement has glare, maintenance, drainage, and local design considerations |
| Spectral weak link between warm cells and a modeled cooling feature | Document the barrier; check shade continuity, crossing safety, public access, tree condition, and route comfort; bring the finding to a local partner | A graph cut is a hypothesis generator, not proof that the connection is physically or socially inaccessible |
| Strong local evidence and a public partner | Propose a bounded corridor / block pilot with before-after measurement and community review | Do not make causal benefit claims before the evaluation plan is approved |

EPA and DOE support investigating cool roofs as one option, but DOE emphasizes that value depends on climate, insulation, roof type, and HVAC efficiency; cool roofs can carry a winter heating penalty in colder conditions. [DOE cool-roof procurement guidance](https://www.energy.gov/cmei/femp/purchasing-energy-efficient-cool-roof-products), [EPA cool-roof guidance](https://www.epa.gov/heatislands/using-cool-roofs-reduce-heat-islands)

### Step 5 — make contribution concrete and safe

End every result with a **“Turn observation into community evidence”** panel:

1. Choose a claim to verify: shade gap, hot waiting area, unsafe walk to cooling, inaccessible public cooling, tree-maintenance need, or missing map context.
2. Collect non-identifying evidence: date/time, public location, photo only with consent and no faces / address numbers, observation protocol, source link, and uncertainty.
3. Choose a steward: neighborhood organization, public-health office, planning / forestry / public-works team, school, library, tenant group, or university partner.
4. Request a bounded response: site visit, shade audit, maintenance review, cooling-resource update, or pilot feasibility review.
5. Publish what changed, including negative findings.

This mirrors NOAA’s community-science heat-mapping model, in which local partnerships and residents contribute to field campaigns and the results inform planning and response. [NOAA Heat Watch campaigns](https://toolkit.climate.gov/tool/heat-watch-campaigns), [NOAA community heat-mapping overview](https://www.nesdis.noaa.gov/events/nedtalk-extreme-heat-mapping-heat-islands-cities)

## 4. What spectral urbanism adds—and what it does not

Let the local analysis graph be \(G=(V,E,W)\), where nodes are valid spatial units and nonnegative \(w_{ij}\) encodes the chosen modeled connectivity. The current core uses a weight of the form:

\[
w_{ij}=\exp(-\alpha g_{ij})\bigl(1+\beta\,\overline{\mathrm{NDVI}}_{ij}\bigr),
\]

where \(g_{ij}\) is a local normalized land-surface-temperature-gradient quantity and the NDVI term is optional. Its normalized Laplacian is \(\mathcal L=I-D^{-1/2}WD^{-1/2}\). A Fiedler-vector sweep evaluates candidate subsets \(S\) by conductance:

\[
\phi(S)=\frac{\operatorname{cut}(S,V\setminus S)}{\min(\operatorname{vol}(S),\operatorname{vol}(V\setminus S))}.
\]

Small conductance is evidence of a weakly connected partition **in that declared graph**. The operational interpretation can be: “inspect whether the chosen local data has exposed a gap in modeled cooling continuity.” It cannot become: “this resident lacks cooling,” “heat flows through this route,” “this parcel causes harm,” or “planting here will reduce a temperature by \(x\).”

### Address-specific spectral outputs that are acceptable

- Position relative to a **neighborhood-scale** candidate cut, never a parcel label.
- Relative modeled least-cost access to an explicitly defined cooling feature, with the word *modeled* retained.
- Sensitivity stability: does the location remain in a candidate region across documented, plausible parameter choices?
- A map of the nearby cut boundary and a request for local review.
- A group-level opportunity: “this corridor may merit shade / access investigation with local partners.”

### Outputs that are prohibited until independently validated

- Individual health or vulnerability score.
- Indoor temperature, energy bill, or building-performance prediction from address alone.
- Parcel-level intervention ranking or property-value claim.
- A medical recommendation or emergency triage decision.
- Causal estimate of cooling, mortality, emission, or equity benefit.
- Enforcement, eligibility, insurance, lending, or housing decisions.

## 5. Minimum data and engineering architecture

### A. Privacy-preserving lookup boundary

```text
Browser: address / approximate place
  → consent + purpose selection
  → privacy-aware geocoder
  → ephemeral exact coordinate
  → rounded analysis cell / neighborhood geometry
  → public-layer query + provenance record
  → optional local spectral service
  → browser receives explanation and expiring report
```

Requirements:

- no address in application logs, analytics, error traces, URL query strings, exports, screenshots, or model-training data;
- server-side rate limits and abuse prevention without storing a raw address;
- delete control and documented retention period;
- no third-party behavioral advertising, cross-site tracking, or sale / sharing of location data;
- separate consent for saving a report or contacting a partner;
- accessibility: keyboard-first entry, plain-language alternative to maps, screen-reader descriptions, language pathway, and a no-address option.

### B. Evidence services

Each response must attach a provenance object:

```json
{
  "analysis_geometry": "rounded cell or declared neighborhood polygon",
  "geocoding_precision": "approximate | address-confirmed",
  "layers": [{"name": "...", "publisher": "...", "observed_at": "...", "resolution_m": 30, "coverage": "...", "quality_flags": ["..."]}],
  "graph": {"adjacency": "8-neighbor", "alpha": 3.0, "beta": 0.5, "sink_rule": "NDVI >= 95th percentile", "analysis_date": "..."},
  "limits": ["Land-surface temperature is not indoor temperature.", "Result is not a health-risk assessment."]
}
```

This object should be displayed, downloadable, versioned, and testable. Do not silently substitute a newer source layer without changing the date and version.

### C. A strict availability gate

Run address-level spectral analysis only if all conditions hold:

1. Location is within a supported city / licensed coverage boundary.
2. Required layers overlap in time and geometry.
3. Resolution is adequate for the stated **neighborhood** claim; no parcel claim from a 30 m layer.
4. Quality / cloud / missing-data flags pass documented thresholds.
5. The graph is connected enough for the calculation; disconnected cases return “not available,” not an invented score.
6. At least one plausible sensitivity set is evaluated.
7. The output has been independently reviewed for that city’s data contract.

If any gate fails, provide safety guidance and a local-resource / contribution path—but no spectral result.

## 6. Advice-ranking logic: value without false precision

Do not use a single additive “best action” score. Use a transparent eligibility-and-evidence matrix.

For an action \(a\), calculate a non-decisive investigation priority:

\[
P(a)=\mathbf{1}_{\mathrm{eligible}}(a)\times
\min\{E_{\mathrm{data}}, E_{\mathrm{site}}, E_{\mathrm{authority}}\}\times
R_{\mathrm{reversibility}}(a),
\]

where each component is ordinal and visibly explained, not a pseudo-precise probability:

- \(E_{\mathrm{data}}\): source quality, recency, resolution, coverage, and sensitivity stability;
- \(E_{\mathrm{site}}\): whether user-verified site facts support considering the action;
- \(E_{\mathrm{authority}}\): renter / owner / public-right-of-way authority and permit status;
- \(R_{\mathrm{reversibility}}\): prioritize low-cost, low-harm information gathering and maintenance before irreversible construction.

The response should say “**worth exploring first**” rather than “recommended,” and explain every factor. High uncertainty should reduce specificity, not merely lower a badge color.

## 7. Validation and governance before public launch

### Technical validation

- Unit-test geocoder ambiguity, unsupported coverage, stale source, cloud / no-data, disconnected graph, missing sinks, and sensitivity instability.
- Regression-test that raw addresses never enter logs, analytics, URL parameters, exports, or exception messages.
- Compare output across geocoders and point perturbations (for example, 25 m, 100 m, and 250 m) to quantify address-placement instability.
- Run parameter sweeps over adjacency, \(\alpha\), \(\beta\), sink definition, season, imagery date, and analysis extent.
- Publish reproducibility fixtures and a plain-language “why no result?” state.

### Phase 2 comprehension check

Before Phase 2 is marked complete, test the approximate-place page with at
least five people who did not help build it. Ask each person, without coaching:

1. Can you enter a street address here? What should you enter instead?
2. Does the location text leave the browser or reach the evidence service?
3. Is the neighborhood evidence card about a property, a person, or a
   city / neighborhood-scale study context?
4. Does the page show an address-level spectral result today? Why or why not?
5. What is one safe next step you could take after reading the plan?

**Pass condition:** every participant correctly answers questions 1–4, and at
least four of five can identify one action without interpreting the plan as a
health-risk score or property prescription. Record the answers, any confusing
language, and resulting changes in the project’s issue tracker before marking
Phase 2 complete.

### Field validation

- Co-design a pilot with residents, public health, planning / urban forestry, disability / accessibility advocates, tenants, and data stewards.
- Ground-truth a pre-specified sample with shade observations, route and access observations, tree condition, public-resource accessibility, and—where appropriate—calibrated field measurements.
- Evaluate whether the system’s questions identify useful places, not merely whether its maps look compelling.
- Track false positives, missed concerns, differential performance by neighborhood, language / access barriers, and harm reports.
- Publish an evaluation protocol before interpreting intervention outcomes.

NOAA’s heat-mapping work offers a strong precedent for participatory validation: community field campaigns produce finer local thermal context, but mapping itself is only the beginning of a policy and equity response. [NOAA / BAMS research record](https://repository.library.noaa.gov/view/noaa/66596)

### Governance

- City-specific data steward and public-interest purpose.
- Independent methods / privacy / accessibility review before launch.
- Community review path that can correct, suppress, or contextualize a location result.
- Prohibition on using address results for enforcement, eligibility, surveillance, insurance, lending, rent-setting, or other adverse decisions.
- Versioned change log, incident response, and a sunset / rollback mechanism.

## 8. Delivery roadmap

| Phase | Scope | User value | Exit criterion |
| --- | --- | --- | --- |
| 0. Research contract | Publish this boundary, privacy specification, and data inventory | Trust before feature work | Community / technical review accepts the contract |
| 1. No-address heat-help page | Official forecast links, local resources, general safety and contribution routes | Immediate value without location retention | Accessibility and content review pass |
| 2. Approximate-place prototype *(external review pending)* | Browser-only place label plus city-wide evidence card; no spectral advice unless supported | Neighborhood orientation without location transmission | Five-person comprehension study is recorded and resulting changes are applied |
| 3. One-city co-designed pilot | Curated layers, local partner, public feedback route, spectral explanation panel | Local question discovery | Ground-truth and equity evaluation protocol complete |
| 4. Address-confirmed private report | Ephemeral geocoding, rounded display, site-fact questionnaire, conditional investigation menu | More tailored but bounded guidance | Independent privacy/security/accessibility review and pilot evidence justify expansion |
| 5. Evaluated contribution network | Public issue / partner handoff, structured observations, pilot registry, learning reports | Turns individual curiosity into accountable civic action | Demonstrated local usefulness and no unacceptable disparate harms |

Supporting readiness contracts: [Boston pilot](BOSTON_PILOT_READINESS.md),
[address-confirmed private report](PHASE_4_PRIVATE_REPORT_READINESS.md), and
[contribution network](PHASE_5_CONTRIBUTION_NETWORK_READINESS.md). The status
table at the start of this document is authoritative; these contracts define
the detailed external gates for the later phases.

## 9. Recommended next implementation

Do **not** enable a street-address lookup next. First complete the outstanding
Phase 2 comprehension study and apply any resulting language or interaction
changes. In parallel, strengthen the existing approximate-place experience with
official current-heat and local-resource integrations only where the data and
operational owner are clear.

Then establish a single, consented Boston pilot with a named local steward and
review process. The first spectral output should be a **research explanation
panel**, not an action ranker: show the candidate cut, explain the model,
request confirmation or disagreement, and document what local review reveals.
Only after reproducibility, field validation, privacy review, and a co-designed
action pathway should the platform permit address-confirmed, personalized
investigation menus.

## 10. Final decision

An address can make Spectral Urbanism more useful when it **narrows the question** and **strengthens accountability**. It becomes harmful when it creates an illusion of parcel-level precision, medical certainty, or individualized responsibility for a collective infrastructure problem.

The standard for launch is therefore not “can we produce a score?” It is: **can a resident understand what was observed, what was modeled, what remains unknown, how their data is protected, what they can safely do next, and how the city or community can be asked to act with them?**
