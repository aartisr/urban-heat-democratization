# Map Stack Evaluation

This note records the current frontend map-stack reality in Urban Heat Democratization.

## Current State

- The app currently uses `maplibre-gl`.
- The atlas is already lazy-loaded, so the main app shell stays lighter until a city atlas is opened.
- The vendor graph has been split more explicitly in Vite.
- Even after that split, the core lazy `maplibre` runtime remains very large.

Observed production-build signal:

- `maplibre-core` remains roughly `1,054 kB` minified before gzip in the current build shape.

## What This Means

- The shell and non-map routes are in better shape than before.
- The biggest remaining frontend performance cost is the interactive atlas runtime itself.
- This is not mainly a styling problem or a chunk-naming problem anymore.

## Honest Recommendation

Keep `maplibre-gl` if all of the following remain true:

- we need a real geographic basemap,
- we need rich vector-layer control,
- we need polygon interaction, fit-bounds, hover, click, and multiple overlay layers,
- we want to stay close to the current implementation with minimal rewrite risk.

Consider replacing `maplibre-gl` only if the primary goal becomes dramatically lighter atlas startup over maximum map capability.

## Likely Replacement Paths

### 1. Leaflet

Pros:

- usually much lighter for this kind of overlay-heavy civic map,
- strong ecosystem,
- easier to reason about for simple basemap + GeoJSON overlays.

Cons:

- less modern rendering model,
- weaker fit for more advanced vector-style-map workflows,
- would require atlas rewrite work.

Best fit if:

- the app mainly needs tiled basemap + GeoJSON overlays + popups + controls.

### 2. Custom SVG/Canvas Atlas

Pros:

- potentially the lightest runtime,
- full control over storytelling and presentation,
- strongest path if we want a highly curated, non-generic atlas experience.

Cons:

- more custom engineering,
- more work for pan/zoom and basemap parity,
- weaker general-purpose map behavior unless we rebuild a lot ourselves.

Best fit if:

- the product is prioritizing a premium research-story surface over a general GIS-like map.

### 3. Keep MapLibre and Optimize Around It

Pros:

- lowest rewrite risk,
- preserves current behavior and real basemap workflow,
- easiest short-term path.

Cons:

- the heavy lazy chunk remains.

Best fit if:

- we want to preserve capability and focus current effort on UX, correctness, and data depth.

## Recommended Next Step

Short term:

- keep `maplibre-gl`,
- continue improving the atlas UX and data story,
- accept that the atlas runtime is still heavy but isolated behind explicit user activation.

Medium term:

- prototype one Boston city page using a lighter map stack, most likely `Leaflet`, and compare:
  - startup feel,
  - interactivity parity,
  - implementation complexity,
  - visual quality.

## Decision

Current recommendation:

- do **not** rewrite the atlas map stack immediately,
- do **prototype** a lighter alternative if frontend atlas startup becomes a top-priority objective.
