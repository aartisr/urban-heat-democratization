# Documentation guide

**Urban Heat Democratization** helps more people inspect urban heat evidence, understand the assumptions behind a map, and participate in decisions about cooling. It is authored by [Aarti S Ravikumar](https://ai-aarti.com/). The project combines established scientific methods with a public workflow; it has not demonstrated measured cooling or health outcomes from an intervention.

## Choose a path

| I want to… | Read first | Then try |
| --- | --- | --- |
| Understand a neighborhood heat question | [Civic starter guide](wiki/12-civic-starter-guide.md) | [Boston atlas](https://urban-heat.ai-aarti.com/cities/boston) and its layer sources |
| Teach or learn with a concrete example | [Boston classroom guide](BOSTON_CLASSROOM_GUIDE.md) | [Graph theory worked example](wiki/08-graph-theory-worked-example.md) |
| Evaluate a planning option | [Boston study guide](BOSTON_STUDY_GUIDE.md) | [Scenarios](https://urban-heat.ai-aarti.com/scenarios), followed by the [evidence guide](wiki/04-evidence-and-responsible-use.md) |
| Bring another city or community into the work | [City onboarding and partnership](wiki/05-city-onboarding-and-partnership.md) | [Civic starter guide](wiki/12-civic-starter-guide.md) |
| Review the science or code | [Math accountability](MATH_INNOVATION_ACCOUNTABILITY.md) | [Technical reference](wiki/07-technical-reference.md), [architecture](ARCHITECTURE.md), and [API](API.md) |
| Check what is available today | [Repository capability status](IMPLEMENTATION_STATUS.md) | [Impact evidence protocol](IMPACT_EVIDENCE_PROTOCOL.md) |

The [wiki index](wiki/README.md) is the public field guide. The [repository README](../README.md) explains setup, tests, and the overall project.

## Where the innovation lies

The project makes an **inspectable path from heat evidence to civic questions**: a thermal and vegetation raster can be converted into a declared graph; graph measures can highlight modeled bottlenecks and relative access to inferred cooling pixels; the interface exposes sources and limits alongside the result. A fictional mitigation grid and benchmark scenarios let people discuss possible responses without presenting a simulated change as an observed outcome. The methods are established; the contribution is their transparent integration, public explanation, and accountable use. See the [method trace](MATH_INNOVATION_ACCOUNTABILITY.md).

## What communities can do with it

Start with a specific question, inspect a map layer's source and date, and compare it with local experience: shade at walking times, public access, maintenance, mobility barriers, and places residents actually seek relief. Record where the map agrees or conflicts with lived knowledge. Bring those findings to a community organization or public agency and ask what additional measurement, consent, or review is needed before acting. The [civic guide](wiki/12-civic-starter-guide.md) gives a meeting workflow; the [partnership guide](wiki/05-city-onboarding-and-partnership.md) explains how to add a city responsibly. Avoid sharing personal addresses or health details in public issues.

## Read results at the right evidence level

- **Observed or sourced inputs:** inspect the date, provider, geography, and measurement type before drawing a conclusion.
- **Derived model signals:** a graph bottleneck, priority class, or cooling-access proxy is a calculation under stated assumptions. It is a prompt for investigation, not a measured condition at a person's location.
- **Exploratory scenarios:** benchmark costs, modeled reach, and fictional learning grids are discussion aids. They do not predict local temperature, health, or intervention effectiveness.
- **Measured impact:** requires a documented intervention, baseline and follow-up measurements, comparison design, uncertainty, and community review. The [impact evidence protocol](IMPACT_EVIDENCE_PROTOCOL.md) describes that threshold; this repository does not claim to have met it.

Boston is the bundled study. Other city presets and onboarding paths do not imply completed local studies. For current capability and limits, use [implementation status](IMPLEMENTATION_STATUS.md). For immediate heat-safety decisions, follow current local public-health guidance.

## Documentation map

- **Public use:** [wiki](wiki/README.md), [Boston study](BOSTON_STUDY_GUIDE.md), [classroom guide](BOSTON_CLASSROOM_GUIDE.md).
- **Methods and evidence:** [math accountability](MATH_INNOVATION_ACCOUNTABILITY.md), [bundled-array map comparison](BUNDLED_MAP_COMPARISON.md), [urban thermal math deep dive](Urban_Thermal_Math_Deep_Dive.md), [impact evidence protocol](IMPACT_EVIDENCE_PROTOCOL.md), [data and provenance](../data/README.md).
- **Student scientific paper:** [Final Paper PDF](Final_Paper.pdf) and [source Markdown](Final_Paper.md). Its nine-cell experiment and companion map comparison are computational studies, not field validation.
- **Working paper:** [source Markdown](DEMOCRATIZING_URBAN_HEAT_RESILIENCE_JOURNAL.md), [PDF](DEMOCRATIZING_URBAN_HEAT_RESILIENCE_JOURNAL.pdf), and [editable Word](DEMOCRATIZING_URBAN_HEAT_RESILIENCE_JOURNAL.docx). This methods and perspective manuscript is not peer reviewed.
- **Engineering:** [API](API.md), [architecture](ARCHITECTURE.md), [design patterns](DESIGN_PATTERNS.md), [release process](RELEASE_PROCESS.md), [live thermal setup](LIVE_THERMAL_SETUP.md).
- **Proposals and research directions:** [advanced math and layers plan](ADVANCED_THERMAL_MATH_AND_MAP_LAYERS_IMPLEMENTATION_PLAN.md), [future research](FUTURE_COMPUTATIONAL_URBAN_THERMAL_RESEARCH.md), [scenario comparison design](SCENARIO_MAP_COMPARISON_DESIGN.md). A plan is not a shipped feature.
- **Historical snapshots:** [archive](archive/README.md). Old test counts and completion claims are not current verification.

## Keep the guide trustworthy

When a feature or public claim changes, update its source, evidence level, limit, and [capability status](IMPLEMENTATION_STATUS.md). Link to the source of truth instead of copying status numbers into multiple pages. Run `python3 scripts/check_docs_links.py` from the repository root before submitting documentation. See [CONTRIBUTING.md](../CONTRIBUTING.md) for contributions.
