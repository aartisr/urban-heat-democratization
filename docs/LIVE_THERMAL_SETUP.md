# Live Thermal Setup

This app now supports a real background refresh path for thermal layers, but it does not pretend that live Landsat or ECOSTRESS data is magically available by default.

## What Exists Now

- The atlas can enable or disable background live-thermal refresh.
- The API can refresh in a background thread without blocking normal map use.
- The map can keep showing bundled study layers while live adapter refresh runs asynchronously.
- If a valid live adapter is configured, the map will merge the latest fetched thermal sources into the atlas payload.
- If a live adapter is unreachable, the API can fall back to locally cached thermal data and clearly mark the atlas as using cached fallback data.
- If auto-refresh was enabled before an API restart, the worker will resume on startup.

## What You Must Configure

Create this file:

- `data/live_thermal_sources.json`

You can start from:

- `data/live_thermal_sources.example.json`
- `docs/LIVE_PROVIDER_BRIDGES.md`

## Expected Adapter Payload Shape

Each configured adapter location must return a JSON object with:

- `surfaceGeojson`
- `corridorGeojson`
- `bounds`

Optional fields:

- `id`
- `label`
- `sourceName`
- `provider`
- `sensor`
- `sceneId`
- `capturedAt`
- `publishedAt`
- `adapterKind`
- `resolutionM`
- `meanTempC`
- `stdTempC`
- `minTempC`
- `maxTempC`
- `thresholdTempC`
- `corridorQuantile`
- `filePath`
- `metadataPath`

Optional adapter config fields:

- `adapterKind`
- `responsePath`
- `timeoutSec`
- `headers`
- `backupLocation`

## Important Honesty Note

This feature provides the async refresh and merge mechanism.

It does **not** by itself turn raw NASA or USGS products into ready-to-render city thermal layers.

You still need an adapter endpoint or file-generation step that converts your chosen source into the app's thermal-source JSON contract.
For resilience, point `backupLocation` at a static JSON copy that can be used when the live bridge or network is unavailable. The atlas will treat it as cached fallback data when needed.

What the backend now does for you:

- runs background refresh on a worker thread,
- supports file or URL adapter locations,
- can unwrap nested JSON responses with `responsePath`,
- can send request headers when your adapter endpoint requires them,
- persists the latest live payload and resumes auto-refresh after API restart,
- surfaces latest scene timestamps in the atlas when your adapter includes `capturedAt`.

## Operational Flow

1. Configure `data/live_thermal_sources.json`.
2. Start the API.
3. Open the city atlas.
4. In the `Thermal` control tab:
   - enable `Auto-refresh live data when configured`
   - or press `Refresh now`
5. The map will continue rendering while refresh happens in the background.

## Current Recommendation

Use this for:

- preprocessed live adapter feeds,
- scheduled external pipelines that emit city-ready JSON,
- local file-based testing before pointing to remote URLs.

Do not interpret this as direct raw-satellite ingestion inside the app today.

## Included First-Party Bridge Scripts

This repo now ships with:

- `scripts/fetch_landsat_live_source.py`
- `scripts/fetch_ecostress_live_source.py`
- `scripts/build_live_thermal_bridge.py`

These scripts query official provider metadata, combine that metadata with the app's existing city-ready thermal contract, and write local JSON files that the async live adapter can load.

Typical flow:

```bash
make live-landsat CITY=boston
make live-ecostress CITY=boston
```

Then enable the atlas live adapter.
