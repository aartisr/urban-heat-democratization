# Spectral Theory Contract: What the Mathematics Establishes

> Authored by [Aarti S Ravikumar](https://ai-aarti.com) · The canonical living platform is [urban-heat.ai-aarti.com](https://urban-heat.ai-aarti.com/).

## Why a contract

Spectral graph theory is powerful because it makes a precise statement about a
precisely defined graph. It becomes misleading only when that statement is
silently expanded into a claim about people, health, or an intervention. This
contract keeps those levels distinct.

## The exact object being analysed

For valid raster cells, the implementation constructs an undirected weighted
graph $G=(V,E,W)$. The edge construction is documented in
[`core/graph.py`](../../core/graph.py):

$$
w_{ij}=\exp(-\alpha g_{ij})(1+\beta\,\overline{\mathrm{NDVI}}_{ij}),
\qquad c_{ij}=\ell_{ij}/w_{ij}.
$$

Here $g_{ij}$ is a local gradient-derived barrier proxy, $w_{ij}$ is a chosen
conductance, and $c_{ij}$ is the least-cost-path input. These quantities are
not direct measurements of energy transport, human travel, health exposure, or
the performance of a proposed intervention.

## What the spectral result establishes

The normalized Laplacian is

$$
\mathcal L=I-D^{-1/2}WD^{-1/2}.
$$

For a connected, nonnegative weighted graph, the code computes its second
eigenpair and searches threshold sets along the Fiedler-vector ordering. For
each candidate $S$, it evaluates

$$
\phi(S)=\frac{\operatorname{cut}(S,V\setminus S)}
{\min\{\operatorname{vol}(S),\operatorname{vol}(V\setminus S)\}}.
$$

The selected result is the **lowest-conductance Fiedler sweep cut**, not an
exhaustive global search of all subsets. Cheeger inequalities explain why the
second eigenvalue and conductance are related:

$$
\lambda_2/2\leq\phi_*\leq\sqrt{2\lambda_2}.
$$

The guarantee is mathematical: it concerns connectivity of this specified
weighted graph. The implementation rejects disconnected inputs because then a
unique Fiedler bottleneck interpretation is not available.

## What needs validation outside the graph

No graph theorem validates the input raster, edge-weight design, cooling-sink
proxy, boundary choice, or intervention mechanism. Those require source
provenance, sensitivity analysis across plausible parameters, field and local
expert review, community knowledge, and—when claiming outcomes—a pre-specified
evaluation design.

## The honest conclusion

The spectral layer gives a reproducible answer to: *where is the chosen model
weakly connected?* Its civic value is that this answer is inspectable and can
be challenged. It does not answer: *where are people harmed?*, *what project
will work best?*, or *what temperature reduction will occur?*

Read the [worked example](08-graph-theory-worked-example.md) for an intuitive
four-cell derivation and [science and interpretation](03-science-and-interpretation.md)
for the responsible-use protocol.
