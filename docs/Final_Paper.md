---
title: "Can the Same Heat Values Tell Different Stories?"
subtitle: "An auditable graph experiment for community-centered urban heat research"
author: "Aarti Sri Ravikumar"
date: "November 27, 2026"
---

## Abstract

I built Urban Heat Democratization because a heat map should help people ask better questions about their neighborhoods, not silence them with a complicated score. My scientific question for this paper is whether two tiny maps with exactly the same nine values can produce different graph results when the values are rearranged. I made a smooth 3-by-3 grid and a scattered 3-by-3 grid. Both contain the numbers 1 through 9, so both have a mean of 5. I used the project's open-source code to turn each grid into a weighted graph, calculated its second normalized-Laplacian eigenvalue and a spectral sweep cut, and checked the best cut by testing every nonduplicate partition. I repeated the comparison at three values of the graph's sensitivity setting. At the default setting, the sweep conductance was 0.3927 for the smooth grid and 0.4396 for the scattered grid. This supports the narrow claim that spatial arrangement changes this model's structural result even when the average and histogram do not change. It does not show which neighborhood is hotter for a person, which route is safe, or which project will cool a city. The value of the tool is that its steps can be checked, challenged, and improved with community knowledge.

## Acknowledgements

This paper uses the public work of the U.S. Environmental Protection Agency, the U.S. Geological Survey, urban heat researchers, and graph theorists named in the Works Cited. I also acknowledge the knowledge residents have about shade, locked gates, dangerous crossings, and the hours when heat is hardest to bear. No community participant, mentor, school, or partner has been claimed as a contributor to this experiment without confirmation.

## Introduction and Background Research

I keep thinking about a person waiting for a bus in the sun. A satellite might show a warm roof or road nearby, but the person needs an answer about shade at that stop and at that time. The Environmental Protection Agency explains that surface-temperature images and air-temperature measurements answer different questions (U.S. Environmental Protection Agency, n.d.). The U.S. Geological Survey provides land-surface-temperature products, but a product's scale factors and acquisition details matter before anyone interprets the pixels as temperatures (U.S. Geological Survey, n.d.). A colored map can be useful, but color alone cannot tell us whether a park is open or a route is safe.

Heat also has an equity dimension. Hsu and colleagues reported unequal exposure to surface urban heat island intensity across major U.S. cities. Their study is a reason to take distribution seriously; it is not evidence that my nine-cell demonstration measures anyone's exposure (Hsu et al., 2021). The Intergovernmental Panel on Climate Change describes how urban climate risks interact with poverty, infrastructure, and justice (Intergovernmental Panel on Climate Change, 2022). A responsible tool must therefore keep its mathematical result separate from a claim about a person's health.

Urban Heat Democratization starts with prepared land-surface-temperature (LST) values and, when available, a vegetation layer. It connects neighboring valid cells with weights that depend on the local LST gradient and vegetation. It then asks where the resulting *chosen graph* has a weak connection. A second calculation estimates modeled linkage to cells that look relatively cool or green. These are planning clues. They are not measurements of heat flow, walking access, or cooling caused by a tree (Ravikumar, 2026a).

The most interesting part to me is that a map's average can hide its arrangement. Imagine nine numbers spread evenly across a square and then scrambled. The average stays the same, but neighbors change. If an algorithm uses neighbor relationships, its answer can change. Graph theory gives us a way to test this idea exactly on a very small example. The project did not invent Laplacians, spectral cuts, or shortest paths. Its innovation is putting these familiar tools into a transparent chain that a resident or teacher can question, with the limits written next to the result. The project's civic guide asks users to begin with one local decision, read each evidence label, add local knowledge, and choose the next evidence step; I think that is a more honest use of a map than asking it to declare a winner (Ravikumar, 2026d).

## Purpose

My goal is to test one clear claim: does the graph method notice a change in the spatial arrangement of values that a mean or histogram misses? I also want to show that the calculation is reproducible and that its sweep cut can be checked against an exact answer on a small graph. The larger purpose is to model how a community-facing scientific tool should make its assumptions visible.

## Problem

If two 3-by-3 grids contain the same nine values but put them in different places, do their graph eigenvalues and cut scores differ? If they do, what can and cannot be concluded from that difference?

## Hypothesis and Engineering Goals

**If** I rearrange the same nine values while holding the code, graph settings, and grid size fixed, **then** at least one graph score will change, **because** the graph weight of an edge depends on the values around neighboring cells. I do not predict that every score will move in the same direction. My engineering goal is a repeatable tool that exposes the input grid, equation, cut score, source, and limitations instead of giving a mysterious “best place” label.

## Variables and Constraints

The independent variable is the **position** of the nine values. The smooth and scattered grids contain the same multiset {1, 2, 3, 4, 5, 6, 7, 8, 9}. I also run a sensitivity check in which the edge parameter alpha takes values 1, 3, and 5. The dependent variables are the second normalized-Laplacian eigenvalue (lambda 2), the conductance of the implemented sweep cut, and the exact minimum conductance. I keep the grid size at 3 by 3, use four-neighbor connections, omit vegetation, keep beta at zero, and use the same code version and normalization rule. The smooth grid is the comparison or control condition. These values are **unitless teaching numbers**, not observed degrees Celsius or a Boston sample.

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

The table is generated from the script rather than copied from a city map. The two inputs have identical means and histograms at every alpha setting. Differences in graph scores therefore come from arrangement and the declared edge rule, not from different overall values. The exact cut is a benchmark for this tiny graph; it is not an observed neighborhood boundary.

