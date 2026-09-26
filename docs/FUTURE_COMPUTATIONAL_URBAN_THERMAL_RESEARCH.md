# A Future Computational Research Program for Urban Heat Democratization

## A note to the project’s future stewards

Urban Heat Democratization is at its best when it gives residents, educators,
public agencies, and researchers a more equal ability to inspect how a claim
was made. More compute should deepen that public accountability—not replace it
with an impressive but opaque “AI score.”

This is a personal roadmap for the kind of research program this platform can
grow into: ambitious enough to use high-performance computing, rigorous enough
to say *when the model does not know*, and civic enough to keep community
questions ahead of technical novelty. It is written for a project whose creator
wants innovation, ingenuity, and community to reinforce one another.

The current graph-spectral workflow remains valuable because it is transparent,
fast, and inspectable. Future computation should extend it in layers, not
discard it for a black box.

## The north-star question

> Given a specific city, heat event, public-space network, and set of
> realistic interventions, which **collective cooling pathways** deserve
> investigation first—and how uncertain is that conclusion?

That question is deliberately narrower than “where is it hot?” and more honest
than “what will fix heat?” It asks for evidence that can guide field work,
community deliberation, and public investment while keeping causal claims
separate from modelled hypotheses.

## Non-negotiable principles

1. **Public purpose before technical spectacle.** Every expensive model run
   must answer a decision-relevant question that a community or public partner
   can understand and challenge.
2. **A model ladder, not a model monopoly.** Preserve the current transparent
   graph view; add empirical, statistical, and physical views as complementary
   lenses.
3. **Uncertainty is a first-class output.** Publish intervals, sensitivity,
   data gaps, and disagreement—not only a colored map.
4. **No private-address inference by default.** Compute capacity must never be
   an excuse to collect addresses, identify households, or create a property
   risk score.
5. **Validation earns stronger language.** A model may become more complex
   before it becomes more actionable. Public claims advance only after the
   corresponding validation and governance gate.
6. **Reproducibility beats one-off heroics.** A result should be rerunnable
   from a versioned city package, parameter manifest, container/environment,
   and random seed.

## The future model stack

```text
Community questions + public decisions + lived observation
                          ↓
Authoritative data, consent, provenance, and privacy controls
                          ↓
  ┌───────────┬────────────┬─────────────┬───────────────────┐
  │ Graph     │ Statistical│ Physical    │ Decision / equity │
  │ structure │ inference  │ microclimate│ evaluation        │
  └───────────┴────────────┴─────────────┴───────────────────┘
                          ↓
Uncertainty, validation, trade-offs, and plain-language interpretation
                          ↓
Public atlas, local review, field study, and accountable action
```

The value comes from agreement and disagreement between lenses. A graph
bottleneck that also appears in observed thermal patterns, pedestrian shade
audits, and a validated physical simulation is stronger evidence than any one
of those signals alone. Conversely, disagreement tells the team where to
investigate instead of smoothing it away.

## Research capability ladder

| Level | New capability | Mathematics / computation | Useful question | Claim boundary |
| --- | --- | --- | --- | --- |
| 0 | Current transparent baseline | Weighted graphs, normalized Laplacian, Fiedler sweep, least-cost access, seeded Monte Carlo | Where does the declared graph have weak modeled connectivity? | Structural question only. |
| 1 | Proper uncertainty and sensitivity | Ensemble runs, bootstrap, Sobol/global sensitivity, Bayesian hierarchical models | Which findings persist when inputs and assumptions vary? | Robustness of a modelled pattern, not causal effect. |
| 2 | Spatiotemporal observation fusion | State-space models, Gaussian processes, graph neural operators with uncertainty, data assimilation | How do observed land-surface and near-surface conditions evolve across events? | Estimated environmental state with intervals. |
| 3 | Neighborhood physical simulation | Urban canopy models, radiative transfer, CFD/LES on selected domains, surrogate modelling | Which physical mechanisms plausibly explain an observed local pattern? | Scenario mechanism under stated weather and geometry. |
| 4 | Intervention evaluation | Causal inference, synthetic controls, difference-in-differences, causal forests, Bayesian structural time series | Did a real intervention change a registered outcome compared with a credible counterfactual? | Evaluated effect for the studied context. |
| 5 | Participatory decision support | Robust multi-objective optimization, portfolio optimization, fairness constraints, value-of-information analysis | Which options perform acceptably across uncertainty and community priorities? | Deliberation support, never an automated decision. |

