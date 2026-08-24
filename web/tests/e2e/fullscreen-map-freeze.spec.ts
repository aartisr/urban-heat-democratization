import { expect, test } from "@playwright/test";

const SAMPLE_POLYGON = {
  type: "Feature" as const,
  geometry: {
    type: "Polygon",
    coordinates: [[
      [-71.11, 42.35],
      [-71.09, 42.35],
      [-71.09, 42.37],
      [-71.11, 42.37],
      [-71.11, 42.35],
    ]],
  },
  properties: {
    id: "poly-1",
    temp_c: 34.2,
    score: 91,
    scoreClass: "high",
    label: "Downtown hotspot",
  },
};

function buildCityMapPayload() {
  return {
    cityId: "boston",
    cityName: "Boston",
    viewBox: { width: 1280, height: 720 },
    boundary: [
      { x: -71.19, y: 42.22 },
      { x: -70.92, y: 42.22 },
      { x: -70.92, y: 42.40 },
      { x: -71.19, y: 42.40 },
    ],
    heatZones: [
      {
        id: "hz-1",
        label: "Downtown hotspot",
        score: 91,
        scoreClass: "high",
        points: [
          { x: -71.11, y: 42.35 },
          { x: -71.09, y: 42.35 },
          { x: -71.09, y: 42.37 },
          { x: -71.11, y: 42.37 },
        ],
        properties: {
          score: 91,
          scoreClass: "high",
          district: "Downtown",
        },
      },
    ],
    accessZones: [
      {
        id: "az-1",
        label: "Cooling access gap",
        score: 77,
        scoreClass: "medium",
        points: [
          { x: -71.15, y: 42.32 },
          { x: -71.13, y: 42.32 },
          { x: -71.13, y: 42.34 },
          { x: -71.15, y: 42.34 },
        ],
        properties: {
          score: 77,
          scoreClass: "medium",
          district: "South Boston",
        },
      },
    ],
    legend: [
      { label: "Heat", color: "#b91c1c", description: "High thermal load" },
      { label: "Cooling", color: "#0ea5e9", description: "Lower cooling access" },
    ],
    highlights: [
      { title: "Peak heat zone", value: 91, description: "Downtown hotspot concentration" },
    ],
    artifactPaths: ["/artifacts/boston/atlas.json"],
    bounds: {
      minLng: -71.19,
      minLat: 42.22,
      maxLng: -70.92,
      maxLat: 42.40,
    },
    studyAreaGeojson: {
      type: "FeatureCollection",
      features: [SAMPLE_POLYGON],
    },
    boundaryGeojson: {
      type: "FeatureCollection",
      features: [SAMPLE_POLYGON],
    },
    heatGeojson: {
      type: "FeatureCollection",
      features: [SAMPLE_POLYGON],
    },
    accessGeojson: {
      type: "FeatureCollection",
      features: [
        {
          ...SAMPLE_POLYGON,
          properties: {
            ...SAMPLE_POLYGON.properties,
            temp_c: 29.1,
            score: 77,
            scoreClass: "medium",
            label: "Cooling access gap",
          },
        },
      ],
    },
    thermalSources: [
      {
        id: "ecostress-live",
        label: "NASA ECOSTRESS",
        sourceName: "ECOSTRESS",
        provider: "NASA",
        sensor: "ECOSTRESS",
        resolutionM: 70,
        meanTempC: 32.6,
        stdTempC: 2.1,
        minTempC: 26.8,
        maxTempC: 38.9,
        thresholdTempC: 34,
        corridorQuantile: 0.85,
        filePath: "data/runtime/live_thermal/boston.json",
        metadataPath: "data/runtime/live_thermal/boston.meta.json",
        sceneId: "scene-001",
        capturedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        adapterKind: "ecostress",
        granuleConceptId: "G123456789",
        sceneBrowseUrl: "https://example.org/browse/scene-001",
        sceneDataUrl: "https://example.org/data/scene-001",
        sceneMetadataUrl: "https://example.org/meta/scene-001",
        bounds: {
          minLng: -71.19,
          minLat: 42.22,
          maxLng: -70.92,
          maxLat: 42.40,
        },
        surfaceGeojson: {
          type: "FeatureCollection",
          features: [SAMPLE_POLYGON],
        },
        corridorGeojson: {
          type: "FeatureCollection",
          features: [
            {
              ...SAMPLE_POLYGON,
              properties: {
                ...SAMPLE_POLYGON.properties,
                temp_c: 33.1,
              },
            },
          ],
        },
      },
    ],
    liveThermalAdapter: {
      status: "configured",
      headline: "Live thermal stream configured",
      detail: "Auto-refresh is enabled for live ECOSTRESS scenes.",
      providerTargets: ["NASA ECOSTRESS"],
      lastUpdated: new Date().toISOString(),
      lastAttemptedAt: new Date().toISOString(),
      latestSceneCapturedAt: new Date().toISOString(),
      latestSourceLabel: "ECOSTRESS scene",
      activeSourceCount: 1,
      autoRefreshEnabled: true,
      autoRefreshAvailable: true,
      refreshIntervalSec: 900,
      usingBackupData: false,
      backupAvailable: true,
    },
    truthMode: {
      headline: "Derived spectral diagnostics",
      interpretationStatus: "derived",
      methodology: "Graph-based spectral clustering over thermal and access overlays.",
      caution: "Some mitigation impacts are modeled estimates.",
      notes: ["Neighborhood-level values aggregate parcel-scale estimates."],
    },
    layerProvenance: [
      {
        id: "heat",
        label: "Heat overlay",
        truthStatus: "observed",
        sourceType: "thermal raster",
        filePath: "data/thermal/boston.tif",
        method: "Raster thresholding and polygonization",
        primaryFields: ["temp_c", "score"],
        limitations: ["Single snapshot conditions"],
      },
    ],
    narrative: "Boston map layers are loaded for atlas interaction.",
  };
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        userId: "u-admin",
        displayName: "Demo Admin",
        authEnforced: false,
        activeWorkspaceId: "default",
        memberships: [
          { id: "default", role: "admin" },
          { id: "boston-lab", role: "editor" },
        ],
      }),
    });
  });

  await page.route("**/api/v1/workspaces", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "default", role: "admin" },
        { id: "boston-lab", role: "editor" },
      ]),
    });
  });

  await page.route("**/api/v1/cities", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        cities: [
          {
            id: "boston",
            name: "Boston",
            region: "Northeast US",
            population: "675k",
            status: "Ready",
            baselineTempC: 33.8,
            canopyCoverage: "27%",
            planningCostMultiplier: 1,
            description: "Bundled demo city",
          },
        ],
      }),
    });
  });

  await page.route("**/api/v1/city-experiences", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          cityId: "boston",
          cityName: "Boston",
          bundled: true,
          summary: "Bundled Boston",
          readinessLabel: "Ready",
          defaultRunScenario: "Baseline heat atlas",
          defaultPackageId: "boston-research",
          studyGuideArtifactId: null,
          exportArtifactIds: [],
          runSeedArtifactIds: [],
          starterScenarios: [],
          studyCards: [],
          spectralAvailable: true,
          availablePackageIds: ["boston-research"],
        },
      ]),
    });
  });

  await page.route("**/api/v1/cities/**", async (route) => {
    const url = route.request().url();

    if (url.endsWith("/cities/boston")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "boston",
          name: "Boston",
          region: "Northeast US",
          population: "675k",
          status: "Ready",
          baselineTempC: 33.8,
          canopyCoverage: "27%",
          planningCostMultiplier: 1,
          description: "Bundled demo city",
        }),
      });
      return;
    }

    if (url.includes("/experience")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          cityName: "Boston",
          bundled: true,
          summary: "Bundled Boston",
          readinessLabel: "Ready",
          defaultRunScenario: "Baseline heat atlas",
          defaultPackageId: "boston-research",
          studyGuideArtifactId: null,
          exportArtifactIds: [],
          runSeedArtifactIds: [],
          starterScenarios: [],
          studyCards: [],
          spectralAvailable: true,
          availablePackageIds: ["boston-research"],
        }),
      });
      return;
    }

    if (url.includes("/map")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildCityMapPayload()),
      });
      return;
    }

    if (url.includes("/live-thermal")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildCityMapPayload().liveThermalAdapter),
      });
      return;
    }

    if (url.includes("/readiness")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          cityName: "Boston",
          bundled: true,
          readinessLabel: "Ready",
          narrative: "Ready",
          checks: [],
        }),
      });
      return;
    }

    if (url.includes("/spectral")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          summary: "Spectral data available",
          cheegerFeatureCount: 4,
          coolingZoneCount: 3,
          cheegerHighlights: [],
          coolingHighlights: [],
          artifactPaths: [],
        }),
      });
      return;
    }

    if (url.includes("/trust-audit")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          cityName: "Boston",
          generatedAt: new Date().toISOString(),
          summary: "ok",
          benchmarkProtocol: [],
          reproducibilityManifest: [],
          provenanceAudit: [],
          notes: [],
        }),
      });
      return;
    }

    if (url.includes("/data-registration")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          thermalInputsRegistered: true,
          artifactBundleRegistered: true,
          bottleneckOverlayRegistered: true,
          coolingOverlayRegistered: true,
          thermalInputsPath: null,
          artifactBundlePath: null,
          bottleneckOverlayPath: null,
          coolingOverlayPath: null,
          verifiedPaths: {},
          contentValid: {},
          contentLabels: {},
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.route("**/api/v1/robustness/lab", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        title: "lab",
        summary: "lab",
        pValues: [],
        baselinePercolation: [],
        interventionPercolation: [],
        lambda2Baseline: 0,
        lambda2Intervention: 0,
        phiBaseline: 0,
        phiIntervention: 0,
        reliabilityBaseline: 0,
        reliabilityIntervention: 0,
        notes: [],
      }),
    });
  });

  await page.route("**/api/v1/runs**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/v1/scenarios**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/v1/interventions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/v1/cost-sources", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
});