## Graphs

Figure 2 plots the sweep and exact conductance for both arrangements as alpha changes. Its vertical axis is a unitless graph ratio. A higher point is not hotter air or a better health outcome. The graph helps a teacher see both the arrangement effect and sensitivity to a model setting.

![Figure 2. Conductance from the six runs. Solid lines are the implemented sweep; dashed lines are the exact minimum over all cuts.](final_paper_assets/conductance_graph.png)

## Analysis and Mathematical Proof

The hypothesis is supported in its narrow form. At alpha 3, the two grids have the same mean of 5, yet the smooth grid's sweep conductance is about 0.3927 and the scattered grid's is about 0.4396. The exact minimum also changes, from about 0.3290 to 0.3941. The gap between the sweep and exact answers is useful information: the code's sweep finds one candidate, not necessarily the best possible cut. Alpha sensitivity matters too; Table 1 shows that changing alpha moves the scores. This is why a real report should include more than one setting.

Here is the part I can prove, step by step. Let each valid cell be a vertex. For two neighboring cells i and j, the code gives a positive weight `w_ij = max(10^-9, exp(-alpha*g_ij))` when vegetation is absent. The value `g_ij` is the average of the local gradient magnitudes at those cells. Rearranging the same nine values can change those local gradients and therefore the weighted adjacency matrix A. The average of the nine inputs contains no information about which values touch. This explains *why it is possible* for the graph scores to differ. The actual six differences are observed computational results, not a theorem that every rearrangement must differ.

Let D be the diagonal matrix of weighted degrees and L = D - A. For any vector q, the identity `q^T L q = sum over edges w_ij (q_i - q_j)^2` is nonnegative because every weight and every square is nonnegative. Therefore L is positive semidefinite. In a connected positive-weight graph, the normalized Laplacian `D^-1/2 L D^-1/2` has exactly one zero eigenvalue; its second eigenvalue lambda 2 is positive. This proves a structural fact about the chosen graph. It does **not** prove where physical heat flows or how a person feels.

There is a useful proof connecting lambda 2 to the best cut. Take any nonempty set S. Call its weighted volume `a` and the other side's volume `b`. Give every vertex in S the value `1 - a/(a+b)` and every vertex outside S the value `-a/(a+b)`. This makes a degree-weighted vector centered at zero. Its Rayleigh quotient is `cut(S,not S) * (a+b)/(a*b)`. Since `(a+b)/(a*b) = 1/a + 1/b` is at most `2/min(a,b)`, the quotient is at most twice the conductance of S. The variational rule defining lambda 2 says lambda 2 is no larger than this quotient. Therefore `lambda 2 / 2 <= best possible conductance`. The other side of the classical Cheeger inequality is an established theorem, not a new proof in this paper, and it does not certify our raw-eigenvector implementation (Kwok et al., 2013).

For a set S of vertices, define its cut weight as the sum of edges crossing from S to the rest. Define its volume as the sum of weighted degrees inside S. Its conductance is `cut(S,not S) / min(volume(S), volume(not S))`. With nine nodes, fixing the first node outside S leaves eight yes/no choices. Excluding the empty set leaves `2^8 - 1 = 255` distinct nontrivial cuts, with complements counted only once. The exact benchmark tries all 255, so its answer cannot be greater than the sweep's answer. That inequality appears in every row of Table 1. It is a useful test of the algorithm and of our interpretation. The code orders the raw symmetric-normalized eigenvector rather than the degree-adjusted coordinates used in the standard sweep guarantee (Kwok et al., 2013). I therefore do **not** claim a certified approximation bound for the implemented cut.

The result is innovative in an accountable way. A regular heat map shows values. The graph asks an additional question about their arrangement, and the exact nine-node benchmark reveals how close one heuristic answer is to the best answer for that example. The open equations and code let another student or resident challenge the choices. The experiment does not establish that this extra graph question improves real-world decisions; that needs comparison with simpler maps and local evidence.

## Conclusion

My question was whether the same values can tell different structural stories when their positions change. In this controlled nine-cell experiment, they can. The two inputs have the same mean and histogram, but their graph scores differ, so the hypothesis is supported for these two arrangements and three alpha settings. That is a proof of a computational effect under stated assumptions, not a proof of a cooler neighborhood or a successful intervention.

The biggest weakness is that nine made-up, unitless values are far from a lived city. I did not measure shade, air temperature, safe access, or any person's experience. The scores also depend on how I chose the graph and alpha. If I repeated the project, I would test more arrangements, compare the sweep with a degree-adjusted version, check more parameter settings, and then work with residents and field measurements before asking anyone to act on a map. I want this project to help people who have the least power to challenge a technical answer, especially when the answer affects where limited cooling resources go.

## Applications and Further Research

A teacher can use the two grids to show why an average does not describe spatial pattern. A community group can use the larger app to ask why a place was highlighted and what observation would change that ranking. Boston is the repository's bundled example for such inspection, but its layers are not validated intervention outcomes (Ravikumar, 2026e). A planner can use it as a starting point for site visits, not as a final funding order. The next scientific question is whether graph-derived candidates help people find actionable heat problems better than a simpler LST-only map when both receive the same field-review effort. That test should register the outcome in advance, include people who know the place, record inaccessible or unsafe “cool” sites, and publish null results. Any claim that an intervention cooled a place would require before-and-after observations, comparison sites, uncertainty, and a credible causal design (Ravikumar, 2026c).

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
