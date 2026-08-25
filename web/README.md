# Urban Heat Democratization Web App

This is the public-facing research workspace for Urban Heat Democratization:
the place where a visitor can move from **“Where should we look?”** to a
visible layer, an understandable method, and a clearly bounded planning
conversation.

The frontend is intentionally not a generic dashboard. It uses progressive
disclosure: begin with a question, open technical depth only when it helps, and
keep source status and uncertainty visible throughout.

## What this app delivers

- An accessible overview that leads directly into the Boston bundled study.
- A map-first city experience with unobstructed full-page mode and compact
  layer controls.
- Plain-language explanations beside the spectral and graph-based science.
- Transparent, benchmark-based scenario exploration—not a procurement engine
  or city-calibrated prediction system.
- Exports, onboarding, and run records that keep the work portable and
  inspectable.

For the public purpose, evidence boundaries, and current bundled-data scope,
read the root [project README](../README.md) before changing product copy.

## Stack

- TanStack Router
- TanStack Query
- TanStack Form
- TanStack Table
- Vite + React + TypeScript

## Local development

```bash
npm install
npm run dev
```

Then open the local address printed by Vite. Run `npm install` from this
directory—not the repository root—because the frontend package manifest lives
in `web/package.json`.

## Quality gates

Run these before handing off visual or interaction work:

```bash
npm run build
npm test
npm run check:lockfile
npm run check:contrast
npm run check:performance
```

`check:contrast` protects the central text tokens as well as the dark science
formula and disclosure treatments. `check:performance` protects the lazy map
boundary and route-size budgets; it does not make a claim about real-world
network performance on every device. `check:lockfile` ensures the committed
lockfile uses only the public npm registry and includes declared optional
cross-platform packages, keeping contributor and deployment installs
reproducible without depending on a private registry.

## Progressive Web App behavior

The app uses a dependency-free PWA boundary so it remains portable across Vite
hosts and does not couple the UI to a plugin. `npm run dev` and `npm run build`
generate `public/sw.js` from `scripts/prepare-pwa.mjs`; it is intentionally
ignored because it carries a fingerprint of the current application sources.

- `public/site.webmanifest`, `favicon.svg`, and `offline.html` are the stable
  install assets.
- `src/components/pwa-controls.tsx` is the reusable, optional UI. It appears
  only when the browser makes installation available.
- A changed build fingerprint makes the next worker wait; the user can choose
  **Update now** or **Later**. No update reload is automatic.
- Navigation is network-first and has a deliberately small offline fallback.
  It does not cache live evidence, maps, or API responses as if they were
  current.

## Notes

- The API client can use the Python backend and falls back to local mock data
  when a development API is unavailable, so core walkthroughs remain usable.
- Heavy map code is lazy-loaded behind the city-map boundary; build and
  performance checks are available through `npm run build` and
  `npm run check:performance`.
- Run `npm run check:contrast` after visual work. It covers semantic tokens
  plus the dark science formula and disclosure treatments.
- For the current product workflow and evidence boundaries, start with the
  root [README](../README.md), [Screen Tour](../docs/SCREEN_TOUR.md), and
  [Impact Evidence Protocol](../docs/IMPACT_EVIDENCE_PROTOCOL.md).
- Keep visual decisions centralized in `src/styles.css`. The
  [Design and Accessibility System](../docs/DESIGN_ACCESSIBILITY_SYSTEM.md)
  documents the surface, contrast, and responsive-shell contract.
