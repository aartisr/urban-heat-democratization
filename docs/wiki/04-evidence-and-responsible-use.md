# Evidence, Provenance, and Responsible Use

> 🌐 **Interactive Live Application:** Explore the live heat atlas, transparent mitigation scenarios, and GIS tools on the official platform: [urban-heat.ai-aarti.com](https://urban-heat.ai-aarti.com/) | [Boston Study](https://urban-heat.ai-aarti.com/cities/boston) | [Scenario Lab](https://urban-heat.ai-aarti.com/scenarios) | [Solution Suite](https://urban-heat.ai-aarti.com/solution-suite) | [Mitigation Lab](https://urban-heat.ai-aarti.com/mitigation-lab)


## The evidence standard

Every meaningful claim should be easy to classify:

| Label | Meaning | Appropriate use |
| --- | --- | --- |
| Source-backed | Linked to a public, inspectable source or reproducible generation path | Context and defensible reference |
| Bundled artifact | A local study asset shipped with the repository | Demonstration and documented analysis |
| Benchmark | A comparative planning reference | What-if exploration, clearly labeled |
| Proxy | A constructed indicator standing in for a harder-to-measure condition | Hypothesis generation, never direct outcome claims |
| Unknown / incomplete | Evidence has not been collected, validated, or made available | A visible gap that must shape interpretation |

This classification prevents a common failure in climate technology: turning an uncertain indicator into an authoritative-looking fact because it is displayed with precision.

## Provenance in practice

The repository keeps bundled data, cost references, city package metadata, and runtime products separate. `data/` contains bundled evidence and references; `data/runtime/` contains mutable local state such as onboarded cities, queued runs, JSON mirrors, SQLite data, and locally refreshed provider payloads.

The [Artifact Strategy](../ARTIFACT_STRATEGY.md) specifies that artifacts used to support claims should have a stable provenance or reproducible generation path. Mutable runtime products should not be confused with reviewed source artifacts.

## Responsible scenario use

Current scenarios are benchmark-based. Per-action budgets can be ranking-derived, and benefit-related fields are transparent proxies rather than city-calibrated outcome estimates. Use a scenario to frame a meeting, prioritize research, or compare assumptions. Before advancing it toward a real program, require at least:

1. locally valid quantities and costs;
2. a clear maintenance and operations plan;
3. site feasibility and engineering review;
4. public-health, accessibility, and safety review;
5. community engagement with meaningful ability to change the plan;
6. a plan for measuring results and publishing what was learned.

## Protect people, not just data

Heat data can be sensitive when combined with health, housing, mobility, or utility information. The project should favor aggregation, minimization, appropriate access controls, and explicit data-governance agreements. It should avoid publishing information that could expose vulnerable people, identify individual households, or be used to displace residents from neighborhoods identified as investment targets.

## Language guide

Prefer: “The supplied layers indicate…”, “The model highlights…”, “This benchmark suggests a question to investigate…”, “Local validation is needed.”

Avoid: “The model proves…”, “This intervention will reduce heat by…”, “This area is inherently vulnerable…”, or “The optimal plan is…” unless the exact claim has a source, a defined scope, and appropriate validation.

The project’s ethical standard is simple: clarity should increase agency, not just confidence.

## Apply this standard in the platform

Use the [Urban Heat Democratization platform](https://urban-heat.ai-aarti.com/) to inspect the public-facing evidence. Before sharing a result from the [Boston study](https://urban-heat.ai-aarti.com/cities/boston) or [scenario workspace](https://urban-heat.ai-aarti.com/scenarios), return here to name the evidence class, provenance, and limitation.

*Authored by [Aarti S Ravikumar](https://ai-aarti.com).*

---

### Connect with the Living Platform

- 🗺️ **[Boston Urban Heat Atlas](https://urban-heat.ai-aarti.com/cities/boston)** — Inspect satellite thermal layers, Cheeger cuts, and cooling equity overlays.
- 🧪 **[Mitigation Scenarios](https://urban-heat.ai-aarti.com/scenarios)** — Model urban tree canopy, cool roofs, and pavements with cost constraints.
- 🛠️ **[Solution Suite & GIS Tools](https://urban-heat.ai-aarti.com/solution-suite)** — Interactive Overpass OSM query builder, microclimate sensor validation, and federal grant generator.
- 🔬 **[Interactive Mitigation Lab](https://urban-heat.ai-aarti.com/mitigation-lab)** — Real-time temperature response and cost-benefit trade-off exploration.
- 📈 **[Robustness & Science Lab](https://urban-heat.ai-aarti.com/robustness)** — Inspect spectral graph conductance, Fiedler vectors, and percolation dynamics.
- 🤝 **[Collaborate on Heat Action](https://urban-heat.ai-aarti.com/contact)** — Join research mentors, civic leaders, and community partners.
