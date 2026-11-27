---
title: "Can the Same Heat Values Tell Different Stories?"
subtitle: "Testing one link in an inspectable, community-centered heat evidence chain"
author: "Aarti Sri Ravikumar"
date: "November 27, 2026"
---

## Abstract

When a community studies heat, an average temperature can hide where warm and cool places sit next to each other. Urban Heat Democratization tries to make the journey from evidence to public decision open to inspection and correction. I tested one essential link: can its graph detect an arrangement that an average misses, and can its answer be checked? I arranged the numbers 1 through 9 into two different 3-by-3 grids with identical means and histograms. Using the project's open-source code, I built a weighted neighbor graph for each, measured its second normalized-Laplacian eigenvalue, found a candidate cut with the implemented spectral sweep, and compared that cut with all 255 distinct cuts. I repeated the test at three sensitivity settings. At the default alpha of 3, sweep conductance was 0.3927 for the smooth grid and 0.4396 for the scattered grid; the exact minimum also differed. The experiment shows that this graph's structural answer can change when spatial arrangement changes, and that its candidate cut can be audited. It does not show that the tool improves a real decision or that an intervention cools anyone. I want a resident to be able to ask why a place was highlighted, see the rule, and bring local knowledge that could change the answer.

## Acknowledgements

This paper uses the public work of the U.S. Environmental Protection Agency, the U.S. Geological Survey, urban heat researchers, and graph theorists named in the Works Cited. I also acknowledge the knowledge residents have about shade, locked gates, dangerous crossings, and the hours when heat is hardest to bear. No community participant, mentor, school, or partner has been claimed as a contributor to this experiment without confirmation.

## Introduction and Background Research

I picture someone waiting for a bus on a hot afternoon. A satellite may show a warm roof or road nearby. The person needs to know whether the stop has shade at that hour and whether relief is actually accessible. The Environmental Protection Agency distinguishes measurements of surface temperature from measurements of air temperature (U.S. Environmental Protection Agency, n.d.). The U.S. Geological Survey explains how its land-surface-temperature product must be scaled before pixel values can be interpreted as temperature (U.S. Geological Survey, n.d.). Even a correctly processed surface image cannot tell us whether a park is open or a crossing is safe.

Heat is also an issue of fairness. Hsu and colleagues found unequal exposure to surface urban heat island intensity across major U.S. cities (Hsu et al., 2021). The Intergovernmental Panel on Climate Change describes how urban climate risks interact with poverty, infrastructure, and justice (Intergovernmental Panel on Climate Change, 2022). These studies explain why the distribution of heat deserves attention. They do not turn my nine teaching cells into a measure of anyone's exposure or health. A responsible tool has to keep those claims separate.

Urban Heat Democratization starts with prepared land-surface-temperature (LST) values and, when available, a vegetation layer. It connects neighboring valid cells with weights that depend on the local LST gradient and vegetation. It then asks where the resulting *chosen graph* has a weak connection. A second calculation estimates modeled linkage to cells that look relatively cool or green. These are planning clues. They are not measurements of heat flow, walking access, or cooling caused by a tree (Ravikumar, 2026a).

The project organizes its contribution around three connected questions. **Observe:** What does the source image show, and what can it not show? **Understand:** How did declared graph rules turn nearby values into a bottleneck or cooling-linkage clue? **Deliberate:** What local observation, alternative assumption, or new evidence could change the proposed next step? A person can inspect the input, rule, derived layer, and limits instead of receiving only a colored ranking (Ravikumar, 2026a; Ravikumar, 2026b). Established methods such as Laplacians, spectral cuts, and shortest paths make this possible; the project does not claim to have invented them. Its contribution is their transparent connection to a civic workflow. The civic guide starts with a local decision, checks the evidence label, adds local knowledge, and records a next evidence step (Ravikumar, 2026d). Whether that workflow actually improves a decision remains to be tested.

## Purpose

I want to test whether the graph notices an arrangement that a mean and histogram miss, and whether its candidate cut can be checked against an exact answer. This tests the **understand** link of the larger observe–understand–deliberate design. It cannot by itself test whether a resident understands the map or whether a community decision improves.

## Problem

**Question 1 — added information:** When the same nine values move to different positions, does the graph reveal a structural difference hidden by the unchanged mean and histogram? **Question 2 — auditability:** Can an exhaustive nine-node check show how close the published candidate cut is to the best cut under the declared rule? **Question 3 — public value:** Would showing these inputs, rules, and limits help people challenge a real heat decision? This experiment answers the first two for its tiny grids; the third requires a separate study with residents and decision makers.

## Hypothesis and Engineering Goals