Each level is useful on its own. The project should never wait for level 5 to
deliver value, and it should never present a level-1 sensitivity run as though
it were a level-4 causal evaluation.

## Program A — make the current spectral math scientifically stronger

This is the highest-return investment because it improves every present and
future city workflow.

### A1. Full uncertainty propagation

Today, a graph result depends on choices such as raster resolution, masking,
adjacency, $\alpha$, $\beta$, NDVI availability, sink threshold, and
edge-retention probability. Treat these as declared uncertain inputs:

$$
\theta = (r, m, a, \alpha, \beta, q_{sink}, p, \ldots)
$$

For samples $\theta^{(1)},\ldots,\theta^{(K)}$, compute the full output
bundle:

$$
Y^{(k)} = \big(\lambda_2^{(k)},\, \phi^{(k)},\,
\text{access}^{(k)},\,\text{boundary}^{(k)}\big).
$$

Then publish:

- a boundary persistence map: the share of runs in which a cell lies near a
  selected cut boundary;
- intervals for $\lambda_2$, conductance, access, and sink reachability;
- sensitivity ranking showing which inputs drive the result; and
- a “not stable enough to interpret” state when persistence is low.

**Compute design:** embarrassingly parallel ensemble jobs; object storage for
intermediate artifacts; a compact manifest for each member; aggregate only the
statistics required for public display. A few CPU workers can begin this work;
larger clusters shorten turnaround rather than change the scientific contract.

### A2. Better graph construction

Move from one raster adjacency rule toward a multi-layer graph while keeping
each edge meaning explicit:

$$
W = \eta_T W_{thermal} + \eta_V W_{vegetation} + \eta_S W_{shade}
    + \eta_M W_{materials} + \eta_P W_{pedestrian},
$$

where every $\eta$ is a documented scenario parameter, not a learned hidden
weight. Possible layers include:

- thermal similarity and local gradient;
- canopy, vegetation health, and shade continuity;
- impervious surface and albedo;
- street canyon geometry and pedestrian routes;
- verified public cooling resources and opening hours; and
- barriers, ownership, and accessibility constraints.

Do not merge these layers into one public “heat score.” Let users inspect them
separately, then show how a declared combination changes the structural model.

### A3. More honest random stress models

Independent edge deletion is a teaching baseline, not a realistic climate
hazard model. Future stress tests can model correlated disruptions:

$$
\Pr(Z_e=1 \mid X, H) = \operatorname{logit}^{-1}
  (\gamma_0 + \gamma^\top X_e + u_{\text{neighborhood}} + v_{\text{event}}),
$$

where $Z_e$ represents retained model connectivity, $X_e$ contains
declared edge characteristics, and the random effects represent shared event
conditions. The point is not to forecast a failure; it is to test whether a
conclusion survives plausible *correlated* stress rather than only independent
loss.

## Program B — build a spatiotemporal urban-heat evidence engine

### B1. Fuse sources at their honest scale

A serious city evidence cube would keep each source’s spatial and temporal
truth intact:

| Source | Typical contribution | Essential caveat |
| --- | --- | --- |
| Satellite land-surface temperature | Broad spatial thermal pattern | Surface, not air or indoor temperature; revisit and cloud limits. |
| Fixed and mobile sensors | Near-surface temperature/humidity at sampled places | Sparse, placement-sensitive, calibration-sensitive. |
| Weather stations and reanalysis | Event-scale boundary conditions | Coarser than neighborhood microclimate. |
| LiDAR/building/terrain geometry | Shade, sky view, canyon structure | Licensing and update frequency vary. |
| Tree inventory and canopy | Vegetation condition and intervention baseline | Inventory completeness and maintenance bias. |
| Community observations | Lived heat, shade, access, and safety context | Requires consent, moderation, and careful non-identifying design. |

Use a data cube indexed by place, time, source, resolution, license, and
quality flags. Never interpolate away the distinction between a satellite
pixel, a street sensor, and a resident observation.

### B2. Bayesian data assimilation

For a latent near-surface thermal state $x_t$, a future model can combine a
dynamic process model with observations:

$$
x_t = F_t x_{t-1} + B_t u_t + \omega_t, \qquad
y_t = H_t x_t + \epsilon_t.
$$

The practical promise is an uncertainty-aware estimate, not fake precision:
the model should show wider intervals where sensors are absent, clouds obscure
surface observations, or geometry is incomplete. Candidate methods include
ensemble Kalman filtering for operational speed and Bayesian hierarchical
models for fuller uncertainty reporting.

### B3. Extreme-event archive

