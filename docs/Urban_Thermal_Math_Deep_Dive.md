# Urban Thermal Network Math Deep Dive

## Scope and intent

This document explains the graph-based analytical methods implemented in
**Urban Heat Democratization**. It distinguishes deliberately between the
calculations the repository performs today, the project outputs that use them,
and research extensions that are not enabled as production claims.

It covers:

1. Data to graph modeling
2. Laplacian and spectral graph theory
3. Cheeger cut and conductance
4. Probability, percolation, and reliability
5. Combinatorics and computational hardness
6. Conceptual GMRF inference extension
7. Bounded optimization heuristic
8. Practical scientific interpretation and limitations
9. A fully worked toy example
10. A layperson glossary mapped to repository modules
11. An equations-only appendix

For the end-to-end product mapping, read [How Urban Thermal Math Is Used in
Urban Heat Democratization](URBAN_THERMAL_MATH_IN_PROJECT.md). For scientific
and public-use boundaries, read the [Impact Evidence
Protocol](IMPACT_EVIDENCE_PROTOCOL.md).

## Why this is a credible decision-support method

The persuasive case for this work is not that graph mathematics makes a map
infallible. It is that every important step is inspectable and falsifiable:

1. **Declared inputs:** valid raster cells, adjacency, normalization, edge
   weights, sink rule, and thresholds are explicit rather than hidden in a
   score.
2. **Defined quantities:** conductance, the normalized Laplacian, \(\lambda_2\),
   least-cost access, and Monte Carlo reliability each have a precise
   mathematical definition.
3. **Reproducible computation:** the core modules are deterministic for fixed
   inputs and seeds; the teaching interfaces call the same canonical metric
   evaluator used by the pipeline.
4. **Testable invariants:** automated tests verify expected path-graph
   eigenvalues, positive conductance and cost, bounded conductance, bounded
   reliability, and invalid-probability rejection.
5. **Bounded interpretation:** a low-conductance feature is a structural
   property of the declared graph. It is not a measurement of heat flow,
   indoor temperature, health risk, public access, or an intervention outcome.

That combination makes the method suitable for transparent investigation and
comparative planning. It does not turn a proxy into a causal finding.

---

## 1) The core idea in plain language

The project translates a thermal raster and, when available, a vegetation
raster into a network.

- A map cell becomes a node.
- Neighboring cells are connected by edges.
- Each edge has a weight (conductance): larger means easier cooling linkage.
- Weak links form bottlenecks.
- Spectral graph math finds those bottlenecks.
- Probability models random edge failures to test robustness.
- A bounded comparison scenario can show how declared changes affect the same
  graph quantities.

Think of the city as a thermal road network. If a few narrow bridges are weak, the entire city cooling flow is fragile. The Cheeger cut finds those weak bridges.

---

## 2) Data to graph construction

### 2.1 Grid and nodes

In [`core/graph.py`](../core/graph.py), each finite raster cell (LST and
optional NDVI) is a node.

### 2.2 Edges and neighborhood

- The implemented raster graph supports 4-neighbor or 8-neighbor connectivity
  (rook/queen style).
- A polygon-adjacency or wind-aware graph is a possible future city adapter;
  it is not the current generic core graph contract.

### 2.3 Edge weights (conductance)

#### Implemented raster graph

A local temperature gradient is computed. Steeper gradient means a stronger thermal barrier.

Weight form:

$$
w_{ij} = \exp(-\alpha g_{ij}) \cdot (1 + \beta \cdot \text{ndvi}_{ij})
$$

where:

- $g_{ij}$ is local gradient magnitude around edge $(i,j)$
- $\alpha > 0$ controls barrier sensitivity
- $\beta \ge 0$ controls NDVI uplift

Then cost is inverse-like:

$$
\text{cost}_{ij} = \frac{\ell_{ij}}{w_{ij}}
$$

with $\ell_{ij}=1$ for cardinal adjacency and $\sqrt{2}$ for diagonal.

Every implemented weight is floored at a small positive value. This prevents
division-by-zero in least-cost calculations; it does not assert that every
real-world location has a physical cooling connection.

---

