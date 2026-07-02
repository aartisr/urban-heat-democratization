# Scenario Visual Benchmark Matrix (Top 25 Reference Set)

## Purpose

This matrix translates the existing reference set in [docs/TOP_25_CITY_ANALYSIS_REFERENCES.md](docs/TOP_25_CITY_ANALYSIS_REFERENCES.md)
into actionable guidance for the three Scenarios visuals:

- Sunburst (hierarchy)
- Packed bubble (concentration)
- Sankey (flow provenance)

The goal is not to claim all references use these exact components.
The goal is to map verified interface patterns from those references into our
three-lens decision workflow.

## Confidence labels

- `direct`: public interface shows this chart type or a close equivalent
- `pattern-fit`: interface behavior strongly maps to this chart’s purpose
- `not-primary`: this chart type is not a primary pattern in that reference

## Top-25 mapping

| # | Reference | Sunburst lens | Packed bubble lens | Sankey lens | Confidence summary |
| --- | --- | --- | --- | --- | --- |
| 1 | AirNow Fire and Smoke Map | pattern-fit | pattern-fit | not-primary | map-first orientation supports quick scan and drill-down |
| 2 | NOAA HeatRisk | pattern-fit | not-primary | not-primary | layered hazard explanation maps to hierarchy-first reading |
| 3 | EPA EnviroAtlas | pattern-fit | pattern-fit | not-primary | evidence-rich layer taxonomy supports composition lens |
| 4 | FEMA Map Service Center | not-primary | not-primary | not-primary | task-first journey influences navigation and next-step flow |
| 5 | FEMA National Risk Index | pattern-fit | pattern-fit | not-primary | compact metrics + spatial context align with concentration summaries |
| 6 | Climate Central Coastal Risk | pattern-fit | pattern-fit | pattern-fit | map-to-impact storytelling aligns with causal sequencing |
| 7 | EPA EJScreen | pattern-fit | pattern-fit | not-primary | index + screening behavior aligns with weighted composition |
| 8 | CDC Environmental Justice Index | pattern-fit | pattern-fit | not-primary | indicator hierarchy supports top-down composition reading |
| 9 | CDC Social Vulnerability Index | pattern-fit | pattern-fit | not-primary | index decomposition aligns with hierarchy and concentration views |
| 10 | Cal-Adapt | pattern-fit | pattern-fit | pattern-fit | scenario-style exploration aligns with multi-lens workflow |
| 11 | NOAA Sea Level Rise Viewer | pattern-fit | not-primary | pattern-fit | scenario comparison and consequence tracing fit flow lens |
| 12 | EPA How’s My Waterway | pattern-fit | not-primary | not-primary | place-first drill-down supports progressive disclosure |
| 13 | US Drought Monitor | not-primary | pattern-fit | not-primary | legend discipline informs compact concentration encoding |
| 14 | USGS Earthquake Map | not-primary | pattern-fit | not-primary | fast scan + inspect later maps to packed-bubble quick triage |
| 15 | NASA Earthdata Worldview | pattern-fit | pattern-fit | pattern-fit | expert layers + controls map to lens switching patterns |
| 16 | Global Forest Watch | pattern-fit | pattern-fit | pattern-fit | high-density storytelling supports hierarchy + flow sequences |
| 17 | National Equity Atlas | pattern-fit | pattern-fit | pattern-fit | strong narrative sectioning and chart transitions |
| 18 | Opportunity Atlas | pattern-fit | pattern-fit | not-primary | place-centered comparison supports composition + concentration |
| 19 | Atlas of ReUrbanism pattern | pattern-fit | pattern-fit | pattern-fit | context-to-intervention progression maps to 3-lens sequence |
| 20 | Urban Institute Data Tools pattern | pattern-fit | pattern-fit | not-primary | user-purpose-first framing improves chart context and copy |
| 21 | ArcGIS Urban pattern | pattern-fit | pattern-fit | pattern-fit | scenario planning context maps strongly to causal flow tracing |
| 22 | City Health Dashboard | pattern-fit | pattern-fit | not-primary | concise metric blocks support concentration scan behavior |
| 23 | NYC Environment/Health Data pattern | pattern-fit | pattern-fit | pattern-fit | dense data with guidance maps to progressive chart disclosure |
| 24 | Resilience Atlas pattern | pattern-fit | pattern-fit | pattern-fit | adaptation pathways align with causality and evidence framing |
| 25 | Transit/mobility observatory pattern | pattern-fit | pattern-fit | pattern-fit | system-flow reasoning maps directly to Sankey-like storytelling |

## Best features extracted for Scenarios page

From the reference set, the best reusable features are:

1. Progressive disclosure

- Show composition first, then concentration, then flow causality.

1. Evidence near claim

- Keep observed/derived/estimated status adjacent to chart values.

1. Fast first read

- Provide compact visual summaries before detailed interactions.

1. Guided next action

- Keep user moving toward generation/compare/audit without navigation churn.

1. Honest caveats

- Keep proxy and benchmark language visible near chart explanations.

## How this is now applied in the product

- Sunburst: composition and evidence hierarchy lens
- Packed bubbles: dominance and budget concentration lens
- Sankey: evidence-to-family flow provenance lens
- Shared controls: zoom and compact mode across all three visuals
- Scenario narrative strip and section nav: keeps the page legible, not overwhelming

## Helper-function mapping (code-level)

### Sunburst helpers

- `sumNode`, `maxDepth`, `layoutNodes`, `describeArcSegment`
  - build hierarchy geometry and readable ring structure
- `ensureReadableSunburstColor`
  - prevents low-contrast slice coloring

File: [web/src/components/sunburst-card.tsx](web/src/components/sunburst-card.tsx)

### Packed bubble helpers

- `actionValue`, `categoryColor`
  - derive weighted intervention values and semantic color groupings
- `packBubbles`, `overlaps`
  - create non-overlapping concentration layout

File: [web/src/components/scenario-packed-bubble-card.tsx](web/src/components/scenario-packed-bubble-card.tsx)

### Sankey helpers

- `buildScenarioSankey`
  - constructs evidence/category/budget nodes and links
- `layoutColumn`
  - allocates readable vertical space by value
- `linkPath`
  - routes causal flow curves for scanability

File: [web/src/components/scenario-sankey-card.tsx](web/src/components/scenario-sankey-card.tsx)

## Why three views champion understanding

- One chart alone cannot answer all decision questions without overload.
- Three coordinated lenses reduce cognitive load by separating tasks:
  - composition question -> Sunburst
  - concentration question -> Packed bubbles
  - causality question -> Sankey
- This separation keeps the experience richer than a single complex chart,
  while preserving readability for non-specialist users.