Create a versioned archive of selected heat events. Each event package should
contain weather context, source inventory, quality checks, model configuration,
community questions, outputs, validation findings, and corrections. Over time,
this becomes more valuable than a single “perfect” map because it enables
cross-event learning and honest model comparison.

## Program C — use high-performance physics selectively

Physics can be transformative, but it should be used where its additional
detail changes a real decision.

### C1. Urban canopy modelling

An urban canopy model can represent surface energy balance, radiation,
turbulence parameterization, vegetation, and anthropogenic heat at a
neighborhood scale. It is appropriate for questions such as:

- how shade, trees, pavement, and roof surfaces shift a daytime heat budget;
- how a heat event interacts with a district’s geometry; and
- which assumptions dominate a scenario response.

It is not a substitute for measurements. Every run needs weather forcing,
surface parameters, geometry assumptions, and calibration/validation data.

### C2. CFD and large-eddy simulation

For a small, carefully chosen public realm—such as a school route, transit
stop cluster, plaza, or cooling-center approach—computational fluid dynamics
can estimate wind, radiation, and local exchange at high resolution. A useful
workflow is:

1. Co-design the site and question with local partners.
2. Survey geometry, materials, trees, and observed conditions.
3. Run an ensemble of boundary conditions, not one “best” simulation.
4. Compare simulation output to measured conditions.
5. Publish the error, uncertainty, and model configuration beside visuals.

Large-eddy simulation is computationally expensive and should be reserved for
mechanism questions where a coarse model cannot distinguish alternatives. It
should not become a decorative animation or a claim about an unmeasured block.

### C3. Physics-informed surrogates

Once a limited set of high-fidelity simulations has been validated, train a
surrogate model to approximate scenario responses quickly:

$$
\widehat{f}_{\text{surrogate}}(\text{geometry},\text{weather},\text{intervention})
\approx f_{\text{physics}}(\cdot).
$$

Useful techniques include Gaussian-process emulators, reduced-order models,
neural operators, and physics-informed neural networks. The surrogate must
report out-of-distribution warnings, uncertainty, and the conditions under
which it was trained. It must not silently extrapolate from one neighborhood
to an entire city.

## Program D — make interventions evaluable, not merely attractive

The public value of extreme computation rises sharply when it is paired with a
registered real-world learning program.

### D1. Pre-register the question before installation

Before a tree, shade structure, cool roof, pavement treatment, or cooling
access program is evaluated, register:

- intervention geometry, timing, maintenance, and comparison areas;
- outcomes and units: surface temperature, air temperature, mean radiant
  temperature, shade duration, access, energy, or heat-health proxy;
- inclusion/exclusion rules and data-quality thresholds;
- confounders and weather controls;
- causal design, placebo checks, sensitivity analyses, and equity analysis;
- community governance, consent, communications, and correction pathway.

### D2. Causal designs that fit civic reality

No single method fits every intervention. The research team can choose among:

- **difference-in-differences** when treated and comparison places have
  credible parallel pre-trends;
- **synthetic control** when one district has a useful donor pool;
- **interrupted time series** when dense repeated measurements exist;
- **matched observational designs** when interventions are distributed; and
- **randomized or stepped-wedge designs** only where ethical and feasible.

For example, a difference-in-differences estimand can be expressed as:

$$
\tau = (\bar Y_{T,post} - \bar Y_{T,pre}) -
       (\bar Y_{C,post} - \bar Y_{C,pre}).
$$

The equation is simple; the credibility comes from design diagnostics,
measurement quality, and transparent limitations.

## Program E — optimize portfolios under uncertainty and equity constraints

When the platform has validated inputs and partner-approved objectives, it can
move from ranking isolated sites toward comparing *portfolios*. A future robust
multi-objective problem may be:

$$
\max_{x \in \mathcal X}
\; \Big(\mathbb E[B(x,\xi)],\; -\mathbb E[C(x,\xi)],\;
       \mathbb E[A(x,\xi)]\Big)
$$

subject to budget, maintenance, safety, accessibility, land-control, and
distributional constraints. Here $x$ is a portfolio, $\xi$ represents
uncertain weather and model inputs, $B$ is a validated benefit measure,
$C$ cost, and $A$ an access/equity criterion chosen with partners.

Important design choices:

- show a **Pareto frontier**, not one supposedly optimal answer;
- allow partners to inspect weights and constraints;
- test whether a solution shifts benefits away from historically burdened
  communities;
- include maintenance and failure modes, not only installation costs; and
- use value-of-information analysis to show whether a new sensor, survey, or
  pilot would change a decision more than another model run.

