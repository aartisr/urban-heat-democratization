# Urban Heat Democratization: Production Blueprint

## Product North Star

Build the fastest and most trusted urban heat planning operating system for cities, schools, climate NGOs, and infrastructure teams.

Success equation:

$$
\text{Trust} \times \text{Usability} \times \text{Distribution} \times \text{Data Freshness}
$$

## Architecture Boundaries

1. `web/`: UX shell, query caching, map rendering, user workflows.
2. `api/`: business APIs, runtime orchestration, audit and trust metadata, live adapter control.
3. `core/`: deterministic domain logic (spectral, reliability, planning).
4. `data/`: curated public artifacts and benchmark evidence.
5. `data/runtime/`: mutable runtime state and SQLite mirrors.

Boundary rule: no product policy logic in `web/`; no view formatting logic in `core/`.

## Production Readiness Checklist

1. Reliability

- Per-request request ID propagation (`x-request-id`) from frontend to API.
- Structured request logs with latency and status.
- Thread-safe runtime writes for city/scenario/run stores.
- Health endpoints include uptime and version metadata.

1. Security and Compliance

- Security headers: `x-content-type-options`, `x-frame-options`, `referrer-policy`.
- API payload validation at request boundary (Pydantic models).
- Immutable evidence references for benchmark and unit-cost sources.

1. Performance

- Compressed API responses (gzip middleware).
- Query-layer stale caching and reduced focus-refetch churn.
- Safe retries only for idempotent reads on transient failure classes.

1. Observability

- Error envelopes include request IDs.
- Request logs are machine-parsable for SIEM or dashboard ingestion.

## UX Strategy Inspired by High-Traffic Products

Reference principles (not copied design):

1. Dashboard immediacy (Stripe-style): show critical metrics and next actions above the fold.
2. Guided workflows (Notion-style): users always see a suggested next step.
3. Progressive detail (Figma-style): overview first, inspect details on demand.
4. Trust scaffolding (Bloomberg/NYT graphics style): every metric links to provenance.
5. Fast navigation (Linear-style): keyboard-first interactions and low-latency transitions.

## Viral Growth Loops

1. Share Loop

- One-click export of city briefing cards with signed provenance metadata.
- Public viewer links for scenario comparisons.

1. Team Loop

- Invite collaborators into city workspaces.
- Comment and annotate on map zones and scenarios.

1. Evidence Loop

- Publish “before/after” intervention outcomes that link back to methods and data.

## Monetization Model

1. Free

- Public city views, educational overlays, low-rate scenario simulation.

1. Pro (City Teams)

- Unlimited scenarios, team workspaces, role-based access, export templates.

1. Enterprise

- SSO/SAML, private deployment, API SLAs, data residency and audit exports.

1. Data/API Add-ons

- Live thermal adapter bundles, premium benchmark packs, white-label reporting.

## KPI Scoreboard

1. Activation: first scenario generated within 10 minutes.
2. Trust: percentage of outputs with complete provenance manifest.
3. Engagement: weekly active planners and exported briefs per workspace.
4. Retention: 30-day return rate of onboarded organizations.
5. Revenue: conversion rate from free to Pro, average contract value.

## Next 30-Day Execution Plan

1. Split `api/main.py` into modular routers/services (`api/routers`, `api/services`, `api/repositories`).
2. Add role-based auth and organization workspaces.
3. Add async job worker for run execution with queue durability.
4. Add map tile and artifact CDN strategy for global performance.
5. Add product analytics event taxonomy and A/B capability for onboarding.