**If** I rearrange the same nine values while holding the grid size and graph rules fixed, **then** at least one structural score will change, **because** edge weights depend on local neighbors, not only on the set of values. This predicts a difference, not a direction for every score. **If** I compare the sweep cut with every possible cut on this small graph, **then** I can report its actual gap from the optimum rather than implying it is exact. My engineering goal is a repeatable, explainable result that a future user can question. Whether it is understandable and useful to that user is an untested design hypothesis.

## Variables and Constraints

The main independent variable is the **position** of the nine values. The smooth and scattered grids each contain {1, 2, 3, 4, 5, 6, 7, 8, 9}. I separately vary the edge sensitivity parameter alpha across 1, 3, and 5 to see whether the result depends on that choice. The dependent variables are the second normalized-Laplacian eigenvalue (lambda 2), the conductance of the implemented sweep cut, and the exact minimum conductance. Within each comparison, I keep the grid size at 3 by 3, use four-neighbor connections, omit vegetation, keep beta at zero, and use the same normalization and code. The smooth grid is the comparison condition. The values are **unitless teaching numbers**, not degrees Celsius or a Boston sample.

The main constraint is that this is a computer experiment on nine cells. It cannot test human heat exposure, citywide performance, shade, routes, or project outcomes. Exact enumeration is practical for nine nodes but not for a full city grid. The pipeline's optional two-raster path also does not verify that two inputs share a coordinate system or pixel alignment; a real study must check that first (Ravikumar, 2026b).

## Materials

The materials were a computer with Python, NumPy, NetworkX, and SciPy; the repository's `core/raster.py`, `core/graph.py`, `core/spectra.py`, and `core/assurance.py`; two 3-by-3 arrays shown in Figure 1; the script `scripts/build_final_paper.py`; and the research and project sources in the Works Cited. No thermometer, physical sensor, field photograph, or human-subject data was used.

## Procedure

1. Record the smooth grid as rows [1, 2, 3], [4, 5, 6], [7, 8, 9]. Record the scattered grid as rows [1, 8, 3], [6, 5, 4], [7, 2, 9]. Check that each grid contains 1 through 9 once and has mean 5.
2. For each grid, call `core.raster.normalize` to scale the values using the 2nd and 98th percentiles, clipping results to the interval from zero to one. This makes the graph input relative rather than a physical temperature.
3. For alpha equal to 1, 3, and 5, call `build_weighted_grid` with four-neighbor connections, no NDVI, and beta equal to zero. The code computes an edge weight from the average local gradient at its two ends.
4. Call `lambda2_and_fiedler` and `sweep_conductance` for each graph. Record lambda 2 and the lowest conductance among cuts in the code's Fiedler ordering.
5. Call `fiedler_exact_cut_benchmark`, which checks every nonduplicate nonempty partition of this nine-node graph. Record its exact minimum conductance and the difference between the sweep and exact values.
6. Put the six runs in Table 1 and graph the sweep and exact scores in Figure 2. Re-run the script once and compare the recorded values. There is no hourly timetable because the independent variable is a digital arrangement, not a process changing over time; the three alpha settings are the prespecified checkpoints.
7. Interpret only what the experiment measures. Compare the results with the hypothesis and list what a real neighborhood study would need before making a public recommendation.

## Pictures and Experiment Checkpoints

Figure 1 is a computer-generated picture of the exact input grids. It is a record of the setup, not a satellite image or field photograph. The project had no camera or site visit in this experiment. The check before calculation was that both grids had the same values and mean; the check after calculation was that the six runs produced the table below.

![Figure 1. The two input grids use the same values in different positions. The numbers are unitless teaching values, not measured temperatures.](final_paper_assets/grid_comparison.png)

## Data

**Table 1.** Results from the repository's graph code. Lower conductance means a weaker cut *in the declared graph*. Values are rounded to four decimals for reading; the script retains full precision.

| Grid | Alpha | Mean input | Lambda 2 | Sweep conductance | Exact conductance |
|:--|--:|--:|--:|--:|--:|
| Smooth | 1 | 5.0 | 0.4201 | 0.3976 | 0.3319 |
| Scattered | 1 | 5.0 | 0.4170 | 0.4086 | 0.3495 |
| Smooth | 3 | 5.0 | 0.4149 | 0.3927 | 0.3290 |
| Scattered | 3 | 5.0 | 0.4214 | 0.4396 | 0.3941 |
| Smooth | 5 | 5.0 | 0.4098 | 0.3879 | 0.3260 |
| Scattered | 5 | 5.0 | 0.4429 | 0.4861 | 0.4526 |

