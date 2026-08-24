# Vercel deployment

Urban Heat Democratization can run as one Vercel project: the Vite application
is served as static output and the FastAPI application serves `/api/*` from a
Python Function. The repository's `vercel.json` owns that routing and should
be deployed from the repository root.

## What this deployment is for

It is a strong fit for the public workspace, Boston bundled study, map layers,
scenario exploration, exports, and lightweight demonstration runs. Vercel
Functions can host FastAPI applications, while Vercel’s static delivery serves
the Vite build efficiently.

It is **not** a durable worker platform by itself. On Vercel, this project
automatically enters serverless mode:

- mutable runtime files and SQLite use `/tmp` scratch storage;
- a demonstration run completes inline rather than relying on a resident queue
  worker;
- a live-thermal enable action performs the explicit refresh but does not
  promise an interval worker will remain alive;
- data created during one function instance may disappear after an instance
  is recycled.

This is intentional. The interface and API remain usable without implying
that serverless scratch state is a persistent research record.

## Deploy from GitHub

1. Push this repository to GitHub and import it in Vercel.
2. Set the Vercel project **Root Directory** to the repository root. Do not set
   it to `web/`: the API, data, and `vercel.json` live at the root.
3. Vercel reads the committed configuration:
   - framework: Vite, explicitly selected so `/` is served by the static web
     application rather than being inferred as a FastAPI-only project;
   - build command: `cd web && npm ci && npm run build`
   - static output: `web/dist`
   - Python entry point: `api/main.py`; its targeted `includeFiles` glob keeps
     only runtime-read research assets in the function bundle, while
     `excludeFiles` excludes local environments, frontend assets, tests,
     screenshots, and mutable runtime files.
   - API routing: `/api/*`
   - SPA fallback: every non-API route resolves to `index.html`, including
   direct links such as `/cities/boston`.
4. Add the environment variables below, deploy, then test the verification
   checklist.

Use Node.js 22 or newer for the Vercel build. The frontend package declares
this requirement so the deployment uses a runtime supported by its resolved
dependencies. The repository pins Python 3.12 in `.python-version`; this is
the oldest Python version currently supported by Vercel's Python runtime.
`pyproject.toml` repeats that requirement as `==3.12.*`, which makes the
constraint explicit to Vercel's `uv` dependency resolver.

The Vercel Function installs the lean `requirements.txt` runtime set. Local
research runs, raster exports, and tests use `requirements-research.txt`, so
their large optional geospatial and visualization dependencies do not inflate
the public serverless bundle.

The runtime pins a current Pydantic 2 release so Vercel can install its
prebuilt `pydantic-core` wheel. Do not downgrade it to Pydantic 2.6.x: that
series can trigger an unsupported source build on current Vercel Python
builders. The serverless spectral endpoint uses a NumPy dense-matrix fallback
for its compact demonstration graphs, so SciPy remains in the local research
toolchain instead of the public Function bundle.

If a Vercel log shows Meson or Cython compiling NumPy or SciPy, redeploy with
**Use existing Build Cache** disabled. The checked-in Python 3.12 constraints
resolve those packages to prebuilt Linux wheels; a source compile indicates a
stale cache or an overridden project setting.

## Required environment variables

Set these in Vercel for Production, Preview, and Development as appropriate:

```text
# Keep frontend requests on the same Vercel deployment.
VITE_API_BASE_URL=/api

# The public URL without a trailing slash.
VITE_SITE_URL=https://your-domain.example

# Make serverless behavior explicit, including when using `vercel dev`.
UHD_RUNTIME_MODE=serverless

# Restrict browser origins. Include your custom domain and Vercel preview host
# only when those hosts should be allowed to use the API.
UHD_CORS_ORIGINS=https://your-domain.example,https://your-project.vercel.app
```

Optional analytics stay disabled unless configured and a visitor consents:

```text
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_CLARITY_PROJECT_ID=your-clarity-project-id
```

`VITE_` values are visible in the browser bundle. Do not put credentials,
access tokens, or database URLs in them. For access control, set
`UHD_ENFORCE_AUTH=true` and supply `UHD_ACCESS_TOKENS` only after replacing the
demo token configuration with an appropriate identity design.

## Verify the deployment

```text
GET https://your-domain.example/api/health
GET https://your-domain.example/api/v1/health
GET https://your-domain.example/cities/boston
GET https://your-domain.example/scenarios
```

Then, in a fresh browser session:

1. Open Boston and confirm city layers load.
2. Enter and review a scenario; confirm its planning/evidence labels remain
   visible.
3. Create a demonstration run and confirm it completes without remaining
   indefinitely queued.
4. Open a direct city URL after a hard refresh; it must return the app, not a
   404 page.
5. Confirm no PostHog or Clarity request is sent before a visitor accepts the
   optional analytics choice.

## Durable production evolution

Before relying on uploads, runs, refreshes, or audit history as durable public
records, replace serverless scratch state with:

| Current local concern | Durable replacement |
| --- | --- |
| SQLite and JSON runtime mirrors | Managed Postgres or another transactional database |
| `DurableRunQueue` background thread | External queue and worker service |
| Live thermal interval thread | Scheduled job plus durable cache/storage |
| Uploaded local files | Object storage with validation and retention policy |

Keep `VITE_API_BASE_URL=/api` if those services are exposed through a Vercel
gateway route, or set it to the HTTPS URL of the separate API and update
`UHD_CORS_ORIGINS` accordingly.

## Local parity

For a Vercel-style local check, install the Vercel CLI and run:

```bash
vercel dev
```

For ordinary product development, keep using the existing two-process setup:

```bash
make api
make web
```

## References

- [Vercel: Vite](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel: FastAPI](https://vercel.com/docs/frameworks/backend/fastapi)
- [Vercel: configuring Functions](https://vercel.com/docs/functions/configuring-functions/advanced-configuration)