test("full page map toggle does not freeze the city atlas", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/cities/boston");

  await page.getByRole("button", { name: "Show the city atlas" }).click();

  const openButton = page.getByRole("button", { name: "Open full page map" });
  await expect(openButton).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".maplibre-stage")).toBeVisible({ timeout: 15_000 });

  await openButton.click();
  await expect(page.locator("article.map-card-fullpage")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("complementary", { name: "Layers and evidence" })).toHaveCount(0);

  await page.getByRole("button", { name: "Layers & evidence" }).click();
  await expect(page.getByRole("complementary", { name: "Layers and evidence" })).toBeVisible({ timeout: 10_000 });

  await page.keyboard.press("Escape");
  await expect(page.getByRole("complementary", { name: "Layers and evidence" })).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator("article.map-card-fullpage")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator("article.map-card-fullpage")).toHaveCount(0, { timeout: 10_000 });
  await expect(openButton).toBeVisible({ timeout: 10_000 });

  for (let i = 0; i < 4; i += 1) {
    await openButton.click();
    await expect(page.locator("article.map-card-fullpage")).toBeVisible({ timeout: 8_000 });

    const exitButton = page.locator(".map-fullpage-exit");
    await exitButton.click();
    await expect(page.locator("article.map-card-fullpage")).toHaveCount(0, { timeout: 8_000 });

    await page.getByRole("button", { name: "Reset extent" }).click();
    await expect(page.locator(".maplibre-stage")).toBeVisible({ timeout: 8_000 });
  }

  const fatalErrors = pageErrors.filter((message) =>
    /Maximum update depth exceeded|too much recursion|Cannot update a component while rendering/i.test(message),
  );
  expect(fatalErrors).toEqual([]);
});