## 3) Laplacian mathematics ("Laplace everything")

### 3.1 Matrices

For weighted graph $G=(V,E,W)$:

- $W$ (weighted adjacency): $W_{ij}=w_{ij}$ if edge exists, else 0
- Degree at node $i$: $d_i = \sum_j W_{ij}$
- Degree matrix $D = \text{diag}(d_1,\dots,d_n)$

### 3.2 Laplacians

Combinatorial Laplacian:

$$
L = D - W
$$

Normalized Laplacian:

$$
L_{\text{norm}} = I - D^{-1/2} W D^{-1/2}
$$

The implemented core uses the normalized Laplacian for spectral metrics.

Why normalized? It avoids over-favoring high-degree nodes and makes comparison more stable across heterogeneous degree distributions.

### 3.3 Eigenvalues and eigenvectors

- Eigenvalues of $L_{\text{norm}}$: $0=\lambda_1 \le \lambda_2 \le \cdots \le \lambda_n$
- $\lambda_2$ is algebraic connectivity (spectral gap in this workflow).
- Eigenvector for $\lambda_2$ is Fiedler vector.

Intuition:

- Larger $\lambda_2$: more globally well-connected thermal network.
- Smaller $\lambda_2$: easier to split, more bottlenecked.

---

## 4) Cheeger cut, conductance, and sweep

### 4.1 Conductance definition

For node subset $S \subset V$:

$$
\phi(S)=\frac{\text{cut}(S,V\setminus S)}{\min(\text{vol}(S),\text{vol}(V\setminus S))}
$$

where:

$$
\text{cut}(S,V\setminus S)=\sum_{i\in S,\,j\notin S} w_{ij}
$$

$$
\text{vol}(S)=\sum_{i\in S} d_i
$$

Low conductance means the graph has a narrow weak bridge between two bigger regions.

### 4.2 Why spectral sweep

Exact minimization over all subsets is combinatorially expensive. Number of possible nontrivial cuts grows exponentially.

The practical method:

1. Compute Fiedler vector.
2. Sort nodes by Fiedler value.
3. Sweep prefix sets of this ordering.
4. Compute conductance for each prefix.
5. Choose best (minimum conductance) prefix.

This is implemented in [`core/spectra.py`](../core/spectra.py).

### 4.3 Cheeger boundary nodes

After best split is found, edges crossing the split are identified. Endpoints of crossing edges become bottleneck boundary nodes.

Those are treated as "corridor pinch points" for intervention focus.

---

## 5) Probability and percolation

### 5.1 Edge-failure model

Each edge is retained with probability $p$ and removed with probability $1-p$, independently.

This defines a random subgraph $G_p$.

### 5.2 Percolation scan

For each $p$ in a grid (for example 0.1 to 1.0):

- sample a random subgraph
- compute largest connected component fraction

The current interactive curve uses one seeded draw at each $p$, making it a
repeatable teaching stress test rather than an estimated physical failure
curve. Repeated scans can be aggregated in a future uncertainty analysis.

Implemented in [`core/percolation.py`](../core/percolation.py).

### 5.3 Reliability metrics

The implemented reliability measure is **sink reachability**: the expected
fraction of graph nodes connected to at least one inferred cooling sink under
the declared independent edge-retention model. It is a Monte Carlo estimator.
The project does not present all-terminal reliability as a city result.

---

## 6) Combinatorics and computational complexity

### 6.1 Why this is combinatorics-heavy

1. Cut search:
   - Candidate subsets are exponential in node count.
2. Reliability exact computation:
   - Requires summation over $2^m$ edge states in brute force form.
3. Intervention search:
   - Candidate set size grows with number of nodes times intervention types.

### 6.2 Practical approximations used

- Spectral sweep instead of brute-force cut minimization.
- Monte Carlo reliability instead of exact all-state enumeration.
- Greedy marginal-gain selection instead of full combinatorial optimization.

These are standard tractability compromises for city-scale graphs.

---

## 7) Cooling sinks and resistance proxy

### 7.1 Sink inference

Sinks are inferred from cool or green cells (quantile thresholds on NDVI and/or temperature).

### 7.2 Super-sink shortest path

