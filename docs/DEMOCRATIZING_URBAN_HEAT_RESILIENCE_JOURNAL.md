---
title: "The Right to Question the Map: Democratizing Urban Heat Decisions Through Auditable Spatial Graphs"
author: "Aarti Sri Ravikumar"
date: "November 27, 2026"
lang: en-US
keywords:
  - urban heat
  - environmental justice
  - land surface temperature
  - spectral graph theory
  - open science
  - civic decision support
---

# The Right to Question the Map: Democratizing Urban Heat Decisions Through Auditable Spatial Graphs

**Aarti Sri Ravikumar**  
Independent researcher and creator, Urban Heat Democratization  
ORCID: [0009-0009-9807-5273](https://orcid.org/0009-0009-9807-5273)  
Correspondence: [Urban Heat Democratization](https://urban-heat.ai-aarti.com/)  
Manuscript type: Methods and perspective; open working manuscript, not peer reviewed  
Version: November 27, 2026; repository baseline [`4c073d5`](https://github.com/aartisr/urban-heat-democratization/tree/4c073d5)

## Abstract

Urban heat is lived at the scale of a bus stop, a walk home, and a night without relief, yet the evidence used to allocate protection is often coarse, technically inaccessible, or presented as a finished verdict. This methods and perspective article introduces Urban Heat Democratization, an open-source framework that turns prepared land-surface-temperature and optional vegetation rasters into an inspectable weighted graph. A normalized Laplacian and Fiedler sweep locate candidate weak connections; least-cost paths to inferred cool or green cells describe a distinct linkage proxy; and seeded percolation experiments test structural fragility. Its distinct contribution is the separation of surface intensity, modeled network structure, and cooling-linkage proxies within an auditable claim chain. Each output carries assumptions, intermediate quantities, and an evidence boundary that a community can challenge. We derive the active calculations, distinguish them from proposed Gaussian Markov random field inference, and specify tests against simpler maps and a path from planning hypotheses to measured and causal evidence. Boston is a bundled study and teaching case, not a validated intervention trial. The framework does not equate graph connectivity with physical heat transport, safe access, health risk, or cooling caused by a project. The scientific and civic proposition is that people affected by heat should be able to inspect, dispute, and improve the reasoning that informs public action.

**Keywords:** urban heat; land surface temperature; environmental justice; spectral graph theory; reproducibility; public-interest technology

Picture a neighborhood meeting about a summer heat budget. A resident knows which bus stop has no shade at 3 p.m. An agency brings a satellite map. An engineer brings a model. Each knows something the others may miss. If the map cannot be questioned, the resident can speak only after the important choices have been made. My reason for building Urban Heat Democratization is simple: people who live with heat deserve to see how a technical claim was made, where it is weak, and what observation would change it. This is the purpose of the work, not a claim that any community has endorsed the current model.

Urban heat is a physical and civic problem. Climate change and urban development interact with differences in exposure and vulnerability, and those differences are not resolved by one metropolitan average (Intergovernmental Panel on Climate Change [IPCC], 2022). A map of hot surfaces can help identify patterns, but it cannot by itself describe the air a person breathes, the shade along a route, housing conditions, or the ability to enter a safe cooling space (U.S. Environmental Protection Agency [EPA], n.d.). A public heat tool should make local questions easier to ask while refusing to turn a proxy into a promise.

The project's purpose is to make a difficult chain of reasoning available to residents, educators, researchers, and public agencies: **What was observed? What was inferred? Which assumptions created this boundary or ranking? What evidence would justify action?** The platform becomes useful when those questions produce a shared, auditable record. The ethical standard is demanding: a model may help direct attention, but people retain the authority to interpret their place and to challenge a proposed action.

## The Public Problem and the Scientific Claim

The first deficit is observational. Satellite land surface temperature (LST) measures radiative surface conditions at a particular time; it is not pedestrian-height air temperature or a measure of human heat dose. Landsat 8/9 thermal bands have a native ground resolution of 100 m, although distributed products are resampled to 30 m (U.S. Geological Survey [USGS], n.d.-a). ECOSTRESS Level-2 LST is approximately 70 m (NASA Jet Propulsion Laboratory [JPL], 2019). A sharper displayed map does not create independently observed street-level thermal detail.

The second deficit is interpretive. A warm pixel alone cannot tell a community whether a modeled thermal landscape is fragmented, whether a cool-looking area is reachable, or whether a proposed intervention will work. The framework adds a structural question: **Given a declared rule for turning neighboring raster cells into weighted links, where is that particular graph weakly connected?** This is a mathematically answerable question. It is not identical to physical heat flow, wind transport, safe walking access, or health burden.

The third deficit is institutional. A technically polished score can obscure its source, formula, and limits. Here, the graph construction, spectral cut, sink rule, priority blend, and scenario assumptions are separately inspectable. The intended civic benefit is better scrutiny and more accountable prioritization, with local observation and community knowledge retained as necessary evidence (Ravikumar, 2026a, 2026b).

The innovation is a *chain of evidence*, not an invented equation. Remote sensing describes a surface pattern; graph theory describes connections in a chosen network; an equity review asks who is affected and who can challenge the interpretation. The framework joins these questions while keeping their answers distinct. A public result should say **what data support it, how it was calculated, what it can mean, and how someone can correct it**. Mathematical sophistication serves people only when those answers remain visible.

## The Innovation and Its Testable Boundary

### What Is Established, and What Is New Here

Satellite LST products, NDVI, spectral partitioning, shortest-path algorithms, and participatory heat mapping all precede this project. The inequitable distribution of surface urban heat exposure has also been documented across U.S. cities (Hsu et al., 2021), and normalized graph cuts are an established technique (Shi & Malik, 2000). Claiming invention of any of these would weaken the paper. The distinctive proposal is their *accountable composition for a public heat decision*: a source raster becomes a declared graph; that graph yields a candidate structural break and a separate sink-linkage measure; a user can inspect each transform, alter defensible assumptions, and see exactly which conclusions remain planning hypotheses. The result is a research object with an explicit route from computation to correction, not a colored map whose authority is implied by its complexity.

The distinction between *how hot* and *how heat is arranged* is mathematically substantive. Two maps can contain exactly the same temperature values and have the same citywide average, yet place their hot cells in different locations. If that rearrangement changes which cells neighbor one another, it can change the weight matrix $W$, its eigenstructure, and the candidate cut. A city average or histogram cannot recover that spatial arrangement. This proves that the graph can carry *different information* from a hotspot summary. It does not prove that the new information predicts a person's experience or improves a decision; those claims require independent tests.

### Four Contributions That Can Be Audited

**A structural representation.** The edge formula makes the thermal-gradient and vegetation assumptions explicit. Its outputs answer where the declared raster network has weak modeled connections. A code reviewer can reproduce $W$, $\lambda_2$, and the sweep cut from pinned inputs. This is an implementation contribution, not a new graph theorem.

**Noninterchangeable evidence layers.** A high-LST cell, a low-conductance boundary, a long modeled path to an inferred sink, and a socially vulnerable census tract are not equivalent. Keeping them separate allows agreement to strengthen an investigation and disagreement to identify what must be checked on the ground. A single composite risk score would make those disagreements harder to see. The paper's priority blend is therefore disclosed as a policy option, not promoted to an empirical truth.

**An evidence-status contract.** The repository distinguishes a computational result, an interpretive hypothesis, an observed change, and a causal effect. Each step requires additional evidence. This prevents a perfectly reproducible calculation from being mistaken for a validated city outcome. The contract is operational: source metadata, parameter choices, software revision, exported artifacts, and claim limitations can be checked together (Ravikumar, 2026a, 2026b, 2026d).

**A route for community correction.** A resident can identify an inaccessible park, missing shade, a dangerous crossing, or an atypical time of day; a researcher can vary the graph or sensor assumptions; an agency can record why it acted. The framework's promise is that these challenges can change the question or the output. That promise has not yet been established by a controlled usability or governance study, so it is a design hypothesis rather than a claimed social outcome.

### What Would Refute the Innovation Claim

The strongest test is a *preregistered* comparison: record the question, outcome, and scoring rules before seeing the results. Compare this method with simpler, credible baselines: an LST-only hotspot map and an LST-plus-vegetation priority map built from the same source scenes and spatial support. Hold the underlying observations fixed. Ask independent local reviewers to identify candidate sites where field investigation reveals a consequential shade, access, or thermal-pattern issue; record precision, recall, and calibration of any ranked candidate set.

Separately test whether residents and practitioners can correctly explain why a place was highlighted, identify unsupported claims, and submit a correction that is traceably considered. Prespecify time, comprehension, and correction measures before exposure to the interfaces. Report subgroup performance and disagreements, not only an average score. If the graph layer fails to add decision-relevant information, proves unstable under plausible parameters, or makes the explanation harder to understand, the claimed advance must be narrowed. If the participatory workflow does not change decisions or accountability, it should not be called democratization merely because the code is public.

Robustness is part of that comparison. For candidate boundary sets $B(\theta_a)$ and $B(\theta_b)$ generated under two defensible source-and-parameter configurations, report their spatial Jaccard overlap,

$$
J_{ab}=\frac{|B(\theta_a)\cap B(\theta_b)|}{|B(\theta_a)\cup B(\theta_b)|},
$$

on a common valid grid, together with the actual maps and reasons for disagreement. Here 1 means the two boundary sets coincide and 0 means they do not overlap. A high score indicates stability to the *tested* changes, not truth; a low score is a reason to investigate before ranking places. The evaluation should also compare the degree-adjusted spectral sweep with the current raw-eigenvector sweep and small-graph exact cuts. These are proposed validation analyses, not results already reported for Boston.

## Method

### Evidence Objects and Scale

The implemented pipeline accepts prepared LST rasters and optional aligned normalized difference vegetation index (NDVI) data, retaining finite shared cells. Source scenes, acquisition times, calibration, cloud masks, emissivity, coordinate reference system, and spatial resolution must travel with a released artifact. The project bundles Boston boundaries, prepared thermal arrays, and derived overlays; these are suitable for inspection and teaching under their stated provenance, not an independently replicated estimate of every Boston street (Ravikumar, 2026a, 2026c).

For Landsat Collection 2 Level-2 surface temperature, the published scale conversion is

$$
T_{\mathrm{K}} = 0.00341802\,\mathrm{DN}+149.0,\qquad T_{\mathrm{C}}=T_{\mathrm{K}}-273.15.
$$

The scale factors apply to the specified USGS product; they are not interchangeable with raw radiance or another sensor's calibration (USGS, n.d.-b). If red and near-infrared reflectance are comparably calibrated and co-registered, vegetation can be summarized by

$$
\mathrm{NDVI}=\frac{\rho_{\mathrm{NIR}}-\rho_{\mathrm{red}}}{\rho_{\mathrm{NIR}}+\rho_{\mathrm{red}}},
$$

where a near-zero denominator must be masked. The repository includes radiometric and emissivity routines as *framework-ready* methods; it does not run a new raw-satellite calibration or a validated sub-15 m downscaling step for its current Boston result (Ravikumar, 2026d). This distinction corrects expansive descriptions in older archive prose that treat proposed radiometric fusion as a completed empirical finding.

### From a Raster to a Declared Graph

Let valid cells be vertices $V$ and 4- or 8-neighbor adjacency be $E$. The implementation robustly scales each finite input raster using its 2nd and 98th percentiles:

$$
z_i=\operatorname{clip}\!\left(\frac{x_i-P_2(x)}{P_{98}(x)-P_2(x)},0,1\right).
$$

The denominator is guarded against degeneracy. This transformation enables relative within-scene comparison but removes absolute °C units from subsequent graph weights. With local normalized LST-gradient magnitude $g_{ij}$ and mean normalized vegetation $n_{ij}$, the current edge rule is

$$
w_{ij}=\max\{10^{-9},\exp(-\alpha g_{ij})(1+\beta n_{ij})\},
\quad\alpha,\beta\geq 0.
$$

In everyday terms, each valid map cell becomes a point, and neighboring points receive a link. Under this chosen rule, a sharper temperature change weakens the link and more vegetation strengthens it. The map of links lets us ask where the *model* has a narrow connection. It does not show heat moving between those cells.

When NDVI is absent, its multiplier is omitted. The default pipeline parameters are $\alpha=3.0$ and $\beta=0.6$; they are authored sensitivities, not fitted physical coefficients. Cardinal edges have length $\ell_{ij}=1$ and diagonal edges $\ell_{ij}=\sqrt{2}$ in raster-cell units, giving shortest-path cost $c_{ij}=\ell_{ij}/w_{ij}$. Consequently, $w_{ij}$ is an explicitly constructed *linkage proxy*. It is not thermal conductivity, a measured energy flux, or proof of a walkable corridor (`core/graph.py`; Ravikumar, 2026d).

Let $A_{ij}=w_{ij}$ for edges and zero otherwise, $d_i=\sum_j A_{ij}$, and $D=\operatorname{diag}(d_i)$. The combinatorial and symmetric normalized Laplacians are

$$
L=D-A,\qquad \mathcal L=D^{-1/2}LD^{-1/2}=I-D^{-1/2}AD^{-1/2}.
$$

For isolated vertices the implementation uses zero inverse degree; the production analysis rejects disconnected graphs before interpreting a unique bottleneck. For a connected nonnegative graph, $0=\lambda_1<\lambda_2\leq\cdots$ and $\mathcal L v_2=\lambda_2v_2$. The second eigenpair describes structural connectivity in the *defined graph* (`core/spectra.py`).

The algebra explains why this object is suitable for a structural question. For any real vector $q$,

$$
q^{\top}Lq=\sum_{(i,j)\in E}w_{ij}(q_i-q_j)^2\geq 0.
$$

Thus $L$ is positive semidefinite and the constant vector has eigenvalue zero. A second zero eigenvalue signals disconnection; a positive $\lambda_2$ for a connected graph measures separation from that disconnected state. This is a theorem about graph structure, not a thermodynamic law. Rescaling or changing the edge rule changes the mathematical object being studied.

A reader need not calculate an eigenvector to understand the question. If two large parts of the chosen graph are joined mainly through weak links, the graph is easier to separate. The second eigenvalue helps reveal that structure. It cannot tell us whether a child can walk safely through the area or whether a tree will lower air temperature there.

### Candidate Bottlenecks and the Cheeger Bound

For $S\subset V$, define weighted volume and conductance as

$$
\operatorname{vol}(S)=\sum_{i\in S}d_i,\quad
\operatorname{cut}(S,\bar S)=\sum_{i\in S,j\in\bar S}w_{ij},\quad
\phi(S)=\frac{\operatorname{cut}(S,\bar S)}{\min\{\operatorname{vol}(S),\operatorname{vol}(\bar S)\}}.
$$

The graph's Cheeger constant is $h_G=\min_{S\ne\varnothing,V}\phi(S)$. For the normalized Laplacian under the usual connected-graph conditions,

$$
\frac{\lambda_2}{2}\leq h_G\leq\sqrt{2\lambda_2}.
$$

This theorem relates a global optimum to an eigenvalue; it does **not** say that the implementation computes the global optimum. The code sorts cells by their Fiedler-vector coordinates, evaluates every prefix cut in that ordering, and returns the lowest conductance among those candidates. A sweep is tractable, reproducible, and explainable, but a different cut outside that ordering may be better. The mapped boundary is enlarged for visibility, so its visual thickness is not a measured zone of influence (`core/spectra.py`; Ravikumar, 2026e). Spectral partitioning follows established graph methods rather than a novel theorem (Shi & Malik, 2000).

The classical Cheeger sweep guarantee is usually stated for a degree-adjusted normalized eigenvector or an equivalent random-walk formulation. The current implementation orders the raw symmetric-normalized eigenvector coordinates. Accordingly, the theorem above bounds the graph's optimum $h_G$; it must **not** be advertised as a certified approximation ratio for this exact code path. The returned cut is a reproducible candidate whose observed $\phi(S)$ can be checked directly. A future implementation should compare the degree-adjusted sweep and, on small graphs, exact enumeration as a diagnostic. This distinction matters because a public map should disclose where a familiar theorem stops supporting an implementation.

### Cooling-Linkage and Priority Proxies

The current pipeline marks some cells as possible cooling sources because they appear green or relatively cool in the input. It then calculates the cheapest path through the *modeled links* from every other cell to one of those sources. A longer modeled path suggests weaker linkage. A green or cool pixel, however, is not necessarily a public park, shelter, accessible route, or safe refuge. A local resident who knows that a mapped green space is fenced off has found a real limitation of the model, not an exception to be ignored.

On candidate bottleneck cells, the planning priority combines normalized heat and low modeled access:

$$
P_i=100\left(0.65H_i+0.35(1-A_i)\right),\qquad H_i,A_i\in[0,1].
$$

The weights are explicit policy choices. They should be varied in sensitivity analysis and reviewed with affected communities before a funding decision. CDC/ATSDR's Social Vulnerability Index can add *area-level context* when version, geography, temporal alignment, and ecological limits are recorded; it is not a person's risk score, and multiplying it by LST does not create a validated health model (Agency for Toxic Substances and Disease Registry [ATSDR], 2024). The current graph pipeline does not depend on a validated person-level SVI outcome.

This blend is also easy to challenge quantitatively. Holding the 0.65/0.35 weights fixed, two plausible input versions obey

$$
|\Delta P_i|\leq 100\left(0.65|\Delta H_i|+0.35|\Delta A_i|\right).
$$

That bound does not validate the weights, but it makes the consequence of input uncertainty explicit. Policy sensitivity requires a separate sweep over weight choices, source dates, sink thresholds, and graph topology; a ranking that changes sharply should not be presented as robust.

### Stress Tests, Scenarios, and Research Extensions

The robustness lab forms random subgraphs by retaining each edge independently with probability $p$. For each draw $G_p$, it computes the largest-component fraction $|C_{\max}(G_p)|/|V|$. Given inferred sinks $K$ and $M$ trials, sink reliability is estimated by

$$
\widehat R_K(p)=\frac{1}{M}\sum_{m=1}^{M}\frac{1}{|V|}
\sum_{i\in V}\mathbf 1\{i\leftrightarrow K\text{ in }G_p^{(m)}\}.
$$

In plain language, this stress test asks: if some modeled links disappear at random, how much of the modeled network still connects to a possible cool area? Fixed seeds make the calculation repeatable. Independent edge deletion is a teaching stress model, not a heatwave probability, public infrastructure failure model, or probability that a resident can reach cooling. A single seeded draw at each $p$ in the percolation scan is illustrative; precision requires repeated trials and uncertainty reporting (`core/percolation.py`; `core/reliability.py`).

Because each trial's reached-node share lies in $[0,1]$, independent repetitions permit the distribution-free Monte Carlo bound

$$
\Pr\!\left(|\widehat R_K-R_K|\geq\epsilon\right)\leq 2\exp(-2M\epsilon^2).
$$

This controls *simulation error under the specified graph and independent-edge model*. It does not account for source-data error, parameter uncertainty, correlated disruption, or whether the graph resembles real access. Reporting the bound without that distinction would create a false appearance of certainty.

The bounded graph intervention multiplies selected edge weights by 1.5 and divides their path costs by 1.5. This asks how the *same model* responds to stronger declared links. It does not specify trees, pavement materials, capital costs, or °C of cooling. Separate scenario budget selection uses explicit ranking-derived utility and cost constraints; the result is a planning ledger, not a climate-benefit optimizer (Ravikumar, 2026d).

A Gaussian Markov random field (GMRF) could become a calibrated future data-assimilation layer. One illustrative prior has precision $Q_0=\tau L+\epsilon I$, and Gaussian observations $y=Hx+\eta$ with covariance $R$ yield

$$
Q_{\mathrm{post}}=Q_0+H^\top R^{-1}H,\qquad
\mu_{\mathrm{post}}=Q_{\mathrm{post}}^{-1}(Q_0\mu_0+H^\top R^{-1}y).
$$

In simpler terms, this future model could combine noisy observations while showing how uncertain the estimate remains. The equation is a standard sparse-inference formulation (Rue & Held, 2005), **not** a currently published Boston posterior. A valid release would need sensor error, geolocation, support/scale matching, held-out validation, and calibrated uncertainty. The same release gate applies to advanced spatial autocorrelation, extreme-value, and exposure models that are implemented or described as extensions but are not established public city findings (Ravikumar, 2026d).

## Results: What the Present System Demonstrates

What can a reader actually see today? The software provides a prepared Boston study boundary, a map of candidate weak graph connections, and a separate map of weaker modeled links to cool or green cells. Code tests check graph calculations and repeatability for fixed inputs and seeds. A clearly labeled synthetic nine-node exercise lets people explore robustness without mistaking it for a Boston measurement. Scenario comparisons and exports preserve the assumptions behind a result (Ravikumar, 2026a, 2026c). These are auditable analytical capabilities, not measured cooling effects.

| Evidence state | What can be said now | Evidence required for a stronger statement |
|:--|:--|:--|
| Computational | A defined raster graph has a given $\lambda_2$, sweep cut, and path-cost field. | Reproduce with pinned inputs, code, parameters, CRS, masks, and artifact hashes. |
| Interpretive | Candidate boundaries and sink-linkage patterns warrant local inspection. | Compare with shade timing, air temperature, routes, land ownership, and resident knowledge. |
| Observational | A monitored place changed after an intervention. | Comparable before/after observations with season, time, sensor, and weather controls. |
| Causal | An intervention changed a prespecified outcome relative to a credible counterfactual. | Registered design, controls, pre-trends, spillover checks, uncertainty, and robustness tests. |

The older publications archive includes precise cross-city temperatures, correlations, intervention multipliers, and hospital associations without a traceable study package in these repositories. They are **not reproduced here as findings**. The current software and documentation support the computational and planning claims above; they do not support those unverified empirical magnitudes. This is a substantive scientific distinction, not an editorial qualification.

## Discussion

### Why This Mathematics Can Democratize a Decision

Democratization has four testable parts. **Access** means the public can open the data description, code, equations, and resulting artifacts. **Legibility** means each number has a plain-language question and a stated unit or lack of unit. **Contestability** means a resident or researcher can change defensible assumptions, point to missing shade or access information, and see whether the result survives. **Accountability** means a decision maker records which evidence and local testimony informed an action, and later measures what happened. A model that performs only the first part is open software; it is not yet an accountable public process.

The spatial-graph approach adds a useful perspective to heat maps. High LST asks *where surfaces were hot in a scene?* The sweep cut asks *where a declared spatial linkage network can be separated by relatively weak connections?* Sink paths ask *where does this network have weak modeled linkage to cool-like cells?* These are different quantities and should remain separate. Their combination can guide site visits and candidate discussions without pretending to settle whether a person is safe or where a tree will produce a quantified benefit.

### A Community Conversation, Not an Automated Verdict

Consider a group concerned about an unshaded route to a bus stop. They could begin with the Boston atlas and ask when the satellite scene was recorded, what area each thermal pixel represents, and whether the route crosses a candidate weak connection. They could then walk the route at relevant times, note shade, crossings, barriers, and available refuges, and ask people who use it what the map misses. If a supposedly cool destination is locked, unsafe, or closed when needed, that observation should change the interpretation. The group could bring the map, the field notes, and the model's assumptions to a public meeting and ask an agency to record its response. This is an example of a responsible workflow, not a claim that the platform has already completed that partnership or produced an intervention outcome.

Care is part of the method. People may be dealing with disability, medication, caregiving, work schedules, housing costs, or a lack of safe alternatives. None of those facts is contained in a thermal pixel. A technically excellent map that cannot make room for them is incomplete for public decision-making. The task is to let formal evidence and lived evidence correct one another without pretending they measure the same thing.

### Limits and Threats to Validity

The largest physical limitation is scale and construct validity. Satellite LST may miss the temporal and human-scale conditions that dominate lived heat exposure. Raster adjacency ignores blocked routes, ownership, wind, building form, shade schedule, and air movement. Thermal gradients are not measured flux; NDVI is not canopy shade at a pedestrian's time and place. Input date, cloud mask, calibration, spatial support, and missing cells may move a candidate boundary. Changing $\alpha$, $\beta$, neighborhood topology, sink threshold, or priority weights may change a ranking. The model therefore requires sensitivity maps and local ground truth before operational targeting.

The largest equity limitation is that area-level demographic indicators can erase variation within a tract. SVI is valuable for contextualizing where support may be needed (ATSDR, 2024), but community partnership must determine what support is actually accessible, acceptable, and needed. Data minimization and consent matter when collecting household or route observations. The present system does not claim individual prediction.

### A Falsifiable Path to Real-World Evidence

A first field study should preregister the outcome, intervention footprint, install date, comparison sites, eligibility, and analysis before observing post-installation results. Measure surface LST for a surface-pattern claim; measure shaded pedestrian-height air temperature and humidity for experienced heat; use valid energy or health records only for claims about those outcomes (EPA, n.d.; Ravikumar, 2026b). Collect comparable baseline and follow-up periods, record weather and sensor uncertainty, inspect pre-trends and spillovers, and publish all exclusions. A matched-control or appropriate aggregate counterfactual design can estimate an effect with uncertainty; a scenario map alone cannot.

For a prospective matched-area design, a simple difference-in-differences estimand is

$$
\widehat\tau=(\bar Y_{T,\mathrm{post}}-\bar Y_{T,\mathrm{pre}})-(\bar Y_{C,\mathrm{post}}-\bar Y_{C,\mathrm{pre}}).
$$

In plain language, compare how much a treated place changes with how much a similar untreated place changes over the same period. Here $Y$ must be named in advance, $T$ denotes treated sites, and $C$ denotes credible comparison sites. The interpretation depends on comparable pre-intervention trends, weather adjustment, no unmeasured co-intervention that selectively affects one group, and attention to spatial spillovers. It is a proposed evaluation design, not an estimate produced by the current repository. An apparent post-installation difference without those checks is an observation, not causal evidence.

The proposal is falsifiable. If candidate bottlenecks are unstable under plausible graph choices, fail local interpretation checks, or do not help communities identify decision-relevant evidence, the framework should be revised or its claim narrowed. If a deployed action fails a preregistered outcome test, the result should be published as such. A democratic research tool earns trust by making correction possible.

## Conclusion

Urban Heat Democratization exists because a person affected by heat deserves to understand and question the evidence behind a public decision. The method asks a spatial question that a temperature average cannot answer, shows how the calculation was made, and states what the result does and does not establish. It offers a reproducible way to find places worth investigating together; it has not demonstrated that an intervention cooled them. The next test is practical and demanding: compare it with simpler maps, check whether the result survives reasonable changes in assumptions, listen to local corrections, and measure outcomes after real action. I want this work to be useful enough to invite scrutiny and honest enough to change when that scrutiny finds a better answer.

## Declarations

**Author contributions.** Aarti Sri Ravikumar is credited as creator and lead author in the repository. Additional contributions to this manuscript should be recorded before formal submission.  
**Funding and competing interests.** The reviewed repositories do not provide a verified funding or competing-interest declaration for this manuscript; these statements require author confirmation before journal submission.  
**Ethics.** This methods manuscript analyzes software and public or bundled spatial materials and reports no human-participant study. Any future household, route, or health-data study requires its own ethics and privacy review.  
**Data and code availability.** [Source code](https://github.com/aartisr/urban-heat-democratization), [`data/README.md`](../data/README.md), [`data/metadata/thermal_sources.json`](../data/metadata/thermal_sources.json), and the [public application](https://urban-heat.ai-aarti.com/) describe available artifacts. The commit above identifies the reviewed baseline; this new manuscript itself is an uncommitted addition until released. A durable version DOI and complete input hashes are future release tasks.

## References

Agency for Toxic Substances and Disease Registry. (2024). *CDC/ATSDR Social Vulnerability Index 2022 documentation*. Centers for Disease Control and Prevention. https://stacks.cdc.gov/view/cdc/157287

Hsu, A., Sheriff, G., Chakraborty, T., & Manya, D. (2021). Disproportionate exposure to urban heat island intensity across major U.S. cities. *Nature Communications, 12*, Article 2721. https://doi.org/10.1038/s41467-021-22799-5

Intergovernmental Panel on Climate Change. (2022). Chapter 6: Cities, settlements and key infrastructure. In *Climate change 2022: Impacts, adaptation and vulnerability*. https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/

NASA Jet Propulsion Laboratory. (2019). *ECOSTRESS Level-2 land surface temperature and emissivity user guide*. https://ecostress.jpl.nasa.gov/downloads/userguides/2_ECOSTRESS_L2_UserGuide_06182019.pdf

Ravikumar, A. S. (2026a). *Repository capability status* [Project documentation]. Urban Heat Democratization. https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/IMPLEMENTATION_STATUS.md

Ravikumar, A. S. (2026b). *Urban Heat Democratization impact evidence protocol* [Project documentation]. Urban Heat Democratization. https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/IMPACT_EVIDENCE_PROTOCOL.md

Ravikumar, A. S. (2026c). *Boston study guide* [Project documentation]. Urban Heat Democratization. https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/BOSTON_STUDY_GUIDE.md

Ravikumar, A. S. (2026d). *Mathematical innovation accountability report* [Project documentation]. Urban Heat Democratization. https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/MATH_INNOVATION_ACCOUNTABILITY.md

Ravikumar, A. S. (2026e). *Spectral theory contract: What the mathematics establishes* [Project documentation]. Urban Heat Democratization. https://github.com/aartisr/urban-heat-democratization/blob/4c073d5/docs/wiki/09-spectral-theory-contract.md

Rue, H., & Held, L. (2005). *Gaussian Markov random fields: Theory and applications*. Chapman & Hall/CRC. https://doi.org/10.1201/9780203492024

Shi, J., & Malik, J. (2000). Normalized cuts and image segmentation. *IEEE Transactions on Pattern Analysis and Machine Intelligence, 22*(8), 888–905. https://doi.org/10.1109/34.868688

U.S. Environmental Protection Agency. (n.d.). *Measuring heat islands*. https://www.epa.gov/heatislands/measuring-heat-islands

U.S. Geological Survey. (n.d.-a). *What are the band designations for the Landsat satellites?* https://www.usgs.gov/faqs/what-are-band-designations-landsat-satellites

U.S. Geological Survey. (n.d.-b). *Landsat Collection 2 surface temperature*. https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-temperature

## Appendix A: Reproducibility and Source Crosswalk

This paper synthesizes the current urban-heat material in `publications-1` (`README.md`, `src/data/publications.ts`, `src/data/urbanHeatData.ts`, and the urban-heat, graph-theory, and GMRF wiki pages) and the urban-heat repository's documentation tree. The latter includes the documentation index, classroom and Boston guides, capability and evidence records, math guides, wiki field guide, project architecture and roadmap, API and live-source notes, scenario and future-research designs, and historical/archive documents. Historical claims were checked against the current implementation and accountability report rather than treated as independent results.

| Manuscript claim | Repository evidence to inspect | Status |
|:--|:--|:--|
| Prepared thermal and vegetation data; robust relative scaling | [`core/raster.py`](../core/raster.py), [`core/pipeline.py`](../core/pipeline.py), [`data/metadata/thermal_sources.json`](../data/metadata/thermal_sources.json) | Active with input provenance limits |
| Weighted 4/8-neighbor graph and costs | [`core/graph.py`](../core/graph.py), [`tests/test_spectral_core.py`](../tests/test_spectral_core.py) | Active model proxy |
| Eigenpair and Fiedler sweep candidate | [`core/spectra.py`](../core/spectra.py), [`docs/wiki/09-spectral-theory-contract.md`](wiki/09-spectral-theory-contract.md) | Active graph result |
| Cooling-sink and priority rules | [`core/pipeline.py`](../core/pipeline.py), [`docs/MATH_INNOVATION_ACCOUNTABILITY.md`](MATH_INNOVATION_ACCOUNTABILITY.md) | Active planning proxy |
| Percolation and sink reliability | [`core/percolation.py`](../core/percolation.py), [`core/reliability.py`](../core/reliability.py), [`tests/test_reproducibility.py`](../tests/test_reproducibility.py) | Active teaching/robustness model |
| GMRF and advanced spatial inference | [`core/advanced_thermal_math.py`](../core/advanced_thermal_math.py), [`docs/Urban_Thermal_Math_Deep_Dive.md`](Urban_Thermal_Math_Deep_Dive.md) | Research extension / release gated |
| Measured intervention effects | [`docs/IMPACT_EVIDENCE_PROTOCOL.md`](IMPACT_EVIDENCE_PROTOCOL.md), [`docs/wiki/10-repeatability-and-real-world-validation.md`](wiki/10-repeatability-and-real-world-validation.md) | No qualifying field result in the reviewed repositories |

## Appendix B: Notation and Interpretation

| Symbol | Meaning | What it is not |
|:--|:--|:--|
| $T_{\mathrm{K}}$, $T_{\mathrm{C}}$ | Calibrated LST in kelvin or Celsius for a specified product | Air temperature or personal heat dose |
| $z_i$ | Unitless within-scene normalized raster value | Absolute temperature |
| $w_{ij}$ | Chosen positive graph-link weight | Measured thermal conductivity |
| $c_{ij}$ | Chosen length/weight path cost | Travel time or safety |
| $\lambda_2$ | Second eigenvalue of the declared normalized Laplacian | °C of cooling or health benefit |
| $\phi(S)$ | Weighted cut divided by smaller weighted volume | A causal intervention effect |
| $A_i$ | Normalized linkage to inferred sinks | Verified public access to cooling |
| $P_i$ | Weighted planning priority under stated policy choices | A validated risk or procurement score |