The table is checked against the script that generated the graphs. Within each alpha setting, the two inputs have identical means and histograms. Their score differences therefore arise from how the same values are arranged under the declared edge rule. The exact cut benchmarks the algorithm on nine nodes; it is not an observed neighborhood boundary. The full-precision results are saved with the paper so that rounding in this table does not hide a discrepancy.

## Graphs

Figure 2 plots the sweep and exact conductance for both arrangements as alpha changes. Its vertical axis is a unitless graph ratio. A higher point is not hotter air or a better health outcome. The graph helps a teacher see both the arrangement effect and sensitivity to a model setting.

![Figure 2. Conductance from the six runs. Solid lines are the implemented sweep; dashed lines are the exact minimum over all cuts.](final_paper_assets/conductance_graph.png)

## Analysis and Mathematical Proof

The results support the hypothesis for these two arrangements. At alpha 3, both grids have mean 5, but sweep conductance rises from 0.3927 for the smooth grid to 0.4396 for the scattered grid, a difference of about 0.0469. The exact minimum changes from 0.3290 to 0.3941. Both comparisons detect spatial arrangement that the mean misses. The sweep score is above the exact minimum in every run, so the method produces a candidate cut rather than claiming to find the best cut. Alpha matters as well: the scattered grid's sweep score rises from 0.4086 at alpha 1 to 0.4861 at alpha 5. Lambda 2 does not move in one direction across all three settings, which is another reason to report all measures instead of choosing a favorable one. These are descriptive results for six prespecified computations, not estimates of a population effect.

The mechanism is visible in the code. Each valid cell becomes a vertex. With vegetation absent, neighboring cells i and j receive a positive weight `w_ij = max(10^-9, exp(-alpha*g_ij))`, where `g_ij` averages their local gradient magnitudes. Rearranging the same nine values can change those gradients and the weighted adjacency matrix A. A mean contains no information about which values touch. This proves that equal means do not force equal graph inputs; the six observed differences show that this particular rearrangement changed the outputs. I am **not** claiming that every rearrangement must do so.

Let D be the diagonal matrix of weighted degrees and L = D - A. For any vector q, the identity `q^T L q = sum over edges w_ij (q_i - q_j)^2` is nonnegative because every weight and every square is nonnegative. Therefore L is positive semidefinite. Zero energy requires equal q values at the ends of every edge. In this connected, positive-weight nine-node graph, that equality extends to all vertices, leaving only one independent zero-energy direction. The normalized Laplacian `D^-1/2 L D^-1/2` therefore has exactly one zero eigenvalue and a positive second eigenvalue, lambda 2. This proves a structural fact about the chosen graph. It does **not** prove where physical heat flows or how a person feels.

There is a useful proof connecting lambda 2 to the best cut. Take any nonempty set S. Call its weighted volume `a` and the other side's volume `b`. Give every vertex in S the value `1 - a/(a+b)` and every vertex outside S the value `-a/(a+b)`. This makes a degree-weighted vector centered at zero. Its Rayleigh quotient is `cut(S,not S) * (a+b)/(a*b)`. Since `(a+b)/(a*b) = 1/a + 1/b` is at most `2/min(a,b)`, the quotient is at most twice the conductance of S. The variational rule defining lambda 2 says lambda 2 is no larger than this quotient. Therefore `lambda 2 / 2 <= best possible conductance`. The other side of the classical Cheeger inequality is an established theorem, not a new proof in this paper, and it does not certify our raw-eigenvector implementation (Kwok et al., 2013).

For a set S of vertices, define its cut weight as the sum of edges crossing from S to the rest. Define its volume as the sum of weighted degrees inside S. Its conductance is `cut(S,not S) / min(volume(S), volume(not S))`. With nine nodes, fixing the first node outside S leaves eight yes/no choices. Excluding the empty set leaves `2^8 - 1 = 255` distinct nontrivial cuts, with complements counted only once. The exact benchmark tries all 255, so its answer cannot be greater than the sweep's answer. That inequality appears in every row of Table 1. It is a useful test of the algorithm and of our interpretation. The code orders the raw symmetric-normalized eigenvector rather than the degree-adjusted coordinates used in the standard sweep guarantee (Kwok et al., 2013). I therefore do **not** claim a certified approximation bound for the implemented cut.

This experiment supports one part of the project's central innovation: turning map values into a *different, inspectable question* about spatial structure. The equal-mean grids isolate what the graph adds; the exact benchmark exposes where its shortcut falls short; and the code lets another student challenge both. The wider design also keeps cooling-linkage clues, scenario assumptions, and local observations visible as separate kinds of evidence (Ravikumar, 2026a; Ravikumar, 2026b). Those parts were not tested here. A convincing next study would compare the full workflow with a simpler LST map under the same field-review effort and a prespecified outcome. If it adds no useful information, the innovation claim should narrow.