A synthetic super-sink is attached with zero cost to all sink nodes.

Edge resistance cost is inverse conductance:

$$
r_{ij} \propto \frac{1}{w_{ij}}
$$

Then Dijkstra shortest path from super-sink gives each node's resistance-to-cooling distance.

### 7.3 Access normalization

Distances are transformed to access score in [0,100], where high means easier sink access.

The project reports the inverse of this normalized access field as a
cooling-access constraint where needed:

$$
\text{resistance\_proxy} = 100 - \text{cooling\_access\_score}
$$

---

## 8) Priority synthesis for bottleneck mitigation

A weighted blend is used on bottleneck boundary cells:

$$
\text{priority} = 100\left(0.65\cdot \text{heat\_unit} + 0.35\cdot (1-\text{access\_unit})\right)
$$

Interpretation:

- High heat increases urgency.
- Poor access to cooling sinks increases urgency.
- Restricting to Cheeger boundary cells targets structural bottlenecks rather than all hot cells.

### 8.1 Verified cost sources

The repo now carries real cost references so the planning story stays grounded:

- A New York State Energy Research and Development Authority heat-island report is used in the literature for relative cost-effectiveness ranking.
- A Los Angeles cool-communities benchmark is cited in urban-heat literature at roughly US$1 billion for a city-scale package.

What these sources give us:

- one ranking signal for which interventions are cheaper per unit of cooling,
- one order-of-magnitude cost anchor for large-scale city mitigation.

What they do not give us:

- a city-specific procurement table,
- exact per-tree, per-roof, or per-street-segment unit prices for every action.

So the model can cite real sources without pretending the city has a complete cost catalog when it does not.

---

## 9) GMRF as a research extension, not a current production result

### 9.1 Prior

Using graph Laplacian as smoothness prior:

$$
Q = \tau L + \epsilon I
$$

where:

- $\tau$ controls smoothness strength
- $\epsilon$ stabilizes precision matrix and avoids singular issues

### 9.2 Posterior with Gaussian observations

Observed nodes add diagonal precision:

$$
Q_{\text{post}} = Q + \frac{1}{\sigma^2}I_{obs}
$$

Posterior mean solve:

$$
\mu = Q_{\text{post}}^{-1} b
$$

This is a valid graph-regularized modeling pattern, but Urban Heat
Democratization does not currently expose a GMRF posterior as a city result.
It is included to make the extension path explicit rather than to imply it has
already been validated or deployed.

---

## 10) Bounded optimization heuristic

The pipeline currently uses a transparent bounded heuristic: it raises the
weight of selected cut-crossing or sink-adjacent edges, then recomputes the
same graph metrics. This is a **sensitivity scenario**, not a procurement
optimizer or a physical intervention simulation.

An equity-aware objective such as the following is a research design pattern,
not a production score:

$$
\text{score} = \alpha\,\lambda_2 + \beta\,\text{reliability} - \gamma\,\text{equity\_exposure}
$$

with equity exposure defined as weighted burden:

$$
\text{equity\_exposure} = \sum_i \text{vulnerability}_i \cdot \text{temp}_i
$$

For a future city-specific optimizer, a greedy algorithm could at each step:

1. Try each candidate intervention.
2. Apply local edge-weight multiplier around target node.
3. Recompute score.
4. Pick best positive gain candidate.
5. Repeat until budget exhausted.

The implemented bounded edge-selection heuristic lives in
[`core/pipeline.py`](../core/pipeline.py). Any city-specific objective would
require a documented intervention mapping, costs, equity inputs, sensitivity
analysis, and external review before it could be used for recommendations.

---

## 11) Fully worked toy example (requested)

This section is intentionally explicit and hand-computable.

### 11.1 Example A: 5-node path, uniform edge weight 1

Graph:

$$
1 - 2 - 3 - 4 - 5
$$

Edge weights all 1.

Degrees:

- $d_1=1$
- $d_2=2$
- $d_3=2$
- $d_4=2$
- $d_5=1$

Total volume:

$$
\text{vol}(V)=1+2+2+2+1=8
$$

Assume Fiedler ordering is monotone left-to-right (true for path).

