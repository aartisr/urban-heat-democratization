---
title: "The Right to Question the Map: Democratizing Urban Heat Decisions Through Auditable Spatial Graphs"
author: "Aarti Sri Ravikumar"
date: "November 27, 2026"
lang: en-US
keywords: [urban heat, environmental justice, land surface temperature, spectral graph theory, civic decision support]
---

# The Right to Question the Map: Democratizing Urban Heat Decisions Through Auditable Spatial Graphs

**Aarti Sri Ravikumar**  
Independent researcher and creator, Urban Heat Democratization  
ORCID: [0009-0009-9807-5273](https://orcid.org/0009-0009-9807-5273)  
Correspondence: [Urban Heat Democratization](https://urban-heat.ai-aarti.com/)  
Methods and perspective; open working manuscript, not peer reviewed

Version: November 27, 2026; code baseline [`4c073d5`](https://github.com/aartisr/urban-heat-democratization/tree/4c073d5)

## Abstract

Urban heat decisions depend on evidence that residents can inspect and contest. This methods and perspective paper describes Urban Heat Democratization, an open-source workflow that converts prepared land-surface-temperature (LST) and optional vegetation rasters into a declared weighted graph. A spectral sweep identifies candidate weak connections; paths to inferred cool or green cells provide a separate modeled linkage measure. The contribution is the auditable composition of established methods and explicit separation of observed surface conditions, derived graph signals, and planning hypotheses. Boston supplies a bundled study and teaching case, not a validated intervention trial. No output establishes pedestrian heat exposure, safe access, health risk, or cooling caused by a project. We propose comparisons with simpler heat maps, sensitivity checks, local interpretation, and field evaluation. Democratization is a testable aspiration: people affected by heat should be able to question the model and influence how its results are used.

**Keywords:** urban heat; land surface temperature; environmental justice; spectral graph theory; civic decision support

A resident knows that a bus stop is unshaded at 3 p.m. A satellite map shows a warm surface nearby. Neither fact alone settles where public money should go. The purpose of this project is to let residents, researchers, and agencies examine how a heat claim was made, what it omits, and what observation would change it. Urban heat is unequally experienced, and access to analytic capacity is unequal too (Hsu et al., 2021; IPCC, 2022). A public tool should make the evidence discussable without making the map an automatic verdict.

The problem has three scales. A remote sensor describes radiative conditions over a surface footprint and acquisition time. A person experiences conditions along a route, at work, and at home, often at different times. A public agency allocates money through a decision process that may treat a map as objective even when its assumptions are hidden. These scales must be connected through evidence, not collapsed into a single score. A claim about a warm surface may be well supported while a claim about a person's exposure remains unknown. A claim that a planted tree will change temperature requires still another study. This manuscript treats those as distinct questions with different thresholds of proof.

## Contribution and scope

LST products, vegetation indices, spectral partitioning, and shortest-path algorithms precede this work (Shi & Malik, 2000; USGS, n.d.). The proposed advance is their **accountable composition**: show the input scene, the rule that creates graph links, the resulting structural signal, and its limits in one public workflow. A hot pixel, a weak graph boundary, a long modeled path to a cool-looking cell, and a person's ability to reach relief are different things. Keeping them separate makes disagreement visible and permits correction. The social benefit of this design has not yet been established by a controlled community or usability study.

The bundled Boston study includes a boundary and local analytical overlays for inspection. It is not a city-calibrated intervention optimizer or evidence that a particular treatment lowered temperature. Other city presets are onboarding starting points. The [capability record](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/IMPLEMENTATION_STATUS.md) and [Boston guide](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/BOSTON_STUDY_GUIDE.md) state what is available and what remains unvalidated.

The project's civic proposition is testable. Public access to source code is useful, but it does not by itself redistribute decision power. A more demanding standard is whether an affected person can inspect an input, understand why a place was highlighted, record a correction, and receive a documented response from the decision maker. These are measurable behaviors. Until they are observed in a real process, democratization is the design aim rather than a demonstrated outcome. Two scenes can also have identical temperature means and histograms but different spatial arrangements. Their neighbor relations and graph cuts can therefore differ. That mathematical observation motivates evaluating the graph against simpler maps; it does not establish predictive validity.

## Method: an inspectable graph, not a heat-flow model

The active pipeline accepts prepared LST and optional normalized difference vegetation index (NDVI) rasters. It reduces oversized arrays and retains shared finite cells, cropping different-shaped arrays to their common upper-left dimensions. **It does not verify CRS, transform, or pixel alignment between inputs**; co-registration must therefore be checked before use, and a shape match alone is insufficient. It scales each input between its 2nd and 98th percentiles, clips to $[0,1]$, and guards a zero percentile span. That within-scene scaling removes absolute temperature units from the graph calculation. It also means rankings from two dates are not automatically comparable in degrees Celsius. Each valid cell becomes a vertex; 4- or 8-neighbor cells receive a positive link weight:

$$
w_{ij}=\max\{10^{-9},\exp(-\alpha g_{ij})(1+\beta n_{ij})\},
$$

where $g_{ij}$ is a normalized local LST-gradient magnitude and $n_{ij}$ is mean normalized vegetation, omitted when NDVI is unavailable. Defaults $\alpha=3.0$ and $\beta=0.6$ are authored parameters, not fitted physical coefficients. A stronger gradient weakens a modeled link; more vegetation strengthens it. The weight is **not** measured conductivity, air movement, or a walking route ([method audit](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/MATH_INNOVATION_ACCOUNTABILITY.md)).

The gradient is computed from the normalized temperature array and averaged at the two endpoints. Cardinal edges have geometric length one raster cell; diagonal edges have length $\sqrt{2}$. These are relative cell units, not meters. Missing cells are omitted from the vertex set. The run rejects a graph with fewer than two valid vertices or disconnected components before interpreting a unique structural cut. A reproducible release should preserve the original scene, acquisition time, units, masks, resampling history, CRS, affine transform, parameters, and software revision. The present output alone is not a substitute for that provenance.

Let $A$ contain these weights, $D$ their weighted degrees, and $L=D-A$. The symmetric normalized Laplacian $\mathcal L=D^{-1/2}LD^{-1/2}$ yields a second eigenvalue $\lambda_2$ and eigenvector $v_2$ for a connected graph. The code orders cells by $v_2$ and tests prefix cuts, reporting the candidate with lowest weighted conductance:

$$
\phi(S)=\frac{\operatorname{cut}(S,V\setminus S)}{\min\{\operatorname{vol}(S),\operatorname{vol}(V\setminus S)\}}.
$$

This is a reproducible **candidate boundary**, not the global minimum cut, a physical heat trap, or a certified approximation ratio for this exact sweep. The mapped line is enlarged for legibility. The [spectral contract](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/wiki/09-spectral-theory-contract.md) distinguishes the graph theorem from the implementation.

The conductance denominator adjusts for the weighted size of both sides of a cut, so a boundary is not preferred merely because it isolates a tiny set. The implementation sorts the coordinates of the raw second eigenvector of the symmetric normalized Laplacian, checks each prefix, and chooses the smallest observed conductance. The familiar Cheeger relation concerns the graph's best cut under its assumptions; a standard sweep guarantee generally uses degree-adjusted coordinates. Applying that guarantee to this raw-vector ordering would require a separate proof or implementation change. The reported cut value itself remains checkable from the edge list. A methods comparison should test this ordering against a degree-adjusted sweep and exact enumeration on small graphs.

A separate shortest-path calculation uses edge cost $c_{ij}=\ell_{ij}/w_{ij}$ to estimate linkage to pixels inferred as cool or green. Such a pixel is not necessarily a public, open, safe cooling site. A disclosed planning priority can blend relative heat and this linkage proxy, but its weights are policy choices. The robustness lab's seeded edge-removal exercises describe the declared graph under a synthetic failure rule, not the probability that a resident loses access during a heatwave.

When vegetation is available, the pipeline selects cells at or above the scene's 95th percentile of normalized NDVI as sinks. Otherwise it uses cells at or below the 5th percentile of normalized LST. It computes the least-cost graph distance to those sinks and normalizes its negative to a relative score in $[0,1]$, where a larger value means easier **modeled** linkage. On the highlighted boundary, priority is $0.65$ times normalized heat plus $0.35$ times one minus that linkage score. The result is zero outside the boundary mask. Thus a colored priority cell does not mean that a cool destination is reachable on foot or that its numerical value is a temperature, health probability, or expected benefit.

The graph intervention routine strengthens a bounded selection of existing links near the cut or sinks and recomputes graph summaries. It is a counterfactual **within the declared graph**. It does not specify a tree, pavement treatment, engineering design, installation cost, or expected change in air temperature. Separately, the public application's mitigation learning grid uses modeled priority fields to teach placement and comparison. Its visual extent should likewise be read as a scenario illustration, not a Boston forecast. Keeping these products separate avoids treating a mathematical sensitivity exercise as an intervention result.

## What the system demonstrates—and does not

The software can produce Boston study overlays, expose source context, and reproduce graph calculations for fixed inputs. Scenario costs and benefits are exploratory benchmarks. Its synthetic learning grid is not a Boston temperature forecast. Historical repository prose contains precise cross-city effects and hospital associations without a traceable study package; this paper does not reproduce them as findings. Computational repeatability is not external validity, measured cooling, or causal evidence.

Satellite LST describes radiative surface conditions at an acquisition time. It does not measure pedestrian-height air temperature, indoor heat, a person's exposure, or the shade schedule of a route (EPA, n.d.). Raster adjacency omits ownership, crossings, fences, building form, and many lived barriers. Scene choice, masks, spatial support, and graph parameters may change a highlighted boundary. Area-level social indicators can add context but cannot diagnose an individual. These limits belong beside every map, not in fine print.

There are threats inside the model as well. Resampling and coarse pixel support can move local gradients. A mask can remove links or disconnect the graph. Percentile normalization changes when the scene's spatial extent changes, even if a particular pixel does not. NDVI is a vegetation proxy, not a measure of shade at a specified hour. Default parameters and priority coefficients were chosen by the project, not estimated from intervention outcomes. A graph boundary may respond strongly to a single narrow connection or to a change from four to eight neighbors. These are reasons to publish sensitivity maps and uncertainty explanations alongside a selected result. They define what the result can responsibly mean.

## A testable route to public value

First, compare graph-derived candidates with an LST-only map and an LST-plus-vegetation map on the same scenes and grid. Prespecify candidate-selection rules and locally relevant outcomes. Vary $\alpha$, $\beta$, adjacency, sink thresholds, and source dates; publish the resulting maps and boundary overlap. If the graph signal is unstable or adds no decision-relevant information, narrow the claim. Test whether residents and practitioners can explain a highlighted place, spot an unsupported inference, and submit a correction that is recorded and considered. Open code alone is not evidence of democratized decisions.

A fair comparison must hold the source observations, mask, geography, and review effort constant. Reviewers should be unaware of the method that nominated a candidate whenever practical. Useful outcomes might include whether an independent field visit finds a specific, actionable shade or access problem, the fraction of nominated sites requiring follow-up, and time needed to reach a documented decision. Define these before seeing the candidate maps. Report counts, uncertainty, and places where methods disagree, not only an aggregate score. A graph layer that changes attention but does not improve a decision-relevant outcome should be described as an alternative visualization, not a validated advance.

The unit of evaluation matters. Counting many adjacent raster cells as independent successes would exaggerate precision because neighboring cells share the same scene and local conditions. Candidate sites or street segments should be grouped before sampling, and a review protocol should explain how duplicates, inaccessible parcels, and ambiguous findings are handled. Independent reviewers should record their observations without being asked to confirm the algorithm's ranking. If a dataset spans different dates or sensors, analysis should stratify or adjust for those differences rather than pooling them as though they were interchangeable. Report the number of eligible, excluded, inspected, and confirmed sites so that a favorable precision figure cannot hide selective follow-up.

For each defensible source and parameter setting, compare selected boundary cells on a common valid grid. Jaccard overlap, the intersection divided by the union, is one transparent stability measure. Show the maps too: high overlap under tested settings says only that the algorithm is stable to those changes, while low overlap identifies a question for investigation. Sweeps should include edge sensitivities, neighbor choice, sink percentile, scene date, normalization extent, and treatment of missing cells. Small-graph exact-cut checks can identify whether the spectral ordering misses a much lower-conductance cut. None of these internal checks proves that a graph cut corresponds to experienced heat.

For usability and civic value, compare a guided explanation with a plain heat map among residents, practitioners, and readers unfamiliar with spectral graphs. Ask participants to explain what a highlighted boundary means and does not mean; present an inaccessible cool-looking site and see whether they flag it; measure whether submitted corrections appear in the decision record. Report results by participant group and accessibility needs. The system should fail this test if it encourages unwarranted certainty or if corrections disappear into an untracked channel. No such controlled evaluation is claimed here.

The evaluation should also ask whether the interface makes unsupported claims *less* likely. A useful comprehension test presents statements about surface temperature, walking access, health risk, and expected cooling, then asks which statements the map actually supports. A correction test should measure not just submission, but whether the issue receives a response, whether a source or assumption is updated, and whether a changed decision is explained. Participants should be able to use the tool without knowing graph theory; the method details remain available for those who want to audit them. This is a stronger definition of usability than visual appeal alone.

For a real intervention, register the site, installation date, outcome, comparison areas, and analysis before measuring post-installation change. Match the measurement to the claim: surface temperature for a surface claim; pedestrian-height conditions for an experienced-heat claim; valid health records for a health claim. Account for weather, pre-trends, sensor error, and spillovers. The [impact evidence protocol](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/IMPACT_EVIDENCE_PROTOCOL.md) describes this stronger threshold. No qualifying intervention outcome is reported here.

A practical design would collect comparable measurements before and after installation at both treated and credible comparison sites. Record season, time of day, cloud conditions, sensor placement, humidity, maintenance, and nearby changes. A difference between post-installation means is only an observation. An effect estimate needs assumptions about what would have happened without the intervention, checks on prior trends and spillovers, and an uncertainty interval. If the outcome is pedestrian comfort, a satellite-only surface series is inadequate. If the outcome is a health event, data governance and appropriate epidemiological expertise are necessary. The analysis should publish null and adverse findings as readily as favorable ones.

A community group could use the atlas to ask why a route was highlighted, then document shade, crossings, access, and the times people actually travel. If a mapped cool place is locked, that observation changes the interpretation. The group can bring the map and field notes to an agency and ask for a recorded response. This is a proposed civic workflow, not a claim that a partner has endorsed the current model. Personal or health information should not be posted in public issues.

The people who know a place may identify a mistaken source date, a blocked route, a vulnerable service location, or a priority that the map misses. A useful workflow preserves each correction with its evidence, asks who can resolve it, and shows whether the analysis or decision changed. Community participation should be accessible and appropriately compensated when used as research or planning input. The project should minimize personal data and avoid publishing precise information that exposes a resident's health or household circumstances. These governance choices are part of validity: a tool that cannot hear corrections cannot claim to democratize the decision merely because its code is open.

## Conclusion

The project makes a spatial question inspectable: *where is this declared thermal-landscape graph weakly connected?* It does not answer who is safe or which intervention will work. Its promise depends on whether the signal improves investigation beyond simpler maps, remains stable under defensible assumptions, and can be corrected by people who know the place. Public value will be earned through those tests and through measured outcomes after real action.

## Declarations and availability

Aarti Sri Ravikumar is credited as creator and lead author in the repository. Funding and competing-interest declarations require author confirmation before journal submission. This paper reports no human-participant study. The [source code](https://github.com/aartisr/urban-heat-democratization), [data guide](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/data/README.md), and [method audit](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/MATH_INNOVATION_ACCOUNTABILITY.md) describe available artifacts. A durable DOI, complete input hashes, independent validation, and community review remain future release work.

## References

Hsu, A., Sheriff, G., Chakraborty, T., & Manya, D. (2021). Disproportionate exposure to urban heat island intensity across major U.S. cities. *Nature Communications, 12*, Article 2721. https://doi.org/10.1038/s41467-021-22799-5

Intergovernmental Panel on Climate Change. (2022). Chapter 6: Cities, settlements and key infrastructure. In *Climate change 2022: Impacts, adaptation and vulnerability*. https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/

Shi, J., & Malik, J. (2000). Normalized cuts and image segmentation. *IEEE Transactions on Pattern Analysis and Machine Intelligence, 22*(8), 888–905. https://doi.org/10.1109/34.868688

U.S. Environmental Protection Agency. (n.d.). *Measuring heat islands*. https://www.epa.gov/heatislands/measuring-heat-islands

U.S. Geological Survey. (n.d.). *Landsat Collection 2 surface temperature*. https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-temperature
