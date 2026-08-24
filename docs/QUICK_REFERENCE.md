# Quick Reference

This is the shortest practical guide to running and using Urban Heat Democratization.

## Start the stack

### Python API

```bash
cd "$(git rev-parse --show-toplevel)"
make api
```

### Python API raw fallback

```bash
cd "$(git rev-parse --show-toplevel)"
source .venv/bin/activate
PYTHONPATH=. uvicorn api.main:app --reload
```

### Environment bootstrap

```bash
cd "$(git rev-parse --show-toplevel)"
bash scripts/bootstrap_env.sh
```

### Makefile bootstrap

```bash
cd "$(git rev-parse --show-toplevel)"
make setup
```

If `python3.11` is missing and Homebrew is available on macOS, `make setup` will install `python@3.11` first.

### Python compatibility check

```bash
cd "$(git rev-parse --show-toplevel)"
python3 scripts/check_python_env.py
```

### TanStack frontend

```bash
cd "$(git rev-parse --show-toplevel)/web"
npm run dev
```

### Frontend build

```bash
cd "$(git rev-parse --show-toplevel)/web"
npm run build
```

## First pages to open

1. `Home`
2. `Cities`
3. `City detail`
4. `Scenarios`
5. `Exports`
6. `Runs`

## Current truth

- Python 3.11 is the pinned interpreter target for this repo.
- `make setup` and `scripts/bootstrap_env.sh` try to install `python3.11` with Homebrew on macOS if it is missing.
- Boston is the only real bundled city dataset today.
- `boston-research` and `boston-classroom` are bundled package variants.
- Other cities are upload-first.
- Scenarios are benchmark-based, not city-calibrated optimizers.

## Health checks

```bash
export UHD_API_URL="https://your-public-domain.example"
curl "$UHD_API_URL/api/health"
curl "$UHD_API_URL/api/v1/health"
curl "$UHD_API_URL/api/v1/cities"
curl "$UHD_API_URL/api/v1/bundled-packages"
```

## Useful Python commands

### Validate bundled packages

```bash
cd "$(git rev-parse --show-toplevel)"
source .venv/bin/activate
PYTHONPATH=. python3 scripts/validate_city_packages.py
```

### Check overlay alignment

```bash
cd "$(git rev-parse --show-toplevel)"
source .venv/bin/activate
python3 check_overlay_alignment.py <overlay.tif> <city_boundary.geojson> [buffer_m]
```

### Generate demo figures

```bash
cd "$(git rev-parse --show-toplevel)"
source .venv/bin/activate
python3 generate_demo_figs.py
```

## Add a new city

Two supported paths:

1. UI onboarding from the `Cities` page
2. API onboarding through `POST /api/v1/cities/onboard`

Required idea:

- a usable boundary must be provided or resolved

After onboarding, register local readiness if available:

- thermal inputs
- artifact bundle
- bottleneck overlay
- cooling overlay

## Runtime files

- `data/runtime/urban_heat_runtime.sqlite3`
- `data/runtime/cities.json`
- `data/runtime/scenarios.json`
- `data/runtime/runs.json`
- `data/runtime/uploads/`

## Most important docs

- [Project README](../README.md)
- [Implementation Status](IMPLEMENTATION_STATUS.md)
- [City Onboarding Recipes](CITY_ONBOARDING_RECIPES.md)
- [Screen Tour](SCREEN_TOUR.md)