Sweep table over prefixes:

1) $S_1=\{1\}$

- cut = edge (1,2) = 1
- vol(S1)=1
- vol(comp)=7
- denom=min(1,7)=1
- $\phi(S_1)=1/1=1.0$

2) $S_2=\{1,2\}$

- cut = edge (2,3) = 1
- vol(S2)=1+2=3
- vol(comp)=5
- denom=3
- $\phi(S_2)=1/3=0.3333$

3) $S_3=\{1,2,3\}$

- cut = edge (3,4) = 1
- vol(S3)=1+2+2=5
- vol(comp)=3
- denom=3
- $\phi(S_3)=1/3=0.3333$

4) $S_4=\{1,2,3,4\}$

- cut = edge (4,5) = 1
- vol(S4)=7
- vol(comp)=1
- denom=1
- $\phi(S_4)=1.0$

Best sweep conductance is 1/3 at S2 or S3.

Interpretation: middle split is weakest normalized separator in this simple graph.

### 11.2 Example B: same path but weak middle bridge

Edges:

- (1,2)=1
- (2,3)=0.2   (weak bridge)
- (3,4)=1
- (4,5)=1

Degrees:

- $d_1=1$
- $d_2=1.2$
- $d_3=1.2$
- $d_4=2$
- $d_5=1$

Total volume:

$$
\text{vol}(V)=1+1.2+1.2+2+1=6.4
$$

Sweep around weak bridge split S={1,2}:

- cut = w(2,3)=0.2
- vol(S)=1+1.2=2.2
- vol(comp)=4.2
- denom=2.2
- $\phi=0.2/2.2=0.0909$

This is much lower than uniform case 0.3333.

Interpretation: one weak edge creates a strong bottleneck signal. This is exactly what the Cheeger corridor is trying to detect in spatial thermal networks.

### 11.3 Reliability exact micro-example

For a path graph with 5 nodes and 4 edges, all-terminal connectivity requires all 4 edges survive.

If each edge survives independently with probability $p$:

$$
R_{all-terminal} = p^4
$$

At $p=0.7$:

$$
R=0.7^4=0.2401
$$

Monte Carlo reliability estimators in code should converge near 0.2401 with enough draws.

### 11.4 Percolation micro intuition

At low $p$, many edges fail, giant component fraction is small.
At high $p$, giant component includes most nodes.

For path-like sparse graphs, this transition is smoother than dense urban graphs.

---

## 12) Science interpretation for planning

### 12.1 What a high-priority bottleneck means

A high Cheeger priority cell means:

- it lies on a structural split boundary,
- it is locally hot,
- and/or it has weak sink access.

These are high-value candidates for corridor-style interventions that reconnect cooling pathways.

### 12.2 Why this is not full physics

This framework is a graph-theoretic proxy model, not a full CFD urban canopy simulation.

Strengths:

- tractable at city scale,
- auditable equations,
- robust comparative optimization under fixed assumptions.

Limits:

- edge effects are simplified multipliers,
- microclimate fluid dynamics are not explicitly solved,
- reliability uses Monte Carlo baseline estimators in current version.

---

## 13) Layperson glossary mapped to code (requested)

### 13.1 Core graph terms

- Node: one valid map/grid cell.
  - `core/graph.py`

- Edge: neighboring cell relationship.
  - same modules as above

- Weight or conductance: ease of thermal linkage.
  - same modules as above

- Cost or resistance: inverse-like modeled travel difficulty to inferred sinks.
  - `core/pipeline.py`

### 13.2 Spectral terms

- Laplacian: matrix encoding graph structure.
  - `core/graph.py`

- lambda2: second-smallest normalized Laplacian eigenvalue.
  - `core/spectra.py`

- Fiedler vector: eigenvector linked to lambda2 used to rank nodes for sweep cuts.
  - `core/spectra.py`

- Cheeger conductance: normalized cut quality of a set.
  - same cheeger/spectra modules

### 13.3 Probability terms

- Bond percolation: random edge keep/remove process with keep probability p.
  - `core/percolation.py`

- Reliability: expected share of nodes sink-reachable under random edge retention.
  - `core/reliability.py`

