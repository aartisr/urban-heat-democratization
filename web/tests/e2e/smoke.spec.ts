import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
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

  await page.route("**/api/v1/runs**", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "run-boston-001",
          cityId: "boston",
          scenario: "Baseline heat atlas",
          status: "queued",
          progress: 0,
          updatedAt: new Date().toISOString(),
          outputs: ["boston-analysis-summary.json"],
          summary: "Queued",
          outputArtifactIds: [],
          logs: [],
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
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

  await page.route("**/api/v1/cities/**/experience", async (route) => {
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
  });

  await page.route("**/api/v1/cost-sources", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/v1/cities/**", async (route) => {
    const url = route.request().url();
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
    if (url.includes("/map")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          cityName: "Boston",
          viewBox: { minLng: -71.3, minLat: 42.2, maxLng: -70.9, maxLat: 42.45 },
          boundary: [],
          heatZones: [],
          accessZones: [],
          legend: [],
          highlights: [],
          artifactPaths: [],
          thermalSources: [],
          liveThermalAdapter: {
            status: "planned",
            headline: "planned",
            detail: "planned",
            providerTargets: [],
            activeSourceCount: 0,
            autoRefreshEnabled: false,
            autoRefreshAvailable: false,
            usingBackupData: false,
            backupAvailable: false,
          },
          truthMode: {
            headline: "h",
            interpretationStatus: "estimated",
            methodology: "m",
            caution: "c",
            notes: [],
          },
          layerProvenance: [],
          narrative: "n",
        }),
      });
      return;
    }
    if (url.includes("/live-thermal")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "planned",
          headline: "planned",
          detail: "planned",
          providerTargets: [],
          activeSourceCount: 0,
          autoRefreshEnabled: false,
          autoRefreshAvailable: false,
          usingBackupData: false,
          backupAvailable: false,
        }),
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
    if (url.includes("/benchmarks")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          cityName: "Boston",
          headline: "Benchmark snapshot",
          cases: [],
        }),
      });
      return;
    }
    if (url.includes("/planner-validation")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          cityName: "Boston",
          valid: true,
          errors: [],
          warnings: [],
          checks: [
            {
              id: "cost-sources",
              label: "Cost source registry",
              status: "ready",
              detail: "All required cost-source fields are populated.",
            },
          ],
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

  await page.route("**/api/v1/interventions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
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
});

test("home page renders and navigates to cities", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Turn heat data into a plan people can trust.")).toBeVisible();

  await page.getByRole("link", { name: "Browse cities" }).click();
  await expect(page).toHaveURL(/\/cities$/);
  await expect(page.getByText("Onboard a city")).toBeVisible();
});

test("workspace switcher is visible and editable", async ({ page }) => {
  await page.goto("/");
  const expandButton = page.getByRole("button", { name: "Expand menu" });
  if (await expandButton.isVisible()) {
    await expandButton.click();
  }
  await expect(page.getByText("Workspace Access")).toBeVisible();
  await expect(page.getByText("default: admin")).toBeVisible();

  const workspaceInput = page.getByLabel("Workspace");
  await workspaceInput.fill("boston-lab");
  await expect(workspaceInput).toHaveValue("boston-lab");

  const apiKeyInput = page.getByLabel("API key");
  await apiKeyInput.fill("demo-admin");
  await expect(apiKeyInput).toHaveValue("demo-admin");
});

test("five persona journeys persist mode and route guidance", async ({ page }) => {
  const modeCases = [
    { label: "Educator", expectedNextRoute: "/cities" },
    { label: "Student", expectedNextRoute: "/cities" },
    { label: "Planner", expectedNextRoute: "/cities" },
    { label: "Researcher", expectedNextRoute: "/exports" },
    { label: "Community advocate", expectedNextRoute: "/scenarios" },
  ] as const;

  for (const modeCase of modeCases) {
    await page.goto("/");
    await page.getByRole("button", { name: modeCase.label }).click();
    await expect(page.getByText(`Active mode: ${modeCase.label}.`)).toBeVisible();
    await page.getByRole("link", { name: "Choose your mode" }).click();
    await expect(page).toHaveURL(/\/modes$/);
    await page.locator(".persona-flow-next a").first().click();
    await expect(page).toHaveURL(new RegExp(`${modeCase.expectedNextRoute}$`));

    const storedMode = await page.evaluate(() => window.localStorage.getItem("uhd.active-persona-mode"));
    expect(storedMode).toBeTruthy();
  }
});

test("scenario defaults change with active persona mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Researcher" }).click();
  await page.getByRole("link", { name: "Test scenarios" }).click();
  await expect(page).toHaveURL(/\/scenarios$/);
  await expect(page.getByText("Researcher defaults for scenario science")).toBeVisible();
  await expect(page.getByLabel("Budget USD")).toHaveValue("500000");
  await expect(page.getByLabel("Planning mode")).toHaveValue("evidence_first");

  await page.goto("/");
  await page.getByRole("button", { name: "Community advocate" }).click();
  await page.getByRole("link", { name: "Test scenarios" }).click();
  await expect(page.getByLabel("Budget USD")).toHaveValue("200000");
  await expect(page.getByLabel("Planning mode")).toHaveValue("benchmark_share");
});
