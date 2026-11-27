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

## Contribution and scope

LST products, vegetation indices, spectral partitioning, and shortest-path algorithms precede this work (Shi & Malik, 2000; USGS, n.d.). The proposed advance is their **accountable composition**: show the input scene, the rule that creates graph links, the resulting structural signal, and its limits in one public workflow. A hot pixel, a weak graph boundary, a long modeled path to a cool-looking cell, and a person's ability to reach relief are different things. Keeping them separate makes disagreement visible and permits correction. The social benefit of this design has not yet been established by a controlled community or usability study.

The bundled Boston study includes a boundary and local analytical overlays for inspection. It is not a city-calibrated intervention optimizer or evidence that a particular treatment lowered temperature. Other city presets are onboarding starting points. The [capability record](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/IMPLEMENTATION_STATUS.md) and [Boston guide](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/BOSTON_STUDY_GUIDE.md) state what is available and what remains unvalidated.

## Method: an inspectable graph, not a heat-flow model

The active pipeline accepts prepared LST and optional aligned normalized difference vegetation index (NDVI) rasters. It retains shared valid cells and scales each input between its 2nd and 98th percentiles. That within-scene scaling removes absolute temperature units from the graph calculation. Each valid cell becomes a vertex; 4- or 8-neighbor cells receive a positive link weight:

$$
w_{ij}=\max\{10^{-9},\exp(-\alpha g_{ij})(1+\beta n_{ij})\},
$$

where $g_{ij}$ is a normalized local LST-gradient magnitude and $n_{ij}$ is mean normalized vegetation, omitted when NDVI is unavailable. Defaults $\alpha=3.0$ and $\beta=0.6$ are authored parameters, not fitted physical coefficients. A stronger gradient weakens a modeled link; more vegetation strengthens it. The weight is **not** measured conductivity, air movement, or a walking route ([method audit](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/MATH_INNOVATION_ACCOUNTABILITY.md)).

Let $A$ contain these weights, $D$ their weighted degrees, and $L=D-A$. The symmetric normalized Laplacian $\mathcal L=D^{-1/2}LD^{-1/2}$ yields a second eigenvalue $\lambda_2$ and eigenvector $v_2$ for a connected graph. The code orders cells by $v_2$ and tests prefix cuts, reporting the candidate with lowest weighted conductance:

$$
\phi(S)=\frac{\operatorname{cut}(S,V\setminus S)}{\min\{\operatorname{vol}(S),\operatorname{vol}(V\setminus S)\}}.
$$

This is a reproducible **candidate boundary**, not the global minimum cut, a physical heat trap, or a certified approximation ratio for this exact sweep. The mapped line is enlarged for legibility. The [spectral contract](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/wiki/09-spectral-theory-contract.md) distinguishes the graph theorem from the implementation.

A separate shortest-path calculation uses edge cost $c_{ij}=\ell_{ij}/w_{ij}$ to estimate linkage to pixels inferred as cool or green. Such a pixel is not necessarily a public, open, safe cooling site. A disclosed planning priority can blend relative heat and this linkage proxy, but its weights are policy choices. The robustness lab's seeded edge-removal exercises describe the declared graph under a synthetic failure rule, not the probability that a resident loses access during a heatwave.

## What the system demonstrates—and does not

The software can produce Boston study overlays, expose source context, and reproduce graph calculations for fixed inputs. Scenario costs and benefits are exploratory benchmarks. Its synthetic learning grid is not a Boston temperature forecast. Historical repository prose contains precise cross-city effects and hospital associations without a traceable study package; this paper does not reproduce them as findings. Computational repeatability is not external validity, measured cooling, or causal evidence.

Satellite LST describes radiative surface conditions at an acquisition time. It does not measure pedestrian-height air temperature, indoor heat, a person's exposure, or the shade schedule of a route (EPA, n.d.). Raster adjacency omits ownership, crossings, fences, building form, and many lived barriers. Scene choice, masks, spatial support, and graph parameters may change a highlighted boundary. Area-level social indicators can add context but cannot diagnose an individual. These limits belong beside every map, not in fine print.

## A testable route to public value

First, compare graph-derived candidates with an LST-only map and an LST-plus-vegetation map on the same scenes and grid. Prespecify candidate-selection rules and locally relevant outcomes. Vary $\alpha$, $\beta$, adjacency, sink thresholds, and source dates; publish the resulting maps and boundary overlap. If the graph signal is unstable or adds no decision-relevant information, narrow the claim. Test whether residents and practitioners can explain a highlighted place, spot an unsupported inference, and submit a correction that is recorded and considered. Open code alone is not evidence of democratized decisions.

For a real intervention, register the site, installation date, outcome, comparison areas, and analysis before measuring post-installation change. Match the measurement to the claim: surface temperature for a surface claim; pedestrian-height conditions for an experienced-heat claim; valid health records for a health claim. Account for weather, pre-trends, sensor error, and spillovers. The [impact evidence protocol](https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/IMPACT_EVIDENCE_PROTOCOL.md) describes this stronger threshold. No qualifying intervention outcome is reported here.

A community group could use the atlas to ask why a route was highlighted, then document shade, crossings, access, and the times people actually travel. If a mapped cool place is locked, that observation changes the interpretation. The group can bring the map and field notes to an agency and ask for a recorded response. This is a proposed civic workflow, not a claim that a partner has endorsed the current model. Personal or health information should not be posted in public issues.

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
