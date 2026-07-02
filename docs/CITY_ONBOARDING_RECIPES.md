# City Onboarding Recipes

This document gives copy-friendly onboarding patterns for common city cases.

## Before you begin

Start the API:

```bash
cd /Users/rraviku2/aarti/urban_heat_democratization
source .venv/bin/activate
PYTHONPATH=. uvicorn api.main:app --reload
```

## Recipe: Cambridge from a local GeoJSON upload

Best when:

- you already have `cambridge.geojson`
- you want the fastest upload-first test

### UI path

1. Open `Cities`.
2. Enter `Cambridge`.
3. Choose `upload`.
4. Upload `cambridge.geojson`.
5. Submit the form.
6. Open the new city detail page.

### API path

```bash
python3 - <<'PY' > /tmp/cambridge-onboard.json
from pathlib import Path
import json

payload = {
    "name": "Cambridge",
    "region": "Massachusetts",
    "population": "118000",
    "boundarySource": "upload",
    "boundaryPath": None,
    "boundaryFileName": "cambridge.geojson",
    "boundaryGeojsonText": Path("cambridge.geojson").read_text(),
    "notes": "Uploaded Cambridge boundary for heat-planning research."
}
print(json.dumps(payload))
PY

curl -X POST http://127.0.0.1:8000/api/v1/cities/onboard \
  -H "Content-Type: application/json" \
  --data @/tmp/cambridge-onboard.json
```

## Recipe: New York City preset with uploaded boundary

Best when:

- you want a preset city identity
- you do not yet have bundled NYC artifacts

### UI path

1. Open `Cities`.
2. Choose `New York City` from the preset selector.
3. Upload a valid NYC boundary GeoJSON.
4. Submit the form.
5. Open city detail and review readiness.

### API path

```bash
python3 - <<'PY' > /tmp/nyc-onboard.json
from pathlib import Path
import json

payload = {
    "name": "New York City",
    "region": "Northeast US",
    "population": "8800000",
    "boundarySource": "upload",
    "boundaryPath": None,
    "boundaryFileName": "new_york_city.geojson",
    "boundaryGeojsonText": Path("new_york_city.geojson").read_text(),
    "notes": "Upload-first New York City onboarding."
}
print(json.dumps(payload))
PY

curl -X POST http://127.0.0.1:8000/api/v1/cities/onboard \
  -H "Content-Type: application/json" \
  --data @/tmp/nyc-onboard.json
```

## Recipe: Chicago from an existing boundary path

Best when:

- the backend machine already has the boundary file
- you prefer `catalog` mode over upload

```bash
cat > /tmp/chicago-onboard.json <<'JSON'
{
  "name": "Chicago",
  "region": "Midwest US",
  "population": "2700000",
  "boundarySource": "catalog",
  "boundaryPath": "/absolute/path/to/chicago_boundary.geojson",
  "boundaryFileName": null,
  "boundaryGeojsonText": null,
  "notes": "Chicago onboarding from an existing local boundary path."
}
JSON

curl -X POST http://127.0.0.1:8000/api/v1/cities/onboard \
  -H "Content-Type: application/json" \
  --data @/tmp/chicago-onboard.json
```

## Recipe: Los Angeles for benchmark planning

Best when:

- you want scenario scaffolding first
- you understand the repo still does not provide bundled LA overlays

```bash
python3 - <<'PY' > /tmp/la-onboard.json
from pathlib import Path
import json

payload = {
    "name": "Los Angeles",
    "region": "West US",
    "population": "3800000",
    "boundarySource": "upload",
    "boundaryPath": None,
    "boundaryFileName": "los_angeles.geojson",
    "boundaryGeojsonText": Path("los_angeles.geojson").read_text(),
    "notes": "Los Angeles upload-first onboarding for benchmark what-if planning."
}
print(json.dumps(payload))
PY

curl -X POST http://127.0.0.1:8000/api/v1/cities/onboard \
  -H "Content-Type: application/json" \
  --data @/tmp/la-onboard.json
```

Then:

1. Open `Scenarios`
2. choose `Los Angeles`
3. generate benchmark what-if scenarios

## Recipe: Houston with partial local data

Best when:

- you have a boundary and some local files
- you want to test readiness and export flows

### Suggested flow

1. Onboard Houston with `upload` or `catalog`.
2. Open Houston city detail.
3. Register:
   - thermal inputs
   - artifact bundle
   - bottleneck overlay
   - cooling overlay
4. Re-check planning readiness and planner validation.

## Recipe: Fully custom city

Best when:

- your city is not one of the presets
- you are doing exploratory research or teaching

```bash
python3 - <<'PY' > /tmp/custom-city-onboard.json
from pathlib import Path
import json

payload = {
    "name": "Providence",
    "region": "Rhode Island",
    "population": "190000",
    "boundarySource": "upload",
    "boundaryPath": None,
    "boundaryFileName": "providence.geojson",
    "boundaryGeojsonText": Path("providence.geojson").read_text(),
    "notes": "Custom city onboarding example."
}
print(json.dumps(payload))
PY

curl -X POST http://127.0.0.1:8000/api/v1/cities/onboard \
  -H "Content-Type: application/json" \
  --data @/tmp/custom-city-onboard.json
```

## After onboarding

Onboarding only creates the city record and boundary metadata.

To deepen the city:

1. open city detail
2. register local data readiness
3. generate scenarios
4. queue runs
5. inspect exports

## Important limitations

- Boston is still the only bundled real-data city.
- Other cities remain upload-first.
- Scenario outputs remain benchmark-based.
