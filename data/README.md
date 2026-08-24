# Evidence and bundled study data

This directory holds the compact, version-controlled evidence used by the
bundled Urban Heat Democratization experience. It is not a claim that every
file is a complete city model. Each dataset must be interpreted according to
its provenance, coverage, evidence state, and documented limitations.

## What belongs here

- Small, shareable inputs needed to reproduce the bundled demonstration.
- Intervention catalogues and cost references with clear evidence labels.
- Package metadata that tells the app what is bundled and what is merely an
  onboarding or planning preset.
- Small demo rasters and overlays suitable for repository storage.

## What does not belong here

- Credentials, provider tokens, private source data, or personally identifying
  information.
- Large raw satellite scenes or unreviewed files presented as validated city
  evidence.
- A cost or benefit value without its source, geography, unit, currency/year,
  and stated limitation.

## Key files

- `intervention_catalog.json` — base intervention catalogue; entries may be
  ranking-only or benchmark-only and are never silently promoted to verified
  unit costs.
- `intervention_unit_costs.json` — dedicated source-backed unit-cost overrides
  merged into the catalogue at API load time.
- `cost_sources.json` — benchmark and comparative planning references used to
  explain, not conceal, scenario assumptions.

## Contribution standard

Before adding or changing an evidence file, verify that the interface can say
what the file is, when and where it applies, who published it, and what it
cannot establish. Follow the project’s [evidence and responsible-use
guide](../docs/wiki/04-evidence-and-responsible-use.md) and [impact evidence
protocol](../docs/IMPACT_EVIDENCE_PROTOCOL.md).

Place small demo rasters here only when needed, for example:

- `demo_lst.tif`
- `demo_ndvi.tif`
