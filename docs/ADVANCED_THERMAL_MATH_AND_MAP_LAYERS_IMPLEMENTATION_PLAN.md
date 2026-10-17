# Advanced Thermal Math & Map Layers: Implementation Plan

**Status:** partially implemented. The generic primitive/manifest framework and a hidden, computationally verified LISA atlas preview are implemented; public release, sensor adapters, time-series artifacts, and exposure context remain gated as described below.  
**Purpose:** responsibly add the methods currently marked “not implemented” in [Mathematical Innovation Accountability Report](MATH_INNOVATION_ACCOUNTABILITY.md), where each method has adequate inputs, a legitimate map meaning, and an explicit validation gate.

## Decision and product thesis

Do not turn every equation in the guide into a layer. A map layer is useful only when it answers a different question, has inputs and uncertainty appropriate to that question, and does not look more certain than the evidence allows.

The recommended addition is a **four-family evidence atlas**, with existing spectral layers retained as a separate family:

```text
Observed thermal scene          → What was the surface temperature signal?
Spatial pattern and persistence → Is the pattern clustered or repeatedly extreme?
Land-change and exposure context→ Who/what may warrant further investigation?
Network structure (existing)    → Where does the declared raster graph look weakly connected?
```

Each family must remain independently toggleable, independently downloadable, and visibly labelled **Observed**, **Derived**, **Context**, or **Planning proxy**. The UI must never merge them into a universal “priority score.”

## Prioritization: what to build and why

| Priority | Method family from the guide | Product decision | User question it supports | Why it comes at this point |
| --- | --- | --- | --- | --- |
| P0 | DN → radiance → brightness temperature → emissivity-corrected LST / split window | Build a provenance-preserving thermal-preprocessing capability, with product-specific routes rather than one universal formula. | “What exactly was observed, on which date, and with what quality?” | It upgrades the input contract behind all temperature claims. It is not a decorative new layer. |
| P1 | Global Moran’s I and Local Moran’s I (LISA) | Add a spatial-pattern lens with a multiple-testing-aware local cluster/outlier layer. | “Is this high/low signal spatially patterned beyond its immediate neighbours?” | It adds statistical context that the current graph bottleneck layer does not provide. |
| P1 | Spectral clustering and modularity | Add an advanced **thermal regions** audit layer, not a default public priority layer. | “Which coherent regions emerge under the stated graph rule?” | Useful to explain multi-region structure, but easier to overinterpret than bottlenecks. |
| P2 | Multi-scene exceedance, PDFs, GEV extremes | Add only after a quality-controlled time series exists. | “How often has this place exceeded a stated heat threshold, and what is the uncertainty?” | A single image cannot support an extreme-value or heat-wave claim. |
| P2 | Markov land-cover / vegetation transitions | Add only with registered, harmonized multi-year land-cover inputs. | “What persistent surface/vegetation change is visible here?” | This gives actionable temporal context without claiming a causal intervention effect. |
| P3 | Population exposure / joint and conditional risk | Build a privacy-reviewed **context** lens, not individual-risk or predictive scoring. | “Where do modeled conditions overlap with population or vulnerability context?” | High social value but high ethical, data-governance, and ecological-fallacy risk. |
| Defer | General max-flow/min-cut, exhaustive graph cuts, combinations, generic greedy partitioning | Do not ship as an independent public map layer. Use only as internal benchmark/solver work if a future, well-specified network question requires it. | None currently unanswered by the product. | Without a real physical or accessible-route network and calibrated capacities, a flow map would be visually persuasive but scientifically weak. |

## Target atlas design

The existing MapLibre atlas already supports a source, derived, and scenario layer tray. Extend that tray; do not create a second map or an overloaded default view. The relevant surfaces are `web/src/components/city-heat-map.tsx` and the city data contract/API that supplies its GeoJSON and provenance.

### Proposed layer catalogue

