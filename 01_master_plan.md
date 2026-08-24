# Urban Heat Democratization Master Plan

## 1. Mission
Build a city-agnostic, research-grade, educator-friendly platform that helps
any user understand urban heat, discover heat traps, test mitigation ideas,
and turn those ideas into defensible action plans.

The platform should make spectral urbanism accessible to:
- educators who need a clear teaching tool,
- city planners who need an action-oriented decision system,
- students who need a visual and conceptual entry point,
- researchers who need rigorous, reproducible methods,
- community groups who need plain-English explanations.

The core promise is simple:
1. pick a city,
2. observe the heat system,
3. research why the heat is trapped,
4. test mitigation scenarios,
5. estimate cost and impact,
6. export a plan that a human can actually use.

## 2. Product Thesis
Most urban heat tools do one of two things:
- show a map of hot places, or
- provide an academic model that is hard to use.

This platform must do both well:
- it must be scientifically serious,
- and it must be easy enough for a layperson to use without a specialist.

The product should not stop at heat mapping. It should answer the planner's
real questions:
- Where are the heat traps?
- Why are they trapped?
- What interventions work best?
- How much will each option cost?
- What happens if the budget is smaller?
- What if the city wants to prioritize equity?
- What if the city wants to mitigate the worst heat everywhere, not just the
  most visible hot spots?

## 3. Design Principles

### 3.1 Democratize, do not dumb down
The user experience must be accessible, but the underlying science must remain
transparent and rigorous.

### 3.2 City-agnostic by default
The product should support any city with configurable data adapters, not only
Boston.

### 3.3 Explainability first
Every map layer, score, and recommendation must have:
- a plain-language explanation,
- a technical explanation,
- a provenance trail,
- a confidence indicator.

### 3.4 Scenario thinking over static reporting
The platform should support what-if analysis:
- what if the budget is $100k?
- what if the budget is $1M?
- what if we must prioritize schools?
- what if the city can only use trees and shade?
- what if the city wants the cheapest full mitigation path?

### 3.5 Actionability over novelty
The best result is not a beautiful map. The best result is a better decision.

## 4. User Personas

### 4.1 Educator
Needs:
- simplified visual explanations,
- classroom-friendly city examples,
- annotated diagrams,
- compare/contrast views,
- downloadable lesson materials.

### 4.2 Student
Needs:
- guided exploration,
- “why is this hot?” explanations,
- a glossary,
- map clicks that reveal meaning in plain language,
- small experiments and scenario sliders.

### 4.3 City planner
Needs:
- ranked intervention packages,
- budget constraints,
- priority corridors,
- implementation feasibility,
- exportable reports and tables.

### 4.4 Researcher
Needs:
- reproducibility,
- model cards,
- ablation results,
- confidence intervals,
- sensitivity analysis,
- data provenance.

### 4.5 Community advocate
Needs:
- street-level context,
- understandable maps,
- fairness and impact summaries,
- easy-to-share outputs.

## 5. The Core User Journey

### 5.1 Choose a city
The user selects a city from a catalog or defines a custom city boundary.

### 5.2 Observe
The platform shows:
- heat intensity,
- vegetation,
- bottlenecks,
- resistance / cooling access,
- low-access zones,
- vulnerable neighborhoods,
- streets or corridors of interest.

### 5.3 Research
The user can inspect:
- why a location is hot,
- what data sources were used,
- how confident the system is,
- which assumptions matter most.

### 5.4 Simulate
The user creates scenarios:
- baseline,
- targeted intervention,
- mixed portfolio,
- equity-prioritized,
- climate-stressed future,
- exhaustive mitigation.

### 5.5 Budget
The user enters a budget and receives:
- best interventions under budget,
- marginal cost vs impact,
- unmet need after budget exhaustion,
- cost to fully mitigate to a chosen threshold.

### 5.6 Export
The user downloads:
- map bundle,
- PDF report,
- data package,
- methods appendix,
- scenario comparison sheet.

