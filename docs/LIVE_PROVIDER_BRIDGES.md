# Live Provider Bridges

This repo now includes first-party bridge scripts for Landsat and ECOSTRESS.

They do something very specific and very honest:

- Landsat: query the official USGS LandsatLook STAC for the latest matching scene over a city bbox,
- ECOSTRESS: query official NASA CMR granule metadata for the latest matching scene over a city bbox,
- take the app's existing city-ready thermal surface contract,
- stamp the latest provider scene metadata onto that contract,
- write a JSON file that the async live-thermal adapter can load in the background.

They do **not** yet:

- download raw rasters into the request path,
- raster-process new citywide thermal polygons inside the API,
- claim second-by-second satellite streaming.

## Why this still matters

This gives the atlas a real provider-backed freshness signal today:

- latest scene id,
- scene capture time,
- scene publish/update time,
- provider-backed metadata links.

That is enough to power an honest "freshest available scene" experience while keeping the heavy raster work outside the web request cycle.

## Scripts

- `scripts/build_live_thermal_bridge.py`
  Generic bridge builder using official CMR granule search.
- `scripts/fetch_landsat_live_source.py`
  Landsat wrapper.
- `scripts/fetch_ecostress_live_source.py`
  ECOSTRESS wrapper.

## Current defaults

ECOSTRESS default:

- collection concept id: `C2076090826-LPCLOUD`
- product: `ECO_L2T_LSTE_002`

Landsat default:

- official USGS STAC collection id: `landsat-c2l2-st`
- use the STAC bridge path rather than a CMR collection concept id

Important:

- The ECOSTRESS default is strong and specific.
- The Landsat bridge uses the official USGS LandsatLook STAC because it returns Boston scenes reliably in this workflow.

## Commands

From the repo root:

```bash
make live-landsat CITY=boston
make live-ecostress CITY=boston
```

These write:

- `data/runtime/live_thermal/providers/boston_landsat_live.json`
- `data/runtime/live_thermal/providers/boston_ecostress_live.json`

## Wiring into the app

1. Copy `data/live_thermal_sources.example.json` to `data/live_thermal_sources.json`.
2. Run the bridge scripts.
3. Start the API.
4. Open the city atlas.
5. In the `Thermal` tab, enable `Auto-refresh live data when configured`.

## What to do next for true production freshness

1. Replace bundled geometry with externally generated city-ready surfaces from a scheduled raster pipeline.
2. Narrow Landsat collection choice for the exact product family you trust operationally.
3. Add scene-quality filters, for example cloud or obstruction screening, before publishing bridge outputs.