| Lens and layer | Visual treatment | Classification / interaction | Required disclosure beside the legend | Readiness rule |
| --- | --- | --- | --- | --- |
| **Observed thermal scene**: calibrated LST | Sequential thermal raster/vector tiles; optional transparent cloud/quality mask above it. | Continuous °C scale, fixed and stated for the selected scene; click shows scene, product, acquisition time, pixel scale, quality flags. | “Observed land-surface temperature, not air temperature or personal exposure.” | Only a validated product-specific preprocessing record may enable it. |
| **Vegetation and emissivity inputs**: NDVI, FVC, emissivity | Separate green/purple continuous views; never blended with LST by default. | Fixed physical/derived ranges; click reveals source bands/product and formula/parameter version. | “Derived surface-property proxy; not a tree inventory or shade measurement.” | NDVI/FVC/emissivity formula and optical QA must be registered. |
| **Spatial pattern**: LISA category | Categorical polygons/cells: high–high, low–low, high–low, low–high; non-significant muted/hidden by default. | Click shows local statistic, permutation p-value, adjusted significance status, neighbourhood rule, date/window. | “Statistical spatial pattern, not a causal hotspot designation.” | Global test, permutation plan, multiple-comparison correction, and minimum-neighbour checks pass. |
| **Thermal regions**: spectral cluster/community | Muted categorical boundary/fill layer, shown only in Explore/Audit. | Cluster label has no inherent rank; click shows feature set, graph parameters, stability across seeds/scales. | “Model-defined region under the stated graph rule; boundaries are not administrative or physical barriers.” | Stability and cross-method comparison meet predeclared thresholds. |
| **Heat persistence / extremes**: threshold exceedance and, later, return-level uncertainty | Two separate layers: count/share of valid scenes above a stated threshold; later a return-level estimate with uncertainty hatch. | Threshold map first; no return-period colour until time-series gate passes. | “Scene-based surface-temperature persistence; coverage and missing scenes affect this result.” | Time coverage, seasonal comparability, cloud screening, and uncertainty criteria documented. |
| **Land transition**: vegetation/impervious change class | Categorical transition arrows or cells: stable green, green loss, gain, stable non-green; filterable date pair. | Never use a red “decline” layer as a risk verdict; click gives dates/source/class confidence. | “Observed classification transition; does not establish cause or ownership.” | Harmonized classifications and accuracy assessment are available. |
| **Exposure context**: aggregated population/vulnerability overlap | Bivariate/linked-view display, not a single risk heatmap: toggle condition and context separately, then inspect overlap. | Small-area aggregation, suppression and uncertainty; no individual dots or address-level ranking. | “Area-level context; not an estimate of any person’s exposure, health, or need.” | Privacy, equity, legal, community-governance, and ecological-inference review approve release. |
| **Existing graph layers**: Cheeger bottleneck and cooling linkage | Preserve current treatment and provenance. | Stay separate from LISA, clusters, and exposure. | “Graph-derived structural proxy, not observed flow or access.” | Existing city-package/readiness requirements remain in force. |

### Interaction rules

1. Start every atlas lens with **one active layer**. The default City Read experience should remain concise.
2. A click/open panel always carries: value/category, data date/window, source/product, method version, uncertainty/quality, suitable interpretation, and what it cannot show.
3. “Compare layers” is an intentional mode with a two-layer maximum. It uses independent legends and a text/table alternative; it never computes a hidden composite.
4. Non-significant LISA cells, masked pixels, extrapolated surfaces, and insufficient-history extreme cells are visually distinct from zero or low values.
5. The same GeoJSON/COG artifact and its provenance record must power the map, download, API response, and Audit narrative.

## Architecture and data contract

### 1. Extend the city package, not ad-hoc frontend state

Create a versioned `analysisLayers` manifest entry for every new artifact. A layer is publishable only when its manifest has the following minimum fields:

```json
{
  "id": "lisa-lst-2026-07-15",
  "family": "spatial_pattern",
  "truthStatus": "derived",
  "displayLabel": "Local thermal pattern",
  "artifact": { "format": "COG|GeoJSON|vector-tiles", "path": "...", "sha256": "..." },
  "sourceInputs": ["scene/product/version identifiers"],
  "analysisWindow": { "start": "...", "end": "..." },
  "spatialResolution": "...",
  "method": { "name": "...", "version": "...", "parameters": {} },
  "quality": { "maskRule": "...", "uncertainty": "...", "coverage": "..." },
  "interpretation": "...",
  "limitations": ["..."],
  "validationStatus": "blocked|computationally_verified|externally_validated",
  "download": "..."
}
```

Extend the current city contract and API serializer to pass this manifest, layer availability, provenance, and source links to `city-heat-map.tsx`. Use a discriminated type for layer families so the frontend cannot render a risk/exposure layer as a normal continuous temperature field.

### 2. Preserve raw, calibrated, and derived separation

```text
Source assets + metadata + QA                    immutable input record
        ↓
Product-specific calibration / harmonization     observed-scene artifact
        ↓
Feature derivation (NDVI/FVC/emissivity, etc.)   derived-input artifact
        ↓
Spatial / temporal / graph analysis              derived analysis artifact
        ↓
Manifest, checksums, parameters, test results    publishable city package
        ↓
Atlas, download, Audit and API                   one consistent story
```

