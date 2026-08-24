# Repeatability and Real-World Validation

> Authored by [Aarti S Ravikumar](https://ai-aarti.com) · The canonical living platform is [urban-heat.ai-aarti.com](https://urban-heat.ai-aarti.com/).

## Two standards, kept separate

**Repeatability** asks whether the same code, inputs, parameters, and random
seeds return the same output. **Real-world validity** asks whether the modelled
signal corresponds to a decision-relevant condition or an outcome outside the
computer. A project can satisfy the first standard without yet satisfying the
second; this project reports that distinction openly.

## What is repeatable today

The scientific core has a fixed reference test in
[`tests/test_reproducibility.py`](../../tests/test_reproducibility.py). It runs
the same small weighted raster graph twice with identical inputs and fixed
random seeds, then requires equality of:

- graph-derived spectral gap and sweep conductance;
- selected sweep-cut node set;
- bond-percolation outputs; and
- Monte Carlo sink-reliability estimate.

The production pipeline also records its graph construction parameters,
including raster connectivity, gradient sensitivity, vegetation uplift, sink
rule, retention probability, trial count, and seeds. Any released result should
also preserve input identifiers, source date, CRS, raster resolution, masks,
software revision, and artifact hashes.

## What must happen before real-world use

Use the present spectral layers as an investigation and prioritization aid only.
Before an agency uses them to target a program, complete this validation path:

1. **Pre-specify the decision.** Define the operational question, eligible area,
   decision owner, and the claim the model is and is not allowed to support.
2. **Validate inputs locally.** Check boundary, source date, thermal surface,
   canopy/cooling-sink rule, missingness, and spatial resolution with local
   technical owners and community reviewers.
3. **Run sensitivity analysis.** Recompute under defensible alternatives for
   graph adjacency, weights, sink threshold, raster resolution, and masks.
   Treat an unstable result as a request for more evidence, not as a ranking.
4. **Ground-truth the interpretation.** Compare candidate areas with field
   observation, shade timing, publicly accessible cooling resources, safe
   routes, housing conditions where appropriate, and resident knowledge.
5. **Evaluate implementation separately.** For an intervention claim, collect
   before/after data and use a pre-specified comparison strategy with uncertainty
   reporting. A spectral improvement alone is not an observed heat benefit.
6. **Publish the decision record.** State inputs, reviewers, alternatives,
   uncertainty, action taken, and what changed after feedback.

## The honest real-world claim

The method is suitable for a real-world **workflow**: making assumptions
visible, identifying modelled structural candidates, organizing local review,
and preserving an auditable record. It is not yet evidence that a specific
intervention works in Boston or any other city. That evidence must come from
the validation and evaluation process above.

See the [Spectral Theory Contract](09-spectral-theory-contract.md) for the
mathematical scope and the [Impact Evidence Protocol](../IMPACT_EVIDENCE_PROTOCOL.md)
for outcome and causal-claim governance.