## Computation and data architecture

### Workload tiers

| Tier | Typical workload | Suggested pattern | Why it matters |
| --- | --- | --- | --- |
| Laptop / CI | Core graph metrics, small tests, documentation checks | Python, NumPy, NetworkX, deterministic seeds | Keeps the method inspectable by contributors. |
| Parallel CPU | Sensitivity ensembles, raster pipelines, bootstrap validation | Queue workers, chunked rasters, object storage, run manifests | Increases rigor without forcing GPU dependence. |
| GPU | Surrogate training, remote-sensing segmentation, large probabilistic models | Containerized jobs, experiment tracking, held-out geography/event tests | Useful only with strong evaluation and data governance. |
| HPC | CFD/LES ensembles and high-resolution radiative simulations | Scheduled batch jobs, domain decomposition, immutable inputs, output reduction | Reserve for co-designed sites and decision-relevant physics. |

### Required reproducibility record

Every serious run should emit a machine-readable manifest containing:

- city and study-boundary versions;
- input source, license, acquisition time, resolution, CRS, masks, and hashes;
- graph rule, parameters, sink rule, random seeds, and software revision;
- compute environment/container digest and hardware class;
- output paths, checksums, uncertainty summary, and validation status;
- a plain-language statement of what the output means and does not mean.

The platform should expose a readable version of this record in the Audit mode
and provide the full form for download.

### Privacy and safety architecture

- Process exact addresses, if ever approved, in a separately governed service
  with affirmative consent, short retention, access controls, audit logs, and
  deletion pathways.
- Publish only aggregation levels that meet a documented re-identification and
  harm review.
- Keep community observation intake distinct from public map layers until
  moderation, consent, and safety review are complete.
- Treat school, health, housing, and cooling-center data as sensitive even
  when a source is technically public.

## A realistic phased research plan

### Phase F1 — uncertainty first

Build parameter manifests, ensemble execution, boundary-persistence outputs,
and sensitivity reports for the existing graph pipeline. Deliver a public
“confidence in this pattern” panel only after it has been tested with users.

**Exit gate:** independent rerun on a held-out city package; documented
parameter rationale; no public output where stability is inadequate.

### Phase F2 — event evidence and ground truth

Co-design one Boston-area or future-city event study with a community and
public partner. Combine authoritative weather context, limited calibrated
sensors, satellite products, shade observations, and the graph outputs.

**Exit gate:** registered protocol, data governance approval, sensor QA/QC,
and a public report comparing modelled and observed patterns.

### Phase F3 — targeted physics pilot

Select one bounded public site where a real decision needs physical detail.
Run urban-canopy or CFD ensembles with measurement comparison and an explicit
error budget.

**Exit gate:** external domain review; disclosed validation error; a partner
confirms the result is useful for a real decision rather than only visually
interesting.

### Phase F4 — evaluated intervention learning loop

Study a real intervention with a pre-registered causal design. Publish
positive, null, and adverse findings with equal visibility.

**Exit gate:** credible counterfactual diagnostics, equity review, community
interpretation session, and a correction/appeal process.

### Phase F5 — participatory portfolio explorer

Only after validated intervention evidence exists, introduce robust portfolio
comparison with uncertainty and equity constraints. The interface should let
people deliberate over trade-offs; it must not recommend a single “best” plan
without a decision owner and public process.

**Exit gate:** partner-approved objective function, accessibility testing,
fairness stress tests, governance policy, and independent red-team review.

## The first investments I would make

If resources are limited, invest in this order:

1. **Uncertainty propagation and reproducible manifests.** This makes current
   work substantially more credible before adding any new model.
2. **A carefully governed measurement campaign.** A small amount of good
   ground truth is often more valuable than a much larger opaque compute bill.
3. **One co-designed physical pilot.** Use expensive simulation where partners
   have a genuine question and there is a way to measure whether it helps.
4. **Open, accessible evidence communication.** Every technical advance needs
   a plain-language, downloadable, and citable companion.
5. **Only then, advanced AI or optimization.** High-capacity models should
   amplify validated learning, not outrun it.

## What success looks like

Success is not a dashboard that appears omniscient. It is a public-interest
research system in which someone can ask:

> “Why does this map suggest this place? What assumptions matter? Who checked
> it? What would change the conclusion? And how can my community help decide
> what happens next?”

If the platform can answer those questions clearly—even while running advanced
math on serious infrastructure—it will have used computation in a way that is
both technically ambitious and worthy of public trust.