Inputs must be stored separately from derived results. Every job records code version, dependency environment, parameters, CRS, resampling method, nodata/cloud rules, and random seed where relevant.

### 3. Support raster-scale data responsibly

- Publish continuous thermal/NDVI/FVC/emissivity layers as Cloud-Optimized GeoTIFFs or raster tiles; do not create massive GeoJSON cell grids.
- Publish categorical LISA, transition, cluster, and boundary products as vector tiles/GeoJSON only after simplification that preserves topology and records the simplification tolerance.
- Return a per-pixel/per-feature evidence payload on click, including the exact artifact ID and method version.
- Keep current lazy loading and require activation before downloading heavy layers, consistent with the Map Stack evaluation.

## Workstreams and implementation sequence

### Phase 0 — Governance, contracts, and test fixtures (first)

**Deliverables**

- Add layer-family schemas, provenance requirements, truth-status rules, and quality-state vocabulary to the city-package contract.
- Create two small synthetic fixtures: one valid known-answer raster time series and one deliberately invalid/missing-metadata package.
- Add a `layer-readiness` validator that refuses publication when required formula parameters, QA, validation state, or limitations are absent.
- Create the common map legend/evidence-panel component before adding any computation.

**Exit gate:** contract tests reject an unlabeled/unsupported layer; the map can render a fixture with observed/derived/context labels and an accessible text alternative.

### Phase 1 — Provenance-preserving thermal preprocessing (P0)

**Implementation**

1. Define accepted source products explicitly. Prefer standard collection products that already provide surface temperature and QA. Raw-DN support is a separate adapter, not a default assumption.
2. For raw sources, implement product-specific metadata parsing and the chain where scientifically appropriate: DN → radiance → brightness temperature → emissivity-corrected LST. Implement split-window only for products with the required, validated two-band coefficients, water-vapor inputs, and documentation.
3. Implement NIR/Red NDVI; then FVC and emissivity only with configurable, documented thresholds/coefficients and an input-quality mask.
4. Preserve the original value units and a quality/uncertainty artifact; hand the prepared LST/NDVI field to the existing graph pipeline only after QA validation.
5. Add observed LST, QA mask, NDVI, FVC, and emissivity layers to the atlas with their separate legends.

**Do not do:** apply a generic Landsat-8 formula to every satellite; substitute LST for 2m air temperature; colour cloud/no-data cells as cool; let derived emissivity overwrite a source product’s own temperature provenance.

**Exit gate:** known-scene comparisons against an authoritative/reference product meet predeclared error limits; unit tests validate metadata constants, units, masks, nodata, and scale/offset handling; a domain reviewer signs off on each supported sensor/product adapter.

### Phase 2 — Spatial-pattern lens (P1)

**Implementation**

1. Specify a spatial-weights contract (rook/queen/distance, row standardization, boundary treatment, minimum neighbours) rather than reusing the graph weights implicitly.
2. Compute global Moran’s I with a permutation distribution as a scene/window-level diagnostic.
3. Compute local Moran’s I with a predetermined number of permutations, correction for multiple local tests (e.g., FDR), and a non-significant/insufficient-neighbour state.
4. Generate categorical LISA artifacts and a machine-readable summary: observed I, expected I, permutation p-value, adjusted significance, spatial-weight version, counts by category.
5. Add the “Spatial pattern” lens. Default to significant categories only; offer the full classification in Audit and download.

**Exit gate:** hand-calculated and library-cross-checked fixtures agree; permutation seed/version is recorded; false-discovery treatment is visible; an expert review confirms no wording implies causal hotspots.

### Phase 3 — Thermal regions and graph-method evaluation (P1)

**Implementation**

1. Add optional spectral clustering to the existing weighted graph and a separate modularity/community baseline. Do not change the Cheeger layer’s definition.
2. Choose cluster count through predeclared, inspectable criteria; report sensitivity to `α`, `β`, connectivity, resolution, random seed, and raster scale.
3. Benchmark the existing Fiedler sweep against bounded exact/near-exact cut solvers offline. Use this to quantify approximation/stability, not to replace the product layer by default.
4. Render thermal regions only under an advanced “Regions” lens with a cluster-stability field and no high/low priority rank.

**Exit gate:** region assignments meet a predeclared stability threshold across reasonable parameter perturbations; the method comparison is published in Audit; no user-facing copy presents a cluster boundary as a physical barrier.

### Phase 4 — Time, persistence, and land transition (P2)