## 6. Core Scientific Capabilities

### 6.1 Heat network modeling
Treat the city as a network:
- cells or polygons become nodes,
- adjacency becomes edges,
- weights encode thermal ease or difficulty.

### 6.2 Spectral bottleneck detection
Use Cheeger-style analysis and spectral gaps to find structural pinch points
where cooling corridors are weak.

### 6.3 Cooling access modeling
Estimate how easily a location can reach cool sinks such as:
- parks,
- canopy-rich streets,
- water edges,
- shaded public spaces.

### 6.4 Robustness and reliability
Stress-test the network under randomized failures or disturbances to estimate
how fragile the cooling system is.

### 6.5 Intervention optimization
Select the best mix of mitigation actions under budget and policy constraints.

### 6.6 GMRF-based inference
Use graph-regularized inference to smooth noisy observations and make the heat
field more stable and interpretable.

## 7. Scenario Engine Requirements

The scenario engine must support:
- fixed budget optimization,
- threshold-based mitigation,
- exhaustive mitigation cost,
- corridor-first mitigation,
- school-first mitigation,
- equity-first mitigation,
- maintenance-constrained mitigation,
- long-term climate stress tests,
- single-intervention type scenarios,
- mixed portfolio scenarios.

Each scenario should report:
- cost,
- expected impact,
- spatial coverage,
- uncertainty,
- equity effect,
- implementation complexity.

## 8. Cost Model Requirements

The system must support three cost views:

### 8.1 Project cost
What it costs to implement a specific intervention package.

### 8.2 Portfolio cost
What it costs to reach the best outcome within a budget.

### 8.3 Exhaustive mitigation cost
What it would cost to raise the whole city, or a targeted subset of the city,
above a defined cooling threshold.

The exhaustive mitigation estimator should distinguish between:
- “cheapest useful mitigation,”
- “full mitigation of critical corridors,”
- “full mitigation of all eligible heat traps.”

## 9. Data Philosophy
The product should accept city data in layers:
- thermal imagery,
- vegetation indices,
- imperviousness,
- land cover,
- building footprints,
- roads,
- parcels,
- canopy data,
- vulnerability indices,
- administrative boundaries,
- intervention cost tables.

The system should tolerate incomplete cities by:
- using defaults,
- flagging uncertainty,
- warning on data gaps,
- never silently inventing certainty.

## 10. Trust Model
Every answer must be traceable.

The platform should emit:
- what data was used,
- what time period it represents,
- what assumptions were made,
- what was estimated vs observed,
- what could change the result,
- what scenario produced the recommendation.

## 11. Success Criteria
This product is successful if it can:
- onboard a new city without custom code,
- show heat traps clearly to a non-expert,
- explain the science in plain language,
- recommend defensible interventions,
- estimate budget tradeoffs,
- produce reproducible scenario outputs,
- help real users move from maps to action.

## 12. Phased Strategy

### Phase 1: Foundation
- generic city onboarding,
- core map viewer,
- baseline heat analysis,
- simple explanations,
- provenance capture.

### Phase 2: Scenario Planning
- budget sliders,
- intervention portfolios,
- what-if comparisons,
- cost tables,
- ranked mitigation options.

### Phase 3: Exhaustive Analysis
- exhaustive mitigation estimator,
- full-city coverage scenarios,
- threshold-based completeness analysis,
- fairness and feasibility overlays.

### Phase 4: Democratized UX
- educator mode,
- student mode,
- planner mode,
- researcher mode,
- guided walkthroughs,
- shareable reports.

### Phase 5: Validation and Publication
- benchmarks across cities,
- sensitivity analyses,
- uncertainty reporting,
- public documentation,
- reproducible challenge datasets.

## 13. What This Platform Should Become
Not just a heat map viewer.

Not just a graph theory demo.

A decision studio for urban cooling, designed so that a student, a planner,
and a researcher can all look at the same city and understand what to do next.