## Conclusion

The same nine values produced different structural answers when I changed their positions. Because the mean and histogram were fixed, the graph revealed information those summaries cannot carry. The exact-cut check made the method more accountable: it showed the best conductance on this nine-node graph and the sweep's gap from that answer. That is a small but real demonstration of the project's idea that people should be able to examine *how* a heat-map claim was made. It does not show that a real neighborhood is cooler, that a resident can use the interface effectively, or that a public decision improved.

The main weakness is that nine invented, unitless values are far from a lived city. I did not measure shade, air temperature, safe access, or anyone's experience. The scores also depend on the graph rule and alpha. If I repeated the project, I would test more arrangements, compare the sweep with the degree-adjusted version used by the theorem, and check the result against local observations. I want residents, especially those with little say over cooling investments, to be able to challenge a technical answer before it shapes a public decision.

## Applications and Further Research

A teacher can use the two grids to ask what an average misses and then check whether the graph's answer can be reproduced. A community group can use the larger app to ask why a place was highlighted, whether a supposed cooling site is actually usable, and what evidence would change a ranking. Boston is the bundled example for such inspection, but its layers are not validated intervention outcomes (Ravikumar, 2026e). A planner can use them to plan site visits, not to issue a final funding order. The next research questions follow the innovation chain: Does the graph add actionable information beyond a simpler LST-only map? Can residents understand and correct the explanation? Do those corrections alter a recorded decision? A fair test would register outcomes in advance, give both maps equal field-review effort, include local reviewers, record unsafe or inaccessible “cool” sites, and publish null results. Proving actual cooling would additionally require before-and-after observations, comparison sites, uncertainty, and a credible causal design (Ravikumar, 2026c).

## Works Cited (MLA)

Hsu, Angel, et al. “Disproportionate Exposure to Urban Heat Island Intensity across Major US Cities.” *Nature Communications*, vol. 12, article 2721, 2021, https://doi.org/10.1038/s41467-021-22799-5.

Intergovernmental Panel on Climate Change. “Cities, Settlements and Key Infrastructure.” *Climate Change 2022: Impacts, Adaptation and Vulnerability*, 2022, https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/.

Kwok, Tsz Chiu, et al. “Improved Cheeger's Inequality: Analysis of Spectral Partitioning Algorithms through Higher Order Spectral Gap.” *Proceedings of the 45th Annual ACM Symposium on Theory of Computing*, 2013, pp. 11–20, https://cs.uwaterloo.ca/~lapchi/papers/Cheeger-conf.pdf.

Ravikumar, Aarti Sri. “Mathematical Innovation Accountability Report.” *Urban Heat Democratization*, 2026a, https://github.com/aartisr/urban-heat-democratization/blob/main/docs/MATH_INNOVATION_ACCOUNTABILITY.md.

Ravikumar, Aarti Sri. “Journal Manuscript: The Right to Question the Map.” *Urban Heat Democratization*, 2026b, https://github.com/aartisr/urban-heat-democratization/blob/main/docs/DEMOCRATIZING_URBAN_HEAT_RESILIENCE_JOURNAL.md.

Ravikumar, Aarti Sri. “Impact Evidence Protocol.” *Urban Heat Democratization*, 2026c, https://github.com/aartisr/urban-heat-democratization/blob/main/docs/IMPACT_EVIDENCE_PROTOCOL.md.

Ravikumar, Aarti Sri. “A Civic Starter Guide to Urban Heat Evidence.” *Urban Heat Democratization*, 2026d, https://github.com/aartisr/urban-heat-democratization/blob/main/docs/wiki/12-civic-starter-guide.md.

Ravikumar, Aarti Sri. “Boston Study Guide.” *Urban Heat Democratization*, 2026e, https://github.com/aartisr/urban-heat-democratization/blob/main/docs/BOSTON_STUDY_GUIDE.md.

U.S. Environmental Protection Agency. “Measuring Heat Islands.” *EPA*, https://www.epa.gov/heatislands/measuring-heat-islands. Accessed 27 Nov. 2026.

U.S. Geological Survey. “Landsat Collection 2 Surface Temperature.” *USGS*, https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-temperature. Accessed 27 Nov. 2026.

Urban Heat Democratization. `core/raster.py`, `core/graph.py`, `core/spectra.py`, and `core/assurance.py`. *GitHub*, https://github.com/aartisr/urban-heat-democratization. Accessed 27 Nov. 2026.