- Monte Carlo estimator: repeated random simulation to approximate expected value or probability.
  - same reliability/percolation modules

### 13.4 Inference and optimization terms

- GMRF: Gaussian Markov Random Field graph-based spatial prior/posterior model.
  - Research extension; not a current project output.

- Objective: weighted score combining connectivity, reliability, and equity.
  - Research design pattern; not a current project output.

- Greedy selection: bounded selected-edge strengthening in the current pipeline.
  - `core/pipeline.py`

---

## 14) Equations-only technical appendix (requested)

### 14.1 Graph and Laplacian

$$
d_i = \sum_j w_{ij}
$$

$$
D = \text{diag}(d_1,\ldots,d_n)
$$

$$
L = D - W
$$

$$
L_{\text{norm}} = I - D^{-1/2}WD^{-1/2}
$$

### 14.2 Spectral quantities

$$
0=\lambda_1 \le \lambda_2 \le \cdots \le \lambda_n
$$

$$
\text{mixing-time upper bound} \propto \frac{\log(1/\varepsilon)}{\lambda_2}
$$

### 14.3 Conductance and Cheeger sweep

$$
\text{cut}(S,V\setminus S)=\sum_{i\in S, j\notin S} w_{ij}
$$

$$
\text{vol}(S)=\sum_{i\in S} d_i
$$

$$
\phi(S)=\frac{\text{cut}(S,V\setminus S)}{\min(\text{vol}(S),\text{vol}(V\setminus S))}
$$

### 14.4 Sink resistance and access

$$
r_{ij} = \frac{\ell_{ij}}{\max(w_{ij},\epsilon)}
$$

$$
d_i = \text{shortest-path distance from node } i \text{ to super-sink}
$$

$$
\text{access}_i = 100\cdot (1-\text{normalized}(d_i))
$$

### 14.5 Priority blending

$$
\text{priority}_i = 100\cdot\mathbf{1}_{\{i\in\text{boundary}\}}\left(0.65\,h_i + 0.35\,(1-a_i)\right)
$$

where $h_i\in[0,1]$ is normalized heat and $a_i\in[0,1]$ is normalized access.

### 14.6 Reliability and percolation

$$
R_{\text{sink}}(p)=\mathbb{E}\left[\frac{\#\{i: i \text{ connects to a sink in }G_p\}}{|V|}\right]
$$

$$
\hat R_{\text{sink}} = \frac{1}{T}\sum_{t=1}^T \frac{\#\{i: i \text{ connects to a sink in }G_p^{(t)}\}}{|V|}
$$

$$
\text{GCF}(p)=\frac{|C_{max}(G_p)|}{|V|}

The current percolation display is one seeded realization at each \(p\), not
an estimate of the expectation over repeated realizations.
$$

### 14.7 GMRF

$$
Q = \tau L + \epsilon I
$$

$$
Q_{post} = Q + \frac{1}{\sigma^2}I_{obs}
$$

$$
\mu = Q_{post}^{-1}b
$$

### 14.8 Composite objective

$$
\text{score}=\alpha\lambda_2 + \beta R - \gamma E
$$

$$
E=\sum_i v_i\,t_i
$$

where $v_i$ is vulnerability and $t_i$ is temperature (or posterior mean proxy).

---

## 15) Practical checklist for scientific use

1. Validate edge-weight calibration per city.
2. Report confidence intervals for Monte Carlo reliability.
3. Run ablations (no spectral, no reliability, no equity).
4. Stress-test sensitivity to grid resolution and quantile thresholds.
5. Document policy constraints before operational deployment.

---

## 16) Final takeaway

Urban Heat Democratization implements a coherent graph-spectral-probabilistic
urban-heat framework:

- Cheeger and lambda2 capture structural thermal connectivity.
- Percolation and reliability capture failure robustness.
- Cooling sink resistance captures practical access deficits.
- GMRF and equity-aware objectives are documented research extensions, not
  current city outputs.

Scientifically, this is a strong decision-support proxy framework and not a full physical fluid-dynamics simulator. It is most powerful for comparative planning, prioritization, and transparent tradeoff analysis under explicit assumptions.