**Implementation**

1. Assemble same-season, QA-screened, spatially harmonized scenes with a coverage calendar and per-cell valid-observation count.
2. Ship threshold-exceedance frequency first: count and share of valid scenes above a clearly stated surface-temperature threshold or percentile.
3. Add empirical distribution summaries only after enough comparable observations exist. Add GEV return-level modelling only after a method review establishes sample size, independence/block-maxima rule, diagnostics, and uncertainty treatment.
4. For land transition, produce documented multi-year classifications and transition matrices; show class confidence and date pair.
5. Publish persistence/extreme/transition artifacts as distinct temporal lenses, each with a timeline and coverage warnings.

**Exit gate:** coverage and missingness thresholds pass; GEV diagnostics and intervals pass independently reviewed criteria; transition accuracy and class harmonization are documented.

### Phase 5 — Aggregated exposure context (P3)

**Implementation**

1. Convene a community/data-governance review before choosing vulnerability, demographic, health, or cooling-resource inputs.
2. Implement only small-area aggregates with suppression, licensing, update cadence, and explicit uncertainty. Do not ingest person-level, address-level, or sensitive health data into the public atlas.
3. Use linked views: one panel for thermal condition/persistence and one for population context. The overlap is a **question for outreach**, not a risk score.
4. If conditional/joint statistics are ever offered, make denominators, missing data, geographic unit, and ecological-inference limitation visible in every view.

**Exit gate:** privacy impact assessment, legal/licensing review, community sign-off, equity impact review, and a comprehension test demonstrate that users do not interpret area-level context as individual risk.

## Verification strategy

| Test layer | Required checks |
| --- | --- |
| Unit | Formula constants, units, nodata/QA masks, invalid denominators, raster alignment, graph/spatial-weight construction, deterministic seeds. |
| Known-answer | Published/reference scene calibration examples; toy Moran/LISA matrices; known transition matrices; synthetic extreme series with expected fit diagnostics. |
| Contract | Every publishable layer has manifest/provenance/limitations/download fields; no unavailable layer can be silently rendered. |
| Regression | Fixture hashes and selected map values remain stable unless a versioned method/input change explains the difference. |
| Visual/accessibility | Legend order, colour-blind-safe categorical palette, non-colour encoding, keyboard selection, screen-reader evidence panel, mobile two-layer comparison. |
| Scientific and community | Product-specific remote-sensing review; spatial-statistics review; local ground/operational validation; affected-community interpretation review. |

## Claim and release gates

| Release state | What may be said | What may not be said |
| --- | --- | --- |
| Computationally verified | “The method ran on the documented inputs and passed fixture/contract tests.” | “The layer is accurate for this city” or “the intervention will work.” |
| Reference compared | “Outputs were compared with a stated reference product/dataset under the documented conditions.” | “The model is generally validated” unless study design supports it. |
| Locally externally validated | “The stated metric was evaluated against this local reference/field evidence.” | Any claim outside the measured metric, population, timeframe, or scale. |
| Community/governance approved | “This area-level context is released under the published governance and privacy conditions.” | “This identifies individuals/households at risk.” |

No new layer is default-on in the city Read experience until it has at least **reference-compared** status. A computationally verified layer can appear in Audit or an explicitly labelled preview environment.

## Sequencing, dependencies, and stop conditions

1. Complete Phase 0 before computational work. Without the manifest/readiness contract, the atlas will again mix evidence states.
2. Complete Phase 1 before calling any new product “observed surface heat.” Existing prepared inputs remain valid only under their own provenance records.
3. Complete Phase 2 independently of Phase 3; spatial autocorrelation and graph regions answer different questions and should not be combined by default.
4. Do not begin GEV/heat-wave claims without adequate comparable time coverage. Do not begin exposure context without governance approval.
5. Stop or keep a method in Audit-only status when its required input metadata, QA coverage, validation evidence, or interpretation review is missing.

## First implementation slice (recommended)

Build **Phase 0 plus the Phase 1 LST/QA/NDVI provenance pathway**, then one **Phase 2 LISA preview** using a synthetic fixture and a documented Boston study input. This produces visible map value while proving the layer contract, legends, uncertainty treatment, source lineage, click panel, download, and release gate before the higher-risk time-series and exposure work begins.

The first slice deliberately excludes a composite priority index, person-level exposure, and GEV return periods. Its success criterion is not more coloured polygons; it is that a user can accurately tell the difference between an observed thermal scene, a derived vegetation feature, a statistically significant pattern, and the existing graph-based bottleneck proxy.
